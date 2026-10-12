import type { AccountLookup, Bill, AdminUser } from './types'

// Browser contracts are intentionally smaller than the generated upstream schema.
export type AdminReference = { id: string; value: string }
export type AdminPermissionView = { permissions: AdminReference[] }
export type AdminUserView = Omit<AdminUser, 'roleId'> & { roleSelection: AdminReference | null }
export type AccountLookupView = Pick<AccountLookup, 'accountName' | 'verified'>
export type RoleView = AdminReference & { name: string }
export type PermissionDefinitionView = AdminReference & {
  name: string
  description: string | null
  groupName: string
  sortOrder: number
}
export type BillView = Omit<Bill, 'paymentDestination'> & {
  paymentDestination: Pick<Bill['paymentDestination'], 'bankName' | 'accountName'> | null
}
