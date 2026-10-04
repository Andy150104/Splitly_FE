import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const base = process.env.PREVIEW_URL || 'http://localhost:3001'
const output = process.argv[2] || 'QA/initial-load'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const reports = []
try {
  for (const width of [390, 1440]) {
    for (const route of ['/', '/login']) {
      const context = await browser.newContext({ viewport: { width, height: 900 } })
      const page = await context.newPage()
      await page.route('**/api/**', (request) => request.abort())
      await page.route('https://accounts.google.com/**', (request) => request.abort())
      const cdp = await context.newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await page.addInitScript(() => {
        window.loadAudit = { lcp: 0, longTasks: 0 }
        new PerformanceObserver((entries) => {
          window.loadAudit.lcp = entries.getEntries().at(-1).startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        new PerformanceObserver((entries) => {
          window.loadAudit.longTasks += entries.getEntries().reduce((sum, e) => sum + e.duration, 0)
        }).observe({ type: 'longtask', buffered: true })
      })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(base + route, { waitUntil: 'domcontentloaded' })
      const primary = page.locator(route === '/' ? '#hero-title' : '.ws-auth-card h2')
      await primary.waitFor({ state: 'visible' })
      await page.waitForTimeout(5000)
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0]
        const resources = performance.getEntriesByType('resource')
        const scripts = resources.filter(
          (e) => e.name.includes('/_next/') && e.name.includes('.js'),
        )
        return {
          ttfb: Math.round(navigation.responseStart),
          fcp: Math.round(
            performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          ),
          lcp: Math.round(window.loadAudit.lcp),
          longTasks: Math.round(window.loadAudit.longTasks),
          javascriptKB: Math.round(scripts.reduce((sum, e) => sum + e.encodedBodySize, 0) / 1024),
          scriptCount: scripts.length,
          canvas: document.querySelectorAll('canvas').length,
          overflow: document.documentElement.scrollWidth > innerWidth,
        }
      })
      await page.screenshot({
        path: join(output, `${width}-${route === '/' ? 'landing' : 'login'}.png`),
      })
      const noJs = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width, height: 900 },
      })
      const htmlPage = await noJs.newPage()
      await htmlPage.goto(base + route, { waitUntil: 'domcontentloaded' })
      const primaryWithoutJs = await htmlPage
        .locator(route === '/' ? '#hero-title' : '.ws-auth-card')
        .evaluate((node) => {
          for (let current = node; current; current = current.parentElement) {
            const style = getComputedStyle(current)
            if (
              Number(style.opacity) === 0 ||
              style.display === 'none' ||
              style.visibility === 'hidden'
            )
              return false
          }
          return true
        })
      reports.push({ route, width, ...metrics, primaryWithoutJs, errors })
      await noJs.close()
      await context.close()
    }
  }
} finally {
  await browser.close()
}
await writeFile(join(output, 'report.json'), JSON.stringify(reports, null, 2))
console.table(reports.map(({ errors, ...report }) => ({ ...report, errors: errors.length })))
