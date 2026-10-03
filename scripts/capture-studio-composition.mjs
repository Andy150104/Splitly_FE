import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const output = 'QA/studio-composition'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const errors = []
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/api/**', (route) => route.abort())
  for (const [name, width, height] of [
    ['wide', 2348, 1216],
    ['desktop', 1594, 830],
    ['compact', 1100, 760],
    ['mobile-low', 390, 664],
  ]) {
    await page.setViewportSize({ width, height })
    await page.goto('http://localhost:3000/')
    await page.locator('main[data-hydrated=true]').waitFor()
    await page.locator('.scene-container canvas').waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1600)
    await page.screenshot({ path: `${output}/${name}.png` })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
  }
  await page.setViewportSize({ width: 1594, height: 830 })
  await page.goto('http://localhost:3000/')
  const spin = page.getByRole('button', { name: 'Xoay vật thể 3D' })
  await expect(spin).toBeEnabled()
  await page.waitForTimeout(1600)
  await spin.click()
  await page.waitForTimeout(650)
  await page.screenshot({ path: `${output}/turning.png` })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${output}/turned.png` })
  expect(errors).toEqual([])
  console.log('Reviewed four landing sizes, spin interaction, overflow and browser errors.')
} finally {
  await browser.close()
}
