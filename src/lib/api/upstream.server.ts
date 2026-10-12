import 'server-only'

import { createHash } from 'node:crypto'
import type { LoginSession } from './types'

const refreshes = new Map<string, Promise<LoginSession | null>>()

export async function upstream(path: string, method: string, body?: string, token?: string) {
  const baseUrl = process.env.BACKEND_API_URL
  if (!baseUrl) throw new Error('BACKEND_API_URL is required')
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

export async function refresh(token: string): Promise<LoginSession | null> {
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
    const timer = setTimeout(() => refreshes.delete(key), 15_000)
    timer.unref()
  }
  return pending
}
