import { failure, ok } from "@/app/api/_shared/response";
import { adminApi } from "@/lib/api/server/admin.api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { role?: string };
    if (!body.role) {
      return failure(new Error("Vai trò không được để trống."));
    }

    const res = await adminApi.changeRole(id, body.role);
    return ok(res);
  } catch (error) {
    return failure(error);
  }
}
