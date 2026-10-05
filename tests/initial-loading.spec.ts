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
  await expect(page.locator('.login-scene-canvas .login-sculpture-fallback')).toHaveCount(0)
  await page
    .locator('.login-scene-canvas canvas')
    .evaluate((canvas) => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await expect(page.locator('.login-scene-canvas .login-sculpture-fallback')).toHaveCount(1)
  await expect(page.getByLabel('Mã đăng nhập')).toBeVisible()
})

test('landing keeps artwork in its own column while the renderer chunk is slow', async ({
  page,
}, testInfo) => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let held = 0
  await page.route('**/_next/**/*.js', async (route) => {
    const response = await route.fetch()
    const body = await response.text()
    if (body.includes('WebGLRenderer')) {
      held++
      await gate
    }
    await route.fulfill({ response, body })
  })
  try {
    await page.goto('/')
    const placeholder = page.locator('.wallet-placeholder')
    await expect.poll(() => held).toBeGreaterThan(0)
    await expect(placeholder).toHaveAttribute('data-state', 'loading')
    await expect(placeholder).toBeVisible()
    const viewports = testInfo.project.name.includes('mobile')
      ? [
          [360, 740],
          [390, 844],
        ]
      : [
          [1440, 1000],
          [1920, 1080],
          [2432, 1440],
          [768, 900],
          [768, 700],
        ]
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height })
      await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(width)
      await expect(placeholder).toBeVisible()
      const title = (await page.locator('#hero-title').boundingBox())!
      const art = (await page.locator('.wallet-placeholder-art').boundingBox())!
      expect(art.x >= title.x + title.width || art.y >= title.y + title.height).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      )
      await page.screenshot({
        path: `QA/initial-artwork/${testInfo.project.name}-${width}-${height}-loading.png`,
      })
    }
    await page.setViewportSize(testInfo.project.use.viewport!)
    await expect(
      page.getByRole('button', { name: 'Bắt đầu cùng Splitly', exact: true }).first(),
    ).toBeEnabled()
    await page.screenshot({ path: `QA/initial-artwork/${testInfo.project.name}-loading.png` })
    release()
    await expect(placeholder).toHaveAttribute('data-state', 'ready', { timeout: 30_000 })
    await expect(placeholder).toBeHidden()
    await expect(page.locator('.scene-container canvas')).toBeVisible()
    await page.screenshot({ path: `QA/initial-artwork/${testInfo.project.name}-ready.png` })
    await page
      .locator('.scene-container canvas')
      .evaluate((canvas) =>
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
      )
    await expect(placeholder).toHaveAttribute('data-state', 'loading')
    await expect(placeholder).toBeVisible()
  } finally {
    release()
  }
})

test('landing keeps usable artwork when WebGL is unavailable', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      options?: unknown,
    ) {
      if (/webgl/i.test(type)) {
        const state = window as Window & { blockedWebGL?: number }
        state.blockedWebGL = (state.blockedWebGL || 0) + 1
        return null
      }
      return original.call(this, type as '2d', options as CanvasRenderingContext2DSettings)
    } as typeof original
  })
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { blockedWebGL?: number }).blockedWebGL || 0),
    )
    .toBeGreaterThan(0)
  await expect(page.locator('.wallet-placeholder')).toBeVisible()
  await expect(page.locator('.wallet-placeholder')).toHaveAttribute('data-state', 'loading')
  await expect(page.getByRole('button', { name: 'Xoay vật thể 3D', exact: true })).toBeDisabled()
  await page.screenshot({ path: `QA/initial-artwork/${testInfo.project.name}-no-webgl.png` })
  await page.getByRole('button', { name: 'Bắt đầu cùng Splitly', exact: true }).first().click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  if (!testInfo.project.name.includes('mobile')) {
    await expect(page.locator('.login-scene-canvas .login-sculpture-fallback')).toHaveCount(1)
  }
})
