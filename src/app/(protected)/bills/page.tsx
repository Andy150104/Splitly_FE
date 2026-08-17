import { Plus } from "lucide-react";
import Link from "next/link";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { BillsQueryView } from "@/features/bills/components/bills-query-view";
import { billKeys } from "@/features/bills/query-keys";
import { api } from "@/lib/api/server/api";
import { toResult } from "@/lib/async-result";
import { cn } from "@/lib/utils";
import { SYSTEM_PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server-permissions";

export const metadata = { title: "Hóa đơn" };

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const permissionState = await requirePermission(
    SYSTEM_PERMISSIONS.BILLS_READ,
  );
  const canWrite = hasPermission(
    permissionState,
    SYSTEM_PERMISSIONS.BILLS_CREATE,
  );
  const view = (await searchParams).view === "owed" ? "owed" : "owned";
  const loaded = await toResult(
    api.bills.getAll({ owed: view === "owed", pageNumber: 1, pageSize: 100 }),
  );
  if ("error" in loaded) {
    return (
      <div className="space-y-6">
        <PageHeader title="Hóa đơn" />
        <ErrorState
          message={
            loaded.error instanceof Error ? loaded.error.message : undefined
          }
        />
      </div>
    );
  }
  const queryClient = new QueryClient();
  queryClient.setQueryData(billKeys.list(view === "owed"), loaded.data);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hóa đơn"
        description="Theo dõi hóa đơn bạn tạo và các khoản được chia cho bạn."
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/bills/new">
                <Plus className="size-4" />
                Tạo hóa đơn
              </Link>
            </Button>
          ) : (
            <Button disabled title="Bạn chưa có quyền Bills.Create">
              <Plus className="size-4" />
              Tạo hóa đơn
            </Button>
          )
        }
      />
      <div
        className="bg-muted inline-flex rounded-xl p-1"
        aria-label="Loại hóa đơn"
      >
        {[
          { value: "owned", label: "Tôi đã tạo" },
          { value: "owed", label: "Tôi cần trả" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "owned" ? "/bills" : "/bills?view=owed"}
            className={cn(
              "text-muted-foreground rounded-lg px-4 py-2 text-sm font-medium transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.98]",
              view === tab.value && "bg-card text-foreground shadow-sm",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BillsQueryView owed={view === "owed"} canCreate={canWrite} />
      </HydrationBoundary>
    </div>
  );
}
