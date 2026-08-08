import "server-only";

import { getBillSplitServiceAPI } from "@/generated/api/endpoints";
import type {
  BillSplitServiceApiControllersGroupsControllerAddGroupMembersRequest as AddGroupMembersRequest,
  BillSplitServiceApiControllersGroupsControllerCreateGroupRequest as CreateGroupRequest,
  GetApiGroupsParams,
} from "@/generated/api/models";
import { unwrap } from "@/lib/api/shared/unwrap";
import { authenticatedCall } from "@/lib/api/server/require-session";

const generated = getBillSplitServiceAPI();

export const groupsApi = {
  async getAll(params?: GetApiGroupsParams) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiGroups(params, opts)),
    );
  },
  async getById(groupId: string) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.getApiGroupsGroupId(groupId, opts)),
    );
  },
  async create(input: CreateGroupRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiGroups(input, opts)),
    );
  },
  async addMembers(groupId: string, input: AddGroupMembersRequest) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiGroupsGroupIdMembers(groupId, input, opts)),
    );
  },
  async removeMember(groupId: string, memberId: string) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.deleteApiGroupsGroupIdMembersMemberId(groupId, memberId, opts)),
    );
  },
  async close(groupId: string) {
    return authenticatedCall(async (opts) =>
      unwrap(await generated.postApiGroupsGroupIdClose(groupId, opts)),
    );
  },
};
