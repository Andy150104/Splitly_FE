import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

const createSchema = z.object({
  bankBin: z.string().trim().optional().nullable(),
  bankCode: z.string().trim().optional().nullable(),
  bankName: z.string().trim().optional().nullable(),
  accountNumber: z.string().trim().min(1, "Vui lòng nhập số tài khoản"),
  accountHolderName: z.string().trim().min(1, "Vui lòng nhập tên chủ tài khoản"),
  isDefault: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const accounts = await api.payoutAccounts.getAll();
    return ok(accounts);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = createSchema.parse(await request.json());
    const result = await api.payoutAccounts.create(payload);
    return ok(result, 201);
  } catch (error) {
    return failure(error);
  }
}
