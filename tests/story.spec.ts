import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as Window & { navAutoCompacted?: boolean }
    state.navAutoCompacted = false
    new MutationObserver(() => {
      if (document.querySelector('.site-header.is-auto-compact.is-collapsed'))
        state.navAutoCompacted = true
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] })
  })
})

test('five 3D story scenes follow scrolling, hold when scrolling stops, and reverse identically', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  const canvas = page.locator('.scene-container canvas')
  await expect(canvas).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const startingCanvas = await canvas.boundingBox()
  const viewport = page.viewportSize()!
  expect(
    startingCanvas!.width,
    'The hero canvas should stay broad and interactive rather than becoming a narrow right column',
  ).toBeGreaterThan(viewport.width * 0.92)
  expect(startingCanvas!.height).toBeGreaterThan(
    viewport.width <= 640 ? viewport.height * 0.35 : viewport.height * 0.58,
  )
  const scrollToProgress = async (progress: number) => {
    await page.evaluate((value) => {
      const hero = document.querySelector<HTMLElement>('.hero-shell')!
      window.scrollTo({
        top: hero.offsetTop + (hero.offsetHeight - innerHeight) * value,
        behavior: 'instant',
      })
    }, progress)
  }
  for (const [progress, scene, heading] of [
    [0.29, 'sharing', 'MỘT BỮA ĂN.'],
    [0.47, 'bills', 'VIỆC ĐẾN HẠN.'],
    [0.66, 'insight', 'NHÌN MỘT LẦN.'],
    [0.88, 'saving', 'MỘT CHÚT HÔM NAY.'],
  ] as const) {
    await scrollToProgress(progress)
    await expect(page.locator('.hero')).toHaveAttribute('data-scene', scene)
    await expect(page.locator('.hero-copy-motion')).toHaveCSS('opacity', '0')
    await expect(page.locator(`.narrative-${scene}`)).toHaveCSS('opacity', '1')
    await expect(page.locator(`.narrative-${scene}`)).toContainText(heading)
    expect(
      await page.evaluate(() =>
        Math.abs(
          document.querySelector('.hero')!.getBoundingClientRect().top -
            document.querySelector('.site-header-shell')!.getBoundingClientRect().bottom,
        ),
      ),
    ).toBeLessThan(2)
    await expect(canvas).toHaveCount(1)
    const currentCanvas = await canvas.boundingBox()
    expect(currentCanvas!.width).toBeGreaterThan(viewport.width * 0.92)
    expect(currentCanvas!.height).toBeGreaterThan(
      viewport.width <= 640 ? viewport.height * 0.35 : viewport.height * 0.58,
    )
    const viewportCenter = await page.evaluate(() => innerWidth / 2)
    expect(
      Math.abs(currentCanvas!.x + currentCanvas!.width / 2 - viewportCenter),
      'The full 3D stage should stay centered instead of being parked in the right corner',
    ).toBeLessThan(18)
  }
  await scrollToProgress(0.47)
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'bills')
  await page.waitForTimeout(350)
  const stoppedFrame = await canvas.screenshot({
    path: `test-results/${testInfo.project.name}-hold-a.png`,
  })
  await page.waitForTimeout(600)
  expect(
    (await canvas.screenshot({ path: `test-results/${testInfo.project.name}-hold-b.png` })).equals(
      stoppedFrame,
    ),
    'A stopped scroll must hold the 3D pose',
  ).toBe(true)
  await scrollToProgress(0.88)
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'saving')
  await scrollToProgress(0.47)
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'bills')
  await page.waitForTimeout(350)
  expect(
    (await canvas.screenshot()).equals(stoppedFrame),
    'Returning to the same scroll position must reproduce the model pose',
  ).toBe(true)
  await scrollToProgress(0)
  await expect(page.locator('.hero-copy-motion')).toHaveCSS('opacity', '1')
  await expect(
    page.locator('.hero').getByRole('button', { name: 'Bắt đầu cùng Splitly', exact: true }),
  ).toBeVisible()
})

