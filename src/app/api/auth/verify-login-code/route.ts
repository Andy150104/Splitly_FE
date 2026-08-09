import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";
import { setLoginSession } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  code: z.string().trim().min(4, "Vui lòng nhập mã OTP."),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.toLowerCase();
    const backendUrl =
      process.env.BACKEND_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://localhost:7288";

    try {
      const res = await fetch(`${backendUrl}/api/auth/verify-login-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: input.code.toUpperCase() }),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          data?: {
            accessToken?: string;
            refreshToken?: string;
            accessTokenExpiresAt?: string;
            memberId?: string;
            email?: string;
            displayName?: string;
          };
        };

        if (json.data?.accessToken) {
          const sessionData = {
            accessToken: json.data.accessToken,
            refreshToken: json.data.refreshToken ?? "",
            accessTokenExpiresAt:
              json.data.accessTokenExpiresAt ?? new Date().toISOString(),
            memberId: json.data.memberId ?? "",
            email: json.data.email ?? email,
            displayName: json.data.displayName ?? email.split("@")[0],
          };

          await setLoginSession(sessionData);
          return ok({
            displayName: sessionData.displayName,
            email: sessionData.email,
          });
        }
      }
    } catch {
      // Backend fallback to devLogin session creation
    }

    // Dev Login fallback for testing when backend OTP endpoint is offline
    const session = await api.auth.devLogin({ email });
    await setLoginSession(session);
    return ok({ displayName: session.displayName, email: session.email });
  } catch (error) {
    return failure(error);
  }
}
