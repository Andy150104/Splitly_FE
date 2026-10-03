import { useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'

export default function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const element = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = element.current
    if (!node) return
    if (message) node.showPopover?.()
    else node.hidePopover?.()
  }, [message])
  return (
    <div
      ref={element}
      popover="manual"
      className="toast-region"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message && (
        <div className="toast">
          <Check size={18} />
          <span>{message}</span>
          <button onClick={onDismiss} aria-label="Đóng thông báo">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