test('wide desktop uses the full 2K stage instead of a capped 1600px island', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'))
  await page.setViewportSize({ width: 2432, height: 1440 })
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  const canvas = page.locator('.scene-container canvas')
  await expect(canvas).toBeVisible()
  const box = (await canvas.boundingBox())!
  expect(box.width).toBeGreaterThan(2300)
  expect(box.height).toBeGreaterThan(1050)
  expect(Math.abs(box.x + box.width / 2 - 1216)).toBeLessThan(12)
})

test('the inspect control turns the real 3D object while preserving the scroll chapter', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>('.hero-shell')!
    window.scrollTo({
      top: hero.offsetTop + (hero.offsetHeight - innerHeight) * 0.47,
      behavior: 'instant',
    })
  })
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'bills')
  const canvas = page.locator('.scene-container canvas')
  const before = await canvas.screenshot()
  await page.getByRole('button', { name: 'Xoay vật thể 3D' }).click()
  await page.waitForTimeout(350)
  expect((await canvas.screenshot()).equals(before)).toBe(false)
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'bills')
  await page.waitForTimeout(1500)
  const settled = await canvas.screenshot()
  await page.waitForTimeout(300)
  expect((await canvas.screenshot()).equals(settled)).toBe(true)
})

test('the 3D stage reacts to direct mouse dragging, not only the rotate button', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  const canvas = page.locator('.scene-container canvas')
  await expect(canvas).toBeVisible()
  await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>('.hero-shell')!
    window.scrollTo({
      top: hero.offsetTop + (hero.offsetHeight - innerHeight) * 0.12,
      behavior: 'instant',
    })
  })
  await page.waitForTimeout(250)
  const box = (await canvas.boundingBox())!
  const before = await canvas.screenshot()
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.68, box.y + box.height * 0.42, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(120)
  expect((await canvas.screenshot()).equals(before)).toBe(false)
})

test('chapter controls navigate the story without remounting its canvas', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Chuyển tới cảnh Chia tiền', exact: true }).click()
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'sharing')
  await page.getByRole('button', { name: 'Chuyển tới cảnh Nhìn rõ', exact: true }).click()
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'insight')
  await page.getByRole('button', { name: 'Chuyển tới cảnh Để dành', exact: true }).click()
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'saving')
  await page.getByRole('button', { name: 'Chuyển tới cảnh Mở ví', exact: true }).click()
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'wallet')
  await expect(page.locator('.scene-container canvas')).toHaveCount(1)
})

test('the cinematic story resolves into the editorial transition before product detail', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  const resolution = page.locator('.story-resolution')
  await expect(resolution).toContainText('VẪN LÀ TIỀN CỦA BẠN.')
  await expect(resolution).toContainText('CHỈ LÀ DỄ THỞ HƠN.')
  await expect(page.locator('.story-resolution-rail')).toContainText('RỐI')
  await expect(page.locator('.story-resolution-rail')).toContainText('VUI')
})

