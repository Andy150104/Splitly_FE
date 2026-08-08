"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  ReceiptText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { BillSplitServiceApplicationFeaturesBillsGetBillGetBillHandlerMemberItem as MemberItem } from "@/generated/api/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BillStatusBadge } from "@/features/bills/components/bill-status-badge";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDateTime } from "@/lib/formatters/date";
import { bffFetch } from "@/lib/http/browser-http-client";

export function BillMemberList({
  billId,
  currency,
  members,
  canManage,
}: {
  billId: string;
  currency: string;
  members: MemberItem[];
  canManage: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!members.length)
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        Hóa đơn chưa có thành viên.
      </p>
    );
  return (
    <div className="divide-border divide-y">
      {members.map((member) => {
        const id = member.memberId ?? "";
        const isOpen = expanded === id;
        return (
          <div
            key={id}
            className="hover:bg-muted/35 rounded-xl px-2 py-4 transition-colors duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary grid size-10 place-items-center rounded-full text-xs font-bold">
                {(member.name || member.email || "U").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.name || member.email}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {member.email}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="money text-sm font-semibold">
                  {formatCurrency(member.remainingAmount, currency)}
                </p>
                <p className="text-muted-foreground text-xs">còn phải thu</p>
              </div>
              <BillStatusBadge status={member.status} />
              {member.payments?.length ||
              (canManage && (member.remainingAmount ?? 0) > 0) ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpanded(isOpen ? null : id)}
                  aria-label={
                    isOpen
                      ? "Đóng chi tiết thành viên"
                      : "Mở chi tiết thành viên"
                  }
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              ) : null}
            </div>
            {isOpen ? (
              <div className="animate-expand bg-muted/60 mt-4 ml-0 rounded-xl p-4 sm:ml-13">
                {member.payments?.length ? (
                  <div className="mb-4 space-y-2">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Lịch sử thanh toán
                    </p>
                    {member.payments.map((payment) => (
                      <div
                        key={payment.paymentId}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                          {formatDateTime(payment.paidAtUtc)} · {payment.method}
                        </span>
                        <strong className="money">
                          {formatCurrency(payment.amount, currency)}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : null}
                {canManage && id && (member.remainingAmount ?? 0) > 0 ? (
                  <ManualPaymentForm
                    billId={billId}
                    memberId={id}
                    max={member.remainingAmount ?? 0}
                    currency={currency}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ManualPaymentForm({
  billId,
  memberId,
  max,
  currency,
}: {
  billId: string;
  memberId: string;
  max: number;
  currency: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [amount, setAmount] = useState(String(max));
  const [method, setMethod] = useState("Bank transfer");
  return (
    <form
      className="border-border grid gap-3 border-t pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        try {
          await bffFetch(`/api/bills/${billId}/actions`, {
            method: "POST",
            body: JSON.stringify({
              action: "manual-payment",
              memberId,
              amount: Number(amount),
              method,
            }),
          });
          toast.success("Đã ghi nhận thanh toán");
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Không thể ghi nhận thanh toán.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label>Số tiền ({currency})</Label>
        <Input
          type="number"
          min="0.01"
          max={max}
          step="any"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Phương thức</Label>
        <Input
          value={method}
          onChange={(event) => setMethod(event.target.value)}
        />
      </div>
      <Button
        size="sm"
        disabled={pending || Number(amount) <= 0 || Number(amount) > max}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <ReceiptText className="size-4" />
        )}
        Xác nhận
      </Button>
    </form>
  );
}
