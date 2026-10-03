import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const output = 'QA/scroll-polish'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const errors = []
const results = []
const poses = [
  ['sharing', 0.29],
  ['bills', 0.47],
  ['insight', 0.665],
  ['saving', 0.88],
]
function watch(page) {
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && /THREE|Shader|WebGL|GSAP|TypeError/.test(message.text()))
      errors.push(message.text())
  })
}
async function move(page, progress, duration = 0) {
  await page.evaluate(
    ({ progress, duration }) => {
      const hero = document.querySelector('.hero-shell')
      const target = hero.offsetTop + (hero.offsetHeight - innerHeight) * progress
      if (!duration) return scrollTo({ top: target, behavior: 'instant' })
      const from = scrollY
      const start = performance.now()
      const frame = (now) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = t * t * (3 - 2 * t)
        scrollTo({ top: from + (target - from) * eased, behavior: 'instant' })
        if (t < 1) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    },
    { progress, duration },
  )
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: { dir: output + '/videos', size: { width: 1440, height: 1000 } },
  })
  const page = await context.newPage()
  watch(page)
  await page.route('**/api/**', (route) => route.abort())
  await page.goto('http://localhost:3000/')
  await page.evaluate(() => document.fonts.ready)
  const canvas = page.locator('.scene-container canvas')
  await expect(canvas).toHaveAttribute('data-animation', 'floating', { timeout: 20000 })
  for (const [name, progress] of poses) {
    await move(page, progress, 2000)
    await expect(canvas).toHaveAttribute('data-particles', 'moving')
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${output}/${name}-moving.png` })
    await page.waitForTimeout(1700)
    await expect(canvas).toHaveAttribute('data-particles', 'settled')
    await page.screenshot({ path: `${output}/${name}.png` })
  }
  await page.locator('.narrative-saving .experiment-action').click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: output + '/saving-deposit.png' })
  await move(page, 0.47, 2000)
  await page.waitForTimeout(2400)
  await page.locator('.narrative-bills .experiment-action').click()
  await page.waitForTimeout(700)
  await page.screenshot({ path: output + '/bill-paid.png' })
  await context.close()
  await page.video().saveAs(output + '/scroll-tour.webm')

  const sizePage = await browser.newPage()
  watch(sizePage)
  await sizePage.route('**/api/**', (route) => route.abort())
  for (const [name, width, height] of [
    ['mobile', 390, 664],
    ['tablet-low', 768, 700],
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
    for (const [scene, progress] of poses.slice(1)) {
      await move(sizePage, progress)
      await expect(sizePage.locator('.hero')).toHaveAttribute('data-scene', scene)
      await sizePage.waitForTimeout(650)
      await sizePage.screenshot({ path: `${output}/${name}-${scene}.png` })
      const overflow = await sizePage.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
      const copy = await sizePage.locator(`.narrative-${scene} .narrative-copy`).boundingBox()
      const header = await sizePage.locator('.site-header-shell').boundingBox()
      expect(overflow).toBe(false)
      expect(copy.y).toBeGreaterThan(header.y + header.height)
      expect(copy.y + copy.height).toBeLessThan(height)
      results.push({ name, width, height, scene, overflow })
    }
  }
  await sizePage.emulateMedia({ reducedMotion: 'reduce' })
  await sizePage.goto('http://localhost:3000/')
  await expect(sizePage.locator('.scene-container canvas')).toHaveAttribute(
    'data-particles',
    'disabled',
  )
  await sizePage.screenshot({ path: output + '/reduced-motion.png' })
  const fallback = await browser.newPage({ viewport: { width: 390, height: 664 } })
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...args)
    }
  })
  await fallback.goto('http://localhost:3000/')
  await expect(fallback.locator('.wallet-fallback')).toBeVisible()
  await expect(fallback.locator('.hero-cta')).toBeVisible()
  await fallback.screenshot({ path: output + '/fallback.png' })
  expect(errors).toEqual([])
  await writeFile(output + '/review.json', JSON.stringify({ results, errors }, null, 2))
  console.log(
    'Scroll particles, all three materials, responsive views, reduced motion and fallback checked.',
  )
} finally {
  await browser.close()
}
