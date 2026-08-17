import type { BillSplitServiceApplicationFeaturesAdminGetMemberPermissionsMemberPermissionsDto as MemberPermissionsDto } from "@/generated/api/models";

export const SYSTEM_PERMISSIONS = {
  BILLS_READ: "Bills.Read",
  BILLS_CREATE: "Bills.Create",
  BILLS_UPDATE: "Bills.Update",
  BILLS_DELETE: "Bills.Delete",
  BILLS_MANAGE_MEMBERS: "Bills.ManageMembers",
  BILLS_CALCULATE: "Bills.Calculate",
  BILLS_CONFIGURE_PAYMENT: "Bills.ConfigurePayment",
  BILLS_PUBLISH: "Bills.Publish",
  BILLS_SEND_REMINDERS: "Bills.SendReminders",
  GROUPS_READ: "Groups.Read",
  GROUPS_CREATE: "Groups.Create",
  GROUPS_DELETE: "Groups.Delete",
  GROUPS_MANAGE_MEMBERS: "Groups.ManageMembers",
  PAYMENTS_READ: "Payments.Read",
  PAYMENTS_CREATE: "Payments.Create",
  PAYMENTS_RECORD_MANUAL: "Payments.RecordManual",
  PAYMENT_ACCOUNTS_READ: "PaymentAccounts.Read",
  PAYMENT_ACCOUNTS_UPDATE: "PaymentAccounts.Update",
  PAYOUT_ACCOUNTS_READ: "PayoutAccounts.Read",
  PAYOUT_ACCOUNTS_CREATE: "PayoutAccounts.Create",
  PAYOUT_ACCOUNTS_UPDATE: "PayoutAccounts.Update",
  PAYOUTS_READ: "Payouts.Read",
  PAYOUTS_RETRY: "Payouts.Retry",
  PAYOUTS_RESOLVE: "Payouts.Resolve",
  SUPPORT_REQUESTS_READ: "SupportRequests.Read",
  SUPPORT_REQUESTS_UPDATE: "SupportRequests.Update",
  USERS_READ: "Users.Read",
  USERS_UPDATE_ACCESS: "Users.UpdateAccess",
  USERS_UPDATE_ROLE: "Users.UpdateRole",
  USERS_READ_PERMISSIONS: "Users.ReadPermissions",
  USERS_UPDATE_PERMISSIONS: "Users.UpdatePermissions",
  PERMISSIONS_READ: "Permissions.Read",
  ROLES_READ: "Roles.Read",
  BANKS_READ: "Banks.Read",
  SYSTEM_CONFIGURE: "System.Configure",
} as const;

export type SystemPermission =
  (typeof SYSTEM_PERMISSIONS)[keyof typeof SYSTEM_PERMISSIONS];

interface PermissionPresentation {
  name: string;
  description: string;
  groupName: string;
}

const PERMISSION_PRESENTATIONS: Record<
  SystemPermission,
  PermissionPresentation
