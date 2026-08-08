"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  BillSplitServiceApiControllersGroupsControllerCreateGroupRequest as CreateGroupRequest,
  BillSplitServiceApplicationFeaturesGroupsCreateGroupCreateGroupHandlerResponse as CreateGroupResponse,
  PagedResultListGroups,
} from "@/generated/api/models";
import { bffFetch } from "@/lib/http/browser-http-client";

export const groupKeys = { all: ["groups"] as const };

export function useGroups() {
  return useQuery({ queryKey: groupKeys.all, queryFn: () => bffFetch<PagedResultListGroups>("/api/groups") });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupRequest) => bffFetch<CreateGroupResponse>("/api/groups", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }),
  });
}
