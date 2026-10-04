import { test, expect } from '@playwright/test'

test('login form is visible in server HTML before hydration', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 664 },
  })
  const page = await context.newPage()
  await page.goto('/login')
  const visible = await page.locator('.ws-auth-card').evaluate((node) => {
    for (let current: Element | null = node; current; current = current.parentElement) {
      const style = getComputedStyle(current)
      if (Number(style.opacity) === 0 || style.display === 'none' || style.visibility === 'hidden')
        return false
    }
    return true
  })
  expect(visible).toBe(true)
  const bounds = await page.getByRole('button', { name: 'Gửi mã đăng nhập' }).boundingBox()
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(664)
  await context.close()
})

test('mobile login skips the renderer; form works and desktop resize restores 3D', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 664 })
  const rendererResponses: Promise<string>[] = []
  page.on('response', (response) => {
    if (response.url().includes('/_next/') && response.url().includes('.js')) {
      rendererResponses.push(response.text().catch(() => ''))
    }
  })
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  await page.route('**/api/auth/send-login-code', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: true }),
    }),
  )
  await page.goto('/login')
  await page.getByLabel('Email của bạn').fill('loading-test@example.com')
  await page.getByRole('button', { name: 'Gửi mã đăng nhập' }).click()
  await expect(page.getByLabel('Mã đăng nhập')).toBeVisible()
  expect(
    (await Promise.all(rendererResponses)).some((body) => body.includes('WebGLRenderer')),
  ).toBe(false)
  await expect(page.locator('.login-scene-canvas canvas')).toHaveCount(0)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(page.locator('.login-scene-canvas canvas')).toBeVisible({ timeout: 30_000 })
  expect(
    (await Promise.all(rendererResponses)).some((body) => body.includes('WebGLRenderer')),
  ).toBe(true)
})
