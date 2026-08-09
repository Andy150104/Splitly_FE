import { z } from "zod";

export const createBillSchema = z.object({
  title: z.string().trim().min(1, "Nhập tên hóa đơn.").max(200),
  totalAmount: z.coerce.number().positive("Tổng tiền phải lớn hơn 0."),
  currency: z.string().trim().length(3),
  billDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().trim().max(1000).optional(),
  groupId: z.string().optional(),
  emailsText: z.string().optional(),
  groupMemberIds: z.array(z.string()).default([]),
  includeOwner: z.boolean().default(true),
  splitMethod: z.enum(["Equal", "CustomAmount"]),
  allocations: z.record(z.string(), z.coerce.number().nonnegative()).default({}),
  publish: z.boolean().default(true),
  payoutAccountId: z.string().optional(),
});

export type CreateBillValues = z.input<typeof createBillSchema>;
