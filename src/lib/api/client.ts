export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...options,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.success === false) {
    if (
      response.status === 401 &&
      !/^auth\/(google|send-login-code|verify-login-code|dev-login|logout)$/.test(path)
    ) {
      const next = window.location.pathname + window.location.search
      window.location.assign(`/login?next=${encodeURIComponent(next)}`)
    }
    const errors: unknown = body?.errors
    const values = Array.isArray(errors)
      ? errors
      : errors && typeof errors === 'object'
        ? Object.values(errors)
        : [errors]
    const details = values
      .flat()
      .map((value: unknown) =>
        typeof value === 'string'
          ? value
          : value &&
              typeof value === 'object' &&
              'message' in value &&
              typeof value.message === 'string'
            ? value.message
            : '',
      )
      .filter(Boolean)
      .join(' ')
    throw new ApiError(
      details || body?.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
      response.status,
    )
  }
  return (body && 'data' in body ? body.data : body) as T
}

export const send = <T>(path: string, data: unknown = {}, method = 'POST') =>
  api<T>(path, { method, body: JSON.stringify(data) })

export const money = (amount: number, currency = 'VND') =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount || 0)

export const localDate = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

export function parseEmails(value: string): string[] {
  const emails = [
    ...new Set(
      value
        .split(/[\n,;]+/)
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
  if (emails.some((v) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)))
    throw new Error('Có email chưa hợp lệ. Hãy kiểm tra lại danh sách.')
  return emails
}

export function safeExternalUrl(value: string | null | undefined) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}
