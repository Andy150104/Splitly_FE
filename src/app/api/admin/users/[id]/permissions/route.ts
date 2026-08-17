import { failure, ok } from "@/app/api/_shared/response";
import { adminApi } from "@/lib/api/server/admin.api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return ok(await adminApi.getMemberPermissions(id));
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      effectivePermissionCodes?: string[];
    };
    if (!Array.isArray(body.effectivePermissionCodes)) {
      return failure(new Error("Danh sách quyền không hợp lệ."));
    }

    const res = await adminApi.changePermissions(id, {
      effectivePermissionCodes: body.effectivePermissionCodes,
    });
    return ok(res);
  } catch (error) {
    return failure(error);
  }
}
