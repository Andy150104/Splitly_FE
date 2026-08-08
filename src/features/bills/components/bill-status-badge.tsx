import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  Draft: "Bản nháp",
  Pending: "Chờ thanh toán",
  Published: "Đã công bố",
  PartiallyPaid: "Đã trả một phần",
  Paid: "Đã thanh toán",
  Overdue: "Quá hạn",
  Cancelled: "Đã hủy",
  Unpaid: "Chưa trả",
};

export function BillStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? "Unknown";
  const variant = value === "Paid" ? "success" : value === "Overdue" || value === "Cancelled" ? "destructive" : value === "Draft" ? "secondary" : value === "PartiallyPaid" ? "warning" : "default";
  return <Badge variant={variant}>{labels[value] ?? value}</Badge>;
}
