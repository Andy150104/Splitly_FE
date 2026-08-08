import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  AUTH_COOKIE,
  REFRESH_COOKIE,
  ACCESS_EXP_COOKIE,
  PROFILE_COOKIE,
} from "./lib/auth/constants";

/**
 * Checks whether the access token needs to be refreshed proactively.
 *
 * Returns `true` when:
 *   1. The access-token cookie is missing entirely (browser deleted it, or was never set)
 *      AND a refresh token cookie still exists.
 *   2. The `billshare_access_exp` timestamp cookie indicates the access token has expired
 *      (or will expire within a 30-second buffer) AND a refresh token cookie still exists.
 */
function needsRefresh(request: NextRequest): boolean {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return false; // nothing to refresh with

  const accessToken = request.cookies.get(AUTH_COOKIE)?.value;
  if (!accessToken) return true; // missing access token

  const expiry = request.cookies.get(ACCESS_EXP_COOKIE)?.value;
  if (!expiry) return false; // can't determine — let backend decide

  const expiresAt = new Date(expiry).getTime();
  const bufferMs = 30_000; // refresh 30s before actual expiry
  return Date.now() >= expiresAt - bufferMs;
}

const refreshCache = new Map<
  string,
  Promise<{
    accessToken?: string | null;
    refreshToken?: string | null;
    accessTokenExpiresAtUtc?: string;
    refreshTokenExpiresAtUtc?: string;
  } | null>
>();

async function performRefresh(refreshToken: string): Promise<{
  accessToken?: string | null;
  refreshToken?: string | null;
  accessTokenExpiresAtUtc?: string;
  refreshTokenExpiresAtUtc?: string;
} | null> {
  const backendUrl = process.env.BACKEND_API_URL || "https://localhost:7288";
  const res = await fetch(`${backendUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    if (res.status === 400 || res.status === 401) {
      return null;
    }
    throw new Error(`Refresh request failed with status ${res.status}`);
  }

  const body = (await res.json()) as {
    data?: {
      accessToken?: string | null;
      refreshToken?: string | null;
      accessTokenExpiresAtUtc?: string;
      refreshTokenExpiresAtUtc?: string;
    };
  };
  return body.data || null;
}

function getDeduplicatedRefresh(refreshToken: string) {
  let promise = refreshCache.get(refreshToken);
  if (!promise) {
    promise = performRefresh(refreshToken).then(
      (session) => {
        setTimeout(() => {
          refreshCache.delete(refreshToken);
        }, 10_000);
        return session;
      },
      (error) => {
        refreshCache.delete(refreshToken);
        throw error;
      },
    );
    refreshCache.set(refreshToken, promise);
  }
  return promise;
}

export async function middleware(request: NextRequest) {
  if (!needsRefresh(request)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)!.value;

  try {
    const session = await getDeduplicatedRefresh(refreshToken);

    if (!session) {
      // Refresh failed — clear all auth cookies and let the protected layout redirect to login
      const requestHeaders = new Headers(request.headers);
      request.cookies.delete(AUTH_COOKIE);
      request.cookies.delete(REFRESH_COOKIE);
      request.cookies.delete(ACCESS_EXP_COOKIE);
      request.cookies.delete(PROFILE_COOKIE);
      requestHeaders.set("cookie", request.cookies.toString());

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      response.cookies.delete(AUTH_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      response.cookies.delete(ACCESS_EXP_COOKIE);
      response.cookies.delete(PROFILE_COOKIE);
      return response;
    }

    if (
      !session.accessToken ||
      !session.refreshToken ||
      !session.refreshTokenExpiresAtUtc
    ) {
      // Incomplete response — let it pass through, authenticatedCall can retry
      return NextResponse.next();
    }

    // Propagation: Set updated cookies on the request headers so downstream Server Components/Route Handlers see them
    const requestHeaders = new Headers(request.headers);
    request.cookies.set(AUTH_COOKIE, session.accessToken);
    request.cookies.set(REFRESH_COOKIE, session.refreshToken);
    if (session.accessTokenExpiresAtUtc) {
      request.cookies.set(ACCESS_EXP_COOKIE, session.accessTokenExpiresAtUtc);
    }
    requestHeaders.set("cookie", request.cookies.toString());

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const expires = new Date(session.refreshTokenExpiresAtUtc);
    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set(AUTH_COOKIE, session.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      expires,
    });
    response.cookies.set(REFRESH_COOKIE, session.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      expires,
    });

    if (session.accessTokenExpiresAtUtc) {
      response.cookies.set(ACCESS_EXP_COOKIE, session.accessTokenExpiresAtUtc, {
        httpOnly: false,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        expires,
      });
    }

    return response;
  } catch (error) {
    console.error("[Middleware] Token refresh failed:", error);
    // Network error calling backend — let the request continue;
    // authenticatedCall in Server Components will handle the 401.
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Run on protected pages and BFF API routes (skip static assets, _next, favicon)
    "/((?!_next/static|_next/image|favicon\\.ico|login|api/auth).*)",
  ],
};
