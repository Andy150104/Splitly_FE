"use client";

import { Landmark, LoaderCircle } from "lucide-react";

import { CreatePayoutAccountModal } from "@/features/payout-accounts/components/create-payout-account-modal";
import { PayoutAccountCard } from "@/features/payout-accounts/components/payout-account-card";
import { usePayoutAccounts } from "@/features/payout-accounts/hooks/use-payout-accounts";

export function PayoutAccountList({
  canCreate,
  canUpdate,
  canReadBanks,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canReadBanks: boolean;
}) {
  const { data: accounts = [], isLoading, error } = usePayoutAccounts();

  if (isLoading) {
    return (
      <div className="border-border flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-8 text-center">
        <LoaderCircle className="text-primary size-8 animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">
          Đang tải danh sách tài khoản ngân hàng…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-2xl border p-6 text-center">
        <p className="text-sm font-semibold">
          Không thể tải danh sách tài khoản Payout
        </p>
        <p className="mt-1 text-xs">Vui lòng thử lại sau.</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="border-border/80 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
          <Landmark className="size-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">
          Chưa có tài khoản Payout nào
        </h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          Thêm tài khoản ngân hàng của bạn để Splitly tự động chuyển toàn bộ số
          tiền thu được về ví cá nhân.
        </p>
        <div className="mt-5">
          <CreatePayoutAccountModal
            allowed={canCreate}
            canReadBanks={canReadBanks}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Tài khoản Payout của bạn</h2>
          <p className="text-muted-foreground text-xs">
            Tiền thu được từ PayOS sẽ được giải ngân trực tiếp vào tài khoản
            được chọn.
          </p>
        </div>
        <CreatePayoutAccountModal
          allowed={canCreate}
          canReadBanks={canReadBanks}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((acc) => (
          <PayoutAccountCard
            key={acc.id}
            account={acc}
            canUpdate={canUpdate}
            canReadBanks={canReadBanks}
          />
        ))}
      </div>
    </div>
  );
}
