'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSplitlyNavigation } from '../RouteTransition'
import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { User } from '../../lib/api/session'
import type { Permissions } from '../../lib/api/types'
import { send } from '../../lib/api/client'
import { Reveal } from '../ui/Motion'
import Brand from '../ui/Brand'
import Atmosphere from '../ui/Atmosphere'
import Tooltip from '../ui/Tooltip'
import { useNotify } from '../ui/Notifications'
import { ErrorState, Loading } from '../ui/Feedback'
import { WorkspaceContext, useApi } from './hooks'

const links = [
  {
    href: '/dashboard',
    label: 'Tổng quan',
    description: 'Theo dõi khoản chung và tiến độ thu tiền.',
    icon: LayoutDashboard,
  },
  {
    href: '/bills',
    label: 'Hóa đơn',
    description: 'Các khoản bạn tạo và những khoản bạn cùng chia.',
    permission: 'Bills.Read',
    icon: ReceiptText,
  },
  {
    href: '/groups',
    label: 'Nhóm của bạn',
    description: 'Quản lý những người thường cùng bạn chia tiền.',
    permission: 'Groups.Read',
    icon: Users,
  },
  {
    href: '/payout-accounts',
    label: 'Tài khoản nhận tiền',
    description: 'Thêm và chọn tài khoản ngân hàng để nhận tiền.',
    permission: 'PayoutAccounts.Read',
    icon: Building2,
  },
  {
    href: '/support',
    label: 'Hỗ trợ',
    description: 'Gửi yêu cầu khi bạn cần hỗ trợ.',
    icon: LifeBuoy,
  },
  {
    href: '/admin/users',
    label: 'Người dùng & quyền',
    description: 'Quản lý vai trò và quyền truy cập của từng tài khoản.',
    permission: 'Users.Read',
    icon: ShieldCheck,
  },
  {
    href: '/admin/support-requests',
    label: 'Yêu cầu hỗ trợ',
    description: 'Tiếp nhận và xử lý yêu cầu hỗ trợ của người dùng.',
    permission: 'SupportRequests.Read',
    icon: MessagesSquare,
  },
]
const navigationGroups = [
  { id: 'shared', label: 'Không gian chung', paths: ['/dashboard', '/bills', '/groups'] },
  { id: 'payment', label: 'Thanh toán', paths: ['/payout-accounts'] },
  { id: 'tools', label: 'Công cụ', paths: ['/support', '/admin/users', '/admin/support-requests'] },
]

