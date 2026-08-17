"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CreatePayoutAccountValues } from "@/features/payout-accounts/schemas/payout-account.schema";
import type {
  PayoutAccount,
  VietQrBank,
} from "@/features/payout-accounts/types";
import { bffFetch } from "@/lib/http/browser-http-client";

export const payoutAccountQueryKeys = {
  all: ["payout-accounts"] as const,
  banks: ["vietqr-banks"] as const,
};

export function usePayoutAccounts(enabled = true) {
  return useQuery({
    queryKey: payoutAccountQueryKeys.all,
    queryFn: () => bffFetch<PayoutAccount[]>("/api/payout-accounts"),
    enabled,
  });
}

export function useVietQrBanks(enabled = true) {
  return useQuery({
    queryKey: payoutAccountQueryKeys.banks,
    queryFn: () => bffFetch<VietQrBank[]>("/api/banks/vietqr"),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled,
  });
}

export function useCreatePayoutAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreatePayoutAccountValues) =>
      bffFetch<{ id: string }>("/api/payout-accounts", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Đã thêm tài khoản ngân hàng thành công");
      void queryClient.invalidateQueries({
        queryKey: payoutAccountQueryKeys.all,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể thêm tài khoản ngân hàng.",
      );
    },
  });
}

export function useSetDefaultPayoutAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      bffFetch<boolean>(`/api/payout-accounts/${id}/default`, {
        method: "PUT",
      }),
    onSuccess: () => {
      toast.success("Đã đặt làm tài khoản mặc định");
      void queryClient.invalidateQueries({
        queryKey: payoutAccountQueryKeys.all,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Không thể đặt mặc định.",
      );
    },
  });
}
