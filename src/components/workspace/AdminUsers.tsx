'use client'

import Select from '../ui/Select'

import { useRef, useState } from 'react'
import { send } from '../../lib/api/client'
import type { AdminUser, PageResult } from '../../lib/api/types'
import type { PermissionDefinitionView, PermissionView, RoleView } from '../../lib/api/views'
import PermissionsForm from './admin/PermissionsForm'
import SearchInput from '../ui/SearchInput'
import WorkspaceModal from '../ui/WorkspaceModal'
import { Empty, ErrorState, Loading, Notice } from '../ui/Feedback'
import { Field } from '../ui/Field'
import { PageHeading } from '../ui/PageHeading'
import { Status } from '../ui/Status'
import { useApi, useWorkspace } from './hooks'

export default function AdminUsers() {
  const { can } = useWorkspace()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [editorBusy, setEditorBusy] = useState(false)
  const [message, setMessage] = useState('')
  const query = useApi<PageResult<AdminUser>>(
    can('Users.Read')
      ? `admin/users?search=${encodeURIComponent(filter)}&status=${status}&pageNumber=${page}&pageSize=8`
      : null,
  )
  if (!can('Users.Read'))
    return (
      <Empty
        title="Chưa có quyền quản lý người dùng"
        description="Liên hệ quản trị viên để mở quyền truy cập."
      />
    )
  return (
    <>
      <PageHeading
        eyebrow="QUẢN TRỊ"
        title="Người dùng & quyền."
        description="Quản lý vai trò, quyền truy cập và trạng thái tài khoản."
      />
      <form
        className="ws-toolbar ws-admin-toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          setFilter(search.trim())
          setPage(1)
        }}
      >
        <SearchInput
          className="ws-search"
          label="Tìm người dùng"
          placeholder="Tìm theo tên hoặc email…"
          value={search}
          onChange={setSearch}
        />
        <Select
          className="ws-compact-select"
          aria-label="Trạng thái người dùng"
          value={status}
          onValueChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Đang hoạt động</option>
          <option value="Blocked">Đã chặn</option>
          <option value="Pending">Chờ kích hoạt</option>
          <option value="Deleted">Đã xóa</option>
        </Select>
        <button className="ws-button ws-button-secondary">Tìm kiếm</button>
      </form>
      <Notice message={message} success />
      <section className="ws-panel ws-admin-list ws-users-directory">
        <div className="ws-section-heading">
          <h2>Danh sách người dùng</h2>
          <span className="ws-muted">{query.data?.totalCount ?? '…'} tài khoản</span>
        </div>
        <p className="ws-muted ws-directory-hint">
          Chọn một tài khoản để xem thông tin và quản lý quyền truy cập.
        </p>
        <div className="ws-directory-columns" aria-hidden="true">
          <span>Người dùng</span>
          <span>Vai trò</span>
          <span>Trạng thái</span>
          <span />
        </div>
        <div className="ws-directory-rows">
          {query.loading ? (
            <Loading />
          ) : query.error ? (
            <ErrorState message={query.error} retry={query.reload} />
          ) : query.data?.items?.length ? (
            query.data.items.map((member) => (
              <button
                className={`ws-admin-person ${selected?.memberId === member.memberId ? 'is-selected' : ''}`}
                key={member.memberId}
                aria-pressed={selected?.memberId === member.memberId}
                aria-haspopup="dialog"
                data-status={member.status}
                onClick={() => setSelected(member)}
              >
                <span className="ws-avatar">{(member.name || member.email || '?')[0]}</span>
                <span className="ws-person-identity">
                  <strong>{member.name || member.email}</strong>
                  <small>{member.email}</small>
                </span>
                <span className="ws-person-role">{member.role}</span>
                <Status value={member.status} />
                <span aria-hidden="true">↗</span>
              </button>
            ))
          ) : (
            <Empty
              title="Không có người dùng phù hợp"
              description="Thử tên, email hoặc trạng thái khác."
            />
          )}
        </div>
        {(query.data?.totalPages || 0) > 1 && (
          <div className="ws-pagination">
            <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Trang trước
            </button>
            <span>
              {page} / {query.data?.totalPages}
            </span>
            <button
              disabled={page >= (query.data?.totalPages || 1)}
              onClick={() => setPage((value) => value + 1)}
            >
              Trang sau
            </button>
          </div>
        )}
      </section>
      <WorkspaceModal
        open={!!selected}
        title="Thông tin người dùng"
        size="wide"
        busy={editorBusy}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <MemberEditor
            key={selected.memberId}
            member={selected}
            onBusy={setEditorBusy}
            onSaved={() => {
              setEditorBusy(false)
              setMessage('Đã cập nhật người dùng và quyền truy cập.')
              query.reload()
              setSelected(null)
            }}
          />
        )}
      </WorkspaceModal>
    </>
  )
}

