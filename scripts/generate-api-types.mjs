import fs from 'node:fs'

const source = process.argv[2]
if (!source) throw new Error('Usage: node scripts/generate-api-types.mjs <swagger.json>')
const spec = JSON.parse(fs.readFileSync(source, 'utf8'))
const aliases = {
  LoginSession: 'Authentication.GoogleLogin.GoogleLoginHandler.Response',
  Bill: 'Bills.GetBill.GetBillHandler.Response',
  BillMember: 'Bills.GetBill.GetBillHandler.MemberItem',
  BillItem: 'Bills.ListBills.ListBillsHandler.Item',
  Group: 'Groups.GetGroup.GetGroupHandler.Response',
  GroupItem: 'Groups.ListGroups.ListGroupsHandler.Item',
  PayoutAccount: 'PayoutAccounts.ListPayoutAccounts.ListPayoutAccountsHandler.Item',
  Bank: 'Models.VietQrBankInfo',
  Permissions: 'Admin.GetMemberPermissions.MemberPermissionsDto',
  PaymentOrder: 'PaymentOrders.GetPaymentOrder.GetPaymentOrderHandler.Response',
  AccountLookup: 'VietQr.LookupAccount.LookupVietQrAccountHandler.Response',
  AdminUser: 'Administration.ListUsers.ListUsersHandler.Item',
  PermissionDefinition: 'Admin.ListPermissions.PermissionDto',
  RoleDefinition: 'Admin.ListRoles.RoleDto',
  SupportRequest: 'Admin.GetSupportRequests.SupportRequestDto',
}
const schemas = spec.components.schemas
const keys = Object.keys(schemas)
const names = new Map()
for (const [alias, suffix] of Object.entries(aliases)) {
  const key = keys.find((k) => !k.includes('`') && k.endsWith(suffix))
  if (!key) throw new Error(`Missing ${suffix}`)
  names.set(key, alias)
}
const visited = new Map()
function type(schema) {
  let value
  if (schema.$ref) {
    const key = schema.$ref.replace('#/components/schemas/', '')
    if (!names.has(key)) names.set(key, key.split('.').slice(-3).join(''))
    visit(key)
    value = names.get(key)
  } else if (schema.enum) value = schema.enum.map((v) => JSON.stringify(v)).join(' | ')
  else if (schema.type === 'array') value = `Array<${type(schema.items)}>`
  else if (schema.type === 'object') value = 'Record<string, unknown>'
  else
    value =
      { integer: 'number', number: 'number', boolean: 'boolean', string: 'string' }[schema.type] ||
      'unknown'
  return value + (schema.nullable ? ' | null' : '')
}
function visit(key) {
  if (visited.has(key)) return
  visited.set(key, '')
  const schema = schemas[key]
  const name = names.get(key)
  visited.set(
    key,
    schema.properties
      ? `export interface ${name} {\n${Object.entries(schema.properties)
          .map(([k, v]) => `  ${k}: ${type(v)}`)
          .join('\n')}\n}`
      : `export type ${name} = ${type(schema)}`,
  )
}
for (const key of [...names.keys()]) visit(key)
fs.mkdirSync('src/lib/api', { recursive: true })
fs.writeFileSync(
  'src/lib/api/types.ts',
  '// Generated from the live Swagger contract. See scripts/generate-api-types.mjs.\n\n' +
    [...visited.values()].join('\n\n') +
    '\n\nexport interface PageResult<T> { items: T[] | null; totalCount: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean; pageNumber: number; pageSize: number }\n',
)
