import { failure, ok } from "@/app/api/_shared/response";
import { adminApi } from "@/lib/api/server/admin.api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");

    const data = await adminApi.getSupportRequests({
      status,
      type,
      page,
      pageSize,
    });

    return ok(data);
  } catch (error) {
    return failure(error);
  }
}
