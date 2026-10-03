'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, CircleAlert, X } from 'lucide-react'

type Notification = { id: number; message: string; success: boolean }
const NotificationContext = createContext<(message: string, success?: boolean) => void>(() => {})

export const useNotify = () => useContext(NotificationContext)

function NotificationItem({
  item,
  dismiss,
}: {
  item: Notification
  dismiss: (id: number) => void
}) {
  const [paused, setPaused] = useState(false)
  const remaining = useRef(item.success ? 4500 : 7000)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (paused) return
    const started = Date.now()
    const timer = setTimeout(() => dismiss(item.id), remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (Date.now() - started))
    }
  }, [paused, dismiss, item.id])
  return (
    <motion.div
      layout={!reduced}
      initial={{ opacity: 0, x: reduced ? 0 : 28, y: reduced ? 0 : -8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: reduced ? 0 : 24, scale: reduced ? 1 : 0.96 }}
      transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={`splitly-notification ${item.success ? 'is-success' : 'is-error'}`}
      role="status"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
      }}
    >
      <span className="splitly-notification-icon">
        {item.success ? <Check size={18} /> : <CircleAlert size={18} />}
      </span>
      <div>
        <strong>{item.success ? 'Đã hoàn tất' : 'Chưa thể thực hiện'}</strong>
        <p>{item.message}</p>
      </div>
      <button type="button" onClick={() => dismiss(item.id)} aria-label="Đóng thông báo">
        <X size={16} />
      </button>
      <span
        className="splitly-notification-timer"
        style={{
          animationDuration: item.success ? '4.5s' : '7s',
          animationPlayState: paused ? 'paused' : 'running',
        }}
        aria-hidden="true"
      />
    </motion.div>
  )
}

export default function Notifications({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notification[]>([])
  const host = useRef<HTMLDivElement>(null)
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null)
  const sequence = useRef(0)
  const recent = useRef(new Map<string, number>())
  const notify = useCallback((message: string, success = false) => {
    if (!message.trim()) return
    const key = `${success}:${message}`
    const now = Date.now()
    if (now - (recent.current.get(key) || 0) < 2000) return
    recent.current.set(key, now)
    for (const [entry, time] of recent.current) if (now - time > 2000) recent.current.delete(entry)
    const id = ++sequence.current
    setItems((previous) => [
      ...previous.filter((item) => item.message !== message).slice(-2),
      { id, message, success },
    ])
  }, [])
  const dismiss = useCallback(
    (id: number) => setItems((previous) => previous.filter((item) => item.id !== id)),
    [],
  )
  const hasItems = items.length > 0
  useEffect(() => {
    // A popover outside a modal is visually above it but remains inert. Mount
    // inside the active dialog so dismissing a toast is also operable.
    const update = () =>
      setDialog(
        Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).at(-1) || null,
      )
    const observer = new MutationObserver(update)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open'],
    })
    update()
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    // Native popover places notifications above native dialogs without stealing focus.
    if (items.length) {
      host.current?.hidePopover?.()
      host.current?.showPopover?.()
    }
  }, [items, dialog])
  const notificationHost = (
    <div
      ref={host}
      popover="manual"
      className="splitly-notifications"
      aria-label="Thông báo thao tác"
    >
      <AnimatePresence
        onExitComplete={() => {
          if (!hasItems) host.current?.hidePopover?.()
        }}
      >
        {items.map((item) => (
          <NotificationItem key={item.id} item={item} dismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
  return (
    <NotificationContext.Provider value={notify}>
      {children}
      {dialog ? createPortal(notificationHost, dialog) : notificationHost}
    </NotificationContext.Provider>
  )
}
