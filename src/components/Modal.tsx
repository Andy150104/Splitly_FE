import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = dialog.current
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    node?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      node?.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className={`modal ${wide ? 'modal-wide' : ''}`}
      aria-labelledby={wide ? 'wallet-dialog-title' : 'dialog-title'}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose()
        }
      }}
    >
      <div className="modal-header">
        <div>
          <span className="eyebrow">MỘT KHÔNG GIAN CỦA RIÊNG BẠN</span>
          <h2 id={wide ? 'wallet-dialog-title' : 'dialog-title'}>{title}</h2>
        </div>
        <button
          className="icon-button modal-close"
          aria-label={wide ? 'Đóng ví' : 'Đóng hộp thoại'}
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
