import 'server-only'

import Link from 'next/link'
import { ArrowUpRight, Bell, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { getWorkspacePermissions } from '../../../lib/api/permissions.server'
import { Empty } from '../../../components/ui/Feedback'
import { Field } from '../../../components/ui/Field'
import WorkspaceLoadError from '../../../components/workspace/WorkspaceLoadError'
import Accounts, { AccountForm } from '../../../components/workspace/Accounts'
import BankPicker, { BankLogo } from '../../../components/workspace/BankPicker'
import Bills, { Dashboard } from '../../../components/workspace/Bills'
import BillDetail from '../../../components/workspace/BillDetail'
import CreateBill from '../../../components/workspace/CreateBill'
import Groups, { GroupDetail } from '../../../components/workspace/Groups'
import AdminUsers from '../../../components/workspace/AdminUsers'
import AdminSupport from '../../../components/workspace/AdminSupport'
import PermissionsForm from '../../../components/workspace/admin/PermissionsForm'

type Permissions = Awaited<ReturnType<typeof getWorkspacePermissions>>

function denied(title: string) {
  return <Empty title={title} description="Liên hệ quản trị viên để mở quyền truy cập." />
}

function unavailable(permissions: Permissions): ReactNode {
  return permissions.error ? <WorkspaceLoadError message={permissions.error} /> : null
}

function createBillLink(permissions: Permissions, className = 'ws-button', href = '/bills/new') {
  return permissions.has('Bills.Create') ? (
    <Link className={className} href={href}>
      + Tạo hóa đơn
    </Link>
  ) : null
}

function bankPicker(permissions: Permissions) {
  return permissions.has('Banks.Read') ? <BankPicker banks={[]} value="" /> : null
}

function accountForm(permissions: Permissions) {
  if (!permissions.has('PayoutAccounts.Create') || !permissions.has('Banks.Read')) return null
  return (
    <AccountForm
      bankPicker={bankPicker(permissions)}
      saveButton={<button className="ws-button">Lưu tài khoản</button>}
    />
  )
}

export async function DashboardView() {
  const permissions = await getWorkspacePermissions()
  return (
    unavailable(permissions) || (
      <Dashboard
        createBillLink={createBillLink(permissions)}
        billsLink={
          permissions.has('Bills.Read') ? (
            <Link className="ws-section-link" href="/bills">
              Xem tất cả hóa đơn <span>↗</span>
            </Link>
          ) : null
        }
        groupsLink={
          permissions.has('Groups.Read') ? (
            <Link className="ws-section-link" href="/groups">
              Xem các nhóm <span>↗</span>
            </Link>
          ) : null
        }
      />
    )
  )
}

export async function BillsView({ initialOwed = false }: { initialOwed?: boolean }) {
  const permissions = await getWorkspacePermissions()
  if (permissions.error) return unavailable(permissions)
  if (!permissions.has('Bills.Read')) return denied('Chưa có quyền xem hóa đơn')
  return <Bills initialOwed={initialOwed} createBillLink={createBillLink(permissions)} />
}

export async function AccountsView() {
  const permissions = await getWorkspacePermissions()
  if (permissions.error) return unavailable(permissions)
  if (!permissions.has('PayoutAccounts.Read'))
    return denied('Chưa có quyền xem tài khoản nhận tiền')
  return (
    <Accounts
      bankLogo={permissions.has('Banks.Read') ? <BankLogo /> : null}
      accountForm={accountForm(permissions)}
      addButton={
        permissions.has('PayoutAccounts.Create') ? (
          <button className="ws-button" aria-haspopup="dialog">
            + Thêm tài khoản
          </button>
        ) : null
      }
      defaultButton={
        permissions.has('PayoutAccounts.Update') ? (
          <button className="ws-text-button">Đặt làm mặc định</button>
        ) : null
      }
    />
  )
}

export async function CreateBillView({
  draftId,
  initialGroupId,
}: {
  draftId?: string
  initialGroupId?: string
}) {
  const permissions = await getWorkspacePermissions()
  if (permissions.error) return unavailable(permissions)
  if (!permissions.has('Bills.Create') && (!draftId || !permissions.has('Bills.Update')))
    return denied('Chưa có quyền tạo hóa đơn')
  const firstStep =
    permissions.has('Bills.Create') || (!!draftId && permissions.has('Bills.Update'))
  const stepCodes = ['Bills.ManageMembers', 'Bills.Calculate', 'Bills.Publish']
  const submitButtons = [
    firstStep ? (
      <button key="information" className="ws-button">
        Lưu &amp; tiếp tục
      </button>
    ) : null,
    ...stepCodes.map((code, index) =>
      permissions.has(code) ? (
        <button key={index} className="ws-button">
          Lưu &amp; tiếp tục
        </button>
      ) : null,
    ),
  ]
  return (
    <CreateBill
      draftId={draftId}
      initialGroupId={initialGroupId}
      submitButtons={submitButtons}
      groupField={
        permissions.has('Groups.Read') ? <Field label="Nhóm · tùy chọn">{null}</Field> : null
      }
      accountField={
        permissions.has('PayoutAccounts.Read') ? (
          <Field label="Tài khoản nhận tiền">{null}</Field>
        ) : null
      }
      addAccountButton={
        permissions.has('PayoutAccounts.Create') && permissions.has('Banks.Read') ? (
          <button type="button" className="ws-text-button">
            Thêm tài khoản nhận tiền
          </button>
        ) : null
      }
      accountForm={accountForm(permissions)}
    />
  )
}

export async function BillDetailView({ billId }: { billId: string }) {
  const permissions = await getWorkspacePermissions()
  if (permissions.error) return unavailable(permissions)
  if (!permissions.has('Bills.Read')) return denied('Chưa có quyền xem hóa đơn')
  return (
    <BillDetail
      billId={billId}
      recordButton={
        permissions.has('Payments.RecordManual') ? (
          <button className="ws-text-button">Ghi nhận đã trả</button>
        ) : null
      }
      paymentHistory={
        permissions.has('Payments.Read') ? <div className="ws-payment-history" /> : null
      }
      removeButton={
        permissions.has('Bills.ManageMembers') ? (
          <button className="ws-text-button ws-danger">Xóa khỏi bản nháp</button>
        ) : null
      }
      checkoutLink={
        permissions.has('Payments.Create') ? (
          <a className="ws-button" target="_blank" rel="noopener noreferrer">
            Thanh toán qua PayOS <ArrowUpRight size={17} />
          </a>
        ) : null
      }
      paymentQr={
        permissions.has('Payments.Create') ? (
          <img alt="Mã QR thanh toán phần của bạn" width={220} height={220} />
        ) : null
      }
      remindButton={
        permissions.has('Bills.SendReminders') ? (
          <button className="ws-button ws-button-secondary ws-full">
            <Bell size={16} />
            Nhắc thanh toán
          </button>
        ) : null
      }
      cancelButton={
        permissions.has('Bills.Delete') ? (
          <button className="ws-text-button ws-danger">Hủy hóa đơn</button>
        ) : null
      }
    />
  )
}

export async function GroupsView() {
  const permissions = await getWorkspacePermissions()
  if (permissions.error) return unavailable(permissions)
  if (!permissions.has('Groups.Read')) return denied('Chưa có quyền xem nhóm')
  return (
    <Groups
      createButton={
        permissions.has('Groups.Create') ? (
          <button className="ws-button" aria-haspopup="dialog">
            Tạo nhóm mới
          </button>
        ) : null
      }
    />
  )
}

export async function GroupDetailView({ groupId }: { groupId: string }) {
  const permissions = await getWorkspacePermissions()
  if (permissions.error) return unavailable(permissions)
  if (!permissions.has('Groups.Read')) return denied('Chưa có quyền xem nhóm')
  return (
    <GroupDetail
      groupId={groupId}
      closeButton={
        permissions.has('Groups.Delete') ? (
          <button className="ws-button ws-button-secondary" aria-haspopup="dialog">
            Đóng nhóm
          </button>
        ) : null
      }
      addMemberButton={
        permissions.has('Groups.ManageMembers') ? (
          <button
            className="ws-button ws-button-secondary ws-group-add-trigger"
            aria-haspopup="dialog"
          >
            Thêm người cùng chia
          </button>
        ) : null
      }
      removeMemberButton={
        permissions.has('Groups.ManageMembers') ? (
          <button>
            <X size={17} />
          </button>
        ) : null
      }
      createBillLink={
        permissions.has('Bills.Create') ? (
          <Link className="ws-button ws-full" href={`/bills/new?group=${groupId}`}>
            Tạo hóa đơn cho nhóm
          </Link>
        ) : null
      }
    />
  )
}

export async function AdminUsersView() {
  const permissions = await getWorkspacePermissions()
  if (permissions.error) return unavailable(permissions)
  if (!permissions.has('Users.Read')) return denied('Chưa có quyền quản lý người dùng')
  return (
    <AdminUsers
      roleField={
        permissions.has('Roles.Read') ? <Field label="Vai trò người dùng">{null}</Field> : null
      }
      permissionsPanel={
        permissions.has('Users.ReadPermissions') ? (
          <div id="user-panel-permissions" role="tabpanel" aria-labelledby="user-tab-permissions" />
        ) : null
      }
      permissionPicker={
        permissions.has('Permissions.Read') ? (
          <PermissionsForm initial={[]} catalog={[]} saveButton={null} pending={false} />
        ) : null
      }
      saveRoleButton={
        permissions.has('Users.UpdateRole') ? (
          <button className="ws-button">Lưu vai trò</button>
        ) : null
      }
      accessButton={
        permissions.has('Users.UpdateAccess') ? (
          <button className="ws-button ws-button-secondary">Chặn truy cập</button>
        ) : null
      }
      savePermissionsButton={
        permissions.has('Users.UpdatePermissions') && permissions.has('Permissions.Read') ? (
          <button className="ws-button">Lưu quyền hiệu lực</button>
        ) : null
      }
    />
  )
}

export async function AdminSupportView() {
  const permissions = await getWorkspacePermissions()
  if (permissions.error) return unavailable(permissions)
  if (!permissions.has('SupportRequests.Read')) return denied('Chưa có quyền xem yêu cầu hỗ trợ')
  return (
    <AdminSupport
      editorForm={permissions.has('SupportRequests.Update') ? <form className="ws-form" /> : null}
    />
  )
}
