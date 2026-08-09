import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await api.payoutAccounts.setDefault(id);
    return ok(result);
  } catch (error) {
    return failure(error);
  }
}
