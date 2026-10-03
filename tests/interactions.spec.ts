import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { accountId, billId, fixtureBill, mockWorkspace, permissions } from './helpers/workspace'

test('login stays legible and accessible after the color refresh', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const hydrationErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat/i.test(message.text()))
      hydrationErrors.push(message.text())
  })
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  await page.goto('/login')
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(result.violations).toEqual([])
  expect(hydrationErrors).toEqual([])
})

test('dashboard sections toggle and navigation opens or collapses', async ({ page }, info) => {
  await mockWorkspace(page)
  await page.goto('/dashboard')
  const overview = page.getByRole('button', { name: 'Tổng quan khoản chung Không gian của bạn' })
  await expect(overview).toHaveAttribute('aria-expanded', 'true')
  await overview.click()
  await expect(overview).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.ws-metric')).toHaveCount(0)
  await overview.click()
  await expect(page.locator('.ws-metric')).toHaveCount(3)
  const recent = page.getByRole('button', { name: 'Hóa đơn gần đây 6 khoản gần nhất' })
  await recent.click()
  await expect(recent).toHaveAttribute('aria-expanded', 'false')
  await recent.click()
  await page.getByRole('combobox', { name: 'Lọc hóa đơn gần đây' }).click()
  await page.getByRole('option', { name: 'Bản nháp', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Không có hóa đơn ở trạng thái này.' }),
  ).toBeVisible()
  await page.getByRole('combobox', { name: 'Lọc hóa đơn gần đây' }).click()
  await page.getByRole('option', { name: 'Tất cả trạng thái', exact: true }).click()
  if (info.project.name === 'desktop-chrome') {
    await page.getByRole('button', { name: 'Thu gọn sidebar' }).click()
    await expect(page.locator('.workspace')).toHaveClass(/is-sidebar-collapsed/)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Mở rộng sidebar' })).toBeVisible()
    await page.getByRole('link', { name: 'Tài khoản nhận tiền', exact: true }).click()
    await expect(page).toHaveURL('/payout-accounts')
    await page.getByRole('button', { name: 'Mở rộng sidebar' }).click()
    await expect(page.locator('.workspace')).not.toHaveClass(/is-sidebar-collapsed/)
  } else {
    await page.getByRole('button', { name: 'Mở menu', exact: true }).click()
    await expect(page.locator('.ws-sidebar')).toHaveClass(/is-open/)
    await page.getByRole('link', { name: 'Tài khoản nhận tiền', exact: true }).click()
    await expect(page).toHaveURL('/payout-accounts')
    await expect(page.locator('.ws-sidebar')).not.toHaveClass(/is-open/)
  }
  await page.locator('.ws-profile-menu summary').click()
  await expect(page.locator('.ws-profile-dropdown')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  )
})

test('bank search shows logos, supports keyboard selection and resets verification', async ({
  page,
}) => {
  await mockWorkspace(page)
  await page.route('**/api/vietqr/banks', (route) =>
    route.fulfill({
      json: {
        data: [
          {
            bin: '970436',
            code: 'VCB',
            name: 'Ngân hàng Ngoại thương Việt Nam',
            shortName: 'Vietcombank',
            lookupSupported: true,
            logo: 'https://api.vietqr.io/img/VCB.png',
          },
          {
            bin: '970422',
            code: 'MB',
            name: 'Ngân hàng Quân đội',
            shortName: 'MB Bank',
            lookupSupported: true,
            logo: 'https://api.vietqr.io/img/MB.png',
          },
        ],
      },
    }),
  )
  const lookups: unknown[] = []
  await page.route('**/api/vietqr/account-lookup', (route) => {
    lookups.push(route.request().postDataJSON())
    return route.fulfill({
      json: { data: { verified: true, accountName: 'MINH ANH', bankName: 'Vietcombank' } },
    })
  })
  let saves = 0
  await page.route('**/api/payout-accounts', (route) => {
    if (route.request().method() === 'POST') saves++
    return route.fulfill({
      json: { data: route.request().method() === 'POST' ? { id: accountId } : [] },
    })
  })
  await page.goto('/payout-accounts')
  await page.getByRole('button', { name: '+ Thêm tài khoản', exact: true }).click()
  const bank = page.getByRole('combobox', { name: 'Ngân hàng', exact: true })
  await bank.fill('ngoai thuong')
  const option = page.getByRole('option', { name: /Vietcombank/ })
  await expect(option).toBeVisible()
  await expect(option.locator('img')).toHaveAttribute('src', 'https://api.vietqr.io/img/VCB.png')
  await bank.press('Enter')
  await expect(bank).toHaveValue('Vietcombank')
  await expect(bank).toHaveAttribute('aria-expanded', 'false')
  await page.getByLabel('Số tài khoản', { exact: true }).fill('0123456789')
  await expect(page.getByLabel('Tên chủ tài khoản', { exact: true })).toHaveValue('MINH ANH')
  await bank.fill('quan doi')
  await bank.press('Enter')
  await expect(bank).toHaveValue('MB Bank')
  await expect(page.getByLabel('Tên chủ tài khoản', { exact: true })).toHaveValue('')
  expect(saves).toBe(0)
  await expect(page.getByLabel('Tên chủ tài khoản', { exact: true })).toHaveValue('MINH ANH')
  expect(lookups).toEqual([
    { bankBin: '970436', accountNumber: '0123456789' },
    { bankBin: '970422', accountNumber: '0123456789' },
  ])
  await bank.fill('khong-co-ngan-hang')
  await expect(page.getByText('Không tìm thấy ngân hàng. Thử tên hoặc mã khác.')).toBeVisible()
  await bank.press('Escape')
  await expect(bank).toHaveValue('MB Bank')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  )
})

