'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react'
import { ChevronDown } from 'lucide-react'

export function Reveal({
  children,
  className = '',
  delay = 0,
  initiallyVisible = false,
}: {
  children: ReactNode
  className?: string
  delay?: number
  initiallyVisible?: boolean
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={initiallyVisible ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{
        duration: reduced ? 0 : 0.35,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

export function Disclosure({
  title,
  children,
  defaultOpen = true,
  className = '',
  meta,
}: {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  meta?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const reduced = useReducedMotion()
  return (
    <section className={`ws-disclosure ${open ? 'is-open' : ''} ${className}`}>
      <button
        className="ws-disclosure-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <span className="ws-disclosure-meta">
          {meta}
          <ChevronDown size={16} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="ws-disclosure-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export function Count({ value }: { value: number }) {
  const target = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced || !target.current) return
    const controls = animate(0, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (current) => {
        if (target.current)
          target.current.textContent = new Intl.NumberFormat('vi-VN').format(Math.round(current))
      },
    })
    return () => controls.stop()
  }, [value, reduced])
  return <span ref={target}>{new Intl.NumberFormat('vi-VN').format(value)}</span>
}
