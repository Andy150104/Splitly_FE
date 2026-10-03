// Generated from the live Swagger contract. See scripts/generate-api-types.mjs.

export interface LoginSession {
  displayName: string | null
  email: string | null
  avatarUrl: string | null
  sessionId: string
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAtUtc: string
  refreshTokenExpiresAtUtc: string
}

export interface Bill {
  billId: string
  title: string | null
  description: string | null
  totalAmount: number
  currency: string | null
  billDate: string | null
  dueDate: string | null
  status: string | null
  isOwner: boolean
  collectedAmount: number
  remainingAmount: number
  paidMemberCount: number
  unpaidMemberCount: number
  overdueMemberCount: number
  completionPercentage: number
  paymentDestination: GetBillGetBillHandlerPaymentDestinationItem
  members: Array<BillMember> | null
}

export interface GetBillGetBillHandlerPaymentDestinationItem {
  bankBin: string | null
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
  paymentAccountId: string | null
}

export interface BillMember {
  memberId: string
  name: string | null
  email: string | null
  assignedAmount: number
  paidAmount: number
  remainingAmount: number
  status: string | null
  paidAtUtc: string | null
  reminderCount: number
  paymentQrImageUrl: string | null
  paymentUrl: string | null
  transferContent: string | null
  payments: Array<GetBillGetBillHandlerPaymentItem> | null
}

export interface GetBillGetBillHandlerPaymentItem {
  paymentId: string
  amount: number
  method: string | null
  paidAtUtc: string
  note: string | null
}

export interface BillItem {
  billId: string
  title: string | null
  totalAmount: number
  currency: string | null
  status: string | null
  dueDate: string | null
  assignedOrCollectedAmount: number | null
  remainingAmount: number | null
}

export interface Group {
  groupId: string
  name: string | null
  description: string | null
  status: string | null
  isOwner: boolean
  members: Array<GetGroupGetGroupHandlerMemberItem> | null
  bills: Array<GetGroupGetGroupHandlerBillItem> | null
}

export interface GetGroupGetGroupHandlerMemberItem {
  memberId: string
  name: string | null
  email: string | null
  role: string | null
  status: string | null
}

export interface GetGroupGetGroupHandlerBillItem {
  billId: string
  title: string | null
  totalAmount: number
  currency: string | null
  status: string | null
}

export interface GroupItem {
  groupId: string
  name: string | null
  role: string | null
  memberCount: number
  billCount: number
  status: string | null
  updatedAtUtc: string
}

export interface PayoutAccount {
  id: string
  bankBin: string | null
  bankCode: string | null
  bankName: string | null
  accountNumberMasked: string | null
  accountHolderName: string | null
  isDefault: boolean
  status: string | null
}

export interface Bank {
  id: number
  name: string | null
  code: string | null
  bin: string | null
  shortName: string | null
  logo: string | null
  transferSupported: boolean
  lookupSupported: boolean
}

export interface Permissions {
  memberId: string
  fullName: string | null
  email: string | null
  role: AdminGetMemberPermissionsMemberRoleDto
  rolePermissionCodes: Array<string> | null
  grantedPermissionCodes: Array<string> | null
  deniedPermissionCodes: Array<string> | null
  effectivePermissionCodes: Array<string> | null
}

export interface AdminGetMemberPermissionsMemberRoleDto {
  roleId: string
  code: string | null
  name: string | null
}

export interface PaymentOrder {
  paymentOrderId: string
  billId: string
  billSplitId: string
  providerOrderId: string | null
  amount: number
  currency: string | null
  status: string | null
  paymentUrl: string | null
  qrImageUrl: string | null
  collectedAtUtc: string | null
}

export interface AccountLookup {
  bankBin: string | null
  bankCode: string | null
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
  verified: boolean
}

export interface AdminUser {
  memberId: string
  name: string | null
  email: string | null
  status: string | null
  roleId: string
  role: string | null
  createdAtUtc: string
  lastLoginAtUtc: string | null
}

export interface PermissionDefinition {
  permissionId: string
  code: string | null
  name: string | null
  description: string | null
  groupCode: string | null
  groupName: string | null
  sortOrder: number
}

export interface RoleDefinition {
  roleId: string
  code: string | null
  name: string | null
  description: string | null
  isSystem: boolean
  defaultPermissionCodes: Array<string> | null
}

export interface SupportRequest {
  id: string
  memberId: string | null
  memberName: string | null
  contactEmail: string | null
  type: string | null
  billId: string | null
  billTitle: string | null
  paymentOrderId: string | null
  description: string | null
  status: string | null
  resolutionNote: string | null
  resolvedByMemberId: string | null
  resolvedByMemberName: string | null
  createdAtUtc: string
  resolvedAtUtc: string | null
}

export interface PageResult<T> {
  items: T[] | null
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  pageNumber: number
  pageSize: number
}