test('bill member history, reminders and manual payment use the correct member', async ({
  page,
}) => {
  await mockWorkspace(page)
  const bill = fixtureBill()
  bill.members[1].payments = [
    {
      paymentId: 'payment-1',
      amount: 240000,
      method: 'BankTransfer',
      paidAtUtc: '2026-10-01T12:00:00Z',
      note: 'Đã nhận',
    },
  ]
  await page.route(`**/api/bills/${billId}`, (route) => route.fulfill({ json: { data: bill } }))
  const writes: string[] = []
  await page.route(`**/api/bills/${billId}/reminders`, (route) => {
    expect(route.request().postDataJSON()).toEqual({ memberIds: ['member-owner'] })
    writes.push('reminder')
    return route.fulfill({ json: { data: true } })
  })
  await page.route(`**/api/bills/${billId}/members/member-owner/manual-payments`, (route) => {
    expect(route.request().postDataJSON()).toEqual({
      amount: 120000,
      method: 'BankTransfer',
      note: 'Đã nhận chuyển khoản',
      paidAtUtc: null,
    })
    writes.push('manual')
    bill.members[0].paidAmount = 120000
    bill.members[0].remainingAmount = 360000
    return route.fulfill({ json: { data: true } })
  })
  await page.goto(`/bills/${billId}`)
  await page.getByRole('button', { name: /^Linh friend@example.com.*Đã thanh toán/ }).click()
  await expect(page.locator('.ws-history-row')).toContainText('240.000')
  await page.getByRole('button', { name: 'Nhắc thanh toán', exact: true }).click()
  await expect(page.locator('.ws-notice[role="status"]')).toContainText('Đã gửi lời nhắc')
  await page.getByRole('button', { name: /^Minh Anh owner@example.com.*Chờ thanh toán/ }).click()
  await page.getByRole('button', { name: 'Ghi nhận đã trả', exact: true }).click()
  await page.getByLabel('Số tiền đã nhận').fill('120000')
  await page.getByLabel('Ghi chú', { exact: true }).fill('Đã nhận chuyển khoản')
  await page.getByRole('button', { name: 'Xác nhận đã nhận', exact: true }).click()
  await expect(page.locator('.ws-notice[role="status"]')).toContainText(
    'Đã ghi nhận khoản thanh toán',
  )
  expect(writes).toEqual(['reminder', 'manual'])
})

