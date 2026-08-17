import "server-only";

import { getBillSplitServiceAPI } from "@/generated/api/endpoints";
import type {
  BillSplitServiceApiControllersAdminUsersControllerChangeAccessRequest as ChangeAccessRequest,
  BillSplitServiceApiControllersAdminUsersControllerUpdatePermissionsRequest as UpdatePermissionsRequest,
  BillSplitServiceApiControllersAdminUsersControllerUpdateRoleRequest as UpdateRoleRequest,
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
      unwrap(
        await generated.putApiAdminUsersMemberIdAccess(memberId, input, opts),
      ),
    );
  },
  async changeRole(memberId: string, input: UpdateRoleRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(
        await generated.patchApiAdminUsersMemberIdRole(memberId, input, opts),
      ),
    );
  },
  async getPermissions() {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiAdminUsersPermissions(opts)),
    );
  },
  async getRoles() {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiAdminUsersRoles(opts)),
    );
  },
  async getMemberPermissions(memberId: string) {
    return authenticatedCall(async (opts) =>
      unwrap(
        await generated.getApiAdminUsersMemberIdPermissions(memberId, opts),
      ),
    );
  },
  async changePermissions(memberId: string, input: UpdatePermissionsRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(
        await generated.patchApiAdminUsersMemberIdPermissions(
          memberId,
          input,
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
