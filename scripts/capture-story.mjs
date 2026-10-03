import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

await mkdir('test-results/story', { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
})
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await page.goto('http://localhost:3000')
await page.locator('.scene-container canvas').waitFor()
await page.evaluate(() => document.fonts.ready)
for (const [device, width, height] of [
  ['desktop', 1440, 1000],
  ['mobile', 390, 844],
]) {
  await page.setViewportSize({ width, height })
  for (const [label, progress] of [
    ['wallet', 0],
    ['sharing', 0.33],
    ['bills', 0.47],
    ['insight', 0.71],
    ['saving', 0.93],
  ]) {
    await page.evaluate((value) => {
      const hero = document.querySelector('.hero-shell')
      window.scrollTo({
        top: value === 0 ? 0 : hero.offsetTop + (hero.offsetHeight - innerHeight) * value,
        behavior: 'instant',
      })
    }, progress)
    await page.waitForTimeout(850)
    await page.screenshot({ path: `test-results/story/${device}-${label}.png` })
    console.log(device, label, await page.locator('.hero').getAttribute('data-scene'))
  }
  for (const section of ['features', 'dreams']) {
    await page.locator(`.${section}-section`).scrollIntoViewIfNeeded()
    await page.waitForTimeout(850)
    await page.screenshot({ path: `test-results/story/${device}-${section}.png` })
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
}
expect(errors).toEqual([])
console.log('Page errors:', errors)
await browser.close()
