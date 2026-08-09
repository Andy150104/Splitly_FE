import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { BillSplitServiceDomainEnumsBillSplitMethod } from "@/generated/api/models";
import { api } from "@/lib/api/server/api";

type CalculateInput =
  | { method: "Equal" }
  | { method: "CustomAmount"; allocations: Record<string, number> };

const schema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("Equal"),
  }),
  z.object({
    method: z.literal("CustomAmount"),
    allocations: z.record(
      z.string().trim().toLowerCase().email(),
      z.number().nonnegative(),
    ),
  }),
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ billId: string }> },
) {
  try {
    const { billId } = await context.params;
    const input: CalculateInput = schema.parse(await request.json());

    if (input.method === "Equal") {
      return ok(
        await api.bills.calculate(billId, {
          method: BillSplitServiceDomainEnumsBillSplitMethod.Equal,
          allocations: [],
        }),
      );
    }

    const detail = await api.bills.getById(billId);
    const allocations = (detail.members ?? []).map((member) => {
      const email = member.email?.trim().toLowerCase();
      const memberId = member.memberId;

      if (!email || !memberId || input.allocations[email] === undefined) {
        throw new Error(
          "Không thể ánh xạ đầy đủ thành viên với số tiền tùy chỉnh.",
        );
      }

      return {
        memberId,
        amount: input.allocations[email],
      };
    });

    return ok(
      await api.bills.calculate(billId, {
        method: BillSplitServiceDomainEnumsBillSplitMethod.CustomAmount,
        allocations,
      }),
    );
  } catch (error) {
    return failure(error);
  }
}
