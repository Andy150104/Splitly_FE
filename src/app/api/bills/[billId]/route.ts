import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ billId: string }> },
) {
  try {
    const { billId } = await context.params;
    return ok(await api.bills.getById(billId));
  } catch (error) {
    return failure(error);
  }
}
