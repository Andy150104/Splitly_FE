'use client'

import { Children, Fragment, isValidElement, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

type Option = { value: string; label: ReactNode; disabled?: boolean }
function collectOptions(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; children?: ReactNode; disabled?: boolean }>(child))
      return []
    if (child.type === Fragment) return collectOptions(child.props.children)
    return child.type === 'option'
      ? [
          {
            value: child.props.value ?? '',
            label: child.props.children,
            disabled: child.props.disabled,
          },
        ]
      : []
  })
}

export default function Select({
  children,
  value = '',
  onValueChange,
  disabled,
  required,
  className = '',
  'aria-label': label,
}: {
  children: ReactNode
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  className?: string
  'aria-label'?: string
}) {
  const id = useId()
  const empty = `empty-${id}`
  const trigger = useRef<HTMLButtonElement>(null)
  const [container, setContainer] = useState<HTMLElement | undefined>()
  const options = collectOptions(children)
  return (
    <SelectPrimitive.Root
      value={value || (required ? '' : empty)}
      onValueChange={(next) => onValueChange(next === empty ? '' : next)}
      onOpenChange={(open) => {
        if (open)
          setContainer((trigger.current?.closest('dialog[open]') as HTMLElement) || undefined)
      }}
      disabled={disabled}
      required={required}
    >
      <SelectPrimitive.Trigger
        ref={trigger}
        className={`ws-select-trigger ${className}`}
        aria-label={label}
        data-value={value}
      >
        <SelectPrimitive.Value placeholder={options.find((option) => !option.value)?.label} />
        <SelectPrimitive.Icon className="ws-select-chevron">
          <ChevronDown size={16} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={container}>
        <SelectPrimitive.Content
          className="ws-select-menu"
          position="popper"
          sideOffset={7}
          collisionPadding={12}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          <SelectPrimitive.Viewport className="ws-select-options">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                className="ws-select-option"
                value={option.value || empty}
                disabled={option.disabled || (required && !option.value)}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ws-select-check">
                  <Check size={15} aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
