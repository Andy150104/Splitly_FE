import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  totalAmount: z.number().positive(),
  currency: z.string().trim().length(3),
  groupId: z.string().uuid().nullable().optional(),
  billDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

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

export async function PUT(
  request: Request,
  context: { params: Promise<{ billId: string }> },
) {
  try {
    const { billId } = await context.params;
    return ok(
      await api.bills.update(billId, updateSchema.parse(await request.json())),
    );
  } catch (error) {
    return failure(error);
  }
}
