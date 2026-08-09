"use client";

import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  QrCode,
  ReceiptText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { BillSplitServiceApplicationFeaturesBillsGetBillGetBillHandlerMemberItem as MemberItem } from "@/generated/api/models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BillStatusBadge } from "@/features/bills/components/bill-status-badge";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDateTime } from "@/lib/formatters/date";
import { bffFetch } from "@/lib/http/browser-http-client";
import { cn } from "@/lib/utils";

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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success("Đã sao chép nội dung chuyển khoản");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!members.length) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        Hóa đơn chưa có thành viên.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const id = member.memberId ?? "";
        const isPaid = (member.remainingAmount ?? 0) === 0 || member.status === "Paid";
        const hasQr = !isPaid && Boolean(member.paymentQrImageUrl || member.paymentUrl || member.transferContent);
        const isOpen = expanded === id || (!isPaid && hasQr && expanded === null);
        const payments = member.payments ?? [];
        const canExpand =
          hasQr || payments.length > 0 || (canManage && (member.remainingAmount ?? 0) > 0);

        return (
          <div
            key={id}
            className={cn(
              "rounded-2xl border transition-all duration-200",
              isPaid
                ? "border-emerald-500/25 bg-emerald-500/[0.02] dark:border-emerald-500/20 dark:bg-emerald-500/[0.04]"
                : "border-amber-500/30 bg-amber-500/[0.025] dark:border-amber-500/20 dark:bg-amber-500/[0.04]",
            )}
          >
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <div
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold",
                  isPaid
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                )}
              >
                {(member.name || member.email || "U").slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold sm:text-base">
                    {member.name || member.email}
                  </p>
                  {isPaid ? (
                    <Badge variant="default" className="bg-emerald-600 text-white dark:bg-emerald-500">
                      ✓ Đã thanh toán
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      Chờ thanh toán
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground truncate text-xs sm:text-sm">
                  {member.email}
                </p>
              </div>

              <div className="grid gap-2 sm:min-w-[180px] sm:justify-items-end">
                <div className="text-left sm:text-right">
                  <p
                    className={cn(
                      "money text-base font-semibold",
                      isPaid && "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {isPaid
                      ? formatCurrency(member.assignedAmount, currency)
                      : formatCurrency(member.remainingAmount, currency)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {isPaid ? "đã hoàn tất" : "còn phải thu"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <BillStatusBadge status={member.status} />
                  {canExpand ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpanded(isOpen ? "" : id)}
                      aria-label={
                        isOpen
                          ? "Đóng chi tiết thanh toán"
                          : "Mở chi tiết thanh toán"
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
              </div>
            </div>

            {isOpen ? (
              <div className="animate-expand border-t border-border/70 bg-muted/30 px-4 py-4 sm:px-5 sm:py-5">
                {/* UNPAID FLOW: Display PayOS QR Code & Checkout Button */}
                {!isPaid && hasQr ? (
                  <div className="mb-5 rounded-2xl border border-amber-500/25 bg-background/90 p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                      {member.paymentQrImageUrl ? (
                        <div className="relative flex shrink-0 flex-col items-center rounded-xl border border-border bg-white p-2.5 shadow-sm dark:bg-slate-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={member.paymentQrImageUrl}
                            alt="Mã QR PayOS"
                            className="size-44 object-contain rounded-lg sm:size-48"
                          />
                          <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <QrCode className="size-3" /> Quét bằng App Ngân hàng
                          </span>
                        </div>
                      ) : null}

                      <div className="flex-1 space-y-3">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Thanh toán trực tuyến PayOS
                          </span>
                          <h4 className="mt-0.5 text-base font-bold">
                            Quét QR hoặc Bấm Thanh toán ngay
                          </h4>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            Mã QR PayOS được sinh riêng cho khoản nợ{" "}
                            <strong className="text-foreground">
                              {formatCurrency(member.remainingAmount, currency)}
                            </strong>
                            . Sau khi quét thành công, trạng thái sẽ tự động cập nhật ngay lập tức.
                          </p>
                        </div>

                        {member.transferContent ? (
                          <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
                            <span className="text-muted-foreground block font-medium">
                              Cú pháp chuyển khoản (Mã đơn)
                            </span>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <code className="font-mono text-sm font-bold tracking-wider text-primary">
                                {member.transferContent}
                              </code>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleCopy(member.transferContent!)}
                              >
                                {copiedCode === member.transferContent ? (
                                  <>
                                    <Check className="size-3 text-emerald-600" /> Đã chép
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3" /> Sao chép
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        {member.paymentUrl ? (
                          <Button asChild className="w-full sm:w-auto gap-2">
                            <a
                              href={member.paymentUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="size-4" />
                              Thanh toán ngay (PayOS Checkout)
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* PAID FLOW: Hide QR completely & show payment log */}
                {isPaid ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-700 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-semibold">
                        Thành viên đã hoàn tất thanh toán
                      </span>
                    </div>
                    {member.paidAtUtc ? (
                      <p className="mt-1 text-xs opacity-90">
                        Thời gian: {formatDateTime(member.paidAtUtc)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* PAYMENT HISTORY */}
                {payments.length ? (
                  <div className="mt-4 space-y-2.5">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Lịch sử giao dịch ({payments.length} lần)
                    </p>
                    {payments.map((payment) => (
                      <div
                        key={payment.paymentId}
                        className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                          {formatDateTime(payment.paidAtUtc)} · {payment.method}
                        </span>
                        <strong className="money text-sm">
                          {formatCurrency(payment.amount, currency)}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* MANUAL PAYMENT RECORD (for Owner) */}
                {canManage && id && (member.remainingAmount ?? 0) > 0 ? (
                  <div className="mt-4">
                    <ManualPaymentForm
                      billId={billId}
                      memberId={id}
                      max={member.remainingAmount ?? 0}
                      currency={currency}
                    />
                  </div>
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
  const [amount, setAmount] = useState<number | "">(max);
  const [method, setMethod] = useState("Bank transfer");

  const numericAmount = typeof amount === "number" ? amount : 0;

  return (
    <form
      className="space-y-4 rounded-2xl border border-border/75 bg-background/75 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        try {
          await bffFetch(`/api/bills/${billId}/actions`, {
            method: "POST",
            body: JSON.stringify({
              action: "manual-payment",
              memberId,
              amount: numericAmount,
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
      <div>
        <p className="text-sm font-semibold">Ghi nhận thanh toán thủ công</p>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          Tối đa có thể ghi nhận: {formatCurrency(max, currency)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label>Số tiền</Label>
          <Input
            value={amount}
            money={{
              currency,
              suggestions: false,
              onValueChange: setAmount,
            }}
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
          className="w-full sm:w-auto"
          disabled={numericAmount <= 0 || numericAmount > max}
          isLoading={pending}
          loadingText="Đang ghi nhận…"
        >
          <ReceiptText className="size-4" />
          Xác nhận
        </Button>
      </div>
    </form>
  );
}