function MemberEditor({
  member,
  onSaved,
  onBusy,
}: {
  member: AdminUser
  onSaved: () => void
  onBusy: (busy: boolean) => void
}) {
  const { can, reloadPermissions, user } = useWorkspace()
  const [roleId, setRoleId] = useState(member.roleId)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [tab, setTab] = useState<'access' | 'permissions'>('access')
  const [permissionsOpened, setPermissionsOpened] = useState(false)
  const roles = useApi<RoleView[]>(can('Roles.Read') ? 'admin/users/roles' : null)
  const catalog = useApi<PermissionDefinitionView[]>(
    permissionsOpened && can('Permissions.Read') ? 'admin/users/permissions' : null,
  )
  const permissions = useApi<PermissionView>(
    permissionsOpened && can('Users.ReadPermissions')
      ? `admin/users/${member.memberId}/permissions`
      : null,
  )
  function selectTab(value: 'access' | 'permissions') {
    if (value === 'permissions') setPermissionsOpened(true)
    setTab(value)
  }
  const tabs = can('Users.ReadPermissions')
    ? (['access', 'permissions'] as const)
    : (['access'] as const)
  const lock = useRef(false)
  async function save(path: string, body: unknown, method = 'PATCH') {
    if (lock.current) return
    lock.current = true
    setPending(true)
    onBusy(true)
    setError('')
    try {
      await send(`admin/users/${member.memberId}/${path}`, body, method)
      if (member.email?.toLowerCase() === user.email.toLowerCase()) reloadPermissions()
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa cập nhật được người dùng.')
    } finally {
      lock.current = false
      setPending(false)
      onBusy(false)
    }
  }
  return (
    <section className="ws-admin-editor ws-user-profile" data-status={member.status} data-tab={tab}>
      <div className="ws-user-profile-heading">
        <span className="ws-avatar">{(member.name || member.email || '?')[0].toUpperCase()}</span>
        <div>
          <h3>{member.name || member.email}</h3>
          <p>{member.email}</p>
        </div>
        <Status value={member.status} />
      </div>
      <div className="ws-user-profile-facts">
        <div>
          <span>Vai trò hiện tại</span>
          <strong>{member.role || 'Chưa có vai trò'}</strong>
        </div>
        <div>
          <span>Quyền hiệu lực</span>
          <strong>
            {can('Users.ReadPermissions')
              ? (permissions.data?.effectivePermissionCodes?.length ?? 'Xem trong thẻ quyền')
              : 'Không có quyền xem'}
          </strong>
        </div>
      </div>
      <Notice message={error} />
      <div className="ws-user-profile-tabs" role="tablist" aria-label="Quản lý người dùng">
        {tabs.map((value) => (
          <button
            key={value}
            id={`user-tab-${value}`}
            type="button"
            role="tab"
            aria-selected={tab === value}
            aria-controls={`user-panel-${value}`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => selectTab(value)}
            onKeyDown={(event) => {
              if (
                !can('Users.ReadPermissions') ||
                !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              )
                return
              event.preventDefault()
              const next =
                event.key === 'Home'
                  ? 'access'
                  : event.key === 'End'
                    ? 'permissions'
                    : tab === 'access'
                      ? 'permissions'
                      : 'access'
              selectTab(next)
              document.getElementById(`user-tab-${next}`)?.focus()
            }}
          >
            {value === 'access' ? 'Vai trò & truy cập' : 'Quyền hiệu lực'}
          </button>
        ))}
      </div>
      <div
        id="user-panel-access"
        role="tabpanel"
        aria-labelledby="user-tab-access"
        hidden={tab !== 'access'}
      >
        <div className="ws-user-access">
          {roles.error && <ErrorState message={roles.error} retry={roles.reload} />}
          <Field label="Vai trò người dùng">
            <Select
              value={roleId}
              disabled={pending || roles.loading || !!roles.error || !can('Users.UpdateRole')}
              onValueChange={(value) => setRoleId(value)}
            >
              {!(roles.data || []).some((role) => role.roleId === member.roleId) && (
                <option value={member.roleId}>{member.role || 'Vai trò hiện tại'}</option>
              )}
              {(roles.data || []).map((role) => (
                <option key={role.roleId} value={role.roleId}>
                  {role.name || 'Vai trò'}
                </option>
              ))}
            </Select>
          </Field>
          {can('Users.UpdateRole') && (
            <>
              <p className="ws-muted">
                Đổi vai trò sẽ xóa các quyền cấp thêm hoặc bị từ chối riêng của tài khoản này.
              </p>
              <button
                className="ws-button"
                disabled={pending || roles.loading || !!roles.error || roleId === member.roleId}
                onClick={() => void save('role', { roleId })}
              >
                {pending ? 'Đang lưu…' : 'Lưu vai trò'}
              </button>
            </>
          )}
          {can('Users.UpdateAccess') && (
            <div className="ws-access-control">
              <Status value={member.status} />
              <button
                className="ws-button ws-button-secondary"
                disabled={pending}
                onClick={() =>
                  void save('access', { blocked: member.status !== 'Blocked', roleId }, 'PUT')
                }
              >
                {member.status === 'Blocked' ? 'Mở lại truy cập' : 'Chặn truy cập'}
              </button>
            </div>
          )}
        </div>
      </div>
      {can('Users.ReadPermissions') && (
        <div
          id="user-panel-permissions"
          role="tabpanel"
          aria-labelledby="user-tab-permissions"
          hidden={tab !== 'permissions'}
        >
          {permissions.loading || catalog.loading ? (
            <Loading />
          ) : permissions.error || catalog.error ? (
            <ErrorState
              message={permissions.error || catalog.error}
              retry={() => {
                permissions.reload()
                catalog.reload()
              }}
            />
          ) : (
            permissions.data && (
              <PermissionsForm
                key={JSON.stringify(permissions.data.effectivePermissionCodes)}
                initial={permissions.data.effectivePermissionCodes || []}
                catalog={catalog.data || []}
                editable={
                  can('Users.UpdatePermissions') &&
                  can('Permissions.Read') &&
                  (catalog.data?.length || 0) > 0
                }
                pending={pending}
                onSave={(codes) => void save('permissions', { effectivePermissionCodes: codes })}
              />
            )
          )}
        </div>
      )}
    </section>
  )
}
