import 'server-only'

import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto'
import { deriveSessionKey } from './session'
import type { AdminReference } from './views'

type ReferenceKind = 'role' | 'permission'

function context(kind: ReferenceKind, viewer: string) {
  if (!viewer) throw new Error('Missing reference viewer')
  return Buffer.from(JSON.stringify([kind, viewer]))
}

export function adminReference(kind: ReferenceKind, raw: string, viewer: string): AdminReference {
  if (!raw || raw.length > 512) throw new Error('Invalid reference identifier')
  const key = deriveSessionKey('splitly/admin-references/v1')
  const aad = context(kind, viewer)
  const id = createHmac('sha256', deriveSessionKey('splitly/admin-reference-ids/v1'))
    .update(aad)
    .update(JSON.stringify(raw))
    .digest('base64url')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(aad)
  const encrypted = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()])
  return {
    id,
    value: [
      'v1',
      iv.toString('base64url'),
      encrypted.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
    ].join('.'),
  }
}

export function readAdminReference(kind: ReferenceKind, value: unknown, viewer: string): string {
  if (typeof value !== 'string' || value.length > 3000) throw new Error('Invalid reference')
  const parts = value.split('.')
  if (
    parts.length !== 4 ||
    parts[0] !== 'v1' ||
    parts.slice(1).some((part) => !/^[A-Za-z0-9_-]+$/.test(part))
  )
    throw new Error('Invalid reference')
  const [, nonce, encrypted, tag] = parts
  const iv = Buffer.from(nonce, 'base64url')
  const authTag = Buffer.from(tag, 'base64url')
  if (iv.length !== 12 || authTag.length !== 16) throw new Error('Invalid reference')
  const decipher = createDecipheriv(
    'aes-256-gcm',
    deriveSessionKey('splitly/admin-references/v1'),
    iv,
  )
  decipher.setAAD(context(kind, viewer))
  decipher.setAuthTag(authTag)
  const raw = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
  if (!raw || raw.length > 512) throw new Error('Invalid reference')
  return raw
}

// These references select values only. The gateway and backend still authorize every write.
export function adminRequestBody(path: string, body: string | undefined, viewer: string) {
  if (!/^admin\/users\/[^/]+\/(role|access|permissions)$/.test(path)) return body
  const input = JSON.parse(body || '{}')
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid body')
  if (path.endsWith('/permissions')) {
    if (
      Object.keys(input).some((key) => key !== 'permissions') ||
      !Array.isArray(input.permissions) ||
      input.permissions.length > 1000
    )
      throw new Error('Invalid permission selection')
    return JSON.stringify({
      effectivePermissionCodes: [
        ...new Set(
          input.permissions.map((value: unknown) =>
            readAdminReference('permission', value, viewer),
          ),
        ),
      ],
    })
  }
  const access = path.endsWith('/access')
  if (
    Object.keys(input).some((key) => key !== 'role' && !(access && key === 'blocked')) ||
    (access && typeof input.blocked !== 'boolean')
  )
    throw new Error('Invalid role selection')
  return JSON.stringify({
    roleId: readAdminReference('role', input.role, viewer),
    ...(access ? { blocked: input.blocked } : {}),
  })
}
