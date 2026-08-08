import "server-only";

import { getBillSplitServiceAPI } from "@/generated/api/endpoints";
import type {
  BillSplitServiceApiControllersAdminUsersControllerChangeAccessRequest as ChangeAccessRequest,
  GetApiAdminUsersParams,
} from "@/generated/api/models";
import { unwrap } from "@/lib/api/shared/unwrap";
import { authenticatedCall } from "@/lib/api/server/require-session";

const generated = getBillSplitServiceAPI();

export const adminApi = {
  async getUsers(params?: GetApiAdminUsersParams) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiAdminUsers(params, opts)),
    );
  },
  async changeAccess(memberId: string, input: ChangeAccessRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.putApiAdminUsersMemberIdAccess(memberId, input, opts)),
    );
  },
};
