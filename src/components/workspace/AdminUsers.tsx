'use client'

import Select from '../ui/Select'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { bindControl, fillControl } from './slots'
import { send } from '../../lib/api/client'
import type { PageResult } from '../../lib/api/types'
import type {
  AdminUserView,
  PermissionDefinitionView,
  AdminPermissionView,
  RoleView,
} from '../../lib/api/views'
import PermissionsForm from './admin/PermissionsForm'
import SearchInput from '../ui/SearchInput'
import WorkspaceModal from '../ui/WorkspaceModal'
import { Empty, ErrorState, Loading, Notice } from '../ui/Feedback'
import { PageHeading } from '../ui/PageHeading'
import { Status } from '../ui/Status'
import { useApi, useWorkspace } from './hooks'

export type MemberEditorSlots = {
  roleField: ReactNode
  permissionsPanel: ReactNode
  permissionPicker: ReactNode
  saveRoleButton: ReactNode
  accessButton: ReactNode
  savePermissionsButton: ReactNode
}
export default function AdminUsers(slots: MemberEditorSlots) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminUserView | null>(null)
  const [editorBusy, setEditorBusy] = useState(false)
  const [message, setMessage] = useState('')
  const query = useApi<PageResult<AdminUserView>>(
    `admin/users?search=${encodeURIComponent(filter)}&status=${status}&pageNumber=${page}&pageSize=8`,
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
            {...slots}
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
  roleField,
  permissionsPanel,
  permissionPicker,
  saveRoleButton,
  accessButton,
  savePermissionsButton,
}: MemberEditorSlots & {
  member: AdminUserView
  onSaved: () => void
  onBusy: (busy: boolean) => void
}) {
  const { user } = useWorkspace()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState(member.roleSelection?.id || '')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [tab, setTab] = useState<'access' | 'permissions'>('access')
  const [permissionsOpened, setPermissionsOpened] = useState(false)
  const roles = useApi<RoleView[]>(roleField ? 'admin/users/roles' : null)
  const roleValue =
    roles.data?.find((role) => role.id === selectedRole)?.value ||
    (selectedRole === member.roleSelection?.id ? member.roleSelection.value : undefined)
  const catalog = useApi<PermissionDefinitionView[]>(
    permissionsOpened && permissionPicker ? 'admin/users/permissions' : null,
  )
  const permissions = useApi<AdminPermissionView>(
    permissionsOpened && permissionsPanel ? `admin/users/${member.memberId}/permissions` : null,
  )
  function selectTab(value: 'access' | 'permissions') {
    if (value === 'permissions') setPermissionsOpened(true)
    setTab(value)
  }
  const tabs = permissionsPanel ? (['access', 'permissions'] as const) : (['access'] as const)
  const lock = useRef(false)
  async function save(path: string, body: unknown, method = 'PATCH') {
    if (lock.current) return
    lock.current = true
    setPending(true)
    onBusy(true)
    setError('')
    try {
      await send(`admin/users/${member.memberId}/${path}`, body, method)
      if (member.email?.toLowerCase() === user.email.toLowerCase()) router.refresh()
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
            {permissionsPanel
              ? (permissions.data?.permissions.length ?? 'Xem trong thẻ quyền')
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
                !permissionsPanel ||
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
          {roleField ? (
            fillControl(roleField, {
              children: (
                <>
                  <Select
                    value={selectedRole}
                    disabled={pending || roles.loading || !!roles.error || !saveRoleButton}
                    onValueChange={setSelectedRole}
                  >
                    {!(roles.data || []).some((role) => role.id === member.roleSelection?.id) && (
                      <option value={member.roleSelection?.id || ''}>
                        {member.role || 'Vai trò hiện tại'}
                      </option>
                    )}
                    {(roles.data || []).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name || 'Vai trò'}
                      </option>
                    ))}
                  </Select>
                </>
              ),
            })
          ) : (
            <p className="ws-muted">Vai trò hiện tại: {member.role}</p>
          )}
          {saveRoleButton && (
            <>
              <p className="ws-muted">
                Đổi vai trò sẽ xóa các quyền cấp thêm hoặc bị từ chối riêng của tài khoản này.
              </p>
              {bindControl(saveRoleButton, {
                disabled:
                  pending ||
                  roles.loading ||
                  !!roles.error ||
                  !roleValue ||
                  selectedRole === member.roleSelection?.id,
                onClick: () => void save('role', { role: roleValue }),
                children: pending ? 'Đang lưu…' : 'Lưu vai trò',
              })}
            </>
          )}
          {accessButton && (
            <div className="ws-access-control">
              <Status value={member.status} />
              {bindControl(accessButton, {
                disabled: pending || !roleValue,
                onClick: () =>
                  void save(
                    'access',
                    { blocked: member.status !== 'Blocked', role: roleValue },
                    'PUT',
                  ),
                children: member.status === 'Blocked' ? 'Mở lại truy cập' : 'Chặn truy cập',
              })}
            </div>
          )}
        </div>
      </div>
      {bindControl(permissionsPanel, {
        hidden: tab !== 'permissions',
        children: (
          <>
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
              permissions.data &&
              (permissionPicker ? (
                bindControl(permissionPicker, {
                  key: JSON.stringify(
                    permissions.data.permissions.map((permission) => permission.id),
                  ),
                  initial: permissions.data.permissions,
                  catalog: catalog.data || [],
                  saveButton: savePermissionsButton,
                  pending,
                  onSave: (values: string[]) => void save('permissions', { permissions: values }),
                })
              ) : (
                <PermissionsForm
                  initial={permissions.data.permissions}
                  catalog={[]}
                  saveButton={null}
                  pending={pending}
                />
              ))
            )}
          </>
        ),
      })}
    </section>
  )
}
