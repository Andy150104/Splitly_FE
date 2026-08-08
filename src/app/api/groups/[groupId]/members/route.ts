import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

const schema = z.object({
  emails: z.array(z.string().trim().toLowerCase().email()).min(1).max(50),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await context.params;
    return ok(await api.groups.addMembers(groupId, schema.parse(await request.json())));
  } catch (error) {
    return failure(error);
  }
}
