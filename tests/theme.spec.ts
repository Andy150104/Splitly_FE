import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  fixtureAdminData,
  mockWorkspace,
  permissions,
  provisionSession,
  billId,
} from './helpers/workspace'

test('theme keeps dark as default and remembers the choice across public and workspace routes', async ({
  page,
  context,
}) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydration|hydrated/i.test(message.text()))
      errors.push(message.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const dark = await page
    .locator('.hero-shell')
    .evaluate((node) => getComputedStyle(node).backgroundColor)
  await page.getByRole('button', { name: 'Chuyển sang chế độ sáng', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await page.evaluate(() => localStorage.getItem('splitly.theme'))).toBe('light')
  await page.goto('/login')
  await expect(
    page.getByRole('button', { name: 'Chuyển sang chế độ tối', exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  const other = await context.newPage()
  await other.route('https://accounts.google.com/**', (route) => route.abort())
  await other.goto('/login')
  await other.getByRole('button', { name: 'Chuyển sang chế độ tối', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await other.close()
  await page.goto('/')
  expect(
    await page.locator('.hero-shell').evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe(dark)
  await page.getByRole('button', { name: 'Chuyển sang chế độ sáng', exact: true }).click()
  await mockWorkspace(page)
  await page.goto('/dashboard')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Chuyển sang chế độ tối', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('.workspace')).toHaveCSS('background-color', 'rgb(11, 11, 18)')
  expect(errors).toEqual([])
})

test('saved light preference is applied before the first visible frame and storage failures stay usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('splitly.theme', 'light')
    const frames: string[] = []
    Object.assign(window, { themeFrames: frames })
    const sample = () => {
      if (document.body && document.querySelector('main'))
        frames.push(document.documentElement.dataset.theme || '')
      if (frames.length < 10) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  await page.goto('/login')
  await expect(
    page.getByRole('button', { name: 'Chuyển sang chế độ tối', exact: true }),
  ).toBeVisible()
  const frames = await page.evaluate(
    () => (window as typeof window & { themeFrames: string[] }).themeFrames,
  )
  expect(frames.length).toBeGreaterThan(0)
  expect(frames.every((frame) => frame === 'light')).toBe(true)
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable')
    }
  })
  await page.getByRole('button', { name: 'Chuyển sang chế độ tối', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Chuyển sang chế độ sáng', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('landing artwork and every 3D chapter turn blue in light mode and restore violet in dark', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const canvas = page.locator('.scene-container canvas')
  await expect(canvas).toHaveAttribute('data-palette', 'dark')
  await expect(canvas).toHaveAttribute('data-scene-stage', 'ready', { timeout: 30_000 })
  await expect(page.locator('.wallet-placeholder')).toHaveAttribute('data-state', 'ready')
  // Sample the rendered pixels, so material colors, textures and lighting are all covered.
  const pigments = async () => {
    const frame = (await canvas.screenshot()).toString('base64')
    return page.evaluate(async (png) => {
      const image = new Image()
      image.src = `data:image/png;base64,${png}`
      await image.decode()
      const sample = document.createElement('canvas')
      sample.width = image.width
      sample.height = image.height
      const ctx = sample.getContext('2d')!
      ctx.drawImage(image, 0, 0)
      const pixels = ctx.getImageData(0, 0, sample.width, sample.height).data
      let blue = 0
      let violet = 0
      for (let index = 0; index < pixels.length; index += 4) {
        const [r, g, b] = [pixels[index], pixels[index + 1], pixels[index + 2]]
        if (Math.max(r, g, b) - Math.min(r, g, b) < 18) continue
        if (g > r * 1.06 && b > g * 1.015) blue++
        if (r > g * 1.04 && b > g * 1.04) violet++
      }
      return { blue, violet }
    }, frame)
  }
  const dark = await pigments()
  expect(dark.violet).toBeGreaterThan(dark.blue)
  await page.getByRole('button', { name: 'Chuyển sang chế độ sáng', exact: true }).click()
  await expect(canvas).toHaveAttribute('data-palette', 'light')
  const light = await pigments()
  expect(light.blue).toBeGreaterThan(light.violet * 3)
  const placeholder = page.locator('.wallet-placeholder stop').first()
  await expect(placeholder).toHaveCSS('stop-color', 'rgb(136, 175, 213)')
  await page.getByRole('button', { name: 'Chuyển sang chế độ tối', exact: true }).click()
  await expect(canvas).toHaveAttribute('data-palette', 'dark')
  expect((await pigments()).violet).toBeGreaterThan(light.violet)
  await expect(placeholder).toHaveCSS('stop-color', 'rgb(130, 101, 175)')
  await page.getByRole('button', { name: 'Chuyển sang chế độ sáng', exact: true }).click()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  // Motion reads the preference on mount; reload to exercise the scrolling scene.
  await page.reload()
  await expect(page.locator('.hero-shell')).toHaveClass(/hero-shell-pinned/)
  await expect(canvas).toHaveAttribute('data-palette', 'light')
  for (const [progress, chapter] of [
    [0.12, 'wallet'],
    [0.29, 'sharing'],
    [0.47, 'bills'],
    [0.66, 'insight'],
    [0.88, 'saving'],
  ] as const) {
    await page.evaluate((value) => {
      const hero = document.querySelector<HTMLElement>('.hero-shell')!
      window.scrollTo({
        top: hero.offsetTop + (hero.offsetHeight - innerHeight) * value,
        behavior: 'instant',
      })
    }, progress)
    await expect(page.locator('.hero')).toHaveAttribute('data-scene', chapter)
    await expect(page.locator('.hero-shell')).toHaveCSS('background-color', 'rgb(244, 248, 252)')
    await expect(canvas).toHaveAttribute('data-palette', 'light')
    await expect
      .poll(
        async () => {
          const colors = await pigments()
          return colors.blue > colors.violet * 3
        },
        { message: chapter },
      )
      .toBe(true)
    await page.screenshot({
      path: `QA/theme/${isMobile ? 'mobile' : 'desktop'}-landing-3d-${chapter}-blue.png`,
    })
  }
})

test('light colors cover every workspace screen, public pages and portaled controls', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => localStorage.setItem('splitly.theme', 'light'))
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  const audit = async (label: string) => {
    const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
    expect
      .soft(
        result.violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => ({ html: node.html, summary: node.failureSummary })),
        })),
        label,
      )
      .toEqual([])
    expect
      .soft(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        label,
      )
      .toBe(true)
    await page.screenshot({
      path: `QA/theme/${isMobile ? 'mobile' : 'desktop'}-${label}.png`,
      animations: 'disabled',
    })
  }
  await page.goto('/login')
  await expect(page.getByLabel('Email của bạn')).toBeVisible()
  await audit('login')
  await page.goto('/')
  await expect(page.locator('.hero-copy h1')).toBeVisible()
  await audit('landing')
  await page.locator('#details').scrollIntoViewIfNeeded()
  await audit('landing-features')
  await page.locator('.site-footer').scrollIntoViewIfNeeded()
  await audit('landing-footer')
  await mockWorkspace(page, [
    ...permissions,
    'Users.Read',
    'Roles.Read',
    'Permissions.Read',
    'Users.ReadPermissions',
    'Users.UpdatePermissions',
    'Users.UpdateRole',
    'Users.UpdateAccess',
    'SupportRequests.Read',
    'SupportRequests.Update',
  ])
  await page.route('**/api/admin/**', (route) => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = { items: [], totalCount: 0, totalPages: 0 }
    if (path === '/api/admin/users')
      data = {
        items: [
          {
            memberId: 'theme-user',
            name: 'Linh',
            email: 'friend@example.com',
            roleId: 'member',
            role: 'Thành viên',
            status: 'Active',
          },
        ],
        totalCount: 1,
        totalPages: 1,
      }
    if (path === '/api/admin/users/roles') data = [{ roleId: 'member', name: 'Thành viên' }]
    if (path === '/api/admin/users/permissions')
      data = [
        {
          code: 'Bills.Read',
          name: 'Xem hóa đơn',
          description: 'Xem thông tin hóa đơn',
          groupName: 'Hóa đơn',
          sortOrder: 0,
        },
      ]
    if (path.endsWith('/theme-user/permissions'))
      data = { effectivePermissionCodes: ['Bills.Read'] }
    if (path === '/api/admin/support-requests')
      data = {
        items: [
          {
            id: 'theme-support',
            memberName: 'Linh',
            contactEmail: 'friend@example.com',
            description: 'Thanh toán chưa cập nhật trạng thái.',
            status: 'Pending',
            type: 'PaymentIssue',
            createdAtUtc: '2026-10-01T12:00:00Z',
          },
        ],
        totalCount: 1,
        totalPages: 1,
      }
    return route.fulfill({ json: { data: fixtureAdminData(path, data) } })
  })
  await page.route('**/api/groups/theme-group', (route) =>
    route.fulfill({
      json: {
        data: {
          groupId: 'theme-group',
          name: 'Bạn cùng nhà',
          description: 'Những khoản chung trong tháng',
          status: 'Active',
          isOwner: true,
          members: [
            { memberId: 'theme-member', email: 'friend@example.com', name: 'Linh', isOwner: false },
          ],
          bills: [],
        },
      },
    }),
  )
  for (const path of [
    '/dashboard',
    '/bills',
    `/bills/${billId}`,
    '/groups',
    '/groups/theme-group',
    '/payout-accounts',
    '/support',
    '/admin/users',
    '/admin/support-requests',
  ]) {
    await page.goto(path)
    await expect(page.locator('.ws-main h1')).toBeVisible()
    await expect(page.locator('.splitly-skeleton')).toHaveCount(0)
    await audit(path.split('/').filter(Boolean).join('-'))
  }
  await page.goto('/bills/new')
  await expect(page.getByLabel('Tên hóa đơn')).toBeVisible()
  await page.getByRole('button', { name: 'Ngày hóa đơn', exact: true }).click()
  await expect(page.locator('.ws-calendar-popover')).toBeVisible()
  await audit('calendar')
  await page.keyboard.press('Escape')
  await page.goto('/payout-accounts')
  await page.getByRole('button', { name: '+ Thêm tài khoản', exact: true }).click()
  await page.getByRole('combobox', { name: 'Ngân hàng', exact: true }).click()
  await expect(page.locator('.ws-bank-popover')).toBeVisible()
  await audit('account-modal-bank-picker')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.goto('/admin/users')
  await page.getByRole('button', { name: /Linh friend@example.com/ }).click()
  await page.getByRole('tab', { name: 'Quyền hiệu lực', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: /Xem hóa đơn/ })).toBeVisible()
  await audit('permissions-modal')
  // Read-only profile/permission behavior still comes from server-rendered controls.
  await page.keyboard.press('Escape')
  await page.goto('/admin/support-requests')
  await page.getByRole('button', { name: /Linh Chờ tiếp nhận/ }).click()
  await page.getByRole('combobox', { name: 'Trạng thái xử lý' }).click()
  await audit('support-editor')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await provisionSession(page, ['Bills.Read'])
  await page.goto('/admin/users')
  await expect(
    page.getByRole('heading', { name: 'Chưa có quyền quản lý người dùng' }),
  ).toBeVisible()
  await audit('permission-denied')
})
