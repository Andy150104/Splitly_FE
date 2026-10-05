import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  user: { email: 'owner@example.com', displayName: 'Owner' } as {
    email: string
    displayName: string
  } | null,
  store: new Map<string, string>(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (mocks.store.has(name) ? { value: mocks.store.get(name) } : undefined),
  }),
}))
vi.mock('./session', () => ({
  getCurrentUser: async () => mocks.user,
  setSession: mocks.setSession,
  clearSession: mocks.clearSession,
}))
import { GET, POST, PATCH, PUT } from '../../app/api/[...path]/route'

const context = (path: string) => ({ params: Promise.resolve({ path: path.split('/') }) })
const adminCodes = [
  'Users.Read',
  'Roles.Read',
  'Permissions.Read',
  'Users.ReadPermissions',
  'Users.UpdatePermissions',
  'Users.UpdateRole',
  'Users.UpdateAccess',
  'SupportRequests.Read',
  'SupportRequests.Update',
]
const granted = (codes = adminCodes) =>
  Response.json({ success: true, data: { effectivePermissionCodes: codes } })
beforeEach(() => {
  vi.stubEnv('BACKEND_API_URL', 'http://backend.test')
  mocks.user = { email: 'owner@example.com', displayName: 'Owner' }
  mocks.store.clear()
  mocks.store.set('mo_access', 'expired')
  mocks.store.set('mo_refresh', 'refresh-token')
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
describe('same-origin API gateway', () => {
  it('does not send tokens or bank requests to an implicit backend when configuration is missing', async () => {
    vi.stubEnv('BACKEND_API_URL', '')
    const response = await GET(
      new Request('http://localhost/api/payout-accounts'),
      context('payout-accounts'),
    )
    expect(response.status).toBe(502)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('strips nested token and raw bank fields from legacy success payloads', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        data: {
          paymentOrderId: 'p1',
          amount: 240000,
          diagnostic: {
            AccessToken: 'secret-access',
            accountNumber: '1234567890',
            providerResponse: { secret: 'private' },
          },
        },
      }),
    )
    const response = await GET(
      new Request('http://localhost/api/payment-orders/p1'),
      context('payment-orders/p1'),
    )
    expect((await response.json()).data).toEqual({
      paymentOrderId: 'p1',
      amount: 240000,
      diagnostic: {},
    })
  })
  it.each(['auth/google', 'auth/verify-login-code'])(
    'accepts the public Host when Next binds internally for %s',
    async (path) => {
      mocks.user = null
      vi.mocked(fetch).mockResolvedValue(
        Response.json({
          success: true,
          data: {
            email: 'a@example.com',
            accessToken: 'secret-access',
            refreshToken: 'secret-refresh',
            refreshTokenExpiresAtUtc: '2030-01-01T00:00:00Z',
          },
        }),
      )
      const response = await POST(
        new Request(`http://0.0.0.0:3000/api/${path}`, {
          method: 'POST',
          headers: { Host: 'localhost:3000', Origin: 'http://localhost:3000' },
          body: JSON.stringify(
            path === 'auth/google'
              ? { idToken: 'google-id' }
              : { email: ' A@Example.com ', code: ' sl-82a9-k4m7 ' },
          ),
        }),
        context(path),
      )
      expect(response.status).toBe(200)
      expect(mocks.setSession).toHaveBeenCalledOnce()
      if (path === 'auth/verify-login-code')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)).toEqual({
          email: 'a@example.com',
          code: 'SL-82A9-K4M7',
        })
    },
  )
  it('blocks webhooks, arbitrary routes and cross-origin writes before fetching', async () => {
    expect(
      (
        await POST(
          new Request('http://localhost/api/integrations/payos/webhook', { method: 'POST' }),
          context('integrations/payos/webhook'),
        )
      ).status,
    ).toBe(404)
    expect(
      (
        await POST(
          new Request('http://localhost/api/bills', {
            method: 'POST',
            headers: { Origin: 'https://attacker.test' },
          }),
          context('bills'),
        )
      ).status,
    ).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('requires a verified profile before protected reads', async () => {
    mocks.user = null
    expect((await GET(new Request('http://localhost/api/bills'), context('bills'))).status).toBe(
      401,
    )
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([
    'admin/users',
    'admin/users/roles',
    'admin/users/permissions',
    'admin/users/user-1/permissions',
    'admin/support-requests',
  ])('forwards the authenticated admin read %s to its exact backend path', async (path) => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(granted())
      .mockResolvedValue(Response.json({ success: true, data: [] }))
    const response = await GET(new Request(`http://localhost/api/${path}`), context(path))
    expect(response.status).toBe(200)
    expect(vi.mocked(fetch).mock.calls[1][0]).toEqual(expect.stringContaining(`/api/${path}`))
    expect(vi.mocked(fetch).mock.calls[1][1]?.headers).toMatchObject({
      Authorization: 'Bearer expired',
    })
  })
  it('rejects unsupported admin methods and a missing session before forwarding', async () => {
    const request = new Request('http://localhost/api/admin/users/roles', { method: 'POST' })
    expect((await POST(request, context('admin/users/roles'))).status).toBe(405)
    mocks.user = null
    expect(
      (await GET(new Request('http://localhost/api/admin/users'), context('admin/users'))).status,
    ).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('sets a login session and never exposes access or refresh tokens', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        success: true,
        data: {
          email: 'a@example.com',
          displayName: 'A',
          accessToken: 'secret-access',
          refreshToken: 'secret-refresh',
          refreshTokenExpiresAtUtc: '2030-01-01T00:00:00Z',
        },
      }),
    )
    const response = await POST(
      new Request('http://localhost/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: 'google-id' }),
      }),
      context('auth/google'),
    )
    const body = await response.json()
    expect(body.data).toBe(true)
    expect(JSON.stringify(body)).not.toContain('secret-')
    expect(mocks.setSession).toHaveBeenCalledTimes(1)
  })
  it('does not forward protected reads with only a profile cookie', async () => {
    mocks.store.delete('mo_access')
    const response = await GET(
      new Request('http://localhost/api/payout-accounts'),
      context('payout-accounts'),
    )
    expect(response.status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each(['auth/me/permissions', 'admin/users/member-1/permissions'])(
    'sends only the effective permission codes for %s',
    async (path) => {
      if (path.startsWith('admin/')) vi.mocked(fetch).mockResolvedValueOnce(granted())
      vi.mocked(fetch).mockResolvedValue(
        Response.json({
          success: true,
          data: {
            memberId: 'member-1',
            fullName: 'Private Name',
            email: 'private@example.com',
            role: { code: 'User' },
            rolePermissionCodes: ['Bills.Read'],
            effectivePermissionCodes: ['Bills.Read'],
            internalAudit: 'private',
          },
        }),
      )
      const response = await GET(new Request(`http://localhost/api/${path}`), context(path))
      expect(await response.json()).toEqual({
        success: true,
        data: { effectivePermissionCodes: ['Bills.Read'] },
      })
    },
  )
  it('removes unnecessary role metadata without losing select values', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(granted())
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        data: [
          {
            roleId: 'role-1',
            code: 'User',
            name: 'User',
            description: 'Internal',
            isSystem: true,
            defaultPermissionCodes: ['Users.Read'],
          },
        ],
      }),
    )
    const response = await GET(
      new Request('http://localhost/api/admin/users/roles'),
      context('admin/users/roles'),
    )
    expect((await response.json()).data).toEqual([{ roleId: 'role-1', name: 'User' }])
  })
  it('limits session grants to frontend actions while admin editing retains every grant', async () => {
    const effectivePermissionCodes = [
      'Bills.Read',
      'System.Configure',
      'PaymentAccounts.Update',
      'Bills.Read',
    ]
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ data: { effectivePermissionCodes } }))
    const session = await GET(
      new Request('http://localhost/api/auth/me/permissions'),
      context('auth/me/permissions'),
    )
    expect((await session.json()).data).toEqual({ effectivePermissionCodes: ['Bills.Read'] })
    vi.mocked(fetch).mockResolvedValueOnce(granted())
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ data: { effectivePermissionCodes } }))
    const editor = await GET(
      new Request('http://localhost/api/admin/users/member-1/permissions'),
      context('admin/users/member-1/permissions'),
    )
    expect((await editor.json()).data).toEqual({ effectivePermissionCodes })
  })
  it('omits internal permission identifiers and diagnostics from the editor catalog', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(granted())
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        data: [
          {
            permissionId: 'internal-id',
            code: 'Bills.Read',
            name: 'Xem hóa đơn',
            description: 'Xem chi tiết',
            groupCode: 'Bills',
            groupName: 'Hóa đơn',
            sortOrder: 10,
            audit: 'private',
          },
        ],
      }),
    )
    const response = await GET(
      new Request('http://localhost/api/admin/users/permissions'),
      context('admin/users/permissions'),
    )
    expect((await response.json()).data).toEqual([
      {
        code: 'Bills.Read',
        name: 'Xem hóa đơn',
        description: 'Xem chi tiết',
        groupCode: 'Bills',
        groupName: 'Hóa đơn',
        sortOrder: 10,
      },
    ])
  })
  it.each(['1234567890', '********7890', '1234'])(
    'never sends the unmasked payout account %s',
    async (number) => {
      vi.mocked(fetch).mockResolvedValue(
        Response.json({
          data: [
            {
              id: 'account-1',
              bankName: 'Bank',
              accountNumber: number,
              accountNumberMasked: number,
              memberId: 'private-member',
              providerResponse: { accountNumber: number },
            },
          ],
        }),
      )
      const response = await GET(
        new Request('http://localhost/api/payout-accounts'),
        context('payout-accounts'),
      )
      expect((await response.json()).data).toEqual([
        {
          id: 'account-1',
          bankName: 'Bank',
          accountNumberMasked: number === '1234' ? '••••' : '•••• 7890',
        },
      ])
    },
  )
  it('retains verified bank ownership without echoing the entered account or provider payload', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        data: {
          accountName: 'TEST OWNER',
          verified: true,
          accountNumber: '1234567890',
          bankBin: '123456',
          providerResponse: { accountNumber: '1234567890' },
        },
      }),
    )
    const response = await POST(
      new Request('http://localhost/api/vietqr/account-lookup', {
        method: 'POST',
        body: JSON.stringify({ bankBin: '123456', accountNumber: '1234567890' }),
      }),
      context('vietqr/account-lookup'),
    )
    expect(await response.json()).toEqual({
      success: true,
      data: { accountName: 'TEST OWNER', verified: true },
    })
  })
  it('keeps payment QR and checkout available while dropping unused destination account fields', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        data: {
          billId: 'bill-1',
          paymentDestination: {
            bankName: 'Bank',
            accountName: 'TEST OWNER',
            accountNumber: '1234567890',
            paymentAccountId: 'private',
          },
          members: [
            {
              memberId: 'm1',
              paymentQrImageUrl: 'https://example.com/qr',
              paymentUrl: 'https://example.com/pay',
              internalBankData: 'private',
            },
          ],
        },
      }),
    )
    const response = await GET(
      new Request('http://localhost/api/bills/bill-1'),
      context('bills/bill-1'),
    )
    const data = (await response.json()).data
    expect(data.paymentDestination).toEqual({ bankName: 'Bank', accountName: 'TEST OWNER' })
    expect(data.members[0].paymentQrImageUrl).toBe('https://example.com/qr')
    expect(data.members[0].paymentUrl).toBe('https://example.com/pay')
    expect(JSON.stringify(data)).not.toMatch(/1234567890|internalBankData|private/)
  })
  it.each([400, 403, 500])(
    'does not expose bank diagnostics or error data at status %s',
    async (status) => {
      vi.mocked(fetch).mockResolvedValue(
        Response.json(
          {
            success: false,
            message: 'Error for 1234567890 private@example.com',
            errors: [{ message: 'Provider secret-token' }],
            data: { accountNumber: '1234567890' },
            stackTrace: 'private-stack',
          },
          { status },
        ),
      )
      const response = await POST(
        new Request('http://localhost/api/vietqr/account-lookup', {
          method: 'POST',
          body: '{}',
        }),
        context('vietqr/account-lookup'),
      )
      expect(response.status).toBe(status)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.message).toBeTruthy()
      expect(JSON.stringify(body)).not.toMatch(/1234567890|private|secret-token/)
      expect(body.data).toBeUndefined()
    },
  )
  it('preserves a backend authorization denial without returning its private payload', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(granted())
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { message: 'Private policy', data: { email: 'private@example.com' } },
        { status: 403 },
      ),
    )
    const response = await GET(
      new Request('http://localhost/api/admin/users'),
      context('admin/users'),
    )
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      success: false,
      message: 'Bạn chưa có quyền thực hiện thao tác này.',
    })
  })
  it('blocks direct admin reads before fetching user data when only Bills.Read is granted', async () => {
    vi.mocked(fetch).mockResolvedValue(granted(['Bills.Read']))
    const response = await GET(
      new Request('http://localhost/api/admin/users'),
      context('admin/users'),
    )
    expect(response.status).toBe(403)
    expect(fetch).toHaveBeenCalledOnce()
    expect(vi.mocked(fetch).mock.calls[0][0]).toEqual(
      expect.stringContaining('/api/auth/me/permissions'),
    )
  })
  it('fails closed when the permission service returns an incomplete payload', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ data: { role: { code: 'Administrator' } } }))
    const response = await GET(
      new Request('http://localhost/api/admin/users/roles'),
      context('admin/users/roles'),
    )
    expect(response.status).toBe(403)
    expect(fetch).toHaveBeenCalledOnce()
  })
  it('does not retain permissions across requests after access is revoked', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(granted())
      .mockResolvedValueOnce(Response.json({ data: [] }))
      .mockResolvedValueOnce(granted([]))
    expect(
      (
        await GET(
          new Request('http://localhost/api/admin/users/roles'),
          context('admin/users/roles'),
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await GET(
          new Request('http://localhost/api/admin/users/roles'),
          context('admin/users/roles'),
        )
      ).status,
    ).toBe(403)
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it.each([
    ['admin/users/member-1/role', 'PATCH', 'Users.UpdateRole'],
    ['admin/users/member-1/access', 'PUT', 'Users.UpdateAccess'],
    ['admin/users/member-1/permissions', 'PATCH', 'Users.UpdatePermissions'],
    ['admin/support-requests/request-1/status', 'PATCH', 'SupportRequests.Update'],
  ])('requires the action permission for %s', async (path, method, permission) => {
    const handler = method === 'PUT' ? PUT : PATCH
    const request = () => new Request(`http://localhost/api/${path}`, { method, body: '{}' })
    vi.mocked(fetch).mockResolvedValueOnce(granted(['Users.Read', 'SupportRequests.Read']))
    expect((await handler(request(), context(path))).status).toBe(403)
    expect(fetch).toHaveBeenCalledOnce()
    vi.mocked(fetch)
      .mockResolvedValueOnce(granted([permission]))
      .mockResolvedValueOnce(Response.json({ data: true }))
    expect((await handler(request(), context(path))).status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it('shares only the active permission lookup between concurrent admin requests', async () => {
    let release!: (response: Response) => void
    const pending = new Promise<Response>((resolve) => {
      release = resolve
    })
    vi.mocked(fetch).mockImplementation(async (input) =>
      String(input).endsWith('/auth/me/permissions') ? pending : Response.json({ data: [] }),
    )
    const requests = Promise.all(
      ['roles', 'permissions'].map((path) =>
        GET(
          new Request(`http://localhost/api/admin/users/${path}`),
          context(`admin/users/${path}`),
        ),
      ),
    )
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    release(granted())
    const responses = await requests
    expect(responses.map((response) => response.status)).toEqual([200, 200])
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it('returns a confirmation without leaking an OTP or upstream profile when sending a login code', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        success: true,
        data: {
          email: 'private@example.com',
          code: 'secret-otp',
          accessToken: 'secret-access',
        },
      }),
    )
    const response = await POST(
      new Request('http://localhost/api/auth/send-login-code', {
        method: 'POST',
        body: JSON.stringify({ email: 'private@example.com' }),
      }),
      context('auth/send-login-code'),
    )
    expect(await response.json()).toEqual({ success: true, data: true })
  })
  it('refreshes a 401 and retries with the rotated access token', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ message: 'Expired' }, { status: 401 }))
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          data: {
            accessToken: 'rotated',
            refreshToken: 'new-refresh',
            refreshTokenExpiresAtUtc: '2030-01-01T00:00:00Z',
          },
        }),
      )
      .mockResolvedValueOnce(Response.json({ success: true, data: [] }))
    const response = await GET(new Request('http://localhost/api/bills'), context('bills'))
    expect(response.status).toBe(200)
    expect(mocks.setSession).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetch).mock.calls[2][1]?.headers).toMatchObject({
      Authorization: 'Bearer rotated',
    })
  })
  it('clears local cookies when backend logout fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'))
    const response = await POST(
      new Request('http://localhost/api/auth/logout', { method: 'POST' }),
      context('auth/logout'),
    )
    expect(response.status).toBe(200)
    expect(mocks.clearSession).toHaveBeenCalledTimes(1)
  })
})
