'use client'

import { cloneElement, isValidElement } from 'react'
import type { ReactNode } from 'react'

// Server supplies an actual control, or null. Bind only local interaction/state.
// This does not calculate or authorize permissions.
export function bindControl(control: ReactNode, props: Record<string, unknown> = {}): ReactNode {
  return isValidElement<Record<string, unknown>>(control) ? cloneElement(control, props) : null
}

// Preserve the label/hint already rendered by a server Field when adding local inputs.
export function fillControl(control: ReactNode, { children }: { children: ReactNode }): ReactNode {
  return isValidElement<{ children?: ReactNode }>(control)
    ? cloneElement(control, {}, control.props.children, children)
    : null
}
