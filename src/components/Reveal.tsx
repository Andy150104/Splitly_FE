import type { ReactNode } from 'react'

/** Editorial content is visible from the server render; motion belongs to interactions. */
export default function Reveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return <div className={className}>{children}</div>
}
