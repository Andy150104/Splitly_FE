'use client'

import { useEffect, useRef, useState } from 'react'
import OfflineScreen from './ui/OfflineScreen'

const RETRY_EVENT = 'splitly:retry-connection'

export default function OfflineStatus() {
  const [offline, setOffline] = useState(false)
  const [checking, setChecking] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    let active = true
    let disconnected = false
    let restoring = false
    let pending: AbortController | undefined
    let lastCheck = 0

    const markOffline = () => {
      disconnected = true
      pending?.abort()
      pending = undefined
      setChecking(false)
      setOffline(true)
    }

    const checkConnection = async () => {
      if (pending || restoring || document.hidden) return
      if (!navigator.onLine) {
        markOffline()
        return
      }
      lastCheck = Date.now()
      const controller = new AbortController()
      pending = controller
      setChecking(true)
      const timeout = window.setTimeout(() => controller.abort(), 6000)
      try {
        // Verify the app is reachable: Wi-Fi alone does not guarantee internet access.
        const response = await fetch('/api/connectivity', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!active || pending !== controller) return
        if (response.status === 204 && disconnected) {
          restoring = true
          window.location.reload()
        }
      } catch {
        if (active && pending === controller) markOffline()
      } finally {
        window.clearTimeout(timeout)
        if (active && pending === controller) {
          pending = undefined
          setChecking(false)
        }
      }
    }

    const onVisible = () => {
      if (!document.hidden) void checkConnection()
    }
    const initial = window.setTimeout(() => void checkConnection(), 0)
    const poll = window.setInterval(() => {
      if (disconnected || Date.now() - lastCheck >= 15000) void checkConnection()
    }, 3000)
    window.addEventListener('offline', markOffline)
    window.addEventListener('online', checkConnection)
    window.addEventListener('focus', checkConnection)
    window.addEventListener(RETRY_EVENT, checkConnection)
    document.addEventListener('visibilitychange', onVisible)

    if ('serviceWorker' in navigator && window.isSecureContext) {
      // Only the static offline screen is cached, never account pages or API data.
      void navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => {
          // The current page still handles disconnects if storage/registration is unavailable.
        })
    }

    return () => {
      active = false
      pending?.abort()
      window.clearTimeout(initial)
      window.clearInterval(poll)
      window.removeEventListener('offline', markOffline)
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('focus', checkConnection)
      window.removeEventListener(RETRY_EVENT, checkConnection)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    const element = dialog.current
    if (offline && element && !element.open) {
      element.showModal()
      element
        .querySelector<HTMLButtonElement>('.splitly-offline-retry')
        ?.focus({ preventScroll: true })
    }
    return () => {
      if (element?.open) element.close()
    }
  }, [offline])

  if (!offline) return null

  return (
    <dialog
      ref={dialog}
      className="splitly-offline"
      aria-labelledby="offline-title"
      aria-describedby="offline-description"
      onCancel={(event) => event.preventDefault()}
    >
      <OfflineScreen
        checking={checking}
        onRetry={() => window.dispatchEvent(new Event(RETRY_EVENT))}
      />
    </dialog>
  )
}
