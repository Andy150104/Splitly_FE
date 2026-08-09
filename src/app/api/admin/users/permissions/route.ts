import { failure, ok } from "@/app/api/_shared/response";
import { adminApi } from "@/lib/api/server/admin.api";

export async function GET() {
  try {
    const permissions = await adminApi.getPermissions();
    return ok(permissions);
  } catch (error) {
    return failure(error);
  }
}
