"use client";

import {
  Check,
  CheckSquare,
  LoaderCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Square,
  UserCheck,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import { Select } from "@/components/ui/select";
import type { BillSplitServiceApplicationFeaturesAdminGetMemberPermissionsMemberPermissionsDto as MemberPermissionsDto } from "@/generated/api/models";
import { getRoleDisplayName } from "@/lib/auth/permissions";
import { bffFetch } from "@/lib/http/browser-http-client";

export interface SystemPermissionItem {
  permissionId: string;
  code: string;
  name: string;
  description: string;
  groupCode: string;
  groupName: string;
  sortOrder: number;
}

export interface SystemRoleItem {
  roleId: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  defaultPermissionCodes: string[];
}

export interface AdminUserItem {
  memberId: string;
  displayName: string;
  email: string;
  status: string;
  roleId: string;
  role: string;
  createdAtUtc?: string;
}

export function UserManagementView({
  users,
  systemPermissions,
  roles,
  currentMemberId,
  canUpdateRole,
  canReadPermissions,
  canUpdatePermissions,
}: {
  users: AdminUserItem[];
  systemPermissions: SystemPermissionItem[];
  roles: SystemRoleItem[];
  currentMemberId?: string;
  canUpdateRole: boolean;
  canReadPermissions: boolean;
  canUpdatePermissions: boolean;
}) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [targetRoleId, setTargetRoleId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionDetails, setPermissionDetails] =
    useState<MemberPermissionsDto | null>(null);
  const [permissionCache, setPermissionCache] = useState<
    Record<string, MemberPermissionsDto>
  >({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "role" | "permissions" | null
  >(null);

  const allPermissionCodes = useMemo(
    () => systemPermissions.map((permission) => permission.code),
    [systemPermissions],
  );
  const hasPermissionCatalog = allPermissionCodes.length > 0;

  const permissionGroups = useMemo(() => {
    const grouped = new Map<
      string,
      {
        groupCode: string;
        groupName: string;
        permissions: SystemPermissionItem[];
      }
    >();
    for (const permission of systemPermissions) {
      const current = grouped.get(permission.groupCode);
      grouped.set(permission.groupCode, {
        groupCode: permission.groupCode,
        groupName: permission.groupName,
        permissions: [...(current?.permissions ?? []), permission],
      });
    }

    return [...grouped.values()]
      .map((group) => ({
        ...group,
        permissions: [...group.permissions].sort(
          (left, right) => left.sortOrder - right.sortOrder,
        ),
      }))
      .sort(
        (left, right) =>
          (left.permissions[0]?.sortOrder ?? 0) -
          (right.permissions[0]?.sortOrder ?? 0),
      );
  }, [systemPermissions]);

  const openRoleModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setTargetRoleId(user.roleId);
    setRoleModalOpen(true);
  };

  const loadPermissionDetails = async (user: AdminUserItem) => {
    setPermissionsLoading(true);
    setPermissionsError(null);
    setPermissionDetails(null);
    setSelectedPermissions([]);

    try {
      const details = await bffFetch<MemberPermissionsDto>(
        `/api/admin/users/${user.memberId}/permissions`,
      );
      setPermissionDetails(details);
      setPermissionCache((current) => ({
        ...current,
        [user.memberId]: details,
      }));
      const availableCodes = new Set(allPermissionCodes);
      setSelectedPermissions(
        (details.effectivePermissionCodes ?? []).filter(
          (code): code is string => Boolean(code) && availableCodes.has(code),
        ),
      );
    } catch (error) {
      setPermissionsError(
        error instanceof Error
          ? error.message
          : "Không thể tải quyền hiện tại của thành viên.",
      );
    } finally {
      setPermissionsLoading(false);
    }
  };

  const openPermModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setPermModalOpen(true);
    void loadPermissionDetails(user);
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !targetRoleId || !canUpdateRole) return;
    setPendingAction("role");
    try {
      const details = await bffFetch<MemberPermissionsDto>(
        `/api/admin/users/${selectedUser.memberId}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ roleId: targetRoleId }),
        },
      );
      setPermissionCache((current) => ({
        ...current,
        [selectedUser.memberId]: details,
      }));
      setPermissionDetails(details);
      const selectedRole = roles.find((role) => role.roleId === targetRoleId);
      toast.success(
        `Đã đổi vai trò thành viên thành ${selectedRole?.name ?? "vai trò mới"}`,
      );
      setRoleModalOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Đổi vai trò thất bại.",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleSavePermissions = async () => {
    if (
      !selectedUser ||
      permissionsLoading ||
      permissionsError ||
      !hasPermissionCatalog ||
      !canUpdatePermissions
    ) {
      return;
    }
    setPendingAction("permissions");
    try {
      const details = await bffFetch<MemberPermissionsDto>(
        `/api/admin/users/${selectedUser.memberId}/permissions`,
        {
          method: "PATCH",
          body: JSON.stringify({
            effectivePermissionCodes: selectedPermissions,
          }),
        },
      );
      setPermissionCache((current) => ({
        ...current,
        [selectedUser.memberId]: details,
      }));
      setPermissionDetails(details);
      setSelectedPermissions(
        details.effectivePermissionCodes?.filter(Boolean) ?? [],
      );
      toast.success("Đã cập nhật danh sách quyền hiệu lực");
      setPermModalOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cập nhật quyền thất bại.",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const togglePermission = (code: string) => {
    setSelectedPermissions((current) =>
      current.includes(code)
        ? current.filter((permission) => permission !== code)
        : [...current, code],
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-border/70 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <ShieldCheck className="text-primary size-5" />
            Danh sách Thành viên & Phân quyền ({users.length} người)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-border/60 divide-y">
            {users.map((user) => {
              const cachedPermissions = permissionCache[user.memberId];
              const overrideCount = cachedPermissions
                ? (cachedPermissions.grantedPermissionCodes?.length ?? 0) +
                  (cachedPermissions.deniedPermissionCodes?.length ?? 0)
                : undefined;
              const isCurrentUser = user.memberId === currentMemberId;

              return (
                <div
                  key={user.memberId}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      {user.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-semibold">
                          {user.displayName}
                        </h4>
                        <Badge variant="secondary">
                          <Shield className="mr-1 size-3" /> {user.role}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {typeof overrideCount === "number" ? (
                      <Badge
                        variant="secondary"
                        className="border-primary/30 text-primary"
                      >
                        {overrideCount > 0
                          ? `${overrideCount} quyền ghi đè`
                          : "Theo quyền mặc định"}
                      </Badge>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRoleModal(user)}
                      disabled={
                        isCurrentUser || !canUpdateRole || !roles.length
                      }
                      title={
                        isCurrentUser
                          ? "Bạn không thể đổi vai trò của chính mình."
                          : !canUpdateRole
                            ? "Bạn chưa có quyền Users.UpdateRole"
                            : !roles.length
                              ? "Bạn chưa có quyền Roles.Read"
                              : undefined
                      }
                      className="h-8 gap-1.5 text-xs"
                    >
                      <UserCheck className="size-3.5" /> Đổi vai trò
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPermModal(user)}
                      disabled={
                        isCurrentUser ||
                        !canReadPermissions ||
                        !hasPermissionCatalog
                      }
                      title={
                        isCurrentUser
                          ? "Bạn không thể sửa quyền của chính mình."
                          : !canReadPermissions
                            ? "Bạn chưa có quyền Users.ReadPermissions"
                            : !hasPermissionCatalog
                              ? "Bạn chưa có quyền Permissions.Read"
                              : undefined
                      }
                      className="h-8 gap-1.5 text-xs"
                    >
                      <Wrench className="size-3.5" /> Phân quyền chi tiết
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thay đổi Vai trò Hệ thống</DialogTitle>
            <DialogDescription>
              Chọn vai trò được hệ thống công bố cho thành viên{" "}
              <strong>{selectedUser?.displayName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-3">
            <Select
              value={targetRoleId}
              onChange={setTargetRoleId}
              options={roles.map((role) => ({
                value: role.roleId,
                label: role.name,
              }))}
              placeholder="Chọn vai trò"
              disabled={pendingAction === "role"}
            />

            {roles.find((role) => role.roleId === targetRoleId) ? (
              <div className="border-border/70 bg-muted/30 rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <Shield className="text-primary mt-0.5 size-5 shrink-0" />
                  <div>
                    <strong className="block text-sm font-semibold">
                      {roles.find((role) => role.roleId === targetRoleId)?.name}
                    </strong>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {roles.find((role) => role.roleId === targetRoleId)
                        ?.description || "Vai trò do hệ thống quản lý."}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {targetRoleId !== selectedUser?.roleId ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3 text-xs leading-5 text-amber-800 dark:text-amber-300">
                Đổi vai trò sẽ xóa toàn bộ quyền cấp thêm hoặc thu hồi riêng của
                người dùng này. Bộ quyền mới sẽ do hệ thống trả về sau khi lưu.
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModalOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={!targetRoleId || targetRoleId === selectedUser?.roleId}
              isLoading={pendingAction === "role"}
            >
              Lưu vai trò
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permModalOpen} onOpenChange={setPermModalOpen}>
        <DialogContent
          className="inset-x-2 bottom-2 w-auto sm:w-[calc(100vw-1.5rem)] sm:max-w-[1080px]"
          panelClassName="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] overflow-hidden rounded-[1.25rem] sm:h-[min(92dvh,820px)] sm:max-h-[min(92dvh,820px)] sm:rounded-[1.35rem]"
          bodyClassName="flex h-full min-h-0 flex-col p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 lg:p-6"
        >
          <DialogHeader className="border-border/60 shrink-0 border-b pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <DialogTitle className="flex items-center gap-2 text-lg font-bold sm:text-xl">
                  <Wrench className="text-primary size-5 shrink-0" />
                  Phân quyền Chi tiết (Custom Privileges)
                </DialogTitle>
                <DialogDescription className="mt-1 max-w-3xl text-xs leading-5 sm:text-sm sm:leading-6">
                  Cấp quyền hạn chi tiết theo từng nhóm chức năng cho{" "}
                  <strong>{selectedUser?.displayName}</strong> (
                  {selectedUser?.email}
                  ).
                </DialogDescription>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 pr-8 lg:justify-end lg:pr-0">
                <Badge
                  variant="secondary"
                  className="px-2.5 py-1 text-[11px] font-semibold sm:text-xs"
                >
                  Đã chọn: {selectedPermissions.length} /{" "}
                  {allPermissionCodes.length}
                </Badge>
                {permissionDetails ? (
                  <Badge
                    variant="secondary"
                    className="px-2.5 py-1 text-[11px] font-semibold sm:text-xs"
                  >
                    Hiệu lực:{" "}
                    {permissionDetails.effectivePermissionCodes?.length ?? 0}
                  </Badge>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedPermissions([...allPermissionCodes])
                  }
                  disabled={
                    permissionsLoading ||
                    Boolean(permissionsError) ||
                    !hasPermissionCatalog ||
                    !canUpdatePermissions
                  }
                  className="h-8 gap-1.5 px-2.5 text-xs"
                >
                  <CheckSquare className="size-3.5" /> Chọn tất cả
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPermissions([])}
                  disabled={
                    permissionsLoading ||
                    Boolean(permissionsError) ||
                    !hasPermissionCatalog ||
                    !canUpdatePermissions
                  }
                  className="text-muted-foreground h-8 gap-1.5 px-2.5 text-xs"
                >
                  <Square className="size-3.5" /> Bỏ chọn
                </Button>
              </div>
            </div>

            {permissionDetails?.role ? (
              <div className="border-primary/15 bg-primary/[0.045] text-muted-foreground mt-3 rounded-xl border px-3 py-2 text-xs leading-5">
                Vai trò hiện tại:{" "}
                <strong>
                  {getRoleDisplayName(
                    permissionDetails.role.code,
                    permissionDetails.role.name,
                  )}
                </strong>
                . Ô chọn thể hiện quyền hiệu lực do hệ thống tính từ quyền mặc
                định, quyền cấp thêm và quyền thu hồi.
              </div>
            ) : null}
          </DialogHeader>

          <div className="splitly-scrollbar -mr-1 min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 pr-2 sm:py-5 sm:pr-3">
            {permissionsLoading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                <LoaderCircle className="text-primary size-7 animate-spin" />
                <div>
                  <p className="text-sm font-semibold">
                    Đang tải quyền hiện tại
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Lấy quyền mặc định, quyền cấp thêm, quyền thu hồi và quyền
                    hiệu lực trực tiếp từ hệ thống.
                  </p>
                </div>
              </div>
            ) : permissionsError ? (
              <div className="border-destructive/30 bg-destructive/[0.035] flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center">
                <ShieldAlert className="text-destructive size-7" />
                <div>
                  <p className="text-sm font-semibold">Không tải được quyền</p>
                  <p className="text-muted-foreground mt-1 max-w-lg text-xs leading-5">
                    {permissionsError}
                  </p>
                </div>
                {selectedUser ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void loadPermissionDetails(selectedUser)}
                  >
                    Thử lại
                  </Button>
                ) : null}
              </div>
            ) : !hasPermissionCatalog ? (
              <div className="border-border bg-muted/20 flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center">
                <ShieldAlert className="text-muted-foreground size-7" />
                <div>
                  <p className="text-sm font-semibold">
                    Chưa có danh mục quyền
                  </p>
                  <p className="text-muted-foreground mt-1 max-w-lg text-xs leading-5">
                    Hệ thống chưa trả về danh sách quyền. Không thể lưu phân
                    quyền để tránh vô tình thay đổi quyền hiện tại.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 sm:space-y-6">
                {permissionGroups.map((group) => {
                  const selectedInGroup = group.permissions.filter(
                    (permission) =>
                      selectedPermissions.includes(permission.code),
                  ).length;

                  return (
                    <section key={group.groupCode} className="space-y-3">
                      <div className="border-border/50 flex items-start justify-between gap-3 border-b pb-2.5 sm:items-center">
                        <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
                          <div className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
                            <ShieldCheck className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-foreground text-sm font-bold">
                              {group.groupName}
                            </h3>
                            <p className="text-muted-foreground mt-0.5 text-[11px] leading-4 sm:mt-0 sm:text-xs">
                              {group.groupCode}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px]"
                        >
                          {selectedInGroup}/{group.permissions.length} chọn
                        </Badge>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                        {group.permissions.map((permission) => {
                          const isChecked = selectedPermissions.includes(
                            permission.code,
                          );
                          const isRoleDefault =
                            permissionDetails?.rolePermissionCodes?.includes(
                              permission.code,
                            ) ?? false;
                          const isGranted =
                            permissionDetails?.grantedPermissionCodes?.includes(
                              permission.code,
                            ) ?? false;
                          const isDenied =
                            permissionDetails?.deniedPermissionCodes?.includes(
                              permission.code,
                            ) ?? false;

                          return (
                            <label
                              key={permission.code}
                              className={`group flex min-h-[92px] cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-[border-color,background-color,box-shadow,transform] duration-150 active:scale-[0.99] ${
                                isChecked
                                  ? "border-primary/70 bg-primary/[0.055] ring-primary/15 shadow-sm ring-2"
                                  : "border-border/70 bg-card hover:border-primary/35 hover:bg-muted/35"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={!canUpdatePermissions}
                                onChange={() =>
                                  togglePermission(permission.code)
                                }
                                className="accent-primary mt-0.5 size-4 shrink-0 cursor-pointer"
                              />
                              <div className="min-w-0 flex-1">
                                <code className="text-primary block truncate font-mono text-xs font-bold">
                                  {permission.code}
                                </code>
                                <p className="text-muted-foreground mt-1.5 text-xs leading-5">
                                  {permission.description || permission.name}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {isRoleDefault && !isDenied ? (
                                    <Badge variant="secondary">
                                      Mặc định theo role
                                    </Badge>
                                  ) : null}
                                  {isGranted ? (
                                    <Badge variant="success">Cấp thêm</Badge>
                                  ) : null}
                                  {isDenied ? (
                                    <Badge variant="warning">Đã thu hồi</Badge>
                                  ) : null}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="border-border/60 mt-0 shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setPermModalOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={
                permissionsLoading ||
                Boolean(permissionsError) ||
                !hasPermissionCatalog ||
                !canUpdatePermissions
              }
              title={
                !canUpdatePermissions
                  ? "Bạn chưa có quyền Users.UpdatePermissions"
                  : undefined
              }
              isLoading={pendingAction === "permissions"}
              className="gap-2"
            >
              <Check className="size-4" /> Lưu phân quyền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
