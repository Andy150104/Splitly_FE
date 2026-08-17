"use client";

import type { BillSplitServiceApplicationFeaturesAdminGetMemberPermissionsMemberPermissionsDto as MemberPermissionsDto } from "@/generated/api/models";
import {
  publishAuthSessionExpired,
  publishCurrentAccess,
} from "@/lib/auth/access-state-events";
import { ApiError } from "@/lib/errors/api-error";

let pendingRefresh: Promise<boolean> | null = null;

async function syncCurrentAccess() {
  const response = await fetch("/api/auth/me/permissions", {
    cache: "no-store",
  });
  if (!response.ok) return false;

  const payload = (await response.json()) as {
    data?: MemberPermissionsDto;
  };
  if (!payload.data) return false;

  publishCurrentAccess(payload.data);
  return true;
}

function refreshBrowserSession() {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = fetch("/api/auth/refresh", { method: "POST" })
    .then(async (response) => {
      if (!response.ok) return false;
      return syncCurrentAccess();
    })
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
}

export async function bffFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  hasRetried = false,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (response.status === 401 && !hasRetried) {
    const refreshed = await refreshBrowserSession();
    if (refreshed) return bffFetch<T>(input, init, true);
    publishAuthSessionExpired();
  }

  if (response.status === 403 && String(input) !== "/api/auth/me/permissions") {
    await syncCurrentAccess().catch(() => false);
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
  } | null;
  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: payload?.message ?? "Không thể hoàn tất yêu cầu.",
      errors: payload?.errors,
    });
  }
  return (payload?.data ?? payload) as T;
}
