import type { NextConfig } from "next";

// Suppress the TLS rejection warning in development
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  const originalEmit = process.emit;
  process.emit = function (
    name: string | symbol,
    data: unknown,
    ...args: unknown[]
  ) {
    if (
      name === "warning" &&
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as Record<string, unknown>).message === "string" &&
      ((data as Record<string, unknown>).message as string).includes(
        "NODE_TLS_REJECT_UNAUTHORIZED",
      )
    ) {
      return false;
    }
    return originalEmit.apply(process, [
      name,
      data,
      ...args,
    ] as unknown as Parameters<typeof originalEmit>);
  } as unknown as typeof process.emit;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
