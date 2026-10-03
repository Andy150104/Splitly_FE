import { cookies } from 'next/headers'
import { createHash } from 'node:crypto'
import { clearSession, getCurrentUser, setSession } from '../../../lib/api/session'
import type { LoginSession } from '../../../lib/api/types'

const baseUrl = process.env.BACKEND_API_URL || 'https://92d4-171-251-232-238.ngrok-free.app'
const publicAuth = new Set([
  'auth/google',
  'auth/send-login-code',
  'auth/verify-login-code',
  'auth/dev-login',
])
const allowed =
  /^(auth\/(google|send-login-code|verify-login-code|dev-login|logout|me\/permissions)|bills(?:\/[a-zA-Z0-9-]+(?:\/(?:members(?:\/[a-zA-Z0-9-]+(?:\/manual-payments)?)?|calculate|publish|cancel|reminders|vietqr-payment))?)?|groups(?:\/[a-zA-Z0-9-]+(?:\/(?:members(?:\/[a-zA-Z0-9-]+)?|close))?)?|payout-accounts(?:\/[a-zA-Z0-9-]+\/default)?|payment-accounts(?:\/[a-zA-Z0-9-]+\/default)?|bill-splits\/[a-zA-Z0-9-]+\/payment-order|payment-orders\/[a-zA-Z0-9-]+(?:\/payout-request)?|support-requests|vietqr\/(banks|account-lookup))$/
const refreshes = new Map<string, Promise<LoginSession | null>>()
const adminPaths =
  /^admin\/(users(?:\/(?:permissions|roles|[a-zA-Z0-9-]+\/(?:permissions|role|access)))?|support-requests(?:\/[a-zA-Z0-9-]+\/status)?)$/
async function upstream(path: string, method: string, body?: string, token?: string) {
  return fetch(`${baseUrl.replace(/\/$/, '')}/api/${path}`, {
    method,
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
async function refresh(token: string): Promise<LoginSession | null> {
  const key = createHash('sha256').update(token).digest('hex')
  let pending = refreshes.get(key)
  if (!pending) {
    pending = (async () => {
      const response = await upstream(
        'auth/refresh',
        'POST',
        JSON.stringify({ refreshToken: token }),
      )
      const body = await response.json()
      return response.ok && body.success !== false ? (body.data as LoginSession) : null
    })()
    refreshes.set(key, pending)
    // Keep a short grace window for simultaneous requests using a rotated token.
    const timer = setTimeout(() => refreshes.delete(key), 15_000)
    timer.unref()
  }
  return pending
}
async function handler(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const path = (await context.params).path.join('/')
  if (!allowed.test(path) && !adminPaths.test(path))
    return Response.json({ message: 'Không tìm thấy API.' }, { status: 404 })
  if (adminPaths.test(path)) {
    const methods = path.endsWith('/access')
      ? ['PUT']
      : path.endsWith('/role') || path.endsWith('/status')
        ? ['PATCH']
        : /^admin\/users\/[^/]+\/permissions$/.test(path)
          ? ['GET', 'PATCH']
          : ['GET']
    if (!methods.includes(request.method)) return new Response(null, { status: 405 })
  }
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin')
    // Next dev binds to 0.0.0.0; request.url can use that internal address
    // while the browser and Host header correctly use localhost:3000.
    const host = request.headers.get('host') || new URL(request.url).host
    if (origin) {
      let sameHost = false
      try {
        const source = new URL(origin)
        sameHost = ['http:', 'https:'].includes(source.protocol) && source.host === host
      } catch {
        /* Invalid origins are rejected. */
      }
      if (!sameHost) return Response.json({ message: 'Yêu cầu không hợp lệ.' }, { status: 403 })
    }
  }
  if (
    path === 'auth/dev-login' &&
    (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEV_LOGIN !== 'true')
  ) {
    return Response.json({ message: 'Đăng nhập thử chưa được bật.' }, { status: 403 })
  }
  if (path === 'auth/logout' && request.method !== 'POST')
    return new Response(null, { status: 405 })
  const store = await cookies()
  const user = await getCurrentUser()
  let access = store.get('mo_access')?.value
  const refreshToken = store.get('mo_refresh')?.value
  if (!publicAuth.has(path) && path !== 'auth/logout' && !user)
    return Response.json({ message: 'Vui lòng đăng nhập để tiếp tục.' }, { status: 401 })
  try {
    let body = request.method === 'GET' ? undefined : await request.text()
    if (body && body.length > 100_000)
      return Response.json({ message: 'Nội dung quá dài.' }, { status: 413 })
    if (path === 'auth/verify-login-code' || path === 'auth/send-login-code') {
      let input: { email?: unknown; code?: unknown }
      try {
        input = JSON.parse(body || '{}')
      } catch {
        return Response.json({ message: 'Nội dung đăng nhập chưa hợp lệ.' }, { status: 400 })
      }
      if (
        typeof input.email !== 'string' ||
        (path === 'auth/verify-login-code' && typeof input.code !== 'string')
      )
        return Response.json({ message: 'Nhập email và mã đăng nhập hợp lệ.' }, { status: 400 })
      body = JSON.stringify({
        email: input.email.trim().toLowerCase(),
        ...(path === 'auth/verify-login-code'
          ? { code: (input.code as string).trim().toUpperCase() }
          : {}),
      })
    }
    const target = path + new URL(request.url).search
    if (path === 'auth/logout') {
      try {
        if (refreshToken) await upstream(path, 'POST', JSON.stringify({ refreshToken }), access)
      } finally {
        await clearSession()
      }
      return Response.json({ data: true })
    }
    let response = await upstream(target, request.method, body, access)
    if (response.status === 401 && !publicAuth.has(path) && refreshToken) {
      const session = await refresh(refreshToken)
      if (session?.accessToken && user) {
        await setSession(session, user)
        access = session.accessToken
        response = await upstream(target, request.method, body, access)
      } else {
        await clearSession()
        return Response.json({ message: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 })
      }
    }
    if (response.status === 204) return new Response(null, { status: 204 })
    const result = await response.json().catch(() => null)
    if (!result)
      return Response.json(
        { message: 'Máy chủ chưa sẵn sàng. Vui lòng thử lại sau.' },
        { status: 502 },
      )
    if (
      publicAuth.has(path) &&
      path !== 'auth/send-login-code' &&
      response.ok &&
      result.success !== false
    ) {
      const session = result.data as LoginSession
      if (!session?.email) throw new Error('Incomplete login response')
      const profile = {
        email: session.email,
        displayName: session.displayName || session.email.split('@')[0],
        avatarUrl: session.avatarUrl,
      }
      await setSession(session, profile)
      return Response.json(
        { success: true, data: profile },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
    if (response.status === 401 && !publicAuth.has(path)) await clearSession()
    return Response.json(result, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    if (path === 'auth/logout') return Response.json({ data: true })
    return Response.json(
      { message: 'Chưa kết nối được máy chủ. Vui lòng thử lại trong giây lát.' },
      { status: 502 },
    )
  }
}
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }
