import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { UserManagementView } from "@/features/admin/components/user-management-view";
import { adminApi } from "@/lib/api/server/admin.api";
import { toResult } from "@/lib/async-result";
import {
  SYSTEM_PERMISSIONS,
  getPermissionPresentation,
  getRoleDisplayName,
  hasPermission,
} from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server-permissions";

export const metadata = { title: "Quản lý người dùng & Phân quyền" };

export default async function AdminUsersPage() {
  const currentPermissions = await requirePermission(
    SYSTEM_PERMISSIONS.USERS_READ,
  );
  const canReadPermissionCatalog = hasPermission(
    currentPermissions,
    SYSTEM_PERMISSIONS.PERMISSIONS_READ,
  );
  const canReadRoles = hasPermission(
    currentPermissions,
    SYSTEM_PERMISSIONS.ROLES_READ,
  );

  const loaded = await toResult(
    Promise.all([
      adminApi.getUsers({ pageNumber: 1, pageSize: 100 }),
      canReadPermissionCatalog
        ? adminApi.getPermissions()
        : Promise.resolve([]),
      canReadRoles ? adminApi.getRoles() : Promise.resolve([]),
    ]),
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

  const [userResult, permissionResult, roleResult] = loaded.data;
  const users = (userResult.items ?? []).map((user) => ({
    memberId: user.memberId ?? "",
    displayName: user.name ?? user.email?.split("@")[0] ?? "Thành viên",
    email: user.email ?? "",
    status: user.status ?? "",
    roleId: user.roleId ?? "",
    role: getRoleDisplayName(user.role, user.role),
    createdAtUtc: user.createdAtUtc,
  }));
  const systemPermissions = (permissionResult ?? [])
    .filter((permission) => Boolean(permission.code))
    .map((permission) => {
      const code = permission.code ?? "";
      const presentation = getPermissionPresentation(code);

      return {
        permissionId: permission.permissionId ?? "",
        code,
        name:
          presentation?.name ??
          permission.name ??
          permission.code ??
          "Quyền hệ thống",
        description: presentation?.description ?? permission.description ?? "",
        groupCode: permission.groupCode ?? "Other",
        groupName:
          presentation?.groupName ?? permission.groupName ?? "Quyền khác",
        sortOrder: permission.sortOrder ?? 0,
      };
    })
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const roles = (roleResult ?? [])
    .filter((role) => Boolean(role.roleId))
    .map((role) => ({
      roleId: role.roleId ?? "",
      code: role.code ?? "",
      name: getRoleDisplayName(role.code, role.name),
      description: role.description ?? "",
      isSystem: role.isSystem ?? false,
      defaultPermissionCodes:
        role.defaultPermissionCodes?.filter(Boolean) ?? [],
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng & Phân quyền"
        description="Quản lý vai trò và quyền hiệu lực của từng tài khoản theo danh mục do hệ thống công bố."
      />

      <UserManagementView
        users={users}
        systemPermissions={systemPermissions}
        roles={roles}
        currentMemberId={currentPermissions.memberId}
        canUpdateRole={hasPermission(
          currentPermissions,
          SYSTEM_PERMISSIONS.USERS_UPDATE_ROLE,
        )}
        canReadPermissions={hasPermission(
          currentPermissions,
          SYSTEM_PERMISSIONS.USERS_READ_PERMISSIONS,
        )}
        canUpdatePermissions={hasPermission(
          currentPermissions,
          SYSTEM_PERMISSIONS.USERS_UPDATE_PERMISSIONS,
        )}
      />
    </div>
  );
}
