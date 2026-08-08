import "server-only";

import { getBillSplitServiceAPI } from "@/generated/api/endpoints";
import { unwrap } from "@/lib/api/shared/unwrap";
import { serverRequestOptions } from "@/lib/http/server-http-client";
import { getSessionTokens } from "@/lib/auth/session";

const generated = getBillSplitServiceAPI();

/**
 * Attempt to refresh the server session using the refresh token cookie.
 * Isolated from `authApi` to avoid circular dependency with `require-session`.
 * Returns unwrapped RefreshResponse on success, throws on failure.
 */
export async function refreshServerSession() {
  const { refreshToken } = await getSessionTokens();
  if (!refreshToken) throw new Error("Missing refresh token");

  return unwrap(
    await generated.postApiAuthRefresh(
      { refreshToken },
      serverRequestOptions(),
    ),
  );
}
