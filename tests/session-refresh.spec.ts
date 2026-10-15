import { test, expect } from '@playwright/test'
import { mockWorkspace, permissions, provisionSession } from './helpers/workspace'

for (const entry of ['document', 'login'] as const) {
  test(`expired access recovers without a blank page after ${entry} navigation`, async ({
    page,
  }) => {
    await mockWorkspace(page)
    await page.route('**/api/auth/refresh-session?*', (route) => {
      expect(route.request().isNavigationRequest()).toBe(true)
      return route.continue()
    })
    const expireAccess = async () => {
      await provisionSession(page)
      await page.context().addCookies([
        { name: 'mo_access', value: 'fixture-expired', url: test.info().project.use.baseURL! },
        {
          name: 'mo_refresh',
          value: `fixture-refresh.${Buffer.from(JSON.stringify(permissions)).toString('base64url')}`,
          url: test.info().project.use.baseURL!,
          httpOnly: true,
        },
      ])
    }
    if (entry === 'document') {
      await expireAccess()
      await page.goto('/dashboard?recovered=document')
    } else {
      await page.context().clearCookies()
      await page.route('**/api/auth/verify-login-code', async (route) => {
        await expireAccess()
        await route.fulfill({ json: { data: {} } })
      })
      await page.goto('/login?next=%2Fdashboard%3Frecovered%3Dlogin')
      await page.getByRole('textbox', { name: /^Email/ }).fill('owner@example.com')
      await page.getByRole('button', { name: 'Gửi mã đăng nhập' }).click()
      await page.getByRole('textbox', { name: /^Mã đăng nhập/ }).fill('fixture-code')
      await page.getByRole('button', { name: 'Bước vào không gian của bạn' }).click()
    }
    await expect(page).toHaveURL(`/dashboard?recovered=${entry}`)
    await expect(page.locator('.ws-main h1')).toBeVisible()
    await expect(page.locator('.splitly-transition')).toHaveCount(0)
    await expect(page.locator('.ws-sidebar')).toBeAttached()
    // A controlling service worker can bypass page.route for the document request.
    // Verify that refresh actually persisted the rotated fixture token in either case.
    const access = (await page.context().cookies()).find((cookie) => cookie.name === 'mo_access')
    expect(access?.value).toBe(
      `fixture.${Buffer.from(JSON.stringify(permissions)).toString('base64url')}`,
    )
    if (entry === 'login')
      await page.screenshot({
        path: `QA/session-refresh/${test.info().project.name}-recovered.png`,
        animations: 'disabled',
      })
  })
}

test('rejected refresh returns to a usable login and preserves the destination', async ({
  page,
}) => {
  await mockWorkspace(page)
  await page.route('**/api/auth/refresh-session?*', (route) => route.continue())
  await page.context().addCookies([
    { name: 'mo_access', value: 'fixture-expired', url: test.info().project.use.baseURL! },
    { name: 'mo_refresh', value: 'fixture-rejected', url: test.info().project.use.baseURL! },
  ])
  await page.goto('/dashboard?recovered=rejected')
  await expect(page).toHaveURL('/login?next=%2Fdashboard%3Frecovered%3Drejected')
  await expect(page.getByRole('heading', { name: 'Đăng nhập.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Gửi mã đăng nhập' })).toBeEnabled()
})
