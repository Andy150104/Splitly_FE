import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

await mkdir('test-results/video', { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: { dir: 'test-results/video', size: { width: 1440, height: 1000 } },
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await page.goto('http://localhost:3000')
await page.locator('.scene-container canvas').waitFor()
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1200)
await page.mouse.move(680, 400)
for (let i = 0; i < 23; i++) {
  await page.mouse.wheel(0, 145)
  await page.waitForTimeout(450)
}
await page.waitForTimeout(600)
for (let i = 0; i < 10; i++) {
  await page.mouse.wheel(0, -145)
  await page.waitForTimeout(300)
}
await page.getByRole('button', { name: 'Xoay vật thể 3D' }).click()
await page.waitForTimeout(1900)
await page.screenshot({ path: 'test-results/video/vertical-flight.png' })
await context.close()
await page.video().saveAs('test-results/video/vertical-journey.webm')
console.log('Recorded actual wheel scrolling. Page errors:', errors)
await browser.close()
