import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";
import { setLoginSession } from "@/lib/auth/session";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== "true"
  ) {
    return Response.json({ message: "Không tìm thấy." }, { status: 404 });
  }
  try {
    const input = schema.parse(await request.json());
    const session = await api.auth.devLogin(input);
    await setLoginSession(session);
    return ok({ displayName: session.displayName, email: session.email });
  } catch (error) {
    return failure(error);
  }
}
