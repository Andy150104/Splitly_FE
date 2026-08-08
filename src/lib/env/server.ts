import "server-only";

import { z } from "zod";

const schema = z.object({
  BACKEND_API_URL: z.string().url().default("https://localhost:7288"),
  BACKEND_TLS_REJECT_UNAUTHORIZED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  SESSION_COOKIE_SECRET: z.string().min(32).optional(),
});

export const serverEnv = schema.parse({
  BACKEND_API_URL: process.env.BACKEND_API_URL,
  BACKEND_TLS_REJECT_UNAUTHORIZED:
    process.env.BACKEND_TLS_REJECT_UNAUTHORIZED,
  SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET,
});

export function getSessionSecret() {
  if (serverEnv.SESSION_COOKIE_SECRET) return serverEnv.SESSION_COOKIE_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_COOKIE_SECRET is required in production");
  }
  return "development-only-cookie-secret-change-me";
}
