"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Clock3, UsersRound } from "lucide-react";

import type { BillSplitServiceApplicationFeaturesBillsGetBillGetBillHandlerResponse as BillDetail } from "@/generated/api/models";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BillActions } from "@/features/bills/components/bill-actions";
import { BillMemberList } from "@/features/bills/components/bill-member-list";
import { BillStatusBadge } from "@/features/bills/components/bill-status-badge";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDate } from "@/lib/formatters/date";
import { bffFetch } from "@/lib/http/browser-http-client";

export function BillDetailView({
  billId,
  initialData,
  canPublish,
  canSendReminders,
  canDelete,
  canRecordPayment,
  canReadPayments,
  canCreatePayment,
}: {
  billId: string;
  initialData: BillDetail;
  canPublish: boolean;
  canSendReminders: boolean;
  canDelete: boolean;
  canRecordPayment: boolean;
  canReadPayments: boolean;
  canCreatePayment: boolean;
}) {
  const { data: bill = initialData } = useQuery({
    queryKey: ["bills", "detail", billId],
    queryFn: () => bffFetch<BillDetail>(`/api/bills/${billId}`),
    initialData,
    refetchInterval: (query) => {
      const data = query.state.data ?? initialData;
      const hasUnpaid = (data.members ?? []).some(
        (m) => (m.remainingAmount ?? 0) > 0 && m.status !== "Paid",
      );
      return hasUnpaid ? 3000 : false;
    },
  });

  const currency = bill.currency ?? "VND";
  const members = bill.members ?? [];
  const unpaidIds = members
    .filter((member) => (member.remainingAmount ?? 0) > 0 && member.memberId)
    .map((member) => member.memberId!);

  const completion = Math.min(100, Math.max(0, bill.completionPercentage ?? 0));
  const totalText = formatCurrency(bill.totalAmount, currency);
  const collectedText = formatCurrency(bill.collectedAmount, currency);
  const remainingText = formatCurrency(bill.remainingAmount, currency);

  return (
    <div className="animate-page-enter space-y-5 lg:space-y-6">
      <PageHeader
        title={bill.title || "Chi tiết hóa đơn"}
        description={
          bill.description ||
          "Theo dõi tiến độ thanh toán và số tiền của từng thành viên."
        }
        actions={
          bill.isOwner ? (
            <BillActions
              billId={billId}
              status={bill.status}
              unpaidMemberIds={unpaidIds}
              canPublish={canPublish}
              canSendReminders={canSendReminders}
              canDelete={canDelete}
            />
          ) : undefined
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-border/75 flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <BillStatusBadge status={bill.status} />
              {bill.isOwner ? (
                <Badge variant="default">Chủ hóa đơn</Badge>
              ) : null}
              {(bill.overdueMemberCount ?? 0) > 0 ? (
                <Badge variant="destructive">
                  {bill.overdueMemberCount} người quá hạn
                </Badge>
              ) : null}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <CalendarClock className="size-4" />
              <span>Hạn thanh toán: {formatDate(bill.dueDate)}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.6fr)]">
            <div className="border-border/75 border-b px-5 py-5 sm:px-6 lg:border-r lg:border-b-0 lg:py-6">
              <p className="text-muted-foreground text-sm">Tổng hóa đơn</p>
              <p
                className="money mt-2 text-[clamp(1.9rem,3.2vw,2.75rem)] font-bold tracking-[-0.04em] break-words"
                title={totalText}
              >
                {totalText}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                {members.length} thành viên tham gia
              </p>
            </div>

            <div className="px-5 py-5 sm:px-6 lg:py-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <BillMetric
                  icon={CheckCircle2}
                  label="Đã thu"
                  value={collectedText}
                />
                <BillMetric
                  icon={Clock3}
                  label="Còn lại"
                  value={remainingText}
                />
                <BillMetric
                  icon={UsersRound}
                  label="Đã thanh toán"
                  value={`${bill.paidMemberCount ?? 0}/${members.length} người`}
                />
              </div>

              <div className="border-border/70 mt-5 border-t pt-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">Tiến độ thu tiền</span>
                  <span className="money font-semibold">
                    {Math.round(completion)}%
                  </span>
                </div>
                <Progress value={completion} className="h-2.5" />
                <div className="text-muted-foreground mt-2 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <span>{collectedText} đã thu</span>
                  <span>{remainingText} còn lại</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-border/75 border-b pb-4">
          <CardTitle className="text-lg">Thành viên và thanh toán</CardTitle>
          <CardDescription className="mt-1.5">
            Mã QR thanh toán PayOS sẽ tự động ẩn đi sau khi thành viên hoàn tất
            chuyển khoản.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <BillMemberList
            billId={billId}
            currency={currency}
            members={members}
            canManage={Boolean(bill.isOwner)}
            canRecordPayment={canRecordPayment}
            canReadPayments={canReadPayments}
            canCreatePayment={canCreatePayment}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function BillMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <Icon className="text-primary size-4" />
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
      </div>
      <p className="money mt-2 truncate text-lg font-semibold" title={value}>
        {value}
      </p>
    </div>
  );
}
