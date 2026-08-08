import { Banknote, CheckCircle2, Clock3, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BillActions } from "@/features/bills/components/bill-actions";
import { BillMemberList } from "@/features/bills/components/bill-member-list";
import { BillStatusBadge } from "@/features/bills/components/bill-status-badge";
import { api } from "@/lib/api/server/api";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDate } from "@/lib/formatters/date";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = await params;
  const bill = await api.bills.getById(billId);
  if (!bill.billId) notFound();
  const currency = bill.currency ?? "VND";
  const members = bill.members ?? [];
  const unpaidIds = members
    .filter((member) => (member.remainingAmount ?? 0) > 0 && member.memberId)
    .map((member) => member.memberId!);
  const metrics = [
    {
      label: "Tổng hóa đơn",
      value: formatCurrency(bill.totalAmount, currency),
      icon: Banknote,
    },
    {
      label: "Đã thu",
      value: formatCurrency(bill.collectedAmount, currency),
      icon: CheckCircle2,
    },
    {
      label: "Còn phải thu",
      value: formatCurrency(bill.remainingAmount, currency),
      icon: Clock3,
    },
    {
      label: "Đã thanh toán",
      value: `${bill.paidMemberCount ?? 0}/${members.length} người`,
      icon: UsersRound,
    },
  ];
  return (
    <div className="space-y-7">
      <PageHeader
        title={bill.title || "Chi tiết hóa đơn"}
        description={`${bill.description || "Theo dõi tiến độ thanh toán của từng thành viên."} · Hạn ${formatDate(bill.dueDate)}`}
        actions={
          bill.isOwner ? (
            <BillActions
              billId={billId}
              status={bill.status}
              unpaidMemberIds={unpaidIds}
            />
          ) : undefined
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <BillStatusBadge status={bill.status} />
        <span className="money text-3xl font-bold tracking-[-0.03em] sm:ml-auto">
          {formatCurrency(bill.totalAmount, currency)}
        </span>
        {(bill.overdueMemberCount ?? 0) > 0 ? (
          <span className="text-destructive text-sm">
            {bill.overdueMemberCount} người quá hạn
          </span>
        ) : null}
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="group hover:border-primary/25 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgb(15_23_42/0.06)]"
          >
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{metric.label}</p>
                <metric.icon className="text-primary size-4 transition-transform duration-200 group-hover:scale-110" />
              </div>
              <p className="money text-xl font-bold tracking-tight">
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-3 flex justify-between">
            <div>
              <span className="text-sm font-semibold">Tiến độ thu tiền</span>
              <p className="money text-muted-foreground mt-1 text-xs">
                {formatCurrency(bill.collectedAmount, currency)} /{" "}
                {formatCurrency(bill.totalAmount, currency)}
              </p>
            </div>
            <strong className="money text-sm">
              {Math.round(bill.completionPercentage ?? 0)}%
            </strong>
          </div>
          <Progress value={bill.completionPercentage ?? 0} className="h-2.5" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Thành viên và thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          <BillMemberList
            billId={billId}
            currency={currency}
            members={members}
            canManage={Boolean(bill.isOwner)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
