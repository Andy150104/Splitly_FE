import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

export async function GET() {
  try {
    const banks = await api.payoutAccounts.getVietQrBanks();
    return ok(banks);
  } catch (error) {
    return failure(error);
  }
}
