import { test, expect } from '@playwright/test'
import { mockWorkspace, permissions, fixtureBill } from './helpers/workspace'

test('custom filters fit the viewport and keyboard dismissal leaves the user dialog open', async ({
  page,
  isMobile,
}) => {
  await mockWorkspace(page, [
    ...permissions,
    'Users.Read',
    'Users.ReadPermissions',
    'Users.UpdateRole',
    'Roles.Read',
    'Permissions.Read',
    'SupportRequests.Read',
  ])
  await page.route('**/api/admin/**', (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path === '/api/admin/users')
      data = {
        items: [
          {
            memberId: 'controls',
            name: 'Linh',
            email: 'friend@example.com',
            roleId: 'member',
            role: 'User',
            status: 'Active',
          },
        ],
        totalCount: 1,
        totalPages: 1,
      }
    if (path === '/api/admin/users/roles')
      data = [
        { roleId: 'member', name: 'User' },
        { roleId: 'manager', name: 'Quản lý' },
      ]
    if (path === '/api/admin/users/controls/permissions')
      data = { effectivePermissionCodes: ['Bills.Read'] }
    return route.fulfill({ json: { data } })
  })
  if (!isMobile) await page.setViewportSize({ width: 1556, height: 830 })
  await page.goto('/admin/users')
  if (!isMobile) {
    expect(
      await page
        .locator('.ws-sidebar-scroll')
        .evaluate((node) => node.scrollHeight <= node.clientHeight),
    ).toBe(true)
    await expect(page.getByRole('button', { name: 'Thu gọn sidebar', exact: true })).toHaveCount(1)
  }
  const status = page.getByRole('combobox', { name: 'Trạng thái người dùng' })
  await status.click()
  const options = page.getByRole('listbox')
  await expect(options).toBeVisible()
  expect(await options.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  const bounds = (await options.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.keyboard.press('Escape')
  await expect(options).not.toBeVisible()
  await expect(status).toBeFocused()
  await page.getByRole('button', { name: /Linh friend@example.com/ }).click()
  const modal = page.getByRole('dialog', { name: 'Thông tin người dùng', exact: true })
  const role = modal.getByRole('combobox', { name: 'Vai trò người dùng' })
  await role.click()
  await expect(modal.getByRole('listbox')).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('listbox')).not.toBeVisible()
  await expect(modal).toBeVisible()
  await expect(role).toBeFocused()
  await role.click()
  await page.getByRole('option', { name: 'Quản lý', exact: true }).click()
  await expect(role).toHaveAttribute('data-value', 'manager')
  await page.keyboard.press('Escape')
  await expect(modal).not.toBeVisible()
})

test('calendar selects local dates, prevents an earlier due date, and sends unchanged API date strings', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-03T03:00:00Z'))
  await mockWorkspace(page)
  let saved: unknown
  await page.route('**/api/bills', (route) => {
    saved = route.request().postDataJSON()
    return route.fulfill({ json: { data: fixtureBill({ status: 'Draft', members: [] }) } })
  })
  await page.goto('/bills/new')
  const billDate = page.getByRole('button', { name: 'Ngày hóa đơn', exact: true })
  await billDate.click()
  const calendar = page.locator('.ws-calendar-popover')
  await expect(calendar).toBeVisible()
  const bounds = (await calendar.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await calendar.locator('[data-day="2026-10-07"] button').click()
  await expect(calendar).not.toBeVisible()
  await expect(billDate).toHaveAttribute('data-value', '2026-10-07')
  const dueDate = page.getByRole('button', { name: 'Hạn thanh toán · tùy chọn', exact: true })
  await dueDate.click()
  await expect(calendar.locator('[data-day="2026-10-06"] button')).toBeDisabled()
  await calendar.locator('[data-day="2026-10-08"] button').click()
  await expect(dueDate).toHaveAttribute('data-value', '2026-10-08')
  await dueDate.click()
  await calendar.getByRole('button', { name: 'Xóa ngày', exact: true }).click()
  await expect(dueDate).toHaveAttribute('data-value', '')
  await dueDate.click()
  await calendar.locator('[data-day="2026-10-08"] button').click()
  await page.getByLabel('Tên hóa đơn').fill('Bữa tối')
  await page.getByLabel('Tổng số tiền (VND)', { exact: true }).fill('720000')
  await page.getByRole('button', { name: 'Lưu & tiếp tục', exact: true }).click()
  expect(saved).toMatchObject({
    billDate: '2026-10-07',
    dueDate: '2026-10-08',
    totalAmount: 720000,
  })
})
