import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('landing and login meet structural accessibility checks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  for (const selector of ['#discover', '#details', '#workspace', '#dreams', '.site-footer']) {
    await page.locator(selector).scrollIntoViewIfNeeded()
  }
  await page.waitForTimeout(900)
  const home = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(home.violations).toEqual([])
  await page.getByRole('button', { name: 'Bắt đầu cùng Splitly', exact: true }).last().click()
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  await page.waitForTimeout(300)
  const login = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(login.violations).toEqual([])
})

test('layout fits small phones, tablets and wide desktops', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chrome',
    'Viewport sweep only needs one browser session.',
  )
  await page.goto('/')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [320, 360, 390, 640, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    const metrics = await page.evaluate(() => {
      const title = document.querySelector('h1')!.getBoundingClientRect()
      const skip = document.querySelector('.skip-link')!
      return {
        scrollWidth: document.documentElement.scrollWidth,
        width: innerWidth,
        titleRight: title.right,
        skipTop: skip.getBoundingClientRect().top,
        skipFocused: document.activeElement === skip,
      }
    })
    expect(metrics.scrollWidth, `${width}px page overflows`).toBeLessThanOrEqual(width)
    expect(metrics.titleRight, `${width}px hero heading overflows`).toBeLessThanOrEqual(width)
    expect(metrics.skipTop, `${width}px skip link should be offscreen until focused`).toBeLessThan(
      0,
    )
  }
})

test('WebGL failure falls back to a styled wallet and keeps the page usable', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).includes('webgl')) return null
      return original.apply(this, args)
    } as typeof original
  })
  await page.goto('/')
  await expect(page.locator('.fallback-wallet')).toBeVisible()
  await page.getByRole('button', { name: 'Bắt đầu cùng Splitly', exact: true }).first().click()
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  expect(errors).toEqual([])
})
