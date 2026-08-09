import "server-only";

import { getBillSplitServiceAPI } from "@/generated/api/endpoints";
import type {
  BillSplitServiceApplicationFeaturesPayoutAccountsAddPayoutAccountAddPayoutAccountHandlerRequest as AddPayoutAccountRequest,
} from "@/generated/api/models";
import { authenticatedCall } from "@/lib/api/server/require-session";
import { unwrap } from "@/lib/api/shared/unwrap";

const generated = getBillSplitServiceAPI();

export const payoutAccountsApi = {
  async getAll() {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiPayoutAccounts(opts)),
    );
  },
  async create(input: AddPayoutAccountRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiPayoutAccounts(input, opts)),
    );
  },
  async setDefault(id: string) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.putApiPayoutAccountsIdDefault(id, opts)),
    );
  },
  async getVietQrBanks() {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiVietqrBanks(opts)),
    );
  },
};
