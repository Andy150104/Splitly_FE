import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
})
const page = await context.newPage()
await page.goto('http://localhost:3000')
// Reveal each section before checking its text contrast.
for (const selector of ['#discover', '#workspace', '#dreams', '.site-footer']) {
  await page.locator(selector).scrollIntoViewIfNeeded()
  await page.waitForTimeout(150)
}
await page.waitForTimeout(1000)
let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
console.log(
  'HOME',
  JSON.stringify(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        html: n.html,
        data: n.any.map((x) => x.data),
      })),
    })),
  ),
)
await page.getByRole('button', { name: 'Bắt đầu cùng mơ.' }).click()
result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
console.log(
  'WALLET',
  JSON.stringify(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        html: n.html,
        data: n.any.map((x) => x.data),
      })),
    })),
  ),
)
await page.getByRole('button', { name: 'Đóng ví', exact: true }).click()
await page.setViewportSize({ width: 768, height: 900 })
console.log(
  'OVERFLOW',
  await page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .map((el) => ({
        tag: el.tagName,
        class: el.className,
        rect: el.getBoundingClientRect().toJSON(),
      }))
      .filter((e) => e.rect.right > innerWidth + 1 && e.rect.width < innerWidth * 2),
  ),
)
await browser.close()
