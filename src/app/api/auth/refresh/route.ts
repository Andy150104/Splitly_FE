import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";
import { clearSession, rotateSession } from "@/lib/auth/session";

export async function POST() {
  try {
    const session = await api.auth.refresh();
    await rotateSession(session);
    return ok(true);
  } catch (error) {
    await clearSession();
    return failure(error);
  }
}
