import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

for (const path of ['/', '/login']) {
  test(`cold scene startup remains usable on ${path}`, async ({ page, context, isMobile }) => {
    test.setTimeout(60_000)
    const session = await context.newCDPSession(page)
    await session.send('Network.enable')
    await session.send('Network.setCacheDisabled', { cacheDisabled: true })
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.route('https://accounts.google.com/**', (route) => route.abort())
    await page.route('**/api/**', (route) => route.abort())
    await page.addInitScript(() => {
      const audit = { tasks: [] as { start: number; duration: number }[] }
      Object.assign(window, { sceneAudit: audit })
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          audit.tasks.push({ start: entry.startTime, duration: entry.duration })
      }).observe({ type: 'longtask', buffered: true })
    })
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    if (path === '/login') {
      await page.getByLabel('Email của bạn').fill('startup@example.com')
      if (!isMobile) {
        await expect(page.locator('.login-scene-canvas canvas')).toBeVisible({ timeout: 30_000 })
        await expect(page.locator('.login-scene-canvas canvas')).toHaveAttribute(
          'data-scene-stage',
          'ready',
          { timeout: 30_000 },
        )
        await expect(
          page.locator('.ws-login-spatial-space > .login-sculpture-fallback'),
        ).toBeHidden()
      } else await expect(page.locator('.login-scene-canvas canvas')).toHaveCount(0)
      await expect(page.getByLabel('Email của bạn')).toHaveValue('startup@example.com')
    } else {
      await expect(page.locator('#hero-title')).toBeVisible()
      await expect(page.locator('.wallet-placeholder')).toHaveAttribute('data-state', 'ready', {
        timeout: 30_000,
      })
    }
    const metrics = await page.evaluate(() => {
      const { tasks } = (
        window as typeof window & { sceneAudit: { tasks: { start: number; duration: number }[] } }
      ).sceneAudit
      return {
        readyMs: Math.round(performance.now()),
        fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        longTaskMs: Math.round(tasks.reduce((sum, task) => sum + task.duration, 0)),
        longestTaskMs: Math.round(Math.max(0, ...tasks.map((task) => task.duration))),
        tasks,
      }
    })
    const folder = `QA/scene-startup/${process.env.SCENE_AUDIT_LABEL || 'current'}`
    await mkdir(folder, { recursive: true })
    const label = `${isMobile ? 'mobile' : 'desktop'}-${path === '/' ? 'landing' : 'login'}`
    await writeFile(`${folder}/${label}.json`, JSON.stringify(metrics, null, 2))
    await page.screenshot({ path: `${folder}/${label}.png` })
  })
}

