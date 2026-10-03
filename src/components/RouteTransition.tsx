'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Brand from './ui/Brand'

type Navigate = (href: string, options?: { replace?: boolean; refresh?: boolean }) => void
const NavigationContext = createContext<Navigate | null>(null)

export function useSplitlyNavigation() {
  const navigate = useContext(NavigationContext)
  if (!navigate) throw new Error('Navigation requires RouteTransition.')
  return navigate
}

export default function RouteTransition({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const [active, setActive] = useState(false)
  const [origin, setOrigin] = useState({ x: 50, y: 40 })
  const started = useRef(0)
  const previousPath = useRef(pathname)
  const safety = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reveal = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const begin = useCallback((x = 50, y = 40) => {
    clearTimeout(safety.current)
    clearTimeout(reveal.current)
    started.current = performance.now()
    setOrigin({ x, y })
    setActive(true)
    // A failed navigation must never leave the interface covered.
    safety.current = setTimeout(() => setActive(false), 7000)
  }, [])

  const navigate = useCallback<Navigate>(
    (href, options) => {
      if (new URL(href, window.location.href).pathname !== window.location.pathname) begin()
      if (options?.replace) router.replace(href)
      else router.push(href)
      if (options?.refresh) router.refresh()
    },
    [begin, router],
  )

  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    clearTimeout(safety.current)
    clearTimeout(reveal.current)
    // Let the liquid finish covering a fast, prefetched route before revealing it.
    const remaining = reduced ? 0 : Math.max(0, 460 - (performance.now() - started.current))
    reveal.current = setTimeout(() => setActive(false), remaining)
  }, [pathname, reduced])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      const anchor = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null
      if (
        !anchor ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self')
      )
        return
      const destination = new URL(anchor.href, window.location.href)
      if (
        destination.origin !== window.location.origin ||
        destination.pathname === window.location.pathname
      )
        return
      begin((event.clientX / window.innerWidth) * 100, (event.clientY / window.innerHeight) * 100)
    }
    function onBack() {
      if (window.location.pathname !== previousPath.current) begin()
    }
    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onBack)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onBack)
      clearTimeout(safety.current)
      clearTimeout(reveal.current)
    }
  }, [begin])

  return (
    <NavigationContext.Provider value={navigate}>
      {children}
      <AnimatePresence>
        {active && (
          <motion.div
            className={`splitly-transition ${reduced ? 'is-reduced' : ''}`}
            role="status"
            aria-label="Đang chuyển trang…"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.32 }}
          >
            <span className="sr-only">Đang chuyển trang…</span>
            {!reduced && (
              <motion.div
                className="transition-liquid"
                aria-hidden="true"
                style={{ left: `${origin.x}%`, top: `${origin.y}%` }}
                initial={{ scale: 0.015, y: -100, borderRadius: '40% 60% 55% 45%' }}
                animate={{ scale: 1, y: 0, borderRadius: '50%' }}
                exit={{ scale: 0, y: 90, transition: { duration: 0.5 } }}
                transition={{ duration: 0.48, ease: [0.65, 0, 0.3, 1] }}
              />
            )}
            <motion.div
              className="transition-emblem"
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.65 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ delay: reduced ? 0 : 0.15, duration: 0.2 }}
            >
              <div className="transition-spinner">
                <Brand compact />
              </div>
              <span>NHẸ NHÀNG HƠN MỘT CHÚT.</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </NavigationContext.Provider>
  )
}