const adminPermissions = [
  ...permissions,
  'Users.Read',
  'Users.ReadPermissions',
  'Users.UpdateRole',
  'Users.UpdatePermissions',
  'Users.UpdateAccess',
  'Roles.Read',
  'Permissions.Read',
  'SupportRequests.Read',
  'SupportRequests.Update',
]
test('admin role and effective permission changes send the reference contracts', async ({
  page,
}) => {
  await mockWorkspace(page, adminPermissions)
  const member = {
    memberId: 'user-1',
    name: 'Linh',
    email: 'friend@example.com',
    status: 'Active',
    roleId: 'role-member',
    role: 'Member',
  }
  let effective = ['Bills.Read']
  const writes: unknown[] = []
  await page.route('**/api/admin/**', (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname
    let data: unknown = []
    if (path === '/api/admin/users') data = { items: [member], totalCount: 1, totalPages: 1 }
    if (path === '/api/admin/users/roles')
      data = [
        { roleId: 'role-member', code: 'Member', name: 'Thành viên' },
        { roleId: 'role-manager', code: 'Manager', name: 'Quản lý' },
      ]
    if (path === '/api/admin/users/permissions')
      data = ['Bills.Read', 'Bills.Create'].map((code, index) => ({
        permissionId: code,
        code,
        name: index ? 'Tạo hóa đơn' : 'Xem hóa đơn',
        groupCode: 'Bills',
        groupName: 'Hóa đơn',
        sortOrder: index,
      }))
    if (path.endsWith('/role')) {
      expect(request.method()).toBe('PATCH')
      expect(request.postDataJSON()).toEqual({ roleId: 'role-manager' })
      member.roleId = 'role-manager'
      member.role = 'Manager'
      writes.push(request.postDataJSON())
    }
    if (path === '/api/admin/users/user-1/permissions') {
      if (request.method() === 'PATCH') {
        expect(request.postDataJSON()).toEqual({
          effectivePermissionCodes: ['Bills.Read', 'Bills.Create'],
        })
        effective = request.postDataJSON().effectivePermissionCodes
        writes.push(request.postDataJSON())
      }
      data = { effectivePermissionCodes: effective }
    }
    return route.fulfill({ json: { data } })
  })
  await page.goto('/admin/users')
  await page.getByRole('button', { name: /Linh friend@example.com/ }).click()
  await page.getByRole('combobox', { name: 'Vai trò người dùng' }).click()
  await page.getByRole('option', { name: 'Quản lý', exact: true }).click()
  await page.getByRole('button', { name: 'Lưu vai trò', exact: true }).click()
  await expect(page.locator('.ws-admin-editor')).toHaveCount(0)
  await page.getByRole('button', { name: /Linh friend@example.com/ }).click()
  await page.getByRole('tab', { name: 'Quyền hiệu lực', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Tạo hóa đơn Bills.Create', exact: true }).check()
  await page.getByRole('button', { name: 'Lưu quyền hiệu lực', exact: true }).click()
  await expect(page.locator('.ws-admin-editor')).toHaveCount(0)
  expect(writes).toHaveLength(2)
})

test('support resolution requires a note and updates through the admin endpoint', async ({
  page,
}) => {
  await mockWorkspace(page, adminPermissions)
  const item = {
    id: 'request-1',
    memberName: 'Linh',
    contactEmail: 'friend@example.com',
    description: 'Thanh toán chưa cập nhật trạng thái.',
    status: 'Pending',
    type: 'PaymentIssue',
    createdAtUtc: '2026-10-01T12:00:00Z',
  }
  let writes = 0
  await page.route('**/api/admin/support-requests**', (route) => {
    if (route.request().method() === 'PATCH') {
      expect(route.request().postDataJSON()).toEqual({
        status: 'Resolved',
        resolutionNote: 'Đã đối soát giao dịch.',
      })
      writes++
      item.status = 'Resolved'
      return route.fulfill({ json: { data: true } })
    }
    return route.fulfill({ json: { data: { items: [item], totalCount: 1, totalPages: 1 } } })
  })
  await page.goto('/admin/support-requests')
  await page.getByRole('button', { name: /Linh Chờ tiếp nhận/ }).click()
  await page.getByRole('combobox', { name: 'Trạng thái xử lý' }).click()
  await page.getByRole('option', { name: 'Đã giải quyết', exact: true }).click()
  await page.getByRole('button', { name: 'Lưu trạng thái', exact: true }).click()
  expect(writes).toBe(0)
  await page.getByLabel('Kết quả xử lý', { exact: false }).fill('Đã đối soát giao dịch.')
  await page.getByRole('button', { name: 'Lưu trạng thái', exact: true }).click()
  await expect(page.locator('.ws-admin-editor')).toHaveCount(0)
  await expect(page.locator('.ws-request-row')).toContainText('Đã giải quyết')
  expect(writes).toBe(1)
})
