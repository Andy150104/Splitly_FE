import { test, expect } from '@playwright/test'

test('landing page keeps the 3D concept, fits the viewport and opens the real app', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  await expect(page.locator('main[data-hydrated="true"]')).toBeAttached()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  )
  await page.screenshot({ path: `test-results/${info.project.name}-landing-hero.png` })
  await page.getByRole('button', { name: 'Bắt đầu cùng Splitly', exact: true }).first().click()
  await expect(page).toHaveURL(/\/login\?next=/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  expect(errors).toEqual([])
})
test('FAQ, concept cards and mobile menu stay usable', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Mình bắt đầu cùng Splitly như thế nào?' }).click()
  await expect(page.locator('#faq-2')).toBeVisible()
  await page.getByRole('button', { name: 'Dữ liệu của mình được lưu ở đâu?' }).click()
  await expect(page.locator('#faq-2')).toBeHidden()
  await expect(page.locator('#faq-1')).toContainText('hệ thống')
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  if (info.project.name.includes('mobile')) {
    await page.getByRole('button', { name: 'Mở menu', exact: true }).click()
    await page
      .getByRole('navigation', { name: 'Điều hướng di động' })
      .getByRole('link', { name: 'Cùng nhau' })
      .click()
    await expect(page.locator('#dreams')).toBeInViewport()
  }
  await page.getByRole('button', { name: 'Khám phá nhóm cùng chia' }).click()
  await expect(page).toHaveURL(/\/login\?next=%2Fgroups/)
})
