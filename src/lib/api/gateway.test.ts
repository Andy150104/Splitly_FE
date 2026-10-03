import { beforeEach, describe, expect, it, vi } from 'vitest'

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
import { GET, POST } from '../../app/api/[...path]/route'

const context = (path: string) => ({ params: Promise.resolve({ path: path.split('/') }) })
beforeEach(() => {
  mocks.user = { email: 'owner@example.com', displayName: 'Owner' }
  mocks.store.clear()
  mocks.store.set('mo_access', 'expired')
  mocks.store.set('mo_refresh', 'refresh-token')
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn())
})
describe('same-origin API gateway', () => {
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
    vi.mocked(fetch).mockResolvedValue(Response.json({ success: true, data: [] }))
    const response = await GET(new Request(`http://localhost/api/${path}`), context(path))
    expect(response.status).toBe(200)
    expect(vi.mocked(fetch).mock.calls[0][0]).toEqual(expect.stringContaining(`/api/${path}`))
    expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toMatchObject({
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
    expect(body.data.email).toBe('a@example.com')
    expect(JSON.stringify(body)).not.toContain('secret-')
    expect(mocks.setSession).toHaveBeenCalledTimes(1)
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
