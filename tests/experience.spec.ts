import { test, expect } from '@playwright/test'

test('story examples update the scene and the final action enters the real app', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  const jump = async (name: string, scene: string) => {
    await page.getByRole('button', { name: `Chuyển tới cảnh ${name}`, exact: true }).click()
    await expect(page.locator('.hero')).toHaveAttribute('data-scene', scene)
    await expect(page.locator(`.narrative-${scene}`)).toHaveCSS('opacity', '1')
  }
  await jump('Chia tiền', 'sharing')
  await page.getByRole('button', { name: '4 người', exact: true }).click()
  await expect(page.locator('.narrative-sharing .experiment-result')).toContainText('180.000')
  await expect(page.getByRole('button', { name: '4 người', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await jump('Hóa đơn', 'bills')
  await page.getByRole('button', { name: 'Thử đánh dấu đã trả' }).click()
  await expect(page.getByRole('button', { name: 'Đã xong. Nhẹ đầu rồi.' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await jump('Để dành', 'saving')
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Để dành thử 50.000 ₫' }).click()
  await expect(page.getByRole('progressbar', { name: 'Quỹ chuyến đi mẫu' })).toHaveAttribute(
    'aria-valuenow',
    '150000',
  )
  await jump('Chia tiền', 'sharing')
  await expect(page.locator('.narrative-sharing .experiment-result')).toContainText('180.000')
  await jump('Nhìn rõ', 'insight')
  await page.getByRole('button', { name: 'Khám phá từng khoản' }).click()
  await expect(page).toHaveURL(/\/login\?next=/)
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  expect(errors).toEqual([])
})

test('mobile story keeps reading, interactive controls, and navigation inside the viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome')
  await page.goto('/')
  for (const name of ['Chia tiền', 'Hóa đơn', 'Nhìn rõ', 'Để dành']) {
    await page.getByRole('button', { name: `Chuyển tới cảnh ${name}`, exact: true }).click()
    const current = page.locator('.hero-narrative[aria-hidden="false"] .narrative-copy')
    await expect(current.locator('.story-experiment')).toBeVisible()
    const copy = await current.boundingBox()
    const canvas = await page.locator('.scene-container canvas').boundingBox()
    expect(copy!.y + copy!.height).toBeLessThanOrEqual(canvas!.y + 1)
    expect(copy!.x).toBeGreaterThanOrEqual(0)
    expect(copy!.x + copy!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      page.viewportSize()!.width,
    )
  }
})
