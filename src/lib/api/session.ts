import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'
import type { LoginSession } from './types'

const developmentState = globalThis as typeof globalThis & { moSessionSecret?: string }
function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET
  if (process.env.NODE_ENV === 'production')
    throw new Error('SESSION_SECRET is required in production')
  developmentState.moSessionSecret ||= randomBytes(32).toString('hex')
  return developmentState.moSessionSecret
}
export interface User {
  email: string
  displayName: string
  avatarUrl?: string | null
}
const options = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}
export const SESSION_COOKIES = ['mo_access', 'mo_refresh', 'mo_profile'] as const

export async function setSession(
  session: Pick<LoginSession, 'accessToken' | 'refreshToken' | 'refreshTokenExpiresAtUtc'>,
  user?: User,
) {
  if (!session.accessToken || !session.refreshToken) throw new Error('Incomplete session')
  const expires = new Date(session.refreshTokenExpiresAtUtc)
  if (!Number.isFinite(expires.getTime()) || expires <= new Date())
    throw new Error('Invalid session expiry')
  const store = await cookies()
  store.set('mo_access', session.accessToken, { ...options, expires })
  store.set('mo_refresh', session.refreshToken, { ...options, expires })
  if (user) {
    const payload = Buffer.from(JSON.stringify({ ...user, expires: expires.getTime() })).toString(
      'base64url',
    )
    const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
    store.set('mo_profile', `${payload}.${signature}`, { ...options, expires })
  }
}
export async function clearSession() {
  const store = await cookies()
  SESSION_COOKIES.forEach((name) => store.delete(name))
}
export async function getCurrentUser(): Promise<User | null> {
  const value = (await cookies()).get('mo_profile')?.value
  if (!value) return null
  try {
    const [payload, signature] = value.split('.')
    const expected = createHmac('sha256', secret()).update(payload).digest()
    const received = Buffer.from(signature, 'base64url')
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof user.email !== 'string' || user.expires <= Date.now()) return null
    return { email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl }
  } catch {
    return null
  }
}
