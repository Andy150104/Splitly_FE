"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  BillSplitServiceApiControllersBillsControllerSaveBillRequest as SaveBillRequest,
  BillSplitServiceApplicationFeaturesBillsCreateBillCreateBillHandlerResponse as CreateBillResponse,
  PagedResultListBills,
} from "@/generated/api/models";
import { bffFetch } from "@/lib/http/browser-http-client";
import { billKeys } from "@/features/bills/query-keys";

export function useBills(owed = false) {
  return useQuery({
    queryKey: billKeys.list(owed),
    queryFn: () => bffFetch<PagedResultListBills>(`/api/bills?owed=${owed}`),
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveBillRequest) =>
      bffFetch<CreateBillResponse>("/api/bills", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billKeys.all }),
  });
}
