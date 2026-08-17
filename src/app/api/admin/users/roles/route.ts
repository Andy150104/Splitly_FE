import { failure, ok } from "@/app/api/_shared/response";
import { adminApi } from "@/lib/api/server/admin.api";

export async function GET() {
  try {
    return ok(await adminApi.getRoles());
  } catch (error) {
    return failure(error);
  }
}
