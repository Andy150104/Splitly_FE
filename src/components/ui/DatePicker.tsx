'use client'

import { useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { DayPicker } from 'react-day-picker'
import { vi } from 'react-day-picker/locale'
import { format, parseISO, isValid } from 'date-fns'
import { CalendarDays } from 'lucide-react'

function dateValue(value?: string) {
  const date = value ? parseISO(value) : undefined
  return date && isValid(date) ? date : undefined
}

export default function DatePicker({
  label,
  value,
  onChange,
  min,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [container, setContainer] = useState<HTMLElement | undefined>()
  const trigger = useRef<HTMLButtonElement>(null)
  const selected = dateValue(value)
  const minimum = dateValue(min)
  const [month, setMonth] = useState<Date | undefined>(selected)
  function choose(date?: Date) {
    onChange(date ? format(date, 'yyyy-MM-dd') : '')
    setOpen(false)
  }
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setContainer((trigger.current?.closest('dialog[open]') as HTMLElement) || undefined)
          setMonth(selected || minimum || new Date())
        }
        setOpen(next)
      }}
    >
      <Popover.Trigger asChild>
        <button
          ref={trigger}
          type="button"
          className="ws-date-trigger"
          aria-label={label}
          aria-required={required}
          data-value={value}
        >
          <span>{selected ? format(selected, 'dd/MM/yyyy') : 'Chọn ngày'}</span>
          <CalendarDays size={17} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal container={container}>
        <Popover.Content
          className="ws-calendar-popover"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          aria-label={`Chọn ${label.toLocaleLowerCase('vi')}`}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          <DayPicker
            mode="single"
            locale={vi}
            weekStartsOn={1}
            selected={selected}
            month={month}
            onMonthChange={setMonth}
            onSelect={choose}
            required={required}
            disabled={minimum ? { before: minimum } : undefined}
            showOutsideDays
            fixedWeeks
            autoFocus
          />
          <div className="ws-calendar-actions">
            <button
              type="button"
              disabled={Boolean(minimum && new Date().setHours(0, 0, 0, 0) < minimum.getTime())}
              onClick={() => choose(new Date())}
            >
              Hôm nay
            </button>
            {!required && (
              <button type="button" disabled={!selected} onClick={() => choose()}>
                Xóa ngày
              </button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
