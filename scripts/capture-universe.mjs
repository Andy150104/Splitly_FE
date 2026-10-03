import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const output = 'QA/universe'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const errors = []
const results = []
try {
  const context = await browser.newContext({
    viewport: { width: 1594, height: 830 },
    deviceScaleFactor: 1,
    recordVideo: { dir: output + '/videos', size: { width: 1594, height: 830 } },
  })
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route('**/api/**', (route) => route.abort())
  await page.goto('http://localhost:3000/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  const canvas = page.locator('.scene-container canvas')
  await expect(canvas).toHaveAttribute('data-animation', 'floating', { timeout: 20000 })
  await page.screenshot({ path: output + '/desktop.png' })
  await expect(canvas).toHaveAttribute('data-animation', 'flight', { timeout: 18000 })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: output + '/flight.png' })
  await page.waitForTimeout(4000)
  await page.getByRole('button', { name: 'Xoay vật thể 3D' }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: output + '/inspect.png' })
  await page.waitForTimeout(1700)
  await page.evaluate(() => {
    const hero = document.querySelector('.hero-shell')
    scrollTo({
      top: hero.offsetTop + (hero.offsetHeight - innerHeight) * 0.29,
      behavior: 'instant',
    })
  })
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'sharing')
  await page.waitForTimeout(700)
  await page.screenshot({ path: output + '/sharing.png' })
  await context.close()
  await page.video().saveAs(output + '/universe-tour.webm')

  const sizePage = await browser.newPage({ deviceScaleFactor: 1 })
  sizePage.on('pageerror', (e) => errors.push(e.message))
  await sizePage.route('**/api/**', (route) => route.abort())
  for (const [name, width, height] of [
    ['phone', 360, 780],
    ['mobile-low', 390, 664],
    ['tablet', 768, 1024],
    ['tablet-low', 768, 700],
    ['compact', 1100, 760],
    ['desktop-standard', 1440, 1000],
    ['full-hd', 1920, 1080],
    ['wide', 2432, 1440],
  ]) {
    await sizePage.setViewportSize({ width, height })
    await sizePage.goto('http://localhost:3000/')
    await sizePage.evaluate(() => document.fonts.ready)
    await expect(sizePage.locator('.scene-container canvas')).toHaveAttribute(
      'data-animation',
      'floating',
      { timeout: 20000 },
    )
    await sizePage.screenshot({ path: output + '/' + name + '.png' })
    const cta = await sizePage.locator('.hero-cta').boundingBox()
    const title = await sizePage.locator('.hero h1').boundingBox()
    const header = await sizePage.locator('.site-header-shell').boundingBox()
    const overflow = await sizePage.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    )
    expect(overflow).toBe(false)
    expect(cta.y + cta.height).toBeLessThan(height)
    expect(title.y).toBeGreaterThanOrEqual(header.y + header.height)
    results.push({ name, width, height, overflow, ctaBottom: cta.y + cta.height })
  }
  await sizePage.emulateMedia({ reducedMotion: 'reduce' })
  await sizePage.goto('http://localhost:3000/')
  await expect(sizePage.locator('.scene-container canvas')).toHaveAttribute(
    'data-animation',
    'static',
  )
  await sizePage.screenshot({ path: output + '/reduced-motion.png' })
  expect(errors).toEqual([])
  await writeFile(output + '/review.json', JSON.stringify({ results, errors }, null, 2))
  console.log(
    'Universe screenshots, video, visible CTA and overflow checked.',
    JSON.stringify(results),
  )
} finally {
  await browser.close()
}
