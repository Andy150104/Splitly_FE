import { test, expect } from '@playwright/test'
import { accountId, fixtureBill, mockWorkspace } from './helpers/workspace'

test('dashboard reveals each resource independently and route motion completes', async ({
  page,
}) => {
  await mockWorkspace(page)
  let release: () => void = () => {}
  const ready = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/bills?*', async (route) => {
    const url = new URL(route.request().url())
    if (url.searchParams.get('owed') === 'false') await ready
    await route.fulfill({ json: { data: { items: [fixtureBill()], totalCount: 1 } } })
  })
  await page.goto('/dashboard')
  await expect(page.locator('.ws-metric strong').nth(1)).toHaveText('1')
  await expect(page.locator('.ws-metric strong').nth(2)).toHaveText('0')
  await expect(page.locator('.ws-recent-section .splitly-skeleton')).toBeVisible()
  release()
  await expect(page.locator('.ws-recent-section')).toContainText('Bữa tối cuối tuần')
  await expect(page.locator('.ws-recent-section .splitly-skeleton')).toHaveCount(0)
  const mobileMenu = page.getByRole('button', { name: 'Mở menu', exact: true })
  if (await mobileMenu.isVisible()) await mobileMenu.click()
  await page.getByRole('link', { name: 'Hóa đơn', exact: true }).click()
  await expect(page.locator('.splitly-transition')).toBeVisible()
  await expect(page).toHaveURL(/\/bills$/)
  await expect(page.locator('.splitly-transition')).toHaveCount(0)
  await expect(page.locator('.ws-main h1')).toContainText('Hóa đơn')
  await page.goBack()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.locator('.splitly-transition')).toHaveCount(0)
})

test('account refresh keeps cards visible while the updated resource arrives', async ({ page }) => {
  await mockWorkspace(page)
  let reads = 0
  let release: () => void = () => {}
  const ready = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/payout-accounts', async (route) => {
    if (++reads > 1) await ready
    await route.fulfill({
      json: {
        data: [
          {
            id: accountId,
            bankName: 'Vietcombank',
            bankBin: '970436',
            bankCode: 'VCB',
            accountNumberMasked: '•••• 1234',
            accountHolderName: 'MINH ANH',
            isDefault: reads > 1,
          },
        ],
      },
    })
  })
  await page.route(`**/api/payout-accounts/${accountId}/default`, (route) =>
    route.fulfill({ json: { data: {} } }),
  )
  await page.goto('/payout-accounts')
  await page.getByRole('button', { name: 'Đặt làm mặc định', exact: true }).click()
  await expect.poll(() => reads).toBe(2)
  await expect(page.locator('.ws-bank-card')).toContainText('Vietcombank')
  await expect(page.locator('.skeleton-cards')).toHaveCount(0)
  await expect(page.locator('.ws-refresh-status')).toContainText('Đang cập nhật tài khoản')
  release()
  await expect(page.locator('.ws-bank-card')).toContainText('Mặc định')
})
