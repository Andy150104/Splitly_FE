import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import type {
  BillSplitServiceApplicationFeaturesAuthenticationDevLoginDevLoginHandlerResponse as DevLoginResponse,
  BillSplitServiceApplicationFeaturesAuthenticationGoogleLoginGoogleLoginHandlerResponse as GoogleLoginResponse,
  BillSplitServiceApplicationFeaturesAuthenticationRefreshSessionRefreshSessionHandlerResponse as RefreshResponse,
} from "@/generated/api/models";
import { getSessionSecret } from "@/lib/env/server";

import {
  AUTH_COOKIE,
  REFRESH_COOKIE,
  ACCESS_EXP_COOKIE,
  PROFILE_COOKIE,
} from "./constants";
export { AUTH_COOKIE, REFRESH_COOKIE };

export interface CurrentUser {
  displayName: string;
  email: string;
  avatarUrl?: string;
}

type LoginResponse = GoogleLoginResponse | DevLoginResponse;

const secret = () => new TextEncoder().encode(getSessionSecret());
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setLoginSession(session: LoginResponse) {
  if (
    !session.accessToken ||
    !session.refreshToken ||
    !session.email ||
    !session.refreshTokenExpiresAtUtc
  ) {
    throw new Error("Backend returned an incomplete login session");
  }

  const store = await cookies();
  const refreshExpiry = new Date(session.refreshTokenExpiresAtUtc);
  store.set(AUTH_COOKIE, session.accessToken, {
    ...cookieOptions,
    expires: refreshExpiry,
  });
  store.set(REFRESH_COOKIE, session.refreshToken, {
    ...cookieOptions,
    expires: refreshExpiry,
  });

  if (session.accessTokenExpiresAtUtc) {
    store.set(ACCESS_EXP_COOKIE, session.accessTokenExpiresAtUtc, {
      ...cookieOptions,
      httpOnly: false,
      expires: refreshExpiry,
    });
  }

  const profile: CurrentUser = {
    displayName: session.displayName || session.email.split("@")[0] || "Bạn",
    email: session.email,
    ...(session.avatarUrl ? { avatarUrl: session.avatarUrl } : {}),
  };
  const signedProfile = await new SignJWT({ ...profile })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(refreshExpiry.getTime() / 1000))
    .sign(secret());
  store.set(PROFILE_COOKIE, signedProfile, {
    ...cookieOptions,
    expires: refreshExpiry,
  });
}

export async function rotateSession(session: RefreshResponse) {
  if (
    !session.accessToken ||
    !session.refreshToken ||
    !session.refreshTokenExpiresAtUtc
  ) {
    throw new Error("Backend returned an incomplete refreshed session");
  }
  const store = await cookies();
  const expires = new Date(session.refreshTokenExpiresAtUtc);
  store.set(AUTH_COOKIE, session.accessToken, { ...cookieOptions, expires });
  store.set(REFRESH_COOKIE, session.refreshToken, {
    ...cookieOptions,
    expires,
  });

  if (session.accessTokenExpiresAtUtc) {
    store.set(ACCESS_EXP_COOKIE, session.accessTokenExpiresAtUtc, {
      ...cookieOptions,
      httpOnly: false,
      expires,
    });
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(PROFILE_COOKIE);
  store.delete(ACCESS_EXP_COOKIE);
}

export async function getSessionTokens() {
  const store = await cookies();
  return {
    accessToken: store.get(AUTH_COOKIE)?.value,
    refreshToken: store.get(REFRESH_COOKIE)?.value,
  };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const value = (await cookies()).get(PROFILE_COOKIE)?.value;
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(value, secret());
    if (typeof payload.email !== "string") return null;
    return {
      email: payload.email,
      displayName:
        typeof payload.displayName === "string"
          ? payload.displayName
          : payload.email,
      ...(typeof payload.avatarUrl === "string"
        ? { avatarUrl: payload.avatarUrl }
        : {}),
    };
  } catch {
    return null;
  }
}
