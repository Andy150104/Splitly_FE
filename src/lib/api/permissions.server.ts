import 'server-only'

import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { upstream } from './upstream.server'

// Methods keep this server object from being serialized into client props.
class WorkspacePermissions {
  constructor(
    private readonly codes: Set<string>,
    readonly error: string = '',
  ) {}

  has(code: string): boolean {
    return this.codes.has(code)
  }
}

// React cache only deduplicates layout/page reads within a render request.
// A new render reads current effective permissions from BE again.
export const getWorkspacePermissions = cache(async () => {
  const store = await cookies()
  const access = store.get('mo_access')?.value
  if (!access) redirect('/login')
  let response: Response
  let data: unknown
  try {
    response = await upstream('auth/me/permissions', 'GET', undefined, access)
    data = await response.json().catch(() => null)
  } catch {
    return new WorkspacePermissions(new Set(), 'Chưa tải được quyền truy cập. Hãy thử lại.')
  }
  if (response.status === 401) {
    const next = (await headers()).get('x-mo-path') || '/dashboard'
    if (store.get('mo_refresh')?.value)
      redirect(`/api/auth/refresh-session?next=${encodeURIComponent(next)}`)
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }
  const result = data as { success?: boolean; data?: { effectivePermissionCodes?: unknown } } | null
  const codes = result?.data?.effectivePermissionCodes
  if (
    !response.ok ||
    result?.success === false ||
    !Array.isArray(codes) ||
    codes.some((code) => typeof code !== 'string')
  )
    return new WorkspacePermissions(new Set(), 'Chưa tải được quyền truy cập. Hãy thử lại.')
  return new WorkspacePermissions(new Set(codes))
})

// Called by the gateway after validating the admin route and HTTP method.
export function requiredAdminPermission(path: string, method: string): string {
  if (path.startsWith('admin/support-requests'))
    return method === 'GET' ? 'SupportRequests.Read' : 'SupportRequests.Update'
  if (path === 'admin/users/roles') return 'Roles.Read'
  if (path === 'admin/users/permissions') return 'Permissions.Read'
  if (path.endsWith('/permissions'))
    return method === 'GET' ? 'Users.ReadPermissions' : 'Users.UpdatePermissions'
  if (path.endsWith('/role')) return 'Users.UpdateRole'
  if (path.endsWith('/access')) return 'Users.UpdateAccess'
  return 'Users.Read'
}
