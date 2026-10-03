'use client'

import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import Tooltip from './Tooltip'

export default function SearchInput({
  label,
  placeholder,
  value,
  onChange,
  className = '',
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className={`ws-search-control ${className}`}>
      <Search size={16} aria-hidden="true" />
      <input
        ref={input}
        className="ws-search-input"
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <Tooltip label="Xóa từ khóa" side="bottom">
          <button
            className="ws-search-clear"
            type="button"
            aria-label={`Xóa từ khóa: ${label}`}
            onClick={() => {
              onChange('')
              input.current?.focus()
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </Tooltip>
      )}
    </div>
  )
}