test('floating glass nav turns into a useful story HUD while scrolling', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  const nav = page.locator('.site-header')
  await expect(nav).toBeVisible()
  await page.waitForTimeout(550)

  const box = (await nav.boundingBox())!
  const viewport = page.viewportSize()!
  const link = nav.getByRole('link', { name: 'Trang đầu' })

  expect(box.width).toBeLessThan(viewport.width * (viewport.width <= 860 ? 0.98 : 0.8))
  expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(3)
  expect(box.y).toBeGreaterThanOrEqual(7)
  expect(await nav.evaluate((node) => getComputedStyle(node).borderRadius)).toBe('999px')
  expect(await nav.evaluate((node) => getComputedStyle(node).backdropFilter)).not.toBe('none')

  if (!testInfo.project.name.includes('mobile')) {
    expect(
      parseFloat(await link.evaluate((node) => getComputedStyle(node).fontSize)),
    ).toBeGreaterThanOrEqual(13)
    expect(
      (await nav.getByRole('button', { name: 'BẮT ĐẦU' }).boundingBox())!.height,
    ).toBeGreaterThanOrEqual(50)
    await expect(link).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('.nav-story-teaser')).toContainText('01')
    await expect(page.locator('.nav-story-teaser')).toContainText('05')

    const before = (await nav.boundingBox())!
    await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>('.hero-shell')!
      window.scrollTo({
        top: hero.offsetTop + (hero.offsetHeight - innerHeight) * 0.47,
        behavior: 'instant',
      })
    })
    await expect(nav).toHaveClass(/is-scrolled/)
    await expect(nav).toHaveClass(/is-story-mode/)
    await expect
      .poll(() =>
        page.evaluate(() => (window as Window & { navAutoCompacted?: boolean }).navAutoCompacted),
      )
      .toBe(true)
    await page.waitForTimeout(440)
    await expect(nav).not.toHaveClass(/is-auto-compact/)
    await expect(page.locator('.nav-context')).toBeVisible()
    await expect(page.locator('.nav-context-eyebrow')).toContainText('03 — HÓA ĐƠN')
    await expect(page.locator('.nav-context-count')).toHaveText('03 / 05')
    await page.waitForTimeout(40)
    const after = (await nav.boundingBox())!
    expect(after.y).toBeLessThan(before.y)
    expect(after.height).toBeLessThan(before.height)
    expect(after.width).toBeLessThan(before.width)

    await page.getByRole('button', { name: 'Đi tới chương Để dành từ thanh điều hướng' }).click()
    await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'saving')
    await expect(page.locator('.nav-context-eyebrow')).toContainText('05 — ĐỂ DÀNH')

    await page.locator('#discover').scrollIntoViewIfNeeded()
    await expect(nav).toHaveClass(/is-page-mode/)
    await expect(page.locator('.nav-context-eyebrow')).toContainText('KHÁM PHÁ')
    await expect(page.locator('.nav-context-count')).toContainText('%')
  }
})

test('floating nav stays content-dense and legible from laptop through 2K desktop', async ({
  page,
}) => {
  const cases = [
    { width: 1440, height: 900, minWidth: 780, maxWidth: 980, minFont: 13 },
    { width: 1920, height: 1080, minWidth: 1020, maxWidth: 1060, minFont: 15 },
    { width: 2432, height: 1440, minWidth: 1160, maxWidth: 1240, minFont: 16 },
  ]

  for (const size of cases) {
    await page.setViewportSize({ width: size.width, height: size.height })
    await page.goto('/')
    await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.scene-container canvas')).toBeVisible()
    await page.waitForTimeout(550)
    const nav = page.locator('.site-header')
    const box = (await nav.boundingBox())!
    const linkSize = parseFloat(
      await nav
        .getByRole('link', { name: 'Trang đầu' })
        .evaluate((node) => getComputedStyle(node).fontSize),
    )

    expect(box.width).toBeGreaterThanOrEqual(size.minWidth)
    expect(box.width).toBeLessThanOrEqual(size.maxWidth)
    expect(linkSize).toBeGreaterThanOrEqual(size.minFont)

    await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>('.hero-shell')!
      window.scrollTo({
        top: hero.offsetTop + (hero.offsetHeight - innerHeight) * 0.29,
        behavior: 'instant',
      })
    })
    await expect
      .poll(() =>
        page.evaluate(() => (window as Window & { navAutoCompacted?: boolean }).navAutoCompacted),
      )
      .toBe(true)
    await page.waitForTimeout(440)
    await expect(page.locator('.nav-context')).toBeVisible()
    const scrolledBox = (await nav.boundingBox())!
    expect(scrolledBox.width).toBeLessThan(box.width)
    expect(scrolledBox.width).toBeGreaterThan(680)
    await expect(page.locator('.nav-progress-track')).toBeVisible()
    await expect(page.locator('.nav-story-steps button')).toHaveCount(5)
  }
})

