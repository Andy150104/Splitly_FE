import { expect, test } from '@playwright/test'
import { mockWorkspace } from './helpers/workspace'

for (const path of ['/', '/login', '/dashboard']) {
  test(`rapid theme input reuses the circle and snapshots on ${path}`, async ({
    page,
    isMobile,
  }) => {
    await page.route('https://accounts.google.com/**', (route) => route.abort())
    await page.addInitScript(() => {
      const start = document.startViewTransition.bind(document)
      Object.assign(window, { themeCaptures: 0 })
      document.startViewTransition = (...args: Parameters<typeof start>) => {
        const state = window as typeof window & { themeCaptures: number }
        state.themeCaptures++
        return start(...args)
      }
    })
    if (path === '/dashboard') await mockWorkspace(page)
    await page.goto(path)
    await expect(page.locator('.theme-toggle').first()).toBeVisible()
    if (path === '/login') await page.getByLabel('Email của bạn').fill('rapid@example.com')
    const canvas = page.locator('canvas').first()
    if (path === '/' || (path === '/login' && !isMobile))
      await expect(canvas).toHaveAttribute('data-palette', 'dark')
    if (path === '/' || (path === '/login' && !isMobile))
      await expect(canvas).toHaveAttribute('data-scene-stage', 'ready', { timeout: 30_000 })

    // A burst before ready must share the same snapshot preparation.
    await page
      .locator('.theme-toggle')
      .first()
      .evaluate((node: HTMLButtonElement) => {
        for (let click = 0; click < 5; click++) node.click()
      })
    await expect
      .poll(() =>
        page.evaluate(() => {
          const animation = document
            .getAnimations()
            .find(
              (item) =>
                (item.effect as KeyframeEffect | null)?.pseudoElement ===
                '::view-transition-new(root)',
            )
          if (!animation) return false
          animation.pause()
          animation.currentTime = 420
          return true
        }),
      )
      .toBe(true)

    const result = await page.evaluate(async () => {
      const animation = document
        .getAnimations()
        .find(
          (item) =>
            (item.effect as KeyframeEffect | null)?.pseudoElement === '::view-transition-new(root)',
        )!
      const before = animation.currentTime
      const button = document.querySelector<HTMLButtonElement>('.theme-toggle')!
      for (let click = 0; click < 19; click++) button.click()
      const after = animation.currentTime
      // reverse() commits its playback rate on the next animation tick.
      await animation.ready
      return {
        captures: (window as typeof window & { themeCaptures: number }).themeCaptures,
        sameAnimation: document.getAnimations().includes(animation),
        before,
        after,
        direction: animation.playbackRate,
        requested: localStorage.getItem('splitly.theme'),
      }
    })
    expect(result).toEqual({
      captures: 1,
      sameAnimation: true,
      before: 420,
      after: 420,
      direction: -1,
      requested: 'dark',
    })
    await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition', /.+/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    if (path === '/' || (path === '/login' && !isMobile)) {
      await expect(canvas).toHaveAttribute('data-render-loop', 'always')
      await expect(canvas).toHaveAttribute('data-palette', 'dark')
    }
    if (path === '/login')
      await expect(page.getByLabel('Email của bạn')).toHaveValue('rapid@example.com')
    expect(
      await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((item) => (item.effect as KeyframeEffect | null)?.pseudoElement).length,
      ),
    ).toBe(0)
  })
}

test('theme reveal suspends WebGL work and CSS effects, then resumes them', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Login skips its 3D renderer on mobile')
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  await page.addInitScript(() => {
    const stats = { draws: 0 }
    Object.assign(window, { themeGPU: stats })
    const prototype = WebGL2RenderingContext.prototype
    const draw = prototype.drawElements
    prototype.drawElements = function (...args: Parameters<typeof draw>) {
      stats.draws++
      return draw.apply(this, args)
    }
  })
  await page.goto('/login')
  const canvas = page.locator('.login-scene-canvas canvas')
  await expect(canvas).toHaveAttribute('data-render-loop', 'always')
  await page.locator('.theme-toggle').click()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const animation = document
          .getAnimations()
          .find(
            (item) =>
              (item.effect as KeyframeEffect | null)?.pseudoElement ===
              '::view-transition-new(root)',
          )
        if (!animation) return false
        animation.pause()
        animation.currentTime = 380
        return true
      }),
    )
    .toBe(true)
  await expect(canvas).toHaveAttribute('data-render-loop', 'demand')
  const result = await page.evaluate(async () => {
    const stats = (window as typeof window & { themeGPU: { draws: number } }).themeGPU
    const frames = async (count: number) => {
      for (let frame = 0; frame < count; frame++)
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
    // Allow the final palette frame to settle before measuring the paused renderer.
    await frames(6)
    const before = stats.draws
    await frames(20)
    const style = getComputedStyle(document.querySelector('.theme-toggle')!)
    return {
      pausedDraws: stats.draws - before,
      playState: style.animationPlayState,
      transition: style.transitionDuration,
    }
  })
  expect(result).toEqual({ pausedDraws: 0, playState: 'paused', transition: '0s' })
  const beforeResume = await page.evaluate(
    () => (window as typeof window & { themeGPU: { draws: number } }).themeGPU.draws,
  )
  await page.evaluate(() => {
    for (const animation of document.getAnimations())
      if ((animation.effect as KeyframeEffect | null)?.pseudoElement) animation.play()
  })
  await expect(canvas).toHaveAttribute('data-render-loop', 'always')
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { themeGPU: { draws: number } }).themeGPU.draws,
      ),
    )
    .toBeGreaterThan(beforeResume)
  await expect(page.locator('.theme-toggle')).toHaveCSS('animation-play-state', 'running')
})