> = {
  "Bills.Read": {
    name: "Xem hóa đơn",
    description: "Xem danh sách và thông tin chi tiết của hóa đơn.",
    groupName: "Hóa đơn",
  },
  "Bills.Create": {
    name: "Tạo hóa đơn",
    description: "Tạo hóa đơn mới.",
    groupName: "Hóa đơn",
  },
  "Bills.Update": {
    name: "Cập nhật hóa đơn",
    description: "Chỉnh sửa thông tin của hóa đơn.",
    groupName: "Hóa đơn",
  },
  "Bills.Delete": {
    name: "Xóa hóa đơn",
    description: "Xóa hoặc hủy hóa đơn.",
    groupName: "Hóa đơn",
  },
  "Bills.ManageMembers": {
    name: "Quản lý người tham gia",
    description: "Thêm, xóa và cập nhật người tham gia hóa đơn.",
    groupName: "Hóa đơn",
  },
  "Bills.Calculate": {
    name: "Tính tiền hóa đơn",
    description: "Tính và phân bổ số tiền cho người tham gia.",
    groupName: "Hóa đơn",
  },
  "Bills.ConfigurePayment": {
    name: "Cấu hình thanh toán",
    description: "Thiết lập phương thức và tài khoản nhận thanh toán.",
    groupName: "Hóa đơn",
  },
  "Bills.Publish": {
    name: "Công bố hóa đơn",
    description: "Công bố hóa đơn để bắt đầu theo dõi thanh toán.",
    groupName: "Hóa đơn",
  },
  "Bills.SendReminders": {
    name: "Gửi lời nhắc",
    description: "Gửi email nhắc người tham gia thanh toán.",
    groupName: "Hóa đơn",
  },
  "Groups.Read": {
    name: "Xem nhóm",
    description: "Xem danh sách và thông tin chi tiết của nhóm.",
    groupName: "Nhóm",
  },
  "Groups.Create": {
    name: "Tạo nhóm",
    description: "Tạo nhóm chia sẻ chi phí mới.",
    groupName: "Nhóm",
  },
  "Groups.Delete": {
    name: "Xóa nhóm",
    description: "Đóng hoặc xóa nhóm.",
    groupName: "Nhóm",
  },
  "Groups.ManageMembers": {
    name: "Quản lý thành viên nhóm",
    description: "Thêm hoặc xóa thành viên trong nhóm.",
    groupName: "Nhóm",
  },
  "Payments.Read": {
    name: "Xem thanh toán",
    description: "Xem lịch sử và trạng thái thanh toán.",
    groupName: "Thanh toán",
  },
  "Payments.Create": {
    name: "Tạo thanh toán",
    description: "Tạo yêu cầu thanh toán trực tuyến.",
    groupName: "Thanh toán",
  },
  "Payments.RecordManual": {
    name: "Ghi nhận thanh toán thủ công",
    description: "Ghi nhận khoản thanh toán ngoài hệ thống.",
    groupName: "Thanh toán",
  },
  "PaymentAccounts.Read": {
    name: "Xem tài khoản thanh toán",
    description: "Xem tài khoản dùng để thanh toán.",
    groupName: "Tài khoản thanh toán",
  },
  "PaymentAccounts.Update": {
    name: "Cập nhật tài khoản thanh toán",
    description: "Chỉnh sửa tài khoản dùng để thanh toán.",
    groupName: "Tài khoản thanh toán",
  },
  "PayoutAccounts.Read": {
    name: "Xem tài khoản nhận tiền",
    description: "Xem danh sách tài khoản ngân hàng nhận tiền.",
    groupName: "Tài khoản nhận tiền",
  },
  "PayoutAccounts.Create": {
    name: "Tạo tài khoản nhận tiền",
    description: "Thêm tài khoản ngân hàng nhận tiền mới.",
    groupName: "Tài khoản nhận tiền",
  },
  "PayoutAccounts.Update": {
    name: "Cập nhật tài khoản nhận tiền",
    description: "Chỉnh sửa hoặc đặt tài khoản nhận tiền mặc định.",
    groupName: "Tài khoản nhận tiền",
  },
  "Payouts.Read": {
    name: "Xem lệnh chuyển tiền",
    description: "Xem danh sách và trạng thái lệnh chuyển tiền.",
    groupName: "Chuyển tiền",
  },
  "Payouts.Retry": {
    name: "Thử lại lệnh chuyển tiền",
    description: "Thử thực hiện lại lệnh chuyển tiền bị lỗi.",
    groupName: "Chuyển tiền",
  },
  "Payouts.Resolve": {
    name: "Xử lý lệnh chuyển tiền",
    description: "Xác nhận xử lý thủ công lệnh chuyển tiền.",
    groupName: "Chuyển tiền",
  },
  "SupportRequests.Read": {
    name: "Xem yêu cầu hỗ trợ",
    description: "Xem danh sách và nội dung yêu cầu hỗ trợ.",
    groupName: "Hỗ trợ",
  },
  "SupportRequests.Update": {
    name: "Cập nhật yêu cầu hỗ trợ",
    description: "Cập nhật trạng thái và kết quả xử lý yêu cầu hỗ trợ.",
    groupName: "Hỗ trợ",
  },
  "Users.Read": {
    name: "Xem người dùng",
    description: "Xem danh sách và thông tin người dùng.",
    groupName: "Người dùng",
  },
  "Users.UpdateAccess": {
    name: "Cập nhật trạng thái truy cập",
    description: "Cho phép hoặc khóa quyền truy cập của người dùng.",
    groupName: "Người dùng",
  },
  "Users.UpdateRole": {
    name: "Cập nhật vai trò",
    description: "Thay đổi vai trò của người dùng.",
    groupName: "Người dùng",
  },
  "Users.ReadPermissions": {
    name: "Xem quyền người dùng",
    description: "Xem quyền mặc định, quyền ghi đè và quyền hiệu lực.",
    groupName: "Người dùng",
  },
  "Users.UpdatePermissions": {
    name: "Cập nhật quyền người dùng",
    description: "Cấp thêm hoặc thu hồi quyền của người dùng.",
    groupName: "Người dùng",
  },
  "Permissions.Read": {
    name: "Xem danh mục quyền",
    description: "Xem danh mục quyền do hệ thống công bố.",
    groupName: "Phân quyền",
  },
  "Roles.Read": {
    name: "Xem danh mục vai trò",
    description: "Xem danh sách vai trò và quyền mặc định.",
    groupName: "Phân quyền",
  },
  "Banks.Read": {
    name: "Xem danh sách ngân hàng",
    description: "Xem danh sách ngân hàng được hỗ trợ.",
    groupName: "Ngân hàng",
  },
  "System.Configure": {
    name: "Cấu hình hệ thống",
    description: "Thay đổi các thiết lập cấp hệ thống.",
    groupName: "Hệ thống",
  },
};

