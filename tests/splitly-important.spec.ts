import { test, expect } from '@playwright/test'
import { accountId, billId, fixtureBill, mockWorkspace } from './helpers/workspace'

test('automatic account lookup ignores stale names and saves the current account once', async ({
  page,
}) => {
  await mockWorkspace(page)
  let writes = 0
  await page.route('**/api/vietqr/account-lookup', async (route) => {
    const { accountNumber } = route.request().postDataJSON()
    if (accountNumber === '1111111111') await new Promise((resolve) => setTimeout(resolve, 1400))
    await route
      .fulfill({
        json: {
          data: {
            verified: true,
            accountName: accountNumber === '1111111111' ? 'OLD OWNER' : 'CURRENT OWNER',
            bankName: 'Vietcombank',
          },
        },
      })
      .catch(() => {})
  })
  await page.route('**/api/payout-accounts', (route) => {
    if (route.request().method() === 'POST') {
      writes++
      expect(route.request().postDataJSON()).toEqual({
        bankBin: '970436',
        accountNumber: '2222222222',
        isDefault: true,
      })
      return route.fulfill({ json: { data: { id: accountId } } })
    }
    return route.fulfill({ json: { data: [] } })
  })
  await page.goto('/payout-accounts')
  const trigger = page.getByRole('button', { name: '+ Thêm tài khoản', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Thêm tài khoản nhận tiền' })
  await expect(dialog).toBeVisible()
  await page.getByRole('combobox', { name: 'Ngân hàng', exact: true }).fill('VCB')
  await page.getByRole('option', { name: /Vietcombank/ }).click()
  const firstRequest = page.waitForRequest((request) => request.url().includes('/account-lookup'))
  await page.getByLabel('Số tài khoản', { exact: true }).fill('1111111111')
  await firstRequest
  await page.getByLabel('Số tài khoản', { exact: true }).fill('2222222222')
  await expect(page.getByLabel('Tên chủ tài khoản', { exact: true })).toHaveValue('CURRENT OWNER')
  await page.waitForTimeout(1000)
  await expect(page.getByLabel('Tên chủ tài khoản', { exact: true })).toHaveValue('CURRENT OWNER')
  expect(writes).toBe(0)
  await page.getByRole('button', { name: 'Lưu tài khoản', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(writes).toBe(1)
  await trigger.click()
  await expect(page.getByLabel('Số tài khoản', { exact: true })).toHaveValue('')
  await page.getByRole('button', { name: 'Đóng modal', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('cancel bill uses a modal and never calls the API before confirmation', async ({ page }) => {
  await mockWorkspace(page)
  let cancelled = false
  await page.route(`**/api/bills/${billId}`, (route) =>
    route.fulfill({
      json: { data: fixtureBill({ status: cancelled ? 'Cancelled' : 'Published' }) },
    }),
  )
  await page.route(`**/api/bills/${billId}/cancel`, (route) => {
    expect(route.request().postDataJSON()).toEqual({ reason: 'Tạo nhầm hóa đơn' })
    cancelled = true
    return route.fulfill({ json: { data: true } })
  })
  await page.goto(`/bills/${billId}`)
  const trigger = page.getByRole('button', { name: 'Hủy hóa đơn', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Hủy hóa đơn này?' })
  await expect(dialog).toBeVisible()
  expect(cancelled).toBe(false)
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(cancelled).toBe(false)
  await trigger.click()
  await page.getByLabel('Lý do hủy').fill('Tạo nhầm hóa đơn')
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('.ws-page-heading .ws-status')).toHaveText('Đã hủy')
  expect(cancelled).toBe(true)
})

test('small workspace and modal keep content and controls inside the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 230, height: 768 })
  await mockWorkspace(page)
  for (const path of ['/bills', '/groups', '/payout-accounts']) {
    await page.goto(path)
    await page.locator('.ws-main h1').waitFor()
    const dimensions = await page.evaluate(() => {
      const route = document.querySelector('.ws-route')!
      return {
        document: document.documentElement.scrollWidth,
        viewport: innerWidth,
        content: route.scrollWidth,
        available: route.clientWidth,
      }
    })
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.available + 1)
  }
  await page.getByRole('button', { name: '+ Thêm tài khoản', exact: true }).click()
  await page.getByRole('combobox', { name: 'Ngân hàng', exact: true }).click()
  const dimensions = await page
    .locator('.ws-modal-body')
    .evaluate((element) => ({ content: element.scrollWidth, available: element.clientWidth }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.available + 1)
  await expect(page.getByRole('button', { name: 'Đóng modal', exact: true })).toBeInViewport()
  await expect(page.getByRole('button', { name: 'Lưu tài khoản', exact: true })).toBeInViewport()
})

test('group creation and closing follow the API with a dismissible confirmation modal', async ({
  page,
}) => {
  await mockWorkspace(page)
  const groupId = '33333333-3333-3333-3333-333333333333'
  let created = false
  let closed = false
  const group = () => ({
    groupId,
    name: 'Bạn cùng đi',
    description: 'Chia tiền chuyến đi',
    isOwner: true,
    status: closed ? 'Closed' : 'Active',
    members: [],
    bills: [],
  })
  await page.route(/\/api\/groups(?:\?.*)?$/, (route) => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({
        name: 'Bạn cùng đi',
        description: 'Chia tiền chuyến đi',
      })
      created = true
      return route.fulfill({ json: { data: group() } })
    }
    return route.fulfill({
      json: {
        data: {
          items: created ? [{ ...group(), memberCount: 1, billCount: 0, role: 'Owner' }] : [],
          totalCount: created ? 1 : 0,
          totalPages: 1,
        },
      },
    })
  })
  await page.route(`**/api/groups/${groupId}`, (route) =>
    route.fulfill({ json: { data: group() } }),
  )
  await page.route(`**/api/groups/${groupId}/close`, (route) => {
    closed = true
    return route.fulfill({ json: { data: true } })
  })
  await page.goto('/groups')
  await page.getByRole('button', { name: 'Tạo nhóm mới', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Tạo nhóm mới', exact: true })).toBeVisible()
  await page.getByLabel('Tên nhóm', { exact: true }).fill('Bạn cùng đi')
  await page.getByLabel('Một chút về nhóm', { exact: true }).fill('Chia tiền chuyến đi')
  await page.getByRole('button', { name: 'Tạo nhóm', exact: true }).click()
  await page.locator('.ws-group-card').click()
  await page.getByRole('button', { name: 'Đóng nhóm', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Đóng nhóm này?', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click()
  expect(closed).toBe(false)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Đóng nhóm', exact: true }).click()
  await page.getByRole('button', { name: 'Xác nhận đóng', exact: true }).click()
  await expect(page.locator('.ws-page-heading .ws-status')).toHaveText('Đã đóng')
  expect(closed).toBe(true)
})