test('a storage update interrupts the reveal without restoring a stale local preference', async ({
  page,
  context,
}) => {
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  await page.goto('/login')
  await page.getByLabel('Email của bạn').fill('sync@example.com')
  await page.locator('.theme-toggle').click()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const animation = document
          .getAnimations()
          .find(
            (item) =>
              (item.effect as KeyframeEffect | null)?.pseudoElement ===
              '::view-transition-new(root)',
          )
        if (!animation) return false
        animation.pause()
        animation.currentTime = 380
        return true
      }),
    )
    .toBe(true)
  const other = await context.newPage()
  await other.route('https://accounts.google.com/**', (route) => route.abort())
  await other.goto('/login')
  await other.evaluate(() => localStorage.setItem('splitly.theme', 'dark'))
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition', /.+/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByLabel('Email của bạn')).toHaveValue('sync@example.com')
  await expect(page.getByLabel('Email của bạn')).toBeEditable()
  await other.close()
})

test('login light mode recolors the rendered wallet, orbit and lighting and restores dark', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Login skips its 3D renderer on mobile')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  await page.goto('/login')
  const canvas = page.locator('.login-scene-canvas canvas')
  await expect(canvas).toHaveAttribute('data-palette', 'dark')
  await expect(canvas).toHaveAttribute('data-scene-stage', 'ready', { timeout: 30_000 })
  const pigments = async () => {
    const frame = (await page.locator('.ws-login-spatial-space').screenshot()).toString('base64')
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
  await page.locator('.theme-toggle').click()
  await expect(canvas).toHaveAttribute('data-palette', 'light')
  const light = await pigments()
  expect(light.blue).toBeGreaterThan(light.violet * 3)
  await page.screenshot({ path: 'QA/theme/desktop-login-blue.png', animations: 'disabled' })
  await page.locator('.theme-toggle').click()
  await expect(canvas).toHaveAttribute('data-palette', 'dark')
  expect((await pigments()).violet).toBeGreaterThan(light.violet)
})

test('theme circle expands and contracts smoothly, preserves the form and resumes the 3D scene', async ({
  page,
  isMobile,
}) => {
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  await page.goto('/login')
  await page.getByLabel('Email của bạn').fill('friend@example.com')
  const canvas = page.locator('.login-scene-canvas canvas')
  if (!isMobile) {
    await expect(canvas).toHaveAttribute('data-palette', 'dark')
    await expect(canvas).toHaveAttribute('data-scene-stage', 'ready', { timeout: 30_000 })
  }

  for (const [theme, direction, pseudo] of [
    ['light', 'expand', '::view-transition-new(root)'],
    ['dark', 'contract', '::view-transition-old(root)'],
  ] as const) {
    await page.locator('.theme-toggle').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme-transition', direction)
    await expect
      .poll(() =>
        page.evaluate((element) => {
          const animation = document
            .getAnimations()
            .find((item) => (item.effect as KeyframeEffect | null)?.pseudoElement === element)
          if (!animation) return false
          animation.pause()
          animation.currentTime = Number(animation.effect!.getTiming().duration) / 2
          return true
        }, pseudo),
      )
      .toBe(true)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    if (!isMobile) {
      await expect(canvas).toHaveAttribute('data-render-loop', 'demand')
      await expect(canvas).toHaveAttribute('data-palette', theme)
    }
    const clip = await page.evaluate(
      (element) => getComputedStyle(document.documentElement, element).clipPath,
      pseudo,
    )
    expect(clip).toMatch(/^circle\([1-9]/)
    await page.screenshot({
      path: `QA/theme/${isMobile ? 'mobile' : 'desktop'}-circle-${direction}.png`,
      animations: 'allow',
    })
    await page.evaluate(() => {
      for (const animation of document.getAnimations())
        if ((animation.effect as KeyframeEffect | null)?.pseudoElement) animation.play()
    })
    await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition', /.+/)
    await expect(page.getByLabel('Email của bạn')).toHaveValue('friend@example.com')
    if (!isMobile) await expect(canvas).toHaveAttribute('data-render-loop', 'always')
  }

  // Rapid input keeps the newest preference and cannot leave a snapshot covering the form.
  for (let click = 0; click < 3; click++) await page.locator('.theme-toggle').click()
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition', /.+/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByLabel('Email của bạn').fill('another@example.com')
  await expect(page.getByLabel('Email của bạn')).toHaveValue('another@example.com')
  if (!isMobile) await expect(canvas).toHaveAttribute('data-render-loop', 'always')
})

test('theme switch stays immediate with reduced motion or an unavailable transition API', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  await page.goto('/login')
  await page.locator('.theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition', /.+/)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.evaluate(() =>
    Object.defineProperty(document, 'startViewTransition', { value: undefined }),
  )
  await page.locator('.theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition', /.+/)
  await expect(page.getByLabel('Email của bạn')).toBeEditable()
})
