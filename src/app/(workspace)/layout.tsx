import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import { getCurrentUser } from '../../lib/api/session'
import Shell from '../../components/workspace/Shell'
import type { NavigationLink } from '../../components/workspace/Shell'
import Link from 'next/link'
import { getWorkspacePermissions } from '../../lib/api/permissions.server'
import WorkspaceLoadError from '../../components/workspace/WorkspaceLoadError'

const navigation: (NavigationLink & { permission?: string })[] = [
  {
    href: '/dashboard',
    label: 'Tổng quan',
    description: 'Theo dõi khoản chung và tiến độ thu tiền.',
    icon: 'dashboard',
  },
  {
    href: '/bills',
    label: 'Hóa đơn',
    description: 'Các khoản bạn tạo và những khoản bạn cùng chia.',
    icon: 'bills',
    permission: 'Bills.Read',
  },
  {
    href: '/groups',
    label: 'Nhóm của bạn',
    description: 'Quản lý những người thường cùng bạn chia tiền.',
    icon: 'groups',
    permission: 'Groups.Read',
  },
  {
    href: '/payout-accounts',
    label: 'Tài khoản nhận tiền',
    description: 'Thêm và chọn tài khoản ngân hàng để nhận tiền.',
    icon: 'accounts',
    permission: 'PayoutAccounts.Read',
  },
  {
    href: '/support',
    label: 'Hỗ trợ',
    description: 'Gửi yêu cầu khi bạn cần hỗ trợ.',
    icon: 'support',
  },
  {
    href: '/admin/users',
    label: 'Người dùng & quyền',
    description: 'Quản lý vai trò và quyền truy cập của từng tài khoản.',
    icon: 'users',
    permission: 'Users.Read',
  },
  {
    href: '/admin/support-requests',
    label: 'Yêu cầu hỗ trợ',
    description: 'Tiếp nhận và xử lý yêu cầu hỗ trợ của người dùng.',
    icon: 'requests',
    permission: 'SupportRequests.Read',
  },
]

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user)
    redirect(
      `/login?next=${encodeURIComponent((await headers()).get('x-mo-path') || '/dashboard')}`,
    )
  const permissions = await getWorkspacePermissions()
  const links = navigation
    .filter((link) => !link.permission || permissions.has(link.permission))
    .map(({ href, label, description, icon }) => ({ href, label, description, icon }))
  return (
    <Shell
      user={user}
      links={links}
      createBillLink={
        permissions.has('Bills.Create') ? (
          <Link className="ws-small-create" href="/bills/new">
            + Tạo hóa đơn
          </Link>
        ) : null
      }
    >
      {permissions.error ? <WorkspaceLoadError message={permissions.error} /> : children}
    </Shell>
  )
}
