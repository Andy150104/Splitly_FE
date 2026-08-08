import "server-only";

import { Agent } from "node:https";
import type { AxiosRequestConfig } from "axios";

import { serverEnv } from "@/lib/env/server";

const localHttpsAgent = new Agent({
  rejectUnauthorized: serverEnv.BACKEND_TLS_REJECT_UNAUTHORIZED,
});

export function serverRequestOptions(
  accessToken?: string,
): AxiosRequestConfig {
  return {
    baseURL: serverEnv.BACKEND_API_URL,
    timeout: 15_000,
    httpsAgent: serverEnv.BACKEND_API_URL.startsWith("https://")
      ? localHttpsAgent
      : undefined,
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  };
}
