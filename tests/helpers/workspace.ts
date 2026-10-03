import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'

export const permissions = [
  'Bills.Read',
  'Bills.Create',
  'Bills.Update',
  'Bills.ManageMembers',
  'Bills.Calculate',
  'Bills.Publish',
  'Bills.Delete',
  'Bills.SendReminders',
  'Groups.Read',
  'Groups.Create',
  'Groups.ManageMembers',
  'Groups.Delete',
  'PayoutAccounts.Read',
  'PayoutAccounts.Create',
  'PayoutAccounts.Update',
  'Banks.Read',
  'Payments.RecordManual',
  'Payments.Create',
  'Payments.Read',
]
export const billId = '11111111-1111-1111-1111-111111111111'
export const accountId = '22222222-2222-2222-2222-222222222222'
export const owner = { email: 'owner@example.com', displayName: 'Minh Anh' }
export function fixtureBill(overrides: Record<string, unknown> = {}) {
  return {
    billId,
    title: 'Bữa tối cuối tuần',
    description: 'Một buổi tối thật vui',
    totalAmount: 720000,
    currency: 'VND',
    billDate: '2026-10-01',
    dueDate: '2026-10-08',
    status: 'Published',
    isOwner: true,
    collectedAmount: 240000,
    remainingAmount: 480000,
    paidMemberCount: 1,
    unpaidMemberCount: 1,
    overdueMemberCount: 0,
    completionPercentage: 33.33,
    paymentDestination: { bankName: 'Vietcombank', accountName: 'MINH ANH' },
    members: [
      {
        memberId: 'member-owner',
        name: 'Minh Anh',
        email: owner.email,
        assignedAmount: 480000,
        paidAmount: 0,
        remainingAmount: 480000,
        status: 'AwaitingPayment',
        paymentUrl: 'https://pay.payos.vn/test',
        paymentQrImageUrl: 'https://img.vietqr.io/test.png',
        transferContent: 'MO123',
        payments: [] as Array<{
          paymentId: string
          amount: number
          method: string
          paidAtUtc: string
          note: string
        }>,
      },
      {
        memberId: 'member-friend',
        name: 'Linh',
        email: 'friend@example.com',
        assignedAmount: 240000,
        paidAmount: 240000,
        remainingAmount: 0,
        status: 'Paid',
        paymentUrl: null,
        paymentQrImageUrl: null,
        payments: [] as Array<{
          paymentId: string
          amount: number
          method: string
          paidAtUtc: string
          note: string
        }>,
      },
    ],
    ...overrides,
  }
}
export async function provisionSession(page: Page) {
  const env = readFileSync('.env.local', 'utf8')
  const secret = process.env.SESSION_SECRET || env.match(/^SESSION_SECRET=(.+)$/m)?.[1]?.trim()
  if (!secret) throw new Error('Set SESSION_SECRET before running workspace UI tests')
  const payload = Buffer.from(
    JSON.stringify({ ...owner, expires: Date.now() + 3600_000 }),
  ).toString('base64url')
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  await page.context().addCookies([
    {
      name: 'mo_profile',
      value: `${payload}.${signature}`,
      url: 'http://localhost:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}
export async function mockWorkspace(page: Page, granted = permissions) {
  await provisionSession(page)
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path === '/api/auth/me/permissions')
      data = { effectivePermissionCodes: granted, email: owner.email }
    else if (path === '/api/bills')
      data = {
        items: [fixtureBill()],
        totalCount: 1,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    else if (path.startsWith('/api/bills/')) data = fixtureBill()
    else if (path === '/api/groups') data = { items: [], totalCount: 0, totalPages: 0 }
    else if (path === '/api/payout-accounts')
      data = [
        {
          id: accountId,
          bankName: 'Vietcombank',
          bankBin: '970436',
          bankCode: 'VCB',
          accountNumberMasked: '•••• 1234',
          accountHolderName: 'MINH ANH',
          isDefault: true,
        },
      ]
    else if (path === '/api/vietqr/banks')
      data = [
        {
          bin: '970436',
          code: 'VCB',
          name: 'Vietcombank',
          shortName: 'Vietcombank',
          logo: 'https://api.vietqr.io/img/VCB.png',
          lookupSupported: true,
        },
      ]
    await route.fulfill({ json: { success: true, data } })
  })
  await page.route('https://img.vietqr.io/test.png', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="white"/><path d="M20 20h60v60H20z M140 20h60v60h-60z M20 140h60v60H20z" fill="#163b5b"/><path d="M105 100h35v35h-35z M150 150h45v45h-45z M100 180h25v25h-25z" fill="#163b5b"/></svg>',
    }),
  )
}