function NavigationGroup({
  group,
  items,
  pathname,
  collapsed,
  closeMenu,
}: {
  group: (typeof navigationGroups)[number]
  items: typeof links
  pathname: string
  collapsed: boolean
  closeMenu: () => void
}) {
  const [open, setOpen] = useState(true)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (group.paths.some((path) => pathname === path || pathname.startsWith(`${path}/`)))
      setOpen(true)
  }, [pathname, group.paths])
  const expanded = collapsed || open
  return (
    <section className={`ws-nav-group ${expanded ? 'is-expanded' : ''}`}>
      <button
        type="button"
        className="ws-nav-group-toggle"
        aria-expanded={expanded}
        aria-controls={`ws-nav-${group.id}`}
        onClick={() => setOpen(!open)}
      >
        <span>{group.label}</span>
        <ChevronDown size={13} />
      </button>
      <motion.div
        id={`ws-nav-${group.id}`}
        className="ws-nav-branches"
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        inert={!expanded}
        aria-hidden={!expanded}
        transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {items.map(({ href, label, description, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Tooltip key={href} label={label} description={description} disabled={!collapsed}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                onClick={closeMenu}
              >
                {active && (
                  <motion.span
                    className="ws-nav-highlight"
                    layoutId={reduced ? undefined : 'workspace-navigation'}
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  />
                )}
                <Icon size={18} />
                <span className="ws-nav-label">{label}</span>
                {active && <span className="ws-nav-dot" />}
              </Link>
            </Tooltip>
          )
        })}
      </motion.div>
    </section>
  )
}
export default function Shell({ user, children }: { user: User; children: ReactNode }) {
  const pathname = usePathname()
  const navigate = useSplitlyNavigation()
  const reduced = useReducedMotion()
  const notify = useNotify()
  const permissions = useApi<Permissions>('auth/me/permissions')
  const [menu, setMenu] = useState(false)
  const [mobileViewport, setMobileViewport] = useState(false)
  const menuTrigger = useRef<HTMLButtonElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('mo.sidebar') === 'collapsed')
    } catch {
      /* UI preference is optional. */
    }
  }, [])
  useEffect(() => {
    function closeProfile(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key === 'Escape') setMenu(false)
      const profile = document.querySelector<HTMLDetailsElement>('.ws-profile-menu')
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !profile?.contains(event.target as Node)
      )
        profile?.removeAttribute('open')
    }
    function closeOnDesktop() {
      setMobileViewport(window.innerWidth <= 760)
      if (window.innerWidth > 760) setMenu(false)
    }
    closeOnDesktop()
    document.addEventListener('pointerdown', closeProfile)
    document.addEventListener('keydown', closeProfile)
    window.addEventListener('resize', closeOnDesktop)
    return () => {
      document.removeEventListener('pointerdown', closeProfile)
      document.removeEventListener('keydown', closeProfile)
      window.removeEventListener('resize', closeOnDesktop)
    }
  }, [])
  useEffect(() => {
    if (!menu) return
    const trigger = menuTrigger.current
    return () => trigger?.focus({ preventScroll: true })
  }, [menu])
  function toggleSidebar() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem('mo.sidebar', next ? 'collapsed' : 'expanded')
    } catch {
      /* Continue without persistence. */
    }
  }
  async function logout() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutError('')
    try {
      await send('auth/logout')
      navigate('/login', { replace: true, refresh: true })
    } catch {
      setLogoutError('Chưa đăng xuất được. Hãy thử lại.')
      notify('Chưa đăng xuất được. Hãy thử lại.')
    } finally {
      setLoggingOut(false)
    }
  }
  const visibleLinks = links.filter(
    (link) =>
      !link.permission || permissions.data?.effectivePermissionCodes?.includes(link.permission),
  )
  return (
    <WorkspaceContext.Provider
      value={{ user, permissions: permissions.data, reloadPermissions: permissions.reload }}
    >
      <div className={`workspace ${collapsed ? 'is-sidebar-collapsed' : ''}`}>
        <Atmosphere />
        <a className="skip-link" href="#workspace-content">
          Đi đến nội dung
        </a>
        <aside
          id="workspace-sidebar"
          className={`ws-sidebar ${menu ? 'is-open' : ''}`}
          inert={mobileViewport && !menu}
          aria-hidden={mobileViewport && !menu}
        >
          <div className="ws-brand-row">
            <Link href="/" className="ws-brand" aria-label="Splitly — Trang chủ">
              <Brand />
            </Link>
            <button
              className="ws-mobile-toggle"
              aria-label="Đóng menu"
              onClick={() => setMenu(false)}
            >
              <X />
            </button>
          </div>
          <div className="ws-sidebar-scroll">
            <nav aria-label="Điều hướng ứng dụng">
              {navigationGroups.map((group) => {
                const items = visibleLinks.filter((link) => group.paths.includes(link.href))
                return items.length ? (
                  <NavigationGroup
                    key={group.id}
                    group={group}
                    items={items}
                    pathname={pathname}
                    collapsed={collapsed && !mobileViewport}
                    closeMenu={() => setMenu(false)}
                  />
                ) : null
              })}
            </nav>
          </div>
          <div className="ws-sidebar-bottom">
            <Tooltip
              label="Khám phá Splitly"
              description="Quay về trang chủ."
              disabled={!collapsed || mobileViewport}
            >
              <Link className="ws-sidebar-home" href="/" aria-label="Về trang chủ">
                <span aria-hidden="true">↗</span>
                <span className="ws-nav-label">Khám phá Splitly</span>
              </Link>
            </Tooltip>
            <Tooltip
              label="Đăng xuất"
              description="Kết thúc phiên đăng nhập trên thiết bị này."
              disabled={!collapsed || mobileViewport}
            >
              <button
                className="ws-logout"
                onClick={logout}
                disabled={loggingOut}
                aria-label="Đăng xuất"
              >
                <LogOut size={16} />
                <span className="ws-nav-label">{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</span>
              </button>
            </Tooltip>
            {logoutError && (
              <p className="ws-muted" role="alert">
                {logoutError}
              </p>
            )}
          </div>
        </aside>
        <AnimatePresence>
          {menu && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className="ws-menu-overlay"
              aria-label="Đóng điều hướng"
              onClick={() => setMenu(false)}
            />
          )}
        </AnimatePresence>
        <div className="ws-main-shell">
          <header className="ws-topbar">
            <div>
              <button
                ref={menuTrigger}
                className="ws-mobile-toggle"
                aria-label="Mở menu"
                onClick={() => setMenu(true)}
              >
                <Menu />
              </button>
              <Tooltip
                label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                description={
                  collapsed
                    ? 'Hiện tên các mục điều hướng.'
                    : 'Giữ biểu tượng để có thêm không gian làm việc.'
                }
                side="bottom"
              >
                <button
                  className="ws-desktop-toggle ws-icon-button"
                  aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                  aria-expanded={!collapsed}
                  aria-controls="workspace-sidebar"
                  onClick={toggleSidebar}
                >
                  {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>
              </Tooltip>
              <span className="ws-topbar-word">
                Không gian <span>/</span>{' '}
                {links.find(
                  (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
                )?.label || 'Cá nhân'}
              </span>
            </div>
            <div className="ws-topbar-account">
              {pathname !== '/dashboard' &&
                pathname !== '/bills' &&
                !pathname.startsWith('/bills/new') &&
                permissions.data?.effectivePermissionCodes?.includes('Bills.Create') && (
                  <Link className="ws-small-create" href="/bills/new">
                    + Tạo hóa đơn
                  </Link>
                )}
              <details className="ws-profile-menu">
                <summary aria-label="Mở menu tài khoản">
                  <span className="ws-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
                  <span className="ws-profile-name">{user.displayName}</span>
                  <ChevronDown size={14} />
                </summary>
                <div
                  className="ws-profile-dropdown"
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest('a'))
                      event.currentTarget.closest('details')?.removeAttribute('open')
                  }}
                >
                  <div className="ws-profile-identity">
                    <span className="ws-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <strong>{user.displayName}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  <Link href="/payout-accounts">Tài khoản nhận tiền</Link>
                  <Link href="/support">Hỗ trợ</Link>
                  <button disabled={loggingOut} onClick={logout}>
                    Đăng xuất
                  </button>
                </div>
              </details>
            </div>
          </header>
          <main id="workspace-content" className="ws-main">
            {permissions.loading ? (
              <Loading variant="page" rows={5} />
            ) : permissions.error ? (
              <ErrorState message={permissions.error} retry={permissions.reload} />
            ) : (
              <Reveal key={pathname} className="ws-route">
                {children}
              </Reveal>
            )}
          </main>
          <footer className="ws-footer">
            <span>Splitly / Khoản chung, cùng nhau.</span>
            <Link href="/support">Trung tâm hỗ trợ ↗</Link>
          </footer>
        </div>
      </div>
    </WorkspaceContext.Provider>
  )
}
