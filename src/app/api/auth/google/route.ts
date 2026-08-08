import { z } from "zod";

import { setLoginSession } from "@/lib/auth/session";
import { api } from "@/lib/api/server/api";
import { failure, ok } from "@/app/api/_shared/response";

const schema = z.object({ idToken: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const session = await api.auth.google(input);
    await setLoginSession(session);
    return ok({
      displayName: session.displayName,
      email: session.email,
      avatarUrl: session.avatarUrl,
    });
  } catch (error) {
    return failure(error);
  }
}
