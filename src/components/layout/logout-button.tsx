"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      className={compact ? "size-10 px-0" : "w-full justify-start"}
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={compact ? "Đăng xuất" : undefined}
      title={compact ? "Đăng xuất" : undefined}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
      }}
    >
      <LogOut className="size-4 shrink-0" />{" "}
      {!compact ? (pending ? "Đang thoát…" : "Đăng xuất") : null}
    </Button>
  );
}
