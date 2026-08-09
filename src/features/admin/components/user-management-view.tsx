"use client";

import {
  Check,
  CheckSquare,
  CreditCard,
  FileText,
  LifeBuoy,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Square,
  UserCheck,
  UsersRound,
  Wrench,
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

export interface SystemPermissionItem {
  code: string;
  label: string;
  category: string;
}

const PERMISSION_GROUPS: {
  category: string;
  icon: typeof FileText;
  description: string;
  permissions: SystemPermissionItem[];
}[] = [
  {
    category: "Hóa đơn (Bills)",
    icon: FileText,
    description: "Quyền quản lý, tạo lập và hủy bỏ hóa đơn chia tiền.",
    permissions: [
      { code: "Bills.Read", label: "Xem danh sách và chi tiết hóa đơn", category: "Bills" },
      { code: "Bills.Write", label: "Tạo mới và chỉnh sửa thông tin hóa đơn", category: "Bills" },
      { code: "Bills.Delete", label: "Hủy bỏ và xóa hoàn toàn hóa đơn", category: "Bills" },
    ],
  },
  {
    category: "Nhóm chi tiêu (Groups)",
    icon: UsersRound,
    description: "Quyền tạo và quản lý thành viên các nhóm dùng chung.",
    permissions: [
      { code: "Groups.Manage", label: "Tạo nhóm, mời và quản lý thành viên nhóm", category: "Groups" },
    ],
  },
  {
    category: "Thanh toán & Payout",
    icon: CreditCard,
    description: "Quyền ghi nhận thanh toán thủ công và duyệt giải ngân tự động.",
    permissions: [
      { code: "Payments.Record", label: "Ghi nhận thanh toán tiền mặt / thủ công", category: "Payments" },
      { code: "Payouts.Review", label: "Duyệt và xử lý lệnh giải ngân Payout tự động", category: "Payouts" },
    ],
  },
  {
    category: "Hỗ trợ khách hàng (Support)",
    icon: LifeBuoy,
    description: "Quyền tiếp nhận và đối soát báo lỗi sự cố thanh toán.",
    permissions: [
      { code: "SupportRequests.Manage", label: "Xử lý, đối soát và cập nhật trạng thái báo lỗi", category: "Support" },
    ],
  },
  {
    category: "Quản trị & Hệ thống (Administration)",
    icon: Settings,
    description: "Quyền quản trị tài khoản người dùng và cấu hình hệ thống.",
    permissions: [
      { code: "Users.Manage", label: "Quản lý vai trò và phân quyền thành viên", category: "Admin" },
      { code: "System.Configure", label: "Cấu hình tham số hệ thống và Template Email", category: "System" },
    ],
  },
];

const ALL_PERMISSION_CODES = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.code),
);

export interface AdminUserItem {
  memberId: string;
  displayName: string;
  email: string;
  role: string;
  customPermissions?: string[];
  createdAtUtc?: string;
}

