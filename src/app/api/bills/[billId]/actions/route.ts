import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("publish") }),
  z.object({ action: z.literal("remind"), memberIds: z.array(z.string().uuid()).optional() }),
  z.object({ action: z.literal("cancel"), reason: z.string().trim().min(1).max(500) }),
  z.object({
    action: z.literal("manual-payment"),
    memberId: z.string().uuid(),
    amount: z.number().positive(),
    method: z.string().trim().min(1).max(50),
    note: z.string().trim().max(500).optional(),
  }),
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ billId: string }> },
) {
  try {
    const { billId } = await context.params;
    const input = schema.parse(await request.json());
    switch (input.action) {
      case "publish":
        return ok(await api.bills.publish(billId));
      case "remind":
        return ok(await api.bills.remind(billId, { memberIds: input.memberIds }));
      case "cancel":
        return ok(await api.bills.cancel(billId, { reason: input.reason }));
      case "manual-payment":
        return ok(
          await api.bills.recordManualPayment(billId, input.memberId, {
            amount: input.amount,
            method: input.method,
            note: input.note,
          }),
        );
    }
  } catch (error) {
    return failure(error);
  }
}
