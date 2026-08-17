"use client";

import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BillList } from "@/features/bills/components/bill-list";
import { useBills } from "@/features/bills/hooks/use-bills";

export function BillsQueryView({
  owed,
  canCreate,
}: {
  owed: boolean;
  canCreate: boolean;
}) {
  const query = useBills(owed);
  if (query.isPending)
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-60" />
        ))}
      </div>
    );
  if (query.isError) return <ErrorState message={query.error.message} />;
  return (
    <BillList
      bills={query.data.items ?? []}
      owed={owed}
      canCreate={canCreate}
    />
  );
}
