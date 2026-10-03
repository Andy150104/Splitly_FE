import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const output = 'QA/login-assembled-scene'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
// This visual review never sends authentication requests to the backend.
await page.route('**/api/**', (route) => route.abort())
try {
  for (const [name, width, height] of [
    ['wide', 2348, 1216],
    ['desktop', 1550, 826],
    ['short-desktop', 1594, 830],
    ['compact', 1100, 760],
    ['low-desktop', 1366, 640],
    ['mobile', 390, 844],
  ]) {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('http://localhost:3000/login')
    await page.getByRole('heading', { name: /Đăng nhập/ }).waitFor()
    if (width > 900) await page.locator('canvas').waitFor()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${output}/${name}.png` })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    if (width > 900) {
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
        height,
      )
      const front = await page.locator('.ws-auth-card').evaluate((element) => {
        const b = element.getBoundingClientRect()
        return element.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2))
      })
      expect(front).toBe(true)
    }
    const submit = await page
      .getByRole('button', { name: 'Gửi mã đăng nhập', exact: true })
      .boundingBox()
    expect(submit.y + submit.height).toBeLessThan(height)
  }
  await page.setViewportSize({ width: 1550, height: 826 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('http://localhost:3000/login')
  const control = page.getByRole('button', { name: 'Tương tác với ví Splitly' })
  await control.waitFor()
  await page.locator('canvas').waitFor()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${output}/idle-start.png` })
  await page.waitForTimeout(4300)
  await page.screenshot({ path: `${output}/idle-flourish.png` })
  await page.waitForTimeout(4000)
  await page.screenshot({ path: `${output}/idle-return.png` })
  const bounds = await control.boundingBox()
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width * 0.75, bounds.y + bounds.height * 0.7, {
    steps: 12,
  })
  await expect(page.locator('.login-spatial-scene')).toHaveAttribute('data-interaction', 'dragging')
  await page.waitForTimeout(180)
  await page.screenshot({ path: `${output}/dragging.png` })
  await page.mouse.up()
  await expect(page.locator('.login-spatial-scene')).toHaveAttribute('data-interaction', 'pulse')
  await page.waitForTimeout(380)
  await page.screenshot({ path: `${output}/pulse.png` })
  await page.waitForTimeout(1600)
  await page.screenshot({ path: `${output}/click-separated.png` })
  await expect(page.locator('.login-spatial-scene')).toHaveAttribute('data-interaction', 'rest', {
    timeout: 8000,
  })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${output}/click-assembled.png` })
  await control.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.login-spatial-scene')).toHaveAttribute('data-interaction', 'pulse')
  await page.getByLabel('Email của bạn').fill('visual-review@example.com')
  await expect(page.getByLabel('Email của bạn')).toHaveValue('visual-review@example.com')
  expect(errors).toEqual([])
  console.log(
    'Reviewed 6 viewport sizes, no desktop scrolling, foreground form, idle choreography, drag/release, keyboard pulse, and email input.',
  )
} finally {
  await browser.close()
}
