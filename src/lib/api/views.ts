import type {
  AccountLookup,
  Bill,
  PermissionDefinition,
  Permissions,
  RoleDefinition,
} from './types'

// Browser contracts are intentionally smaller than the generated upstream schema.
export type PermissionView = Pick<Permissions, 'effectivePermissionCodes'>
export type AccountLookupView = Pick<AccountLookup, 'accountName' | 'verified'>
export type RoleView = Pick<RoleDefinition, 'roleId' | 'name'>
export type PermissionDefinitionView = Omit<PermissionDefinition, 'permissionId'>
export type BillView = Omit<Bill, 'paymentDestination'> & {
  paymentDestination: Pick<Bill['paymentDestination'], 'bankName' | 'accountName'> | null
}
