import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, parseEmails, safeExternalUrl } from './client'

afterEach(() => vi.unstubAllGlobals())
describe('API contract handling', () => {
  it('unwraps envelopes and retains backend validation details', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true, data: { billId: 'a' } }))
      .mockResolvedValueOnce(
        Response.json(
          { success: false, errors: [{ field: 'amount', message: 'Amount must be positive' }] },
          { status: 400 },
        ),
      )
    vi.stubGlobal('fetch', fetcher)
    expect(await api('bills')).toEqual({ billId: 'a' })
    await expect(api('bills')).rejects.toThrow('Amount must be positive')
  })
  it('does not redirect when an OTP is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ message: 'Invalid code' }, { status: 401 })),
    )
    await expect(api('auth/verify-login-code')).rejects.toBeInstanceOf(ApiError)
  })
  it('handles dictionary and string error payloads without breaking permission screens', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ errors: { permission: ['Không có quyền truy cập.'] } }, { status: 403 }),
        )
        .mockResolvedValueOnce(Response.json({ errors: 'Dữ liệu không hợp lệ.' }, { status: 400 })),
    )
    await expect(api('admin/users/permissions')).rejects.toThrow('Không có quyền truy cập.')
    await expect(api('vietqr/account-lookup')).rejects.toThrow('Dữ liệu không hợp lệ.')
  })
  it('deduplicates normalized emails and rejects an invalid participant', () => {
    expect(parseEmails(' A@Example.com; a@example.com\nb@example.com ')).toEqual([
      'a@example.com',
      'b@example.com',
    ])
    expect(() => parseEmails('invalid')).toThrow('email')
  })
  it('allows only HTTPS links for external payments and QR images', () => {
    expect(safeExternalUrl('https://pay.payos.vn/abc')).toBe('https://pay.payos.vn/abc')
    expect(safeExternalUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeExternalUrl('//attacker.test')).toBeUndefined()
    expect(safeExternalUrl('http://attacker.test')).toBeUndefined()
  })
})