export function UserManagementView({ users }: { users: AdminUserItem[] }) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permModalOpen, setPermModalOpen] = useState(false);

  const [targetRole, setTargetRole] = useState<string>("User");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const openRoleModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setTargetRole(user.role || "User");
    setRoleModalOpen(true);
  };

  const openPermModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setSelectedPermissions(user.customPermissions ?? []);
    setPermModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      if (!res.ok) throw new Error("Không thể thay đổi vai trò.");
      toast.success(`Đã đổi vai trò thành viên thành ${targetRole}`);
      setRoleModalOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đổi vai trò thất bại.");
    } finally {
      setPending(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.memberId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: selectedPermissions }),
      });
      if (!res.ok) throw new Error("Không thể cập nhật quyền hạn.");
      toast.success("Đã cập nhật danh sách quyền tùy chỉnh");
      setPermModalOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật quyền thất bại.");
    } finally {
      setPending(false);
    }
  };

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions([...ALL_PERMISSION_CODES]);
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Danh sách Thành viên & Phân quyền ({users.length} người)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {users.map((user) => {
              const isAdmin = user.role === "Administrator";
              const permCount = user.customPermissions?.length ?? 0;

              return (
                <div
                  key={user.memberId}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-sm text-primary">
                      {user.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate font-semibold text-sm">
                          {user.displayName}
                        </h4>
                        {isAdmin ? (
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            <Shield className="mr-1 size-3" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {permCount > 0 ? (
                      <Badge variant="secondary" className="border-primary/30 text-primary">
                        {permCount} quyền tùy chỉnh
                      </Badge>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRoleModal(user)}
                      className="h-8 text-xs gap-1.5"
                    >
                      <UserCheck className="size-3.5" /> Đổi vai trò
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPermModal(user)}
                      className="h-8 text-xs gap-1.5"
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

      {/* Role Change Modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thay đổi Vai trò Hệ thống</DialogTitle>
            <DialogDescription>
              Cập nhật vai trò Admin hoặc User cho thành viên <strong>{selectedUser?.displayName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-3">
            <label
              onClick={() => setTargetRole("Administrator")}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                targetRole === "Administrator"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-border/80 hover:border-primary/40"
              }`}
            >
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <strong className="block text-sm font-semibold">Administrator (Quản trị viên)</strong>
                <span className="text-muted-foreground text-xs">
                  Toàn quyền quản trị hệ thống, quản lý người dùng, duyệt payout và báo lỗi support.
                </span>
              </div>
            </label>

            <label
              onClick={() => setTargetRole("User")}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                targetRole === "User"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-border/80 hover:border-primary/40"
              }`}
            >
              <Shield className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div>
                <strong className="block text-sm font-semibold">User (Người dùng thường)</strong>
                <span className="text-muted-foreground text-xs">
                  Tạo và chia hóa đơn, tham gia nhóm và thực hiện thanh toán cá nhân.
                </span>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveRole} isLoading={pending}>
              Lưu vai trò
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spacious Category-Grouped Custom Permissions Modal */}
      <Dialog open={permModalOpen} onOpenChange={setPermModalOpen}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-6 sm:p-8">
          <DialogHeader className="border-b border-border/60 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Wrench className="size-5 text-primary" />
                  Phân quyền Chi tiết (Custom Privileges)
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm">
                  Cấp quyền hạn chi tiết theo từng nhóm chức năng cho <strong>{selectedUser?.displayName}</strong> ({selectedUser?.email}).
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
                  Đã chọn: {selectedPermissions.length} / {ALL_PERMISSION_CODES.length} quyền
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8 text-xs gap-1"
                >
                  <CheckSquare className="size-3.5" /> Chọn tất cả
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="h-8 text-xs gap-1 text-muted-foreground"
                >
                  <Square className="size-3.5" /> Bỏ chọn
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Category Grouped Permission List */}
          <div className="my-4 flex-1 overflow-y-auto space-y-6 pr-2">
            {PERMISSION_GROUPS.map((group) => {
              const GroupIcon = group.icon;
              const selectedInGroup = group.permissions.filter((p) =>
                selectedPermissions.includes(p.code),
              ).length;

              return (
                <div key={group.category} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                        <GroupIcon className="size-4" />
                      </div>
                      <h3 className="font-bold text-sm text-foreground">
                        {group.category}
                      </h3>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        — {group.description}
                      </span>
                    </div>

                    <Badge variant="secondary" className="text-[10px]">
                      {selectedInGroup}/{group.permissions.length} chọn
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.permissions.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm.code);
                      return (
                        <label
                          key={perm.code}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all duration-150 ${
                            isChecked
                              ? "border-primary bg-primary/8 ring-2 ring-primary/20 shadow-xs"
                              : "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.code)}
                            className="accent-primary mt-0.5 size-4 rounded cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <code className="font-mono text-xs font-bold text-primary truncate">
                                {perm.code}
                              </code>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              {perm.label}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="border-t border-border/60 pt-4">
            <Button variant="outline" onClick={() => setPermModalOpen(false)}>
              Hủy
            </Button>

            <Button onClick={handleSavePermissions} isLoading={pending} className="gap-2">
              <Check className="size-4" /> Lưu phân quyền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
