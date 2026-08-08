import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser, getSessionTokens } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const [user, tokens] = await Promise.all([getCurrentUser(), getSessionTokens()]);
  if (!user || !tokens.accessToken) redirect("/login");
  return <AppShell user={user}>{children}</AppShell>;
}
