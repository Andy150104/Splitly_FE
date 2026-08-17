import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

export async function GET() {
  try {
    return ok(await api.auth.getMyPermissions());
  } catch (error) {
    return failure(error);
  }
}
