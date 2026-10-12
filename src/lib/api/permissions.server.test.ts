import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  store: new Map<string, string>(),
  upstream: vi.fn(),
  refresh: vi.fn(),
  user: { email: 'owner@example.com', displayName: 'Owner' } as {
    email: string
    displayName: string
  } | null,
  setSession: vi.fn(),
  clearSession: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (mocks.store.has(name) ? { value: mocks.store.get(name) } : undefined),
  }),
  headers: async () => new Headers({ 'x-mo-path': '/bills/new?draft=draft-1' }),
}))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`)
  },
}))
vi.mock('./upstream.server', () => ({ upstream: mocks.upstream, refresh: mocks.refresh }))
vi.mock('./session', () => ({
  getCurrentUser: async () => mocks.user,
  setSession: mocks.setSession,
  clearSession: mocks.clearSession,
}))

import { getWorkspacePermissions } from './permissions.server'
import { GET } from '../../app/api/auth/refresh-session/route'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.store.clear()
  mocks.store.set('mo_access', 'fixture-access')
  mocks.store.set('mo_refresh', 'fixture-refresh')
  mocks.user = { email: 'owner@example.com', displayName: 'Owner' }
})
afterEach(() => vi.restoreAllMocks())

describe('server-rendered workspace permissions', () => {
  it('uses effective BE codes and reads again after a permission is revoked', async () => {
    mocks.upstream.mockResolvedValueOnce(
      Response.json({ data: { effectivePermissionCodes: ['Bills.Create'] } }),
    )
    mocks.upstream.mockResolvedValueOnce(Response.json({ data: { effectivePermissionCodes: [] } }))
    const first = await getWorkspacePermissions()
    expect(first.has('Bills.Create')).toBe(true)
    expect(first.has('Users.UpdateRole')).toBe(false)
    const second = await getWorkspacePermissions()
    expect(second.has('Bills.Create')).toBe(false)
    expect(mocks.upstream).toHaveBeenCalledTimes(2)
  })
  it.each([null, 'Bills.Create', { actions: { createBill: true } }, ['Bills.Create', true]])(
    'rejects malformed effective grants without trusting roles or client flags %#',
    async (effectivePermissionCodes) => {
      mocks.upstream.mockResolvedValueOnce(
        Response.json({ data: { role: 'Administrator', effectivePermissionCodes } }),
      )
      const permissions = await getWorkspacePermissions()
      expect(permissions.has('Bills.Create')).toBe(false)
      expect(permissions.error).toBeTruthy()
    },
  )
  it('does not surface permission service diagnostics to the browser', async () => {
    mocks.upstream.mockResolvedValueOnce(
      Response.json(
        { message: 'private-token', data: { effectivePermissionCodes: ['Users.Read'] } },
        { status: 503 },
      ),
    )
    const permissions = await getWorkspacePermissions()
    expect(permissions.has('Users.Read')).toBe(false)
    expect(permissions.error).not.toContain('private-token')
  })
  it('redirects an expired access token to a cookie-writing route while preserving the destination', async () => {
    mocks.upstream.mockResolvedValueOnce(new Response(null, { status: 401 }))
    await expect(getWorkspacePermissions()).rejects.toThrow(
      'redirect:/api/auth/refresh-session?next=%2Fbills%2Fnew%3Fdraft%3Ddraft-1',
    )
    expect(mocks.setSession).not.toHaveBeenCalled()
  })
  it('requires an access cookie before requesting permissions', async () => {
    mocks.store.delete('mo_access')
    await expect(getWorkspacePermissions()).rejects.toThrow('redirect:/login')
    expect(mocks.upstream).not.toHaveBeenCalled()
  })
})

describe('server render session refresh', () => {
  const session = { accessToken: 'rotated-access', refreshToken: 'rotated-refresh' }
  it('persists the refreshed session and redirects without returning tokens or grants', async () => {
    mocks.refresh.mockResolvedValueOnce(session)
    mocks.upstream.mockResolvedValueOnce(
      Response.json({ data: { effectivePermissionCodes: ['Bills.Read'] } }),
    )
    const response = await GET(
      new Request('http://localhost/api/auth/refresh-session?next=%2Fbills%2Fbill-1'),
    )
    expect(mocks.setSession).toHaveBeenCalledWith(session, mocks.user)
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('http://localhost/bills/bill-1')
    expect(await response.text()).toBe('')
  })
  it.each([
    'https://attacker.test',
    '//attacker.test',
    '/\\attacker.test',
    '/\t/attacker.test',
    '/\n/attacker.test',
    '/.//attacker.test',
    '/api/auth/refresh-session',
  ])('does not redirect to an unsafe or recursive destination %s', async (next) => {
    mocks.refresh.mockResolvedValueOnce(session)
    mocks.upstream.mockResolvedValueOnce(new Response(null, { status: 200 }))
    const response = await GET(
      new Request(`http://localhost/api/auth/refresh-session?next=${encodeURIComponent(next)}`),
    )
    expect(response.headers.get('location')).toBe('http://localhost/dashboard')
  })
  it('clears a session if BE rejects even the rotated access token', async () => {
    mocks.refresh.mockResolvedValueOnce(session)
    mocks.upstream.mockResolvedValueOnce(new Response(null, { status: 401 }))
    const response = await GET(new Request('http://localhost/api/auth/refresh-session?next=/bills'))
    expect(mocks.setSession).not.toHaveBeenCalled()
    expect(mocks.clearSession).toHaveBeenCalledOnce()
    expect(response.headers.get('location')).toBe('http://localhost/login?next=%2Fbills')
  })
  it('redirects to the public Host instead of the internal dev bind address', async () => {
    mocks.refresh.mockResolvedValueOnce(session)
    mocks.upstream.mockResolvedValueOnce(new Response(null, { status: 200 }))
    const response = await GET(
      new Request('http://0.0.0.0:3000/api/auth/refresh-session?next=/bills', {
        headers: { Host: 'localhost:3000' },
      }),
    )
    expect(response.headers.get('location')).toBe('http://localhost:3000/bills')
  })
})