for (const path of ['/', '/login']) {
  test(`unfinished shaders stay hidden behind persistent artwork on ${path}`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile && path === '/login', 'Mobile login has no renderer')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route('https://accounts.google.com/**', (route) => route.abort())
    await page.addInitScript(() => {
      const state = { hold: true, checks: 0 }
      const values: number[] = []
      Object.assign(window, { sceneCompile: state, sceneProgressValues: values })
      new MutationObserver(() => {
        const meter = document.querySelector('.scene-loading')
        if (!meter) return
        const value = Number(meter.getAttribute('aria-valuenow'))
        if (values.at(-1) !== value) values.push(value)
      }).observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['aria-valuenow'],
      })
      const prototype = WebGL2RenderingContext.prototype
      const original = prototype.getProgramParameter
      prototype.getProgramParameter = function (program: WebGLProgram, parameter: number) {
        if (parameter === 0x91b1 && state.hold) {
          state.checks++
          return false
        }
        return original.call(this, program, parameter)
      }
    })
    const canvas = page.locator(
      path === '/' ? '.scene-container canvas' : '.login-scene-canvas canvas',
    )
    const art = page.locator(
      path === '/' ? '.wallet-placeholder' : '.ws-login-spatial-space > .login-sculpture-fallback',
    )
    const preview = art.locator('.wallet-placeholder-art')
    try {
      await page.goto(path)
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as typeof window & { sceneCompile: { checks: number } }).sceneCompile.checks,
          ),
        )
        .toBeGreaterThan(0)
      await expect(canvas).toHaveAttribute('data-scene-stage', 'compiling')
      await expect(page.locator('.scene-renderer')).toHaveCSS('opacity', '0')
      await expect(art).toBeVisible()
      await expect(preview).toHaveCSS('filter', /blur\(/)
      expect(Number(await preview.evaluate((node) => getComputedStyle(node).opacity))).toBeLessThan(
        0.5,
      )
      const meter = page.getByRole('progressbar', { name: 'Chuẩn bị không gian 3D' })
      await expect(meter).toHaveAttribute('aria-valuenow', '60')
      await expect(meter).toBeVisible()
      await expect(meter).toHaveCSS('filter', 'none')
      await expect(meter).toHaveCSS('opacity', '1')
      await page.screenshot({
        path: `QA/scene-startup/${isMobile ? 'mobile' : 'desktop'}-${path === '/' ? 'landing' : 'login'}-progress-dark.png`,
      })
      await art.evaluate((node) => node.setAttribute('data-persistent-art', 'yes'))
      if (path === '/login') await page.getByLabel('Email của bạn').fill('hidden-model@example.com')
      await page.locator('.theme-toggle').first().click()
      await expect(canvas).toHaveAttribute('data-palette', 'light')
      await expect(preview).toHaveCSS('filter', /blur\(/)
      await expect(meter).toHaveAttribute('aria-valuenow', '60')
      await expect(meter.locator('.scene-loading-fill')).toHaveCSS(
        'background-color',
        'rgb(29, 95, 174)',
      )
      await expect(page.locator('.scene-renderer')).toHaveCSS('opacity', '0')
      await page.screenshot({
        path: `QA/scene-startup/${isMobile ? 'mobile' : 'desktop'}-${path === '/' ? 'landing' : 'login'}-compiling.png`,
      })
    } finally {
      await page.evaluate(() => {
        ;(window as typeof window & { sceneCompile: { hold: boolean } }).sceneCompile.hold = false
      })
    }
    await expect(canvas).toHaveAttribute('data-scene-stage', 'ready', { timeout: 30_000 })
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as typeof window & { sceneProgressValues: number[] }).sceneProgressValues.at(-1),
        ),
      )
      .toBe(100)
    const values = await page.evaluate(
      () => (window as typeof window & { sceneProgressValues: number[] }).sceneProgressValues,
    )
    expect(values).toContain(60)
    expect(values.at(-1)).toBe(100)
    expect(values.every((value, index) => index === 0 || value >= values[index - 1])).toBe(true)
    await expect(page.getByRole('progressbar', { name: 'Chuẩn bị không gian 3D' })).toHaveCount(0)
    await expect(page.locator('.scene-renderer')).toHaveCSS('opacity', '1')
    await expect(art).toBeHidden()
    // The outgoing preview stays soft instead of flashing sharp during its fade.
    await expect(preview).toHaveCSS('filter', /blur\(/)
    await expect(page.locator('.scene-renderer')).toHaveCSS('filter', 'none')
    await expect(art).toHaveAttribute('data-persistent-art', 'yes')
    if (path === '/login')
      await expect(page.getByLabel('Email của bạn')).toHaveValue('hidden-model@example.com')
    await page.screenshot({
      path: `QA/scene-startup/${isMobile ? 'mobile' : 'desktop'}-${path === '/' ? 'landing' : 'login'}-revealed.png`,
    })
  })
}

test('landing pauses offscreen and returns without rebuilding its canvas', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('.scene-container canvas')
  await expect(canvas).toHaveAttribute('data-scene-stage', 'ready', { timeout: 30_000 })
  await canvas.evaluate((node) => Object.assign(window, { retainedSceneCanvas: node }))
  await page.locator('.site-footer').scrollIntoViewIfNeeded()
  await expect(canvas).toBeAttached()
  await expect(canvas).toHaveAttribute('data-render-loop', 'demand')
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(canvas).toHaveAttribute('data-render-loop', 'always')
  expect(
    await canvas.evaluate(
      (node) =>
        node === (window as typeof window & { retainedSceneCanvas: Element }).retainedSceneCanvas,
    ),
  ).toBe(true)
  await expect(canvas).toHaveAttribute('data-scene-stage', 'ready')
})
