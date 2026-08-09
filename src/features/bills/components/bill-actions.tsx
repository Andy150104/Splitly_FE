"use client";

import { BellRing, Rocket, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { bffFetch } from "@/lib/http/browser-http-client";

export function BillActions({ billId, status, unpaidMemberIds }: { billId: string; status?: string | null; unpaidMemberIds: string[] }) {
  const router = useRouter(); const [pending, setPending] = useState<string | null>(null);
  async function act(action: "publish" | "remind" | "cancel") {
    let payload: object = { action };
    if (action === "remind") payload = { action, memberIds: unpaidMemberIds };
    if (action === "cancel") { const reason = window.prompt("Lý do hủy hóa đơn:"); if (!reason) return; payload = { action, reason }; }
    setPending(action);
    try { await bffFetch(`/api/bills/${billId}/actions`, { method: "POST", body: JSON.stringify(payload) }); toast.success(action === "publish" ? "Đã công bố hóa đơn" : action === "remind" ? "Đã xếp hàng email nhắc thanh toán" : "Đã hủy hóa đơn"); router.refresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể hoàn tất thao tác."); }
    finally { setPending(null); }
  }
  if (["Paid", "Cancelled"].includes(status ?? "")) return null;
  return <div className="flex flex-wrap gap-2">{status === "Draft" ? <Button onClick={() => act("publish")} disabled={Boolean(pending)} isLoading={pending === "publish"} loadingText="Đang công bố…"><Rocket className="size-4" />Công bố</Button> : null}{status !== "Draft" && unpaidMemberIds.length ? <Button variant="outline" onClick={() => act("remind")} disabled={Boolean(pending)} isLoading={pending === "remind"} loadingText="Đang gửi nhắc…"><BellRing className="size-4" />Nhắc thanh toán</Button> : null}<Button variant="ghost" onClick={() => act("cancel")} disabled={Boolean(pending)} isLoading={pending === "cancel"} loadingText="Đang hủy…"><XCircle className="size-4" />Hủy hóa đơn</Button></div>;
}
