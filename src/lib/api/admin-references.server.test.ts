import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { adminReference, adminRequestBody, readAdminReference } from './admin-references.server'

const viewer = 'admin@example.com'
beforeEach(() => vi.stubEnv('SESSION_SECRET', 'local-reference-security-test'))
afterEach(() => vi.unstubAllEnvs())

describe('server-only admin references', () => {
  it.each(['role', 'permission'] as const)(
    'hides %s identifiers and keeps stable selection IDs with fresh ciphertext',
    (kind) => {
      const first = adminReference(kind, 'private-backend-identifier', viewer)
      const second = adminReference(kind, 'private-backend-identifier', viewer)
      expect(first.id).toBe(second.id)
      expect(first.value).not.toBe(second.value)
      expect(JSON.stringify(first)).not.toContain('private-backend-identifier')
      expect(readAdminReference(kind, first.value, viewer)).toBe('private-backend-identifier')
    },
  )
  it('rejects a different viewer, kind, secret and changed ciphertext', () => {
    const reference = adminReference('permission', 'Bills.Read', viewer)
    expect(() => readAdminReference('permission', reference.value, 'other@example.com')).toThrow()
    expect(() => readAdminReference('role', reference.value, viewer)).toThrow()
    const parts = reference.value.split('.')
    parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1)
    expect(() => readAdminReference('permission', parts.join('.'), viewer)).toThrow()
    vi.stubEnv('SESSION_SECRET', 'rotated-test-secret')
    expect(() => readAdminReference('permission', reference.value, viewer)).toThrow()
  })
  it.each([null, '', 'Bills.Read', 'v1.a.b.c', 'v1.a.b.c.extra', 'a'.repeat(3001)])(
    'rejects malformed references (%s)',
    (value) => {
      expect(() => readAdminReference('permission', value, viewer)).toThrow()
    },
  )
  it('preserves and deduplicates grants with no frontend catalog entry', () => {
    const values = ['Bills.Read', 'System.Configure', 'Bills.Read'].map(
      (code) => adminReference('permission', code, viewer).value,
    )
    expect(
      JSON.parse(
        adminRequestBody(
          'admin/users/member-1/permissions',
          JSON.stringify({ permissions: values }),
          viewer,
        )!,
      ),
    ).toEqual({ effectivePermissionCodes: ['Bills.Read', 'System.Configure'] })
    expect(
      JSON.parse(
        adminRequestBody('admin/users/member-1/permissions', '{"permissions":[]}', viewer)!,
      ),
    ).toEqual({ effectivePermissionCodes: [] })
  })
  it.each([
    '{}',
    'null',
    '[]',
    'not-json',
    '{"permissions":"a"}',
    '{"effectivePermissionCodes":["Bills.Read"]}',
    '{"permissions":[],"debug":true}',
  ])('rejects invalid permission payloads (%s)', (body) => {
    expect(() => adminRequestBody('admin/users/member-1/permissions', body, viewer)).toThrow()
  })
  it('restores the upstream role and access contracts without forwarding extra fields', () => {
    const role = adminReference('role', 'role-1', viewer).value
    expect(
      JSON.parse(adminRequestBody('admin/users/member-1/role', JSON.stringify({ role }), viewer)!),
    ).toEqual({ roleId: 'role-1' })
    expect(
      JSON.parse(
        adminRequestBody(
          'admin/users/member-1/access',
          JSON.stringify({ role, blocked: false }),
          viewer,
        )!,
      ),
    ).toEqual({ roleId: 'role-1', blocked: false })
    expect(() =>
      adminRequestBody(
        'admin/users/member-1/access',
        JSON.stringify({ role, blocked: 'false' }),
        viewer,
      ),
    ).toThrow()
    expect(() =>
      adminRequestBody(
        'admin/users/member-1/role',
        JSON.stringify({ role, roleId: 'other' }),
        viewer,
      ),
    ).toThrow()
  })
})
