import "server-only";

import { getBillSplitServiceAPI } from "@/generated/api/endpoints";
import type {
  BillSplitServiceApiControllersAdminUsersControllerChangeAccessRequest as ChangeAccessRequest,
  GetApiAdminSupportRequestsParams,
  GetApiAdminUsersParams,
} from "@/generated/api/models";
import { authenticatedCall } from "@/lib/api/server/require-session";
import { unwrap } from "@/lib/api/shared/unwrap";

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
  async changeRole(memberId: string, role: string) {
    return authenticatedCall(async (opts) =>
      unwrap(
        await generated.patchApiAdminUsersMemberIdRole(
          memberId,
          { role },
          opts,
        ),
      ),
    );
  },
  async getPermissions() {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiAdminUsersPermissions(opts)),
    );
  },
  async changePermissions(memberId: string, permissions: string[]) {
    return authenticatedCall(async (opts) =>
      unwrap(
        await generated.patchApiAdminUsersMemberIdPermissions(
          memberId,
          { permissions },
          opts,
        ),
      ),
    );
  },
  async getSupportRequests(params?: GetApiAdminSupportRequestsParams) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiAdminSupportRequests(params, opts)),
    );
  },
  async updateSupportStatus(
    requestId: string,
    input: { status: string; resolutionNote?: string },
  ) {
    return authenticatedCall(async (opts) =>
      unwrap(
        await generated.patchApiAdminSupportRequestsRequestIdStatus(
          requestId,
          input,
          opts,
        ),
      ),
    );
  },
};
