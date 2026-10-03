import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { mockWorkspace, billId, permissions } from '../tests/helpers/workspace.ts'

// Node 22: node --experimental-strip-types scripts/capture-api-design.mjs
// Uses fixtures only. Never writes to the connected backend.
const output = 'QA/api-integration'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const [name, viewport] of [
    ['desktop', { width: 1440, height: 1000 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' })
    await mockWorkspace(page, [
      ...permissions,
      'Users.Read',
      'Users.ReadPermissions',
      'Users.UpdateRole',
      'Users.UpdatePermissions',
      'Roles.Read',
      'Permissions.Read',
      'SupportRequests.Read',
      'SupportRequests.Update',
    ])
    const bankCatalog = JSON.parse(readFileSync(`${output}/bank-catalog.json`, 'utf8'))
    await page.route('**/api/vietqr/banks', (route) =>
      route.fulfill({ json: { data: bankCatalog } }),
    )
    await page.route('**/api/admin/**', (route) => {
      const path = new URL(route.request().url()).pathname
      let data = []
      if (path === '/api/admin/users')
        data = {
          items: [
            {
              memberId: 'review-member',
              name: 'Linh',
              email: 'linh@example.com',
              status: 'Active',
              roleId: 'role-member',
              role: 'Member',
            },
          ],
          totalCount: 1,
          totalPages: 1,
        }
      if (path === '/api/admin/users/roles')
        data = [{ roleId: 'role-member', name: 'Thành viên', code: 'Member' }]
      if (path === '/api/admin/users/permissions')
        data = ['Bills.Read', 'Bills.Create', 'Groups.Read'].map((code, index) => ({
          code,
          name: code,
          groupCode: 'Workspace',
          groupName: 'Không gian cá nhân',
          sortOrder: index,
        }))
      if (path === '/api/admin/users/review-member/permissions')
        data = { effectivePermissionCodes: ['Bills.Read', 'Groups.Read'] }
      if (path === '/api/admin/support-requests')
        data = {
          items: [
            {
              id: 'review-request',
              memberName: 'Linh',
              contactEmail: 'linh@example.com',
              type: 'PaymentIssue',
              description:
                'Mình đã chuyển khoản nhưng trạng thái hóa đơn chưa cập nhật. Nhờ kiểm tra giúp giao dịch này.',
              status: 'Pending',
              createdAtUtc: '2026-10-01T12:00:00Z',
              billId,
              billTitle: 'Bữa tối cuối tuần',
            },
          ],
          totalCount: 1,
          totalPages: 1,
        }
      return route.fulfill({ json: { data } })
    })
    for (const [label, path] of [
      ['dashboard', '/dashboard'],
      ['bills', '/bills'],
      ['groups', '/groups'],
      ['accounts', '/payout-accounts'],
      ['support', '/support'],
      ['create-bill', '/bills/new'],
      ['bill-detail', `/bills/${billId}`],
      ['admin-users', '/admin/users'],
      ['admin-support', '/admin/support-requests'],
    ]) {
      await page.goto(`http://localhost:3000${path}`)
      await page.locator('.ws-main h1').waitFor()
      await page.evaluate(() => document.fonts.ready)
      await page
        .waitForFunction(
          () =>
            Array.from(document.querySelectorAll('.ws-bank-logo img'))
              .filter((img) => img.getBoundingClientRect().top < innerHeight)
              .every((img) => img.complete),
          undefined,
          { timeout: 5000 },
        )
        .catch(() => {})
      if (label === 'admin-users') await page.locator('.ws-admin-person').click()
      if (label === 'admin-support') await page.locator('.ws-request-row').click()
      await page.screenshot({
        path: `${output}/${name}-${label}.png`,
        fullPage: true,
        animations: 'disabled',
      })
    }
    await page.goto('http://localhost:3000/payout-accounts')
    await page.getByRole('button', { name: '+ Thêm tài khoản', exact: true }).click()
    await page.getByRole('combobox', { name: 'Ngân hàng', exact: true }).click()
    await page.locator('.ws-bank-popover').waitFor()
    await page
      .waitForFunction(
        () =>
          Array.from(document.querySelectorAll('.ws-bank-logo img'))
            .filter((img) => img.getBoundingClientRect().top < innerHeight)
            .every((img) => img.complete),
        undefined,
        { timeout: 5000 },
      )
      .catch(() => {})
    await page.screenshot({
      path: `${output}/${name}-bank-picker.png`,
      fullPage: true,
      animations: 'disabled',
    })
    if (name === 'desktop') {
      await page.goto('http://localhost:3000/dashboard')
      await page.getByRole('button', { name: 'Thu gọn sidebar' }).click()
      await page.screenshot({
        path: `${output}/${name}-sidebar-collapsed.png`,
        fullPage: true,
        animations: 'disabled',
      })
    }
    await page.context().clearCookies()
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email của bạn').waitFor()
    await page
      .locator('.ws-google iframe')
      .waitFor({ timeout: 7000 })
      .catch(() => {})
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: `${output}/${name}-login.png`, fullPage: true })
    await page.close()
  }
  console.log(`Design screenshots saved in ${output}`)
} finally {
  await browser.close()
}
