import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PayoutAccountList } from "@/features/payout-accounts/components/payout-account-list";
import { payoutAccountQueryKeys } from "@/features/payout-accounts/hooks/use-payout-accounts";
import { api } from "@/lib/api/server/api";
import { toResult } from "@/lib/async-result";

export const metadata = { title: "Tài khoản Payout" };

export default async function PayoutAccountsPage() {
  const loaded = await toResult(api.payoutAccounts.getAll());

  if ("error" in loaded) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tài khoản Payout" />
        <ErrorState
          message={
            loaded.error instanceof Error ? loaded.error.message : undefined
          }
        />
      </div>
    );
  }

  const queryClient = new QueryClient();
  queryClient.setQueryData(payoutAccountQueryKeys.all, loaded.data);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài khoản Payout (PayOS)"
        description="Quản lý tài khoản ngân hàng cá nhân để nhận tiền tự động khi các thành viên quét QR thanh toán hóa đơn."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PayoutAccountList />
      </HydrationBoundary>
    </div>
  );
}
