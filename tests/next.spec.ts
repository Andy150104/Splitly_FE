import { test, expect } from '@playwright/test'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Next.js serves homepage HTML and hydrates without errors (${reducedMotion})`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.emulateMedia({ reducedMotion })
    // A different client clock must not change the HTML during hydration.
    await page.clock.setFixedTime(new Date('2027-01-01T01:00:00+07:00'))
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    const html = await response!.text()
    expect(html).toContain('id="hero-title"')
    expect(html).toContain('/_next/static/')
    expect(html).not.toContain('/@vite/client')
    await expect(page.locator('.scene-container canvas')).toBeVisible()
    await page.getByRole('button', { name: 'Mình bắt đầu cùng Splitly như thế nào?' }).click()
    await expect(page.locator('#faq-2')).toBeVisible()
    await page.reload()
    await expect(page.locator('main[data-hydrated="true"]')).toBeAttached()
    await expect(page.getByRole('button', { name: 'BẮT ĐẦU', exact: true })).toBeEnabled()
    expect(errors).toEqual([])
  })
}
