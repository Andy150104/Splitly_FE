import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { authApi } from "@/lib/api/server/auth.api";
import {
  hasPermission,
  normalizePermissionState,
  type SystemPermission,
} from "@/lib/auth/permissions";

export const getCurrentPermissionState = cache(async () =>
  normalizePermissionState(await authApi.getMyPermissions()),
);

export async function requirePermission(permission: SystemPermission) {
  const state = await getCurrentPermissionState();
  if (!hasPermission(state, permission)) {
    redirect("/dashboard");
  }
  return state;
}
