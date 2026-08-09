import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { UserManagementView } from "@/features/admin/components/user-management-view";
import { adminApi } from "@/lib/api/server/admin.api";
import { toResult } from "@/lib/async-result";

export const metadata = { title: "Quản lý người dùng & Phân quyền" };

export default async function AdminUsersPage() {
  const loaded = await toResult(
    adminApi.getUsers({ pageNumber: 1, pageSize: 100 }),
  );

  if ("error" in loaded) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quản lý người dùng" />
        <ErrorState
          message={
            loaded.error instanceof Error ? loaded.error.message : undefined
          }
        />
      </div>
    );
  }

  const users = (loaded.data.items ?? []).map((u) => ({
    memberId: u.memberId ?? "",
    displayName: u.name ?? u.email?.split("@")[0] ?? "Thành viên",
    email: u.email ?? "",
    role: u.role ?? "User",
    customPermissions: [],
    createdAtUtc: u.createdAtUtc,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng & Phân quyền"
        description="Quản lý vai trò Administrator / User và phân quyền chi tiết (Custom Privileges) cho từng tài khoản."
      />

      <UserManagementView users={users} />
    </div>
  );
}
