import { chromium } from '@playwright/test'
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto('http://localhost:3000')
await page.locator('.scene-container canvas').waitFor()
await page.evaluate(() => document.fonts.ready)
for (const p of [0.33, 0.56, 0.86, 0.56]) {
  await page.evaluate((p) => {
    const el = document.querySelector('.hero-shell')
    scrollTo({ top: el.offsetTop + (el.offsetHeight - innerHeight) * p, behavior: 'instant' })
  }, p)
  await page.waitForTimeout(100)
}
await page.waitForTimeout(350)
const frame = await page.locator('canvas').screenshot({ path: 'test-results/stop-a.png' })
console.log(
  await page.evaluate(() => ({
    y: scrollY,
    animations: document
      .getAnimations()
      .map((a) => ({ time: a.currentTime, target: a.effect?.target?.className })),
    scene: document.querySelector('.hero').dataset.scene,
  })),
)
await page.waitForTimeout(650)
const next = await page.locator('canvas').screenshot({ path: 'test-results/stop-b.png' })
console.log(
  'equal',
  frame.equals(next),
  await page.evaluate(() => ({
    y: scrollY,
    animations: document
      .getAnimations()
      .map((a) => ({ time: a.currentTime, target: a.effect?.target?.className })),
  })),
)
await browser.close()
