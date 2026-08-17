import Link from "next/link";

import type { BillSplitServiceApplicationFeaturesBillsListBillsListBillsHandlerItem as BillItem } from "@/generated/api/models";
import { BillCard } from "@/features/bills/components/bill-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export function BillList({
  bills,
  owed = false,
  canCreate = false,
}: {
  bills: BillItem[];
  owed?: boolean;
  canCreate?: boolean;
}) {
  if (!bills.length)
    return (
      <EmptyState
        title={owed ? "Bạn không có khoản cần trả" : "Chưa có hóa đơn nào"}
        description={
          owed
            ? "Các hóa đơn người khác chia cho bạn sẽ xuất hiện ở đây."
            : "Tạo hóa đơn đầu tiên để bắt đầu chia tiền và theo dõi thanh toán."
        }
        action={
          !owed ? (
            canCreate ? (
              <Button asChild>
                <Link href="/bills/new">Tạo hóa đơn</Link>
              </Button>
            ) : (
              <Button disabled title="Bạn chưa có quyền Bills.Create">
                Tạo hóa đơn
              </Button>
            )
          ) : undefined
        }
      />
    );
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {bills.map((bill) => (
        <BillCard key={bill.billId} bill={bill} owed={owed} />
      ))}
    </div>
  );
}
