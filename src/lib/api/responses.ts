// Only import from server code. Never forward upstream envelopes or diagnostic payloads.
import { frontendPermissionCodes } from './capabilities'

type JsonObject = Record<string, unknown>

// Defense in depth for legacy endpoints that do not yet have a dedicated browser DTO.
// These fields are never used for rendering; bank numbers entered by the user still go upstream.
export function withoutPrivateFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutPrivateFields)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          !/^(accessToken|refreshToken|idToken|password|secret|authorization|accountNumber|providerResponse|rawResponse|stackTrace|exception|debug)$/i.test(
            key,
          ),
      )
      .map(([key, item]) => [key, withoutPrivateFields(item)]),
  )
}

function object(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {}
}

function pick(value: unknown, keys: readonly string[]) {
  const source = object(value)
  return Object.fromEntries(keys.filter((key) => key in source).map((key) => [key, source[key]]))
}

function maskAccount(value: unknown) {
  if (typeof value !== 'string') return null
  const digits = value.replace(/\D/g, '')
  return digits.length > 4 || (digits.length === 4 && /[*•xX]/.test(value))
    ? `•••• ${digits.slice(-4)}`
    : '••••'
}

function account(value: unknown) {
  const source = object(value)
  return {
    ...pick(source, [
      'id',
      'bankBin',
      'bankCode',
      'bankName',
      'accountHolderName',
      'isDefault',
      'status',
    ]),
    accountNumberMasked: maskAccount(source.accountNumberMasked ?? source.accountNumber),
  }
}

function page(value: unknown, keys: readonly string[]) {
  const source = object(value)
  return {
    ...pick(source, [
      'totalCount',
      'totalPages',
      'hasNextPage',
      'hasPreviousPage',
      'pageNumber',
      'pageSize',
    ]),
    items: Array.isArray(source.items) ? source.items.map((item) => pick(item, keys)) : null,
  }
}

export function browserData(path: string, value: unknown): unknown {
  if (path === 'auth/send-login-code') return true
  if (path === 'auth/me/permissions') {
    const codes = object(value).effectivePermissionCodes
    return {
      effectivePermissionCodes: Array.isArray(codes)
        ? [
            ...new Set(
              codes.filter((code) => typeof code === 'string' && frontendPermissionCodes.has(code)),
            ),
          ]
        : [],
    }
  }
  // Admin edits must preserve all grants, including backend actions with no frontend screen.
  if (/^admin\/users\/[^/]+\/permissions$/.test(path))
    return pick(value, ['effectivePermissionCodes'])
  if (path === 'admin/users/roles')
    return Array.isArray(value)
      ? value.map((role) => ({
          ...pick(role, ['roleId']),
          name: object(role).name || object(role).code || 'Vai trò',
        }))
      : []
  if (path === 'admin/users/permissions')
    return Array.isArray(value)
      ? value.map((permission) =>
          pick(permission, ['code', 'name', 'description', 'groupCode', 'groupName', 'sortOrder']),
        )
      : []
  if (path === 'admin/users')
    return page(value, ['memberId', 'name', 'email', 'status', 'roleId', 'role'])
  if (/^admin\/users\/[^/]+\/(role|access)$/.test(path)) return true
  if (/^(payout|payment)-accounts(?:\/[^/]+\/default)?$/.test(path))
    return Array.isArray(value)
      ? value.map(account)
      : typeof value === 'boolean'
        ? value
        : account(value)
  if (path === 'vietqr/account-lookup') return pick(value, ['accountName', 'verified'])
  if (path === 'vietqr/banks')
    return Array.isArray(value)
      ? value.map((bank) =>
          pick(bank, [
            'id',
            'name',
            'code',
            'bin',
            'shortName',
            'logo',
            'transferSupported',
            'lookupSupported',
          ]),
        )
      : []
  if (/^bills\/[^/]+$/.test(path)) {
    const bill = object(value)
    const result = pick(bill, [
      'billId',
      'title',
      'description',
      'totalAmount',
      'currency',
      'billDate',
      'dueDate',
      'status',
      'isOwner',
      'collectedAmount',
      'remainingAmount',
      'paidMemberCount',
      'unpaidMemberCount',
      'overdueMemberCount',
      'completionPercentage',
    ])
    if ('paymentDestination' in bill)
      result.paymentDestination =
        bill.paymentDestination == null
          ? null
          : pick(bill.paymentDestination, ['bankName', 'accountName'])
    if ('members' in bill)
      result.members = Array.isArray(bill.members)
        ? bill.members.map((member) => {
            const item = object(member)
            return {
              ...pick(item, [
                'memberId',
                'name',
                'email',
                'assignedAmount',
                'paidAmount',
                'remainingAmount',
                'status',
                'paidAtUtc',
                'reminderCount',
                'paymentQrImageUrl',
                'paymentUrl',
                'transferContent',
              ]),
              payments: Array.isArray(item.payments)
                ? item.payments.map((payment) =>
                    pick(payment, ['paymentId', 'amount', 'method', 'paidAtUtc', 'note']),
                  )
                : null,
            }
          })
        : null
    return result
  }
  return value
}

export function browserError(path: string, status: number) {
  if (status === 401)
    return path === 'auth/verify-login-code'
      ? 'Mã đăng nhập không hợp lệ hoặc đã hết hạn. Kiểm tra mã hoặc yêu cầu mã mới.'
      : 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn chưa có quyền thực hiện thao tác này.'
  if (status === 404) return 'Không tìm thấy dữ liệu hoặc dữ liệu không còn khả dụng.'
  if (status === 429) return 'Bạn thao tác quá nhanh. Vui lòng chờ một chút rồi thử lại.'
  if (status >= 500) return 'Máy chủ chưa sẵn sàng. Vui lòng thử lại trong giây lát.'
  if (path === 'vietqr/account-lookup')
    return 'Chưa xác minh được tài khoản. Kiểm tra ngân hàng và số tài khoản rồi thử lại.'
  if (/^(payout|payment)-accounts/.test(path))
    return 'Chưa lưu được tài khoản. Kiểm tra thông tin ngân hàng và thử lại.'
  if (status === 409)
    return 'Dữ liệu đã thay đổi hoặc bị trùng. Tải lại và kiểm tra trước khi thử lại.'
  return 'Dữ liệu chưa hợp lệ. Kiểm tra các trường đã nhập rồi thử lại.'
}
