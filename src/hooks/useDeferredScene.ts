'use client'

import { useEffect, useState } from 'react'

/** Let the page paint and hydrate before requesting an optional WebGL chunk. */
export function useDeferredScene(enabled = true, mediaQuery = '(min-width: 0px)') {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const media = window.matchMedia(mediaQuery)
    let frame = 0
    let idle = 0
    let timer = 0
    let disposed = false
    const cancel = () => {
      cancelAnimationFrame(frame)
      if (idle) window.cancelIdleCallback(idle)
      clearTimeout(timer)
    }
    const schedule = () => {
      cancel()
      if (!enabled || !media.matches) {
        setReady(false)
        return
      }
      if (document.visibilityState !== 'visible') return
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          const reveal = () => {
            if (!disposed) setReady(true)
          }
          if (typeof window.requestIdleCallback === 'function') {
            idle = window.requestIdleCallback(reveal, { timeout: 800 })
          } else {
            timer = window.setTimeout(reveal, 0)
          }
        })
      })
    }
    schedule()
    media.addEventListener('change', schedule)
    document.addEventListener('visibilitychange', schedule)
    return () => {
      disposed = true
      cancel()
      media.removeEventListener('change', schedule)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [enabled, mediaQuery])
  return enabled && ready
}