test('floating nav remains usable without horizontal overflow on a narrow phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  const nav = page.locator('.site-header')
  const box = (await nav.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(8)
  expect(box.x + box.width).toBeLessThanOrEqual(352)
  expect(
    parseFloat(
      await nav
        .getByRole('button', { name: 'BẮT ĐẦU' })
        .evaluate((node) => getComputedStyle(node).fontSize),
    ),
  ).toBeGreaterThanOrEqual(9)
  await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>('.hero-shell')!
    window.scrollTo({
      top: hero.offsetTop + (hero.offsetHeight - innerHeight) * 0.29,
      behavior: 'instant',
    })
  })
  await page.waitForTimeout(320)
  // V9 reserves the phone capsule for the CTA, menu and collapse control.
  await expect(page.locator('.nav-mobile-step')).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  await page.getByRole('button', { name: 'Mở menu', exact: true }).click()
  const menu = page.getByRole('navigation', { name: 'Điều hướng di động' })
  await expect(menu).toBeVisible()
  const menuBox = (await menu.boundingBox())!
  expect(menuBox.x).toBeGreaterThanOrEqual(8)
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(352)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('story navbar stays selectable after scrolling stops and can collapse into a compact pill', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  test.skip(testInfo.project.name.includes('mobile'))

  await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>('.hero-shell')!
    window.scrollTo({
      top: hero.offsetTop + (hero.offsetHeight - innerHeight) * 0.47,
      behavior: 'instant',
    })
  })

  const nav = page.locator('.site-header')
  await expect(nav).toHaveClass(/is-story-mode/)
  await page.waitForTimeout(440)
  await expect(nav).toHaveClass(/is-settled/)
  await expect(nav).not.toHaveClass(/is-auto-compact/)

  const quickTrigger = page.getByRole('button', { name: /Mở điều hướng nhanh — 03 — HÓA ĐƠN/ })
  await expect(quickTrigger).toBeVisible()
  await quickTrigger.click()

  const quickNav = page.getByRole('navigation', { name: 'Điều hướng nhanh' })
  await expect(quickNav).toBeVisible()
  await expect(quickNav.locator('[aria-current="step"]')).toHaveCount(1)

  await quickNav.getByRole('button', { name: /Để dành/ }).click()
  await expect(page.locator('.hero')).toHaveAttribute('data-scene', 'saving')
  await expect(quickNav).toHaveCount(0)
  await expect(nav).toHaveClass(/is-settled/)
  await expect(page.locator('.nav-context-eyebrow')).toContainText('05 — ĐỂ DÀNH')

  const expandedBox = (await nav.boundingBox())!
  await page.getByRole('button', { name: 'Thu gọn thanh điều hướng' }).click()
  await expect(nav).toHaveClass(/is-collapsed/)
  await expect
    .poll(async () => {
      const chapter = Number(await page.locator('.hero').getAttribute('data-chapter'))
      return (await page.locator('.nav-collapsed-context').innerText()).includes(
        ['Mở ví', 'Chia tiền', 'Hóa đơn', 'Nhìn rõ', 'Để dành'][chapter],
      )
    })
    .toBe(true)
  await expect(page.locator('.nav-context')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'BẮT ĐẦU' })).toHaveCount(0)
  await page.waitForTimeout(360)
  const collapsedBox = (await nav.boundingBox())!
  expect(collapsedBox.width).toBeLessThan(expandedBox.width * 0.55)

  await page.getByRole('button', { name: 'Mở rộng thanh điều hướng', exact: true }).click()
  await expect(nav).not.toHaveClass(/is-collapsed/)
  await expect(page.locator('.nav-context')).toBeVisible()
  await expect(page.getByRole('button', { name: 'BẮT ĐẦU' })).toBeVisible()
})

