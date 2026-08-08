import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await context.params;
    return ok(await api.groups.getById(groupId));
  } catch (error) {
    return failure(error);
  }
}
