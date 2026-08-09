import { failure, ok } from "@/app/api/_shared/response";
import { adminApi } from "@/lib/api/server/admin.api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      status?: string;
      resolutionNote?: string;
    };

    if (!body.status) {
      return failure(new Error("Vui lòng chọn trạng thái."));
    }

    const res = await adminApi.updateSupportStatus(id, {
      status: body.status,
      resolutionNote: body.resolutionNote,
    });

    return ok(res);
  } catch (error) {
    return failure(error);
  }
}
