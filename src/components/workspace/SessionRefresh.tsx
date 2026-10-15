'use client'

import { useEffect } from 'react'

export default function SessionRefresh({ destination }: { destination: string }) {
  const href = `/api/auth/refresh-session?next=${encodeURIComponent(destination)}`
  useEffect(() => {
    // Refresh writes cookies, so finish with a document navigation, not a Flight fetch.
    // This also discards the router's response for the expired session.
    window.location.replace(href)
  }, [href])
  return (
    <main className="ws-empty">
      <h2>Đang khôi phục phiên đăng nhập</h2>
      <p role="status">Chờ một chút để trở lại trang bạn đang mở.</p>
      <a href={href} className="ws-button">
        Tiếp tục
      </a>
    </main>
  )
}
