import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { SupportRequestManagementView } from "@/features/admin/components/support-request-management-view";
import { adminApi } from "@/lib/api/server/admin.api";
import { toResult } from "@/lib/async-result";
import { SYSTEM_PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server-permissions";

export const metadata = { title: "Quản lý Yêu cầu Hỗ trợ & Báo lỗi" };

export default async function AdminSupportRequestsPage() {
  const permissions = await requirePermission(
    SYSTEM_PERMISSIONS.SUPPORT_REQUESTS_READ,
  );
  const canUpdate = hasPermission(
    permissions,
    SYSTEM_PERMISSIONS.SUPPORT_REQUESTS_UPDATE,
  );

  const loaded = await toResult(
    adminApi.getSupportRequests({ page: 1, pageSize: 100 }),
  );

  if ("error" in loaded) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quản lý Yêu cầu Hỗ trợ" />
        <ErrorState
          message={
            loaded.error instanceof Error ? loaded.error.message : undefined
          }
        />
      </div>
    );
  }

  const requests = (loaded.data.items ?? []).map((r) => ({
    id: r.id ?? "",
    contactEmail: r.contactEmail ?? "Khách hàng",
    type: r.type ?? "PaymentIssue",
    billId: r.billId ?? undefined,
    description: r.description ?? "",
    status: r.status ?? "Pending",
    resolutionNote: r.resolutionNote ?? undefined,
    createdAtUtc: r.createdAtUtc,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Yêu cầu Hỗ trợ & Báo lỗi"
        description="Kiểm tra đối soát các báo lỗi thanh toán, sự cố giải ngân Payout và cập nhật trạng thái xử lý."
      />

      <SupportRequestManagementView requests={requests} canUpdate={canUpdate} />
    </div>
  );
}
