"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Plus,
  ShieldCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import type { CurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CreateSupportModal } from "@/features/support/components/create-support-modal";

const nav = [
  { href: "/dashboard" as Route, label: "Tổng quan", icon: LayoutDashboard },
  { href: "/bills" as Route, label: "Hóa đơn", icon: FileText },
  { href: "/groups" as Route, label: "Nhóm", icon: UsersRound },
  { href: "/payout-accounts" as Route, label: "Tài khoản Payout", icon: Landmark },
  { href: "/admin/users" as Route, label: "Quản lý người dùng", icon: ShieldCheck },
  { href: "/admin/support-requests" as Route, label: "Yêu cầu hỗ trợ", icon: LifeBuoy },
] as const;

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const initials = user.displayName
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCollapsed(
        window.localStorage.getItem("splitly-sidebar-collapsed") === "true",
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("splitly-sidebar-collapsed", String(next));
      return next;
    });
  }

  const breadcrumb: { parent: string; href: Route; current: string } =
    pathname.startsWith("/bills/new")
      ? { parent: "Hóa đơn", href: "/bills" as Route, current: "Tạo hóa đơn" }
      : pathname.startsWith("/bills/")
        ? { parent: "Hóa đơn", href: "/bills" as Route, current: "Chi tiết hóa đơn" }
        : pathname.startsWith("/bills")
          ? { parent: "Splitly", href: "/dashboard" as Route, current: "Hóa đơn" }
          : pathname.startsWith("/groups/")
            ? { parent: "Nhóm", href: "/groups" as Route, current: "Chi tiết nhóm" }
            : pathname.startsWith("/groups")
              ? { parent: "Splitly", href: "/dashboard" as Route, current: "Nhóm" }
              : pathname.startsWith("/payout-accounts")
                ? { parent: "Splitly", href: "/dashboard" as Route, current: "Tài khoản Payout" }
                : pathname.startsWith("/admin/users")
                  ? { parent: "Quản trị", href: "/dashboard" as Route, current: "Quản lý người dùng" }
                  : pathname.startsWith("/admin/support-requests")
                    ? { parent: "Quản trị", href: "/dashboard" as Route, current: "Yêu cầu hỗ trợ" }
                    : { parent: "Splitly", href: "/dashboard" as Route, current: "Tổng quan" };

  function sidebar(compact: boolean, mobile = false) {
    return (
      <>
        <div
          className={cn(
            "border-border/70 flex h-14 shrink-0 items-center border-b bg-card/70",
            compact ? "justify-center px-3" : "gap-2 px-4",
          )}
        >
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            aria-label={compact ? "Splitly — Tổng quan" : undefined}
          >
            <div className="bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-[10px] shadow-[0_4px_12px_color-mix(in_oklab,var(--primary)_22%,transparent)]">
              <WalletCards className="size-[18px]" />
            </div>
            {!compact ? (
              <span className="text-[17px] font-bold tracking-[-0.02em]">Splitly</span>
            ) : null}
          </Link>
          {!mobile ? (
            <Button
              className={cn(
                "ml-auto",
                compact &&
                  "bg-card absolute top-2.5 left-[52px] z-10 size-7 rounded-full border px-0 shadow-sm",
              )}
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              aria-label={
                collapsed
                  ? "Mở rộng thanh điều hướng"
                  : "Thu gọn thanh điều hướng"
              }
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <ChevronsRight className="size-3.5" />
              ) : (
                <ChevronsLeft className="size-4" />
              )}
            </Button>
          ) : null}
        </div>
        <nav
          className="flex-1 space-y-1 px-3 py-4"
          aria-label="Điều hướng chính"
        >
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                title={compact ? item.label : undefined}
                className={cn(
                  "group text-muted-foreground hover:bg-muted hover:text-foreground relative flex h-11 items-center rounded-xl text-sm font-medium transition-[color,background-color,transform] duration-150 active:scale-[0.98]",
                  compact ? "justify-center px-0" : "gap-3 px-3",
                  active && "bg-primary/10 text-primary",
                )}
              >
                <item.icon className="size-[18px] shrink-0" />
                {!compact ? (
                  <span>{item.label}</span>
                ) : (
                  <span className="bg-foreground text-background pointer-events-none absolute left-[calc(100%+12px)] z-50 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap opacity-0 shadow-lg transition-opacity delay-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div
          className={cn(
            "border-border border-t p-3",
            compact && "flex justify-center",
          )}
        >
          <LogoutButton compact={compact} />
        </div>
      </>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <aside
        className={cn(
          "border-border bg-card/95 fixed inset-y-0 left-0 z-30 hidden border-r backdrop-blur-xl transition-[width] duration-200 ease-out lg:flex lg:flex-col",
          collapsed ? "w-[72px]" : "w-[252px]",
        )}
      >
        {sidebar(collapsed)}
      </aside>
      {open ? (
        <div
          className="animate-backdrop-in fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={cn(
          "bg-card fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col shadow-2xl transition-transform duration-200 ease-out lg:hidden",
          open && "translate-x-0",
        )}
      >
        <Button
          className="absolute top-3 right-3 z-10"
          variant="ghost"
          size="icon"
          onClick={() => setOpen(false)}
          aria-label="Đóng menu"
        >
          <X className="size-5" />
        </Button>
        {sidebar(false, true)}
      </aside>
      <div
        className={cn(
          "transition-[padding-left] duration-200 ease-out",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[252px]",
        )}
      >
        <header className="border-border/80 bg-card/95 sticky top-0 z-20 flex h-14 items-center border-b px-4 shadow-[0_1px_0_rgb(15_23_42/0.025),0_6px_18px_rgb(15_23_42/0.025)] backdrop-blur-xl sm:px-5 lg:px-7 dark:bg-card/90 dark:shadow-[0_1px_0_rgb(255_255_255/0.02),0_8px_22px_rgb(0_0_0/0.12)]">
          <Button
            variant="ghost"
            size="icon"
            className="mr-1 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
          >
            <Menu className="size-5" />
          </Button>
          <nav
            aria-label="Breadcrumb"
            className="hidden min-w-0 items-center gap-1.5 text-sm lg:flex"
          >
            <Link
              href={breadcrumb.href}
              className="text-muted-foreground hover:bg-muted/70 hover:text-foreground focus-visible:ring-primary/20 rounded-lg px-2 py-1.5 font-medium transition-colors outline-none focus-visible:ring-4"
            >
              {breadcrumb.parent}
            </Link>
            <ChevronRight className="text-muted-foreground/45 size-3.5 shrink-0" />
            <span className="bg-muted/55 text-foreground max-w-64 truncate rounded-lg px-2.5 py-1.5 font-semibold">
              {breadcrumb.current}
            </span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {!pathname.startsWith("/bills/new") ? (
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/bills/new">
                  <Plus className="size-4" />
                  Tạo hóa đơn
                </Link>
              </Button>
            ) : null}
            <ThemeToggle />
            <CreateSupportModal defaultEmail={user.email} />
            <button
              type="button"
              onClick={() => setAvatarOpen(true)}
              title="Bấm để xem ảnh đại diện"
              className="group cursor-pointer flex items-center gap-2.5 rounded-xl p-1 transition-all duration-150 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <div className="border-border/70 hidden border-l pl-3 text-right sm:block">
                <p className="text-sm leading-tight font-medium group-hover:text-primary transition-colors">
                  {user.displayName}
                </p>
                <p className="text-muted-foreground max-w-44 truncate text-xs">
                  {user.email}
                </p>
              </div>
              <Avatar className="border-primary/20 bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-bold shadow-sm transition-transform duration-150 group-hover:scale-105 group-hover:border-primary/40">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                ) : null}
                <AvatarFallback>{initials || "U"}</AvatarFallback>
              </Avatar>
            </button>

            {/* Avatar Preview Lightbox Modal */}
            <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
              <DialogContent className="sm:max-w-md text-center p-6 sm:p-8">
                <DialogHeader className="items-center text-center">
                  <DialogTitle className="text-xl font-bold">
                    {user.displayName}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                    {user.email}
                  </DialogDescription>
                </DialogHeader>

                <div className="my-6 flex justify-center">
                  <div className="relative flex size-48 sm:size-56 shrink-0 items-center justify-center rounded-full border-4 border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 p-1 shadow-xl ring-8 ring-primary/5">
                    {user.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="size-full rounded-full object-cover shadow-inner"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center rounded-full bg-primary/15 font-bold text-4xl sm:text-5xl text-primary tracking-wider">
                        {initials || "U"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAvatarOpen(false)}
                    className="w-full sm:w-auto px-6"
                  >
                    Đóng
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-5 lg:px-7 lg:py-5">
          <div key={pathname} className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
