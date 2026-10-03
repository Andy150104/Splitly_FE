import { test, expect } from '@playwright/test'
import { mockWorkspace, permissions } from './helpers/workspace'

test('grouped navigation folds without hiding routes in compact mode', async ({ page }, info) => {
  await mockWorkspace(page)
  await page.goto('/dashboard')
  if (info.project.name === 'mobile-chrome')
    await page.getByLabel('Mở menu', { exact: true }).click()
  const group = page.getByRole('button', { name: 'Không gian chung', exact: true })
  await group.click()
  await expect(group).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('link', { name: 'Hóa đơn', exact: true })).toHaveCount(0)
  await group.click()
  await expect(page.getByRole('link', { name: 'Hóa đơn', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Người dùng & quyền' })).toHaveCount(0)
  if (info.project.name === 'desktop-chrome') {
    await group.click()
    await page.getByLabel('Thu gọn sidebar', { exact: true }).click()
    await expect(page.getByRole('link', { name: 'Hóa đơn', exact: true })).toBeVisible()
    await expect(page.locator('.ws-desktop-toggle')).toHaveCount(1)
    const bills = page.getByRole('link', { name: 'Hóa đơn', exact: true })
    await bills.hover()
    const hint = page.getByRole('tooltip')
    await expect(hint).toContainText('những khoản bạn cùng chia')
    expect(await hint.evaluate((node) => node.matches(':popover-open'))).toBe(true)
    const tipBox = (await hint.boundingBox())!
    const sideBox = (await page.locator('.ws-sidebar').boundingBox())!
    expect(tipBox.x).toBeGreaterThanOrEqual(sideBox.x + sideBox.width)
    await page.keyboard.press('Escape')
    await expect(hint).not.toBeVisible()
    await bills.focus()
    await expect(hint).toContainText('Hóa đơn')
    await page.keyboard.press('Escape')
    await expect(hint).not.toBeVisible()
  }
  await page.getByRole('link', { name: 'Tài khoản nhận tiền', exact: true }).click()
  await expect(page).toHaveURL('/payout-accounts')
  if (info.project.name === 'desktop-chrome') {
    await page.setViewportSize({ width: 390, height: 844 })
    const trigger = page.getByLabel('Mở menu', { exact: true })
    await trigger.click()
    const payment = page.getByRole('button', { name: 'Thanh toán', exact: true })
    await payment.click()
    await expect(payment).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('link', { name: 'Tài khoản nhận tiền', exact: true })).toHaveCount(
      0,
    )
    await payment.click()
    await expect(page.getByRole('link', { name: 'Tài khoản nhận tiền', exact: true })).toBeVisible()
    await page.getByLabel('Đóng menu', { exact: true }).click()
    await expect(trigger).toBeFocused()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  )
})

test('lookup error toast stays above the bank dialog and retry preserves the form', async ({
  page,
}) => {
  await mockWorkspace(page)
  let lookups = 0
  let saves = 0
  await page.route('**/api/vietqr/account-lookup', (route) => {
    lookups++
    return lookups === 1
      ? route.fulfill({ status: 400, json: { message: 'Ngân hàng đang bận. Vui lòng thử lại.' } })
      : route.fulfill({
          json: { data: { verified: true, accountName: 'MINH ANH', bankName: 'Vietcombank' } },
        })
  })
  page.on('request', (request) => {
    if (request.url().endsWith('/api/payout-accounts') && request.method() === 'POST') saves++
  })
  await page.goto('/payout-accounts')
  await page.getByRole('button', { name: '+ Thêm tài khoản', exact: true }).click()
  const bank = page.getByRole('combobox', { name: 'Ngân hàng', exact: true })
  await bank.fill('Vietcombank')
  await bank.press('Enter')
  await page.getByLabel('Số tài khoản', { exact: true }).fill('0123456789')
  const toast = page.locator('.splitly-notification')
  await expect(toast).toContainText('Ngân hàng đang bận.')
  expect(
    await page.locator('.splitly-notifications').evaluate((node) => node.matches(':popover-open')),
  ).toBe(true)
  const dismiss = toast.getByRole('button', { name: 'Đóng thông báo' })
  const bounds = (await dismiss.boundingBox())!
  expect(
    await dismiss.evaluate(
      (node, point) => node.contains(document.elementFromPoint(point.x, point.y)),
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    ),
  ).toBe(true)
  await dismiss.click()
  await expect(toast).toHaveCount(0)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel('Số tài khoản', { exact: true })).toHaveValue('0123456789')
  await page.getByRole('button', { name: 'Thử tra cứu lại' }).click()
  await expect(page.getByLabel('Tên chủ tài khoản', { exact: true })).toHaveValue('MINH ANH')
  expect(lookups).toBe(2)
  expect(saves).toBe(0)
  await page.getByLabel('Đóng modal', { exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('permission load failure shows one toast and retry restores the workspace', async ({
  page,
}) => {
  await mockWorkspace(page)
  let requests = 0
  await page.route('**/api/auth/me/permissions', (route) => {
    requests++
    return requests === 1
      ? route.fulfill({
          status: 503,
          json: { message: 'Chưa tải được quyền truy cập. Hãy thử lại.' },
        })
      : route.fulfill({ json: { data: { effectivePermissionCodes: permissions } } })
  })
  await page.goto('/dashboard')
  await expect(page.locator('.splitly-notification')).toHaveCount(1)
  await expect(page.locator('.splitly-notification')).toContainText('Chưa tải được quyền truy cập.')
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Tổng quan khoản chung Không gian của bạn' }),
  ).toBeVisible()
  expect(requests).toBe(2)
})
