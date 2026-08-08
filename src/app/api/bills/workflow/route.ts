import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { BillSplitServiceDomainEnumsBillSplitMethod } from "@/generated/api/models";
import { api } from "@/lib/api/server/api";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  totalAmount: z.number().positive(),
  currency: z.string().trim().length(3),
  groupId: z.string().uuid().nullable().optional(),
  billDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  emails: z.array(z.string().trim().toLowerCase().email()).max(50),
  groupMemberIds: z.array(z.string().uuid()).max(50).default([]),
  includeOwner: z.boolean(),
  splitMethod: z.enum(["Equal", "CustomAmount"]),
  allocations: z.record(z.string(), z.number().nonnegative()).default({}),
  publish: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const draft = await api.bills.create({
      title: input.title,
      totalAmount: input.totalAmount,
      currency: input.currency.toUpperCase(),
      groupId: input.groupId,
      billDate: input.billDate,
      dueDate: input.dueDate,
      description: input.description,
    });
    if (!draft.billId) throw new Error("Backend did not return a bill ID");

    await api.bills.addMembers(draft.billId, {
      emails: input.emails,
      groupMemberIds: input.groupMemberIds,
      includeOwner: input.includeOwner,
    });

    if (input.splitMethod === "Equal") {
      await api.bills.calculate(draft.billId, {
        method: BillSplitServiceDomainEnumsBillSplitMethod.Equal,
        allocations: [],
      });
    } else {
      const detail = await api.bills.getById(draft.billId);
      const allocations = (detail.members ?? []).map((member) => ({
        memberId: member.memberId ?? "",
        amount: input.allocations[(member.email ?? "").toLowerCase()] ?? 0,
      }));
      await api.bills.calculate(draft.billId, {
        method: BillSplitServiceDomainEnumsBillSplitMethod.CustomAmount,
        allocations,
      });
    }

    const published = input.publish ? await api.bills.publish(draft.billId) : null;
    return ok({ billId: draft.billId, published }, 201);
  } catch (error) {
    return failure(error);
  }
}