export function getPermissionPresentation(
  code: string,
): PermissionPresentation | undefined {
  return PERMISSION_PRESENTATIONS[code as SystemPermission];
}

export function getRoleDisplayName(code?: string | null, name?: string | null) {
  const normalizedCode = code?.trim().toLowerCase();

  if (normalizedCode === "administrator" || normalizedCode === "admin") {
    return "Quản trị viên";
  }
  if (normalizedCode === "user" || normalizedCode === "member") {
    return "Người dùng";
  }

  return name?.trim() || code?.trim() || "Chưa gán vai trò";
}

export interface PermissionState {
  memberId?: string;
  roleId?: string;
  roleCode: string;
  roleName: string;
  rolePermissions: string[];
  grantedPermissions: string[];
  deniedPermissions: string[];
  effectivePermissions: string[];
}

export function normalizePermissionState(
  permissions: MemberPermissionsDto,
): PermissionState {
  const roleCode = permissions.role?.code?.trim() || "";
  const roleName = permissions.role?.name?.trim() || "Chưa gán vai trò";

  return {
    ...(permissions.memberId ? { memberId: permissions.memberId } : {}),
    ...(permissions.role?.roleId ? { roleId: permissions.role.roleId } : {}),
    roleCode,
    roleName,
    rolePermissions: permissions.rolePermissionCodes?.filter(Boolean) ?? [],
    grantedPermissions:
      permissions.grantedPermissionCodes?.filter(Boolean) ?? [],
    deniedPermissions: permissions.deniedPermissionCodes?.filter(Boolean) ?? [],
    effectivePermissions:
      permissions.effectivePermissionCodes?.filter(Boolean) ?? [],
  };
}

export function hasPermission(
  state: Pick<PermissionState, "effectivePermissions">,
  permission: SystemPermission,
) {
  return state.effectivePermissions.includes(permission);
}
