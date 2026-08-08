"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  Menu,
  Plus,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import type { CurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const nav = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/bills", label: "Hóa đơn", icon: FileText },
  { href: "/groups", label: "Nhóm", icon: UsersRound },
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

  const pageContext = pathname.startsWith("/bills/new")
    ? "Tạo hóa đơn"
    : pathname.startsWith("/bills/")
      ? "Chi tiết hóa đơn"
      : pathname.startsWith("/bills")
        ? "Hóa đơn"
        : pathname.startsWith("/groups/")
          ? "Chi tiết nhóm"
          : pathname.startsWith("/groups")
            ? "Nhóm"
            : "Tổng quan";

  function sidebar(compact: boolean, mobile = false) {
    return (
      <>
        <div
          className={cn(
            "border-border/70 flex h-16 shrink-0 items-center border-b",
            compact ? "justify-center px-3" : "gap-2 px-4",
          )}
        >
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            aria-label={compact ? "Splitly — Tổng quan" : undefined}
          >
            <div className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-xl shadow-sm">
              <WalletCards className="size-5" />
            </div>
            {!compact ? (
              <span className="text-lg font-bold tracking-tight">Splitly</span>
            ) : null}
          </Link>
          {!mobile ? (
            <Button
              className={cn(
                "ml-auto",
                compact &&
                  "bg-card absolute top-3 left-[52px] z-10 size-7 rounded-full border px-0 shadow-sm",
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
        <header className="border-border/80 bg-background/85 sticky top-0 z-20 flex h-16 items-center border-b px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
            <span className="text-muted-foreground">Splitly</span>
            <ChevronRight className="text-muted-foreground/60 size-3.5" />
            <span className="truncate font-medium">{pageContext}</span>
          </div>
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
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-medium">
                {user.displayName}
              </p>
              <p className="text-muted-foreground max-w-44 truncate text-xs">
                {user.email}
              </p>
            </div>
            <Avatar className="border-primary/15 bg-primary/10 text-primary inline-flex size-9 items-center justify-center overflow-hidden rounded-full border text-xs font-bold shadow-sm transition-transform duration-150 hover:scale-[1.04]">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
          <div key={pathname} className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
