import { cookies } from 'next/headers'
import { clearSession, getCurrentUser, setSession } from '../../../../lib/api/session'
import { refresh, upstream } from '../../../../lib/api/upstream.server'

// Cookie writes belong in a route handler, never in a Server Component render.
export async function GET(request: Request) {
  const url = new URL(request.url)
  // Match the public Host even when Next dev binds to an internal address.
  const host = request.headers.get('host')
  if (host) url.host = host
  const value = url.searchParams.get('next') || '/dashboard'
  let next = '/dashboard'
  try {
    const destination = new URL(value, url.origin)
    if (
      value.startsWith('/') &&
      !value.includes('\\') &&
      destination.origin === url.origin &&
      !destination.pathname.startsWith('//') &&
      destination.pathname !== '/auth/refresh' &&
      !destination.pathname.startsWith('/auth/refresh/') &&
      !destination.pathname.startsWith('/api/')
    )
      next = destination.pathname + destination.search + destination.hash
  } catch {
    // Invalid destinations fall back to the workspace home.
  }
  const login = `/login?next=${encodeURIComponent(next)}`
  const redirect = (path: string) =>
    new Response(null, {
      status: 303,
      headers: { Location: new URL(path, url.origin).href, 'Cache-Control': 'no-store' },
    })
  const user = await getCurrentUser()
  const token = (await cookies()).get('mo_refresh')?.value
  try {
    const session = user && token ? await refresh(token) : null
    if (session?.accessToken && user) {
      const permissions = await upstream(
        'auth/me/permissions',
        'GET',
        undefined,
        session.accessToken,
      )
      if (permissions.status !== 401) {
        await setSession(session, user)
        return redirect(next)
      }
    }
  } catch {
    // Clear an unusable session without returning upstream diagnostics.
  }
  await clearSession()
  return redirect(login)
}
