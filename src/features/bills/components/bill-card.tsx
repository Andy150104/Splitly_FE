import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

import type { BillSplitServiceApplicationFeaturesBillsListBillsListBillsHandlerItem as BillItem } from "@/generated/api/models";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BillStatusBadge } from "@/features/bills/components/bill-status-badge";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDate } from "@/lib/formatters/date";

export function BillCard({
  bill,
  owed = false,
}: {
  bill: BillItem;
  owed?: boolean;
}) {
  const total = bill.totalAmount ?? 0;
  const remaining = bill.remainingAmount ?? total;
  const paid = Math.max(0, total - remaining);
  const progress = total > 0 ? (paid / total) * 100 : 0;
  return (
    <Card className="group hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgb(15_23_42/0.08)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">
              {bill.title || "Hóa đơn chưa đặt tên"}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <BillStatusBadge status={bill.status} />
            </div>
          </div>
          <p className="money shrink-0 text-lg font-bold tracking-tight">
            {formatCurrency(total, bill.currency ?? "VND")}
          </p>
        </div>
        <div className="mt-5">
          <div className="text-muted-foreground mb-2 flex justify-between text-xs">
            <span>{owed ? "Bạn còn cần trả" : "Còn lại"}</span>
            <span>{formatCurrency(remaining, bill.currency ?? "VND")}</span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="border-border mt-5 flex items-center justify-between border-t pt-4">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <CalendarDays className="size-3.5" />
            Hạn {formatDate(bill.dueDate)}
          </span>
          {bill.billId ? (
            <Link
              href={`/bills/${bill.billId}`}
              className="text-primary hover:bg-primary/8 active:bg-primary/12 inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold transition-colors"
            >
              Chi tiết{" "}
              <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-1" />
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
