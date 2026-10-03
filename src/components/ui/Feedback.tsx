'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Skeleton from './Skeleton'
import { useNotify } from './Notifications'

export function Notice({ message, success = false }: { message: string; success?: boolean }) {
  const notify = useNotify()
  useEffect(() => {
    if (message) notify(message, success)
  }, [message, success, notify])
  return message ? (
    <div className={`ws-notice ${success ? 'is-success' : ''}`} role={success ? 'status' : 'alert'}>
      <span>{message}</span>
    </div>
  ) : null
}
export function Loading(props: Parameters<typeof Skeleton>[0]) {
  return <Skeleton {...props} />
}
export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  const notify = useNotify()
  useEffect(() => {
    if (message) notify(message)
  }, [message, notify])
  return (
    <div className="ws-empty">
      <h2>Chưa tải được dữ liệu</h2>
      <p>{message}</p>
      <button className="ws-button" onClick={retry}>
        Thử lại
      </button>
    </div>
  )
}
export function Empty({
  title,
  description,
  href,
  action,
}: {
  title: string
  description: string
  href?: string
  action?: string
}) {
  return (
    <div className="ws-empty">
      <h2>{title}</h2>
      <p>{description}</p>
      {href && (
        <Link className="ws-button" href={href}>
          {action}
        </Link>
      )}
    </div>
  )
}
