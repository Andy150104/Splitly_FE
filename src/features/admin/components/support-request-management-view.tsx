"use client";

import {
  CheckCircle2,
  Clock,
  HelpCircle,
  LifeBuoy,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/formatters/date";
import { bffFetch } from "@/lib/http/browser-http-client";

export interface SupportRequestItem {
  id: string;
  contactEmail: string;
  type: string;
  billId?: string;
  description: string;
  status: string;
  resolutionNote?: string;
  createdAtUtc?: string;
}

const SUPPORT_TYPE_LABELS: Record<string, string> = {
  PaymentIssue: "Sự cố thanh toán",
  PayoutIssue: "Sự cố chuyển tiền",
  AccountIssue: "Sự cố tài khoản",
  Other: "Yêu cầu khác",
};

const SUPPORT_STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ xử lý",
  InReview: "Đang kiểm tra",
  Resolved: "Đã giải quyết",
  Dismissed: "Từ chối",
};

export function SupportRequestManagementView({
  requests,
  canUpdate,
}: {
  requests: SupportRequestItem[];
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState<SupportRequestItem | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const [newStatus, setNewStatus] = useState<string>("Resolved");
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [pending, setPending] = useState(false);

  const filteredRequests =
    selectedFilter === "All"
      ? requests
      : requests.filter((r) => r.status === selectedFilter);

  const openUpdateModal = (item: SupportRequestItem) => {
    setSelectedItem(item);
    setNewStatus(item.status === "Pending" ? "Resolved" : item.status);
    setResolutionNote(item.resolutionNote ?? "");
    setModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedItem) return;
    setPending(true);
    try {
      await bffFetch(`/api/admin/support-requests/${selectedItem.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
          resolutionNote,
        }),
      });

      toast.success(
        `Đã cập nhật trạng thái yêu cầu thành ${SUPPORT_STATUS_LABELS[newStatus] ?? newStatus}`,
      );
      setModalOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cập nhật thất bại.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {["All", "Pending", "InReview", "Resolved", "Dismissed"].map((tab) => {
          const count =
            tab === "All"
              ? requests.length
              : requests.filter((r) => r.status === tab).length;

          return (
            <Button
              key={tab}
              variant={selectedFilter === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(tab)}
              className="h-8 text-xs"
            >
              {tab === "All"
                ? `Tất cả (${count})`
                : tab === "Pending"
                  ? `Chờ xử lý (${count})`
                  : tab === "InReview"
                    ? `Đang kiểm tra (${count})`
                    : tab === "Resolved"
                      ? `Đã giải quyết (${count})`
                      : `Từ chối (${count})`}
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="border-border/70 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <LifeBuoy className="text-primary size-5" />
            Yêu cầu hỗ trợ & Báo lỗi ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRequests.length > 0 ? (
            <div className="divide-border/60 divide-y">
              {filteredRequests.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {item.contactEmail}
                      </span>
                      <Badge variant="secondary" className="text-[11px]">
                        {SUPPORT_TYPE_LABELS[item.type] ?? item.type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === "Pending" ? (
                        <Badge variant="warning">
                          <Clock className="mr-1 size-3" /> Chờ xử lý
                        </Badge>
                      ) : item.status === "InReview" ? (
                        <Badge
                          variant="secondary"
                          className="bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        >
                          <HelpCircle className="mr-1 size-3" /> Đang kiểm tra
                        </Badge>
                      ) : item.status === "Resolved" ? (
                        <Badge
                          variant="default"
                          className="bg-emerald-600 text-white dark:bg-emerald-500"
                        >
                          <CheckCircle2 className="mr-1 size-3" /> Đã giải quyết
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 size-3" /> Từ chối
                        </Badge>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateModal(item)}
                        disabled={!canUpdate}
                        title={
                          !canUpdate
                            ? "Bạn chưa có quyền SupportRequests.Update"
                            : undefined
                        }
                        className="h-7 text-xs"
                      >
                        Cập nhật
                      </Button>
                    </div>
                  </div>

                  <p className="bg-muted/30 border-border/60 text-foreground rounded-xl border p-3 text-sm leading-relaxed">
                    {item.description}
                  </p>

                  {item.billId ? (
                    <p className="text-muted-foreground text-xs">
                      Mã hóa đơn liên quan:{" "}
                      <code className="text-primary font-mono font-semibold">
                        {item.billId}
                      </code>
                    </p>
                  ) : null}

                  {item.resolutionNote ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                      <strong>Ghi chú xử lý Admin:</strong>{" "}
                      {item.resolutionNote}
                    </div>
                  ) : null}

                  {item.createdAtUtc ? (
                    <span className="text-muted-foreground text-[11px]">
                      Thời gian gửi: {formatDateTime(item.createdAtUtc)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground p-8 text-center text-xs">
              Không có yêu cầu hỗ trợ nào khớp với bộ lọc.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật Trạng thái Yêu cầu</DialogTitle>
            <DialogDescription>
              Yêu cầu hỗ trợ từ <strong>{selectedItem?.contactEmail}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 space-y-4">
            <div className="space-y-2">
              <Label>Trạng thái mới</Label>
              <Select
                value={newStatus}
                onChange={setNewStatus}
                options={[
                  { value: "InReview", label: "Đang kiểm tra (InReview)" },
                  { value: "Resolved", label: "Đã giải quyết (Resolved)" },
                  { value: "Dismissed", label: "Từ chối (Dismissed)" },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-note">Ghi chú đối soát / Kết quả xử lý</Label>
              <Textarea
                id="res-note"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Nhập nội dung đã kiểm tra giao dịch PayOS, đã gạch nợ hoặc phản hồi cho người dùng..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleUpdateStatus}
              isLoading={pending}
              disabled={!canUpdate}
            >
              Lưu kết quả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
