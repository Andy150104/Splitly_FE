import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

await mkdir('QA/design-references', { recursive: true })
const image = await fetch('https://framerusercontent.com/images/PlPO4Mch20CSK6e0huAoTD1yAws.png?height=2004&width=3572')
if (image.ok) await writeFile('QA/design-references/hermetica.png', Buffer.from(await image.arrayBuffer()))
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  for (const [name, url] of [['everswap', 'https://everswap.com/'], ['spline-finance', 'https://spline.design/solutions/finance-and-banking']]) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(4500)
      await page.screenshot({ path: `QA/design-references/${name}.png` })
      console.log(name, await page.title())
    } catch (error) { console.log(name, error.message) }
  }
} finally { await browser.close() }
