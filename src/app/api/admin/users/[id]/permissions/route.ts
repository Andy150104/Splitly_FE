import { failure, ok } from "@/app/api/_shared/response";
import { adminApi } from "@/lib/api/server/admin.api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { permissions?: string[] };
    if (!Array.isArray(body.permissions)) {
      return failure(new Error("Danh sách quyền không hợp lệ."));
    }

    const res = await adminApi.changePermissions(id, body.permissions);
    return ok(res);
  } catch (error) {
    return failure(error);
  }
}
