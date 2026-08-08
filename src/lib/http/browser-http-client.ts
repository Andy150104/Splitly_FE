"use client";

import { ApiError } from "@/lib/errors/api-error";

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
    const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshed.ok) return bffFetch<T>(input, init, true);
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; message?: string; errors?: Record<string, string[]> }
    | null;
  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: payload?.message ?? "Không thể hoàn tất yêu cầu.",
      errors: payload?.errors,
    });
  }
  return (payload?.data ?? payload) as T;
}
