import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

const schema = z.object({
  payoutAccountId: z.string().uuid().nullable().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ billId: string }> },
) {
  try {
    const { billId } = await context.params;
    const input = schema.parse(await request.json());

    return ok(
      await api.bills.publish(billId, {
        payoutAccountId: input.payoutAccountId ?? null,
      }),
    );
  } catch (error) {
    return failure(error);
  }
}
