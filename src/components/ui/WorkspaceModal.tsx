'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { Notice } from './Feedback'

let locks = 0
let previousOverflow = ''

function Dialog({
  title,
  children,
  onClose,
  busy = false,
  size = 'default',
}: {
  title: string
  children: ReactNode
  onClose: () => void
  busy?: boolean
  size?: 'default' | 'wide'
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  const reduced = useReducedMotion()
  const present = useIsPresent()
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null
    if (locks++ === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    const dialog = ref.current!
    dialog.showModal()
    return () => {
      dialog.close()
      if (--locks === 0) document.body.style.overflow = previousOverflow
      if (active?.isConnected) active.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={`ws-modal ${size === 'wide' ? 'ws-modal-wide' : ''} ${present ? '' : 'is-closing'}`}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <motion.div
        className="ws-modal-surface"
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{
          opacity: 0,
          y: 24,
          scale: 0.98,
          transition: { duration: reduced ? 0 : 0.18, ease: 'easeIn' },
        }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 28 }}
      >
        <header className="ws-modal-header">
          <div>
            <span className="ws-eyebrow">SPLITLY / KHÔNG GIAN CỦA BẠN</span>
            <h2 id={id}>{title}</h2>
          </div>
          <button
            type="button"
            className="ws-icon-button"
            aria-label="Đóng modal"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="ws-modal-body">{children}</div>
      </motion.div>
    </dialog>
  )
}

export default function WorkspaceModal({
  open,
  ...props
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  busy?: boolean
  size?: 'default' | 'wide'
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
    ? createPortal(
        <AnimatePresence>{open && <Dialog {...props} />}</AnimatePresence>,
        document.body,
      )
    : null
}

export function ConfirmDialog({
  open,
  title,
  description,
  action,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  action: string
  pending: boolean
  error?: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <WorkspaceModal open={open} title={title} busy={pending} onClose={onClose}>
      <p className="ws-confirm-description">{description}</p>
      <Notice message={error || ''} />
      <div className="ws-form-actions">
        <button className="ws-button ws-button-secondary" disabled={pending} onClick={onClose}>
          Quay lại
        </button>
        <button className="ws-button ws-danger-button" disabled={pending} onClick={onConfirm}>
          {pending ? 'Đang xử lý…' : action}
        </button>
      </div>
    </WorkspaceModal>
  )
}
