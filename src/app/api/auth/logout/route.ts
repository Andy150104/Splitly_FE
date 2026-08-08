import { ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";
import { clearSession } from "@/lib/auth/session";

export async function POST() {
  try {
    await api.auth.logout();
  } catch {
    // Local cookies must still be removed if backend revocation is unavailable.
  } finally {
    await clearSession();
  }
  return ok(true);
}
