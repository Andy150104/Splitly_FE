import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser, getSessionTokens } from "@/lib/auth/session";
import { getCurrentPermissionState } from "@/lib/auth/server-permissions";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const [user, tokens] = await Promise.all([getCurrentUser(), getSessionTokens()]);
  if (!user || !tokens.accessToken) redirect("/login");

  const permissions = await getCurrentPermissionState();
  return (
    <AppShell user={user} permissions={permissions}>
      {children}
    </AppShell>
  );
}
