'use client'

import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { HTMLAttributes, ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

function Bubble({
  anchor,
  id,
  label,
  description,
  side,
  keepOpen,
  close,
}: {
  anchor: HTMLElement
  id: string
  label: string
  description?: string
  side: 'right' | 'bottom'
  keepOpen: () => void
  close: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useLayoutEffect(() => {
    const bubble = ref.current!
    bubble.showPopover?.()
    const rect = anchor.getBoundingClientRect()
    const sidebar = anchor.closest('.ws-sidebar')?.getBoundingClientRect()
    const right = sidebar?.right ?? rect.right
    const left = sidebar?.left ?? rect.left
    const bounds = bubble.getBoundingClientRect()
    const inset = 12
    const x =
      side === 'right'
        ? right + bounds.width + inset <= window.innerWidth
          ? right + inset
          : left - bounds.width - inset
        : rect.left + (rect.width - bounds.width) / 2
    const y =
      side === 'right'
        ? rect.top + (rect.height - bounds.height) / 2
        : rect.bottom + bounds.height + inset <= window.innerHeight
          ? rect.bottom + inset
          : rect.top - bounds.height - inset
    const placedX = Math.max(inset, Math.min(x, window.innerWidth - bounds.width - inset))
    const placedY = Math.max(inset, Math.min(y, window.innerHeight - bounds.height - inset))
    bubble.style.left = `${placedX}px`
    bubble.style.top = `${placedY}px`
    bubble.dataset.side =
      side === 'right' ? (x > rect.left ? 'right' : 'left') : y > rect.top ? 'bottom' : 'top'
    bubble.style.setProperty(
      '--tooltip-arrow-x',
      `${Math.max(14, Math.min(rect.left + rect.width / 2 - placedX, bounds.width - 14))}px`,
    )
    bubble.style.setProperty(
      '--tooltip-arrow-y',
      `${Math.max(14, Math.min(rect.top + rect.height / 2 - placedY, bounds.height - 14))}px`,
    )
    return () => bubble.hidePopover?.()
  }, [anchor, side, label, description])
  return (
    <div
      ref={ref}
      id={id}
      role="tooltip"
      popover="manual"
      className="ws-tooltip"
      onPointerEnter={keepOpen}
      onPointerLeave={close}
    >
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduced ? 0 : 2 }}
        transition={{ duration: reduced ? 0 : 0.15 }}
      >
        <i className="ws-tooltip-arrow" aria-hidden="true" />
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </motion.div>
    </div>
  )
}

export default function Tooltip({
  children,
  label,
  description,
  side = 'right',
  disabled = false,
}: {
  children: ReactElement<HTMLAttributes<HTMLElement>>
  label: string
  description?: string
  side?: 'right' | 'bottom'
  disabled?: boolean
}) {
  const id = useId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visible = open && !disabled
  function clear() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  function hide() {
    clear()
    setOpen(false)
  }
  function show(node: HTMLElement, immediate = false) {
    clear()
    if (disabled) return
    setAnchor(node)
    if (immediate) setOpen(true)
    else timer.current = setTimeout(() => setOpen(true), 180)
  }
  function delayHide() {
    clear()
    timer.current = setTimeout(() => setOpen(false), 100)
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  useEffect(() => {
    if (!visible) return
    const dismiss = () => setOpen(false)
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      dismiss()
    }
    document.addEventListener('keydown', escape, true)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      document.removeEventListener('keydown', escape, true)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [visible])
  return (
    <>
      {cloneElement(children, {
        'aria-describedby': visible
          ? [children.props['aria-describedby'], id].filter(Boolean).join(' ')
          : children.props['aria-describedby'],
        onPointerEnter: (event) => {
          children.props.onPointerEnter?.(event)
          if (event.pointerType !== 'touch') show(event.currentTarget)
        },
        onPointerLeave: (event) => {
          children.props.onPointerLeave?.(event)
          delayHide()
        },
        onFocus: (event) => {
          children.props.onFocus?.(event)
          show(event.currentTarget, true)
        },
        onBlur: (event) => {
          children.props.onBlur?.(event)
          hide()
        },
        onClick: (event) => {
          children.props.onClick?.(event)
          hide()
        },
      })}
      {anchor &&
        createPortal(
          <AnimatePresence>
            {visible && (
              <Bubble
                anchor={anchor}
                id={id}
                label={label}
                description={description}
                side={side}
                keepOpen={clear}
                close={delayHide}
              />
            )}
          </AnimatePresence>,
          anchor.closest('dialog[open]') || document.body,
        )}
    </>
  )
}
