import { z } from "zod";

export const createPayoutAccountSchema = z.object({
  bankBin: z.string().trim().optional(),
  bankCode: z.string().trim().optional(),
  bankName: z.string().trim().min(1, "Vui lòng chọn hoặc nhập tên ngân hàng"),
  accountNumber: z
    .string()
    .trim()
    .min(6, "Số tài khoản phải có ít nhất 6 ký tự")
    .max(30, "Số tài khoản không vượt quá 30 ký tự")
    .regex(/^[0-9A-Za-z]+$/, "Số tài khoản chỉ bao gồm chữ và số"),
  accountHolderName: z
    .string()
    .trim()
    .min(2, "Tên chủ tài khoản phải có ít nhất 2 ký tự")
    .max(100, "Tên chủ tài khoản không vượt quá 100 ký tự"),
  isDefault: z.boolean(),
});

export type CreatePayoutAccountValues = z.infer<typeof createPayoutAccountSchema>;
