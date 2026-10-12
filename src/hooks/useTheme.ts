'use client'

import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { THEME_COLORS, THEME_EVENT, THEME_STORAGE_KEY, THEME_TRANSITION_EVENT } from '../lib/theme'
import type { Theme } from '../lib/theme'

type ThemeReveal = {
  from: Theme
  to: Theme
  requested: Theme
  transition?: ViewTransition
  animation?: Animation
}
let activeReveal: ThemeReveal | undefined
const themeListeners = new Set<() => void>()

function clearReveal(reveal: ThemeReveal) {
  if (activeReveal !== reveal) return
  activeReveal = undefined
  reveal.animation?.cancel()
  delete document.documentElement.dataset.themeTransition
  document.documentElement.style.removeProperty('--theme-reveal-origin')
  window.dispatchEvent(new Event(THEME_TRANSITION_EVENT))
}

function cancelTransition() {
  if (!activeReveal) return
  const reveal = activeReveal
  reveal.transition?.skipTransition()
  clearReveal(reveal)
}

function snapshot(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = THEME_COLORS[theme]
}

function notifyTheme() {
  themeListeners.forEach((callback) => callback())
}

function onStorage(event: StorageEvent) {
  if (event.storageArea !== localStorage) return
  if (event.key !== THEME_STORAGE_KEY && event.key !== null) return
  cancelTransition()
  applyTheme(event.newValue === 'light' ? 'light' : 'dark')
  notifyTheme()
}

function subscribe(callback: () => void) {
  if (themeListeners.size === 0) {
    window.addEventListener(THEME_EVENT, notifyTheme)
    window.addEventListener('storage', onStorage)
  }
  themeListeners.add(callback)
  return () => {
    themeListeners.delete(callback)
    if (themeListeners.size === 0) {
      window.removeEventListener(THEME_EVENT, notifyTheme)
      window.removeEventListener('storage', onStorage)
    }
  }
}

const serverSnapshot = (): Theme => 'dark'

export function useTheme() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot)
}

function subscribeTransition(callback: () => void) {
  window.addEventListener(THEME_TRANSITION_EVENT, callback)
  return () => window.removeEventListener(THEME_TRANSITION_EVENT, callback)
}
const transitionSnapshot = () => !!document.documentElement.dataset.themeTransition
const serverTransitionSnapshot = () => false

// Render one updated 3D frame during the reveal, then resume its normal animation.
export function useThemeTransition() {
  return useSyncExternalStore(subscribeTransition, transitionSnapshot, serverTransitionSnapshot)
}

function rememberTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The switch still works for this visit when browser storage is unavailable.
  }
}

export function setTheme(theme: Theme) {
  applyTheme(theme)
  rememberTheme(theme)
  window.dispatchEvent(new Event(THEME_EVENT))
}

function finishReveal(reveal: ThemeReveal) {
  if (activeReveal !== reveal) return
  // Commit a reversed preference while the snapshots still cover the page.
  if (snapshot() !== reveal.requested) flushSync(() => setTheme(reveal.requested))
  reveal.transition?.skipTransition()
  clearReveal(reveal)
}

/** Reveal light from the switch; collapse that same circle when returning to dark. */
export async function toggleTheme(origin: HTMLElement) {
  const theme = (activeReveal?.requested ?? snapshot()) === 'dark' ? 'light' : 'dark'
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    cancelTransition()
    setTheme(theme)
    return
  }

  if (activeReveal) {
    activeReveal.requested = theme
    rememberTheme(theme)
    // Reuse both snapshots and reverse at the current radius. Never recapture
    // the page or restart the 3D render loop for another click in this reveal.
    activeReveal.animation?.reverse()
    return
  }

  const reveal: ThemeReveal = { from: snapshot(), to: theme, requested: theme }
  activeReveal = reveal
  const root = document.documentElement
  const bounds = origin.getBoundingClientRect()
  const x = bounds.left + bounds.width / 2
  const y = bounds.top + bounds.height / 2
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 2
  const collapsed = `circle(0px at ${x}px ${y}px)`
  const expanded = `circle(${radius}px at ${x}px ${y}px)`
  root.dataset.themeTransition = theme === 'light' ? 'expand' : 'contract'
  root.style.setProperty('--theme-reveal-origin', `${x}px ${y}px`)
  // Pause the canvas before the browser captures the old view.
  flushSync(() => window.dispatchEvent(new Event(THEME_TRANSITION_EVENT)))
  rememberTheme(theme)

  try {
    const transition = document.startViewTransition(() => {
      if (activeReveal === reveal) {
        // Clicks during snapshot preparation only update the requested endpoint.
        flushSync(() => {
          applyTheme(reveal.to)
          window.dispatchEvent(new Event(THEME_EVENT))
        })
      }
    })
    reveal.transition = transition
    // A skipped transition may settle before ready; always observe both promises.
    void transition.finished.catch(() => undefined)
    await transition.ready
    if (activeReveal !== reveal) return
    if (reveal.requested === reveal.from) {
      finishReveal(reveal)
      return
    }
    reveal.animation = root.animate(
      { clipPath: theme === 'light' ? [collapsed, expanded] : [expanded, collapsed] },
      {
        duration: 760,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'both',
        pseudoElement:
          theme === 'light' ? '::view-transition-new(root)' : '::view-transition-old(root)',
      },
    )
    reveal.animation.onfinish = () => finishReveal(reveal)
    await transition.finished
  } catch {
    // A skipped/unsupported animation must still leave the requested theme usable.
    finishReveal(reveal)
  } finally {
    finishReveal(reveal)
  }
}
