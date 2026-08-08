import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ groupId: string; memberId: string }> },
) {
  try {
    const { groupId, memberId } = await context.params;
    return ok(await api.groups.removeMember(groupId, memberId));
  } catch (error) {
    return failure(error);
  }
}
