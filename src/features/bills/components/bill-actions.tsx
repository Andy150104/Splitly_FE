"use client";

import { BellRing, Rocket, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { bffFetch } from "@/lib/http/browser-http-client";

export function BillActions({
  billId,
  status,
  unpaidMemberIds,
  canPublish,
  canSendReminders,
  canDelete,
}: {
  billId: string;
  status?: string | null;
  unpaidMemberIds: string[];
  canPublish: boolean;
  canSendReminders: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function act(action: "publish" | "remind" | "cancel") {
    let payload: object = { action };
    if (action === "remind") {
      payload = { action, memberIds: unpaidMemberIds };
    }
    if (action === "cancel") {
      const reason = window.prompt("Lý do hủy hóa đơn:");
      if (!reason) return;
      payload = { action, reason };
    }

    setPending(action);
    try {
      await bffFetch(`/api/bills/${billId}/actions`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success(
        action === "publish"
          ? "Đã công bố hóa đơn"
          : action === "remind"
            ? "Đã xếp hàng email nhắc thanh toán"
            : "Đã hủy hóa đơn",
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể hoàn tất thao tác.",
      );
    } finally {
      setPending(null);
    }
  }

  if (["Paid", "Cancelled"].includes(status ?? "")) return null;

  const showPublish = status === "Draft";
  const showRemind = status !== "Draft" && unpaidMemberIds.length > 0;
  const showCancel = true;
  if (!showPublish && !showRemind && !showCancel) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {showPublish ? (
        <Button
          onClick={() => act("publish")}
          disabled={!canPublish || Boolean(pending)}
          title={!canPublish ? "Bạn chưa có quyền Bills.Publish" : undefined}
          isLoading={pending === "publish"}
          loadingText="Đang công bố…"
        >
          <Rocket className="size-4" />
          Công bố
        </Button>
      ) : null}
      {showRemind ? (
        <Button
          variant="outline"
          onClick={() => act("remind")}
          disabled={!canSendReminders || Boolean(pending)}
          title={
            !canSendReminders
              ? "Bạn chưa có quyền Bills.SendReminders"
              : undefined
          }
          isLoading={pending === "remind"}
          loadingText="Đang gửi nhắc…"
        >
          <BellRing className="size-4" />
          Nhắc thanh toán
        </Button>
      ) : null}
      {showCancel ? (
        <Button
          variant="ghost"
          onClick={() => act("cancel")}
          disabled={!canDelete || Boolean(pending)}
          title={!canDelete ? "Bạn chưa có quyền Bills.Delete" : undefined}
          isLoading={pending === "cancel"}
          loadingText="Đang hủy…"
        >
          <XCircle className="size-4" />
          Hủy hóa đơn
        </Button>
      ) : null}
    </div>
  );
}
