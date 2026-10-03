'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, ChevronDown, Search } from 'lucide-react'
import type { Bank } from '../../lib/api/types'
import { safeExternalUrl } from '../../lib/api/client'

const popular = ['VCB', 'MB', 'TCB', 'BIDV', 'CTG', 'ACB', 'VPB', 'TPB', 'STB', 'VIB', 'HDB', 'MSB']
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()

export function BankLogo({ bank, name }: { bank?: Bank; name?: string | null }) {
  const src = safeExternalUrl(bank?.logo)
  const [failed, setFailed] = useState('')
  const [loaded, setLoaded] = useState('')
  return (
    <span className="ws-bank-logo">
      {src && failed !== src ? (
        <img
          src={src}
          alt={`Logo ${bank?.shortName || bank?.name || name || 'ngân hàng'}`}
          width={64}
          height={32}
          loading="lazy"
          className={loaded === src ? 'is-loaded' : ''}
          onLoad={() => setLoaded(src!)}
          onError={() => setFailed(src)}
        />
      ) : null}
      {(!src || failed === src || loaded !== src) && (
        <span>{bank?.code || (name || 'NH').slice(0, 3).toUpperCase()}</span>
      )}
    </span>
  )
}

export default function BankPicker({
  banks,
  value,
  onChange,
  disabled = false,
}: {
  banks: Bank[]
  value: string
  onChange: (bank: Bank) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const id = useId()
  const reduced = useReducedMotion()
  const selected = banks.find((bank) => bank.bin === value)
  const sorted = [...banks]
    .filter((bank) => bank.lookupSupported && bank.bin)
    .sort((a, b) => {
      const aIndex = popular.indexOf(a.code || '')
      const bIndex = popular.indexOf(b.code || '')
      return (
        (aIndex < 0 ? 100 : aIndex) - (bIndex < 0 ? 100 : bIndex) ||
        (a.shortName || '').localeCompare(b.shortName || '', 'vi')
      )
    })
  const matches = sorted.filter((bank) =>
    normalize(`${bank.name} ${bank.shortName} ${bank.code} ${bank.bin}`).includes(normalize(query)),
  )
  const results = query || showAll ? matches : matches.slice(0, 24)
  useEffect(() => {
    if (!open) return
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  function select(bank: Bank) {
    onChange(bank)
    setOpen(false)
    setQuery('')
    input.current?.focus()
  }
  function move(index: number) {
    const next = Math.max(0, Math.min(index, results.length - 1))
    setActive(next)
    list.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' })
  }
  return (
    <div className={`ws-bank-picker ${open ? 'is-open' : ''}`} ref={root}>
      <label className="ws-picker-label" htmlFor={`${id}-input`}>
        Ngân hàng
      </label>
      <div className="ws-bank-trigger">
        {selected && !open ? <BankLogo bank={selected} /> : <Search size={17} aria-hidden="true" />}
        <input
          id={`${id}-input`}
          ref={input}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={
            open && results[active] ? `${id}-${results[active].bin}` : undefined
          }
          disabled={disabled}
          autoComplete="off"
          value={open ? query : selected?.shortName || selected?.name || ''}
          placeholder={open ? 'Tìm tên, mã ngân hàng hoặc BIN…' : 'Tìm và chọn ngân hàng'}
          onFocus={() => {
            setOpen(true)
            setActive(0)
          }}
          onClick={() => {
            if (!open) {
              setOpen(true)
              setActive(0)
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setActive(0)
          }}
          onBlur={(event) => {
            if (!root.current?.contains(event.relatedTarget)) {
              setOpen(false)
              setQuery('')
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              const columns = list.current
                ? getComputedStyle(list.current).gridTemplateColumns.split(' ').length
                : 2
              move(open ? active + (event.key === 'ArrowDown' ? columns : -columns) : 0)
            }
            if (open && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
              event.preventDefault()
              move(active + (event.key === 'ArrowRight' ? 1 : -1))
            }
            if (event.key === 'Enter' && open) {
              event.preventDefault()
              if (results[active]) select(results[active])
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
              setQuery('')
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={open ? 'Đóng danh sách ngân hàng' : 'Mở danh sách ngân hàng'}
          onClick={() => {
            if (open) {
              setOpen(false)
              setQuery('')
            } else {
              setOpen(true)
              input.current?.focus()
            }
          }}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="ws-bank-popover"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            <div className="ws-bank-popover-heading">
              <span>
                {query ? 'Kết quả tìm kiếm' : showAll ? 'Tất cả ngân hàng' : 'Ngân hàng phổ biến'}
              </span>
              <small aria-live="polite">{matches.length} ngân hàng</small>
            </div>
            <div
              id={`${id}-list`}
              className="ws-bank-options"
              ref={list}
              role="listbox"
              aria-label="Ngân hàng hỗ trợ xác minh"
            >
              {results.map((bank, index) => (
                <div
                  key={bank.bin}
                  id={`${id}-${bank.bin}`}
                  role="option"
                  aria-selected={bank.bin === value}
                  className={`ws-bank-option ${active === index ? 'is-active' : ''}`}
                  data-index={index}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => select(bank)}
                  onPointerMove={() => setActive(index)}
                >
                  <BankLogo bank={bank} />
                  <span>
                    <strong>{bank.shortName || bank.name}</strong>
                    <small>
                      {bank.code} · {bank.bin}
                    </small>
                  </span>
                  {bank.bin === value && <Check size={16} />}
                </div>
              ))}
              {!results.length && (
                <p className="ws-bank-no-results">
                  Không tìm thấy ngân hàng. Thử tên hoặc mã khác.
                </p>
              )}
            </div>
            <div className="ws-bank-popover-footer">
              {!query && (
                <button
                  type="button"
                  className="ws-text-button"
                  onClick={() => {
                    setShowAll(!showAll)
                    setActive(0)
                  }}
                >
                  {showAll ? 'Thu gọn danh sách' : `Xem tất cả ${sorted.length} ngân hàng`}
                </button>
              )}
              <span>Dùng phím mũi tên để chọn · Enter xác nhận</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
