import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockWorkspace } from './helpers/workspace'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://accounts.google.com/**', (route) => route.abort())
})

test('disconnect blocks the UI and reconnect reloads the same route once', async ({
  page,
  context,
}, info) => {
  await page.goto('/login?next=%2Fbills')
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  let reloads = 0
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) reloads++
  })
  await context.setOffline(true)
  const screen = page.getByRole('dialog', { name: 'Không thể kết nối' })
  await expect(screen).toBeVisible()
  await expect(page.locator('.splitly-notifications')).toBeHidden()
  const nav = screen.getByRole('navigation', { name: 'Điều hướng Splitly' })
  await expect(nav.getByRole('link')).toHaveCount(4)
  await expect(screen.getByRole('link', { name: 'Splitly — Trang đầu', exact: true })).toBeVisible()
  await nav.getByRole('link', { name: 'Khám phá', exact: true }).click()
  await expect(screen.locator('#offline-discover')).toBeInViewport()
  await expect(screen.locator('.splitly-offline-header')).toBeInViewport()
  await nav.getByRole('link', { name: 'Trang đầu', exact: true }).click()
  await expect(screen.getByRole('heading', { name: 'Không thể kết nối' })).toBeInViewport()
  await page.keyboard.press('Escape')
  await expect(screen).toBeVisible()
  await screen.getByRole('button', { name: 'Thử lại', exact: true }).click()
  expect(reloads).toBe(0)
  const bounds = (await screen.boundingBox())!
  expect(bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  expect(bounds.height).toBeLessThanOrEqual(page.viewportSize()!.height)
  expect(await screen.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  expect((await new AxeBuilder({ page }).include('.splitly-offline').analyze()).violations).toEqual(
    [],
  )
  await page.screenshot({ path: `test-results/${info.project.name}-offline.png` })
  await context.setOffline(false)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  await expect(page).toHaveURL(/\/login\?next=%2Fbills$/)
  expect(reloads).toBe(1)
  // Repeated online signals while connected must not reload the page.
  await page.evaluate(() => {
    window.dispatchEvent(new Event('online'))
    window.dispatchEvent(new Event('focus'))
  })
  await expect.poll(() => reloads).toBe(1)
  await context.setOffline(true)
  await expect(page.getByRole('dialog', { name: 'Không thể kết nối' })).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(reloads).toBe(2)
})

test('refresh and a new tab offline use the cached screen and recover the original URL', async ({
  page,
  context,
}, info) => {
  await page.goto('/login?next=%2Fgroups')
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  await page.evaluate(() => localStorage.setItem('splitly.theme', 'light'))
  await page.waitForFunction(async () => {
    if (!navigator.serviceWorker.controller) return false
    const cache = await caches.open('splitly-offline-v2')
    return Boolean((await cache.match('/offline.html')) && (await cache.match('/offline.css')))
  })
  const assets = await page.evaluate(async () => {
    const cache = await caches.open('splitly-offline-v2')
    return (await cache.keys()).map((request) => new URL(request.url).pathname).sort()
  })
  expect(assets).toEqual([
    '/offline-fonts/barlow-condensed-latin-700-normal.woff2',
    '/offline-fonts/barlow-condensed-vietnamese-700-normal.woff2',
    '/offline-fonts/be-vietnam-pro-latin-400-normal.woff2',
    '/offline-fonts/be-vietnam-pro-vietnamese-400-normal.woff2',
    '/offline.css',
    '/offline.html',
  ])
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Không thể kết nối' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(
    await page
      .locator('.splitly-offline')
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe('rgb(244, 248, 252)')
  await page.evaluate(() => document.fonts.ready)
  expect(
    await page.evaluate(() => document.fonts.check('700 32px "Splitly Offline Display"')),
  ).toBe(true)
  const nav = page.getByRole('navigation', { name: 'Điều hướng Splitly' })
  await nav.getByRole('link', { name: 'Cùng nhau', exact: true }).click()
  await expect(page.locator('#offline-dreams')).toBeInViewport()
  await nav.getByRole('link', { name: 'Trang đầu', exact: true }).click()
  await page.screenshot({ path: `test-results/${info.project.name}-offline-cached-light.png` })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  const other = await context.newPage()
  await other.goto('/login?next=%2Fsupport')
  await expect(other.getByRole('heading', { name: 'Không thể kết nối' })).toBeVisible()
  await other.close()
  await context.setOffline(false)
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Không thể kết nối' })).toHaveCount(0)
  await expect(page).toHaveURL(/\/login\?next=%2Fgroups$/)
})

test('detects unreachable internet even with Wi-Fi and waits for a successful probe', async ({
  page,
}) => {
  let reachable = true
  let probes = 0
  await page.route('**/api/connectivity', (route) => {
    probes++
    return reachable ? route.continue() : route.abort('internetdisconnected')
  })
  await page.goto('/login')
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  await expect.poll(() => probes).toBeGreaterThan(0)
  reachable = false
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByRole('dialog', { name: 'Không thể kết nối' })).toBeVisible()
  expect(await page.evaluate(() => navigator.onLine)).toBe(true)
  let reloads = 0
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) reloads++
  })
  const previousProbes = probes
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect.poll(() => probes).toBeGreaterThan(previousProbes)
  await expect(page.getByRole('dialog', { name: 'Không thể kết nối' })).toBeVisible()
  expect(reloads).toBe(0)
  reachable = true
  // Recovery polling must work without another browser online event.
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  expect(reloads).toBe(1)
})

test('the offline screen covers workspace modals and prevents submissions', async ({
  page,
  context,
}) => {
  await mockWorkspace(page)
  await page.goto('/payout-accounts')
  await page.getByRole('button', { name: '+ Thêm tài khoản', exact: true }).click()
  await expect(page.getByLabel('Số tài khoản', { exact: true })).toBeVisible()
  let writes = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/payout-accounts')) writes++
  })
  await context.setOffline(true)
  const screen = page.getByRole('dialog', { name: 'Không thể kết nối' })
  await expect(screen).toBeVisible()
  await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  expect(await screen.evaluate((node) => node.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeFocused()
  await page.getByLabel('Số tài khoản', { exact: true }).evaluate((node) => node.focus())
  await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeFocused()
  expect(writes).toBe(0)
  await context.setOffline(false)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '+ Thêm tài khoản', exact: true })).toBeVisible()
  expect(writes).toBe(0)
})
