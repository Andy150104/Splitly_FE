import "server-only";

import axios from "axios";
import type { AxiosRequestConfig } from "axios";

import type {
  BillSplitServiceApplicationFeaturesAuthenticationRefreshSessionRefreshSessionHandlerResponse as RefreshResponse,
} from "@/generated/api/models";
import { ApiError } from "@/lib/errors/api-error";
import { getSessionTokens, rotateSession } from "@/lib/auth/session";
import { refreshServerSession } from "@/lib/auth/server-refresh";
import { serverRequestOptions } from "@/lib/http/server-http-client";

export async function authenticatedOptions() {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) {
    throw new ApiError({
      status: 401,
      message: "Bạn cần đăng nhập để tiếp tục.",
    });
  }
  return serverRequestOptions(accessToken);
}

// ── In-flight refresh deduplication ──────────────────────────────────────────
// Multiple concurrent calls (e.g. Promise.all in DashboardPage) share the same
// refresh promise so that only ONE refresh request reaches the backend.
// This avoids issues with backend refresh-token rotation invalidating tokens
// between concurrent calls.
let pendingRefresh: Promise<RefreshResponse> | null = null;

function deduplicatedRefresh() {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = refreshServerSession().finally(() => {
    pendingRefresh = null;
  });

  return pendingRefresh;
}

/**
 * Execute a server-side API call with automatic 401 → refresh → retry.
 *
 * ⚠ This function does NOT persist the refreshed tokens to cookies because
 *   Next.js does not allow cookie mutation inside Server Components.
 *   Cookie rotation is handled proactively by the middleware.
 *   This function is a safety-net for edge cases where the middleware
 *   could not refresh in time (race conditions, clock skew, etc.).
 */
export async function authenticatedCall<T>(
  fn: (options: AxiosRequestConfig) => Promise<T>,
): Promise<T> {
  const options = await authenticatedOptions();
  try {
    return await fn(options);
  } catch (error) {
    // Only attempt refresh on 401 from the backend
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      throw error;
    }

    // Attempt to refresh (deduplicated across concurrent calls)
    try {
      const session = await deduplicatedRefresh();
      if (!session?.accessToken) {
        throw new ApiError({
          status: 401,
          message: "Phiên đăng nhập đã hết hạn.",
        });
      }

      // Try to save the refreshed tokens to the cookies (works in Route Handlers & Server Actions)
      try {
        await rotateSession(session);
      } catch {
        // Ignored: NextJS cookies() cannot be mutated in Server Components during render
      }

      // Retry the original call once with the refreshed access token
      const retryOptions = serverRequestOptions(session.accessToken);
      return await fn(retryOptions);
    } catch {
      throw new ApiError({
        status: 401,
        message: "Phiên đăng nhập đã hết hạn.",
      });
    }
  }
}
