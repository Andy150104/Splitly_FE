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
    const session = await api.auth.verifyLoginCode({
      email: input.email.toLowerCase(),
      code: input.code.toUpperCase(),
    });
    await setLoginSession(session);
    return ok({ displayName: session.displayName, email: session.email });
  } catch (error) {
    return failure(error);
  }
}