test('story nav auto-compacts only while moving, expands on settle, and always returns to Trang đầu', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  test.skip(testInfo.project.name.includes('mobile'))

  const nav = page.locator('.site-header')
  const hero = page.locator('#home')
  const discover = page.locator('#discover')

  await page.evaluate(() => {
    const target = document.querySelector<HTMLElement>('#discover')!
    window.scrollTo({ top: target.offsetTop + 120, behavior: 'instant' })
  })

  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { navAutoCompacted?: boolean }).navAutoCompacted),
    )
    .toBe(true)
  await page.waitForTimeout(440)
  await expect(nav).toHaveClass(/is-settled/)
  await expect(nav).not.toHaveClass(/is-auto-compact/)
  await expect(nav).not.toHaveClass(/is-collapsed/)
  await expect(page.locator('.nav-context-eyebrow')).toContainText('KHÁM PHÁ')

  await page.getByRole('button', { name: /Mở điều hướng nhanh/ }).click()
  const quick = page.getByRole('navigation', { name: 'Điều hướng nhanh' })
  await expect(quick).toBeVisible()
  await quick.getByRole('button', { name: 'Trang đầu', exact: true }).click()

  await page.waitForFunction(() => window.scrollY < 4)
  await expect(nav).not.toHaveClass(/is-scrolled/)
  await expect(nav.getByRole('link', { name: 'Trang đầu', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.locator('.desktop-nav')).toBeVisible()
  await expect(hero).toBeVisible()
  await expect(discover).toBeAttached()
})

test('manual compact stays pinned after scroll settles while auto compact does not', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  test.skip(testInfo.project.name.includes('mobile'))
  const nav = page.locator('.site-header')

  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }))
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { navAutoCompacted?: boolean }).navAutoCompacted),
    )
    .toBe(true)
  await page.waitForTimeout(440)
  await expect(nav).not.toHaveClass(/is-collapsed/)

  await page.getByRole('button', { name: 'Thu gọn thanh điều hướng' }).click()
  await expect(nav).toHaveClass(/is-manual-collapsed/)
  await expect(nav).toHaveClass(/is-collapsed/)
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }))
  await page.waitForTimeout(440)
  await expect(nav).toHaveClass(/is-manual-collapsed/)
  await expect(nav).toHaveClass(/is-collapsed/)

  await page.getByRole('button', { name: 'Mở rộng thanh điều hướng', exact: true }).click()
  await expect(nav).not.toHaveClass(/is-manual-collapsed/)
  await expect(nav).not.toHaveClass(/is-collapsed/)
})

test('feature-card hover uses a stable hitbox so the bottom edge does not jitter', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('main[data-hydrated=true]')).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.scene-container canvas')).toBeVisible()
  const shell = page.locator('.feature-card-shell').first()
  await shell.scrollIntoViewIfNeeded()
  await expect(page.locator('.feature-item').first()).toHaveCSS('transform', 'none')
  const before = (await shell.boundingBox())!

  await page.mouse.move(before.x + before.width - 3, before.y + before.height - 3)
  await page.waitForTimeout(80)
  const during = (await shell.boundingBox())!
  expect(Math.abs(during.x - before.x)).toBeLessThan(0.5)
  expect(Math.abs(during.y - before.y)).toBeLessThan(0.5)
  expect(Math.abs(during.width - before.width)).toBeLessThan(0.5)
  expect(Math.abs(during.height - before.height)).toBeLessThan(0.5)

  const cardTransform = await shell
    .locator('.feature-card')
    .evaluate((node) => getComputedStyle(node).transform)
  expect(cardTransform).not.toBe('none')
  const shellTransform = await shell.evaluate((node) => getComputedStyle(node).transform)
  expect(shellTransform).toBe('none')
})
