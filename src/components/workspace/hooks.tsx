'use client'

import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api/client'
import type { User } from '../../lib/api/session'
import type { PermissionView } from '../../lib/api/views'

export const WorkspaceContext = createContext<{
  user: User
  permissions: PermissionView | null
  reloadPermissions: () => void
}>({
  user: { email: '', displayName: '' },
  permissions: null,
  reloadPermissions: () => {},
})
export function useWorkspace() {
  const state = useContext(WorkspaceContext)
  return {
    ...state,
    can: (code: string) => state.permissions?.effectivePermissionCodes?.includes(code) === true,
  }
}
export function useApi<T>(path: string | null, poll: boolean | ((data: T) => boolean) = false) {
  const [resource, setResource] = useState<{ path: string; data: T } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [settledPath, setSettledPath] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])
  useEffect(() => {
    if (!path) {
      setLoading(false)
      setResource(null)
      setError('')
      return
    }
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    setLoading(true)
    setError('')
    async function load(first = false) {
      let continuePolling = Boolean(poll)
      try {
        const result = await api<T>(path!, { signal: controller.signal })
        if (!controller.signal.aborted) {
          setResource({ path: path!, data: result })
          setError('')
        }
        continuePolling = typeof poll === 'function' ? poll(result) : poll
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.')
      } finally {
        if (!controller.signal.aborted) {
          if (first) {
            setLoading(false)
            setSettledPath(path)
          }
          if (continuePolling)
            timer = setTimeout(function tick() {
              if (document.visibilityState === 'visible') void load()
              else timer = setTimeout(tick, 3000)
            }, 3000)
        }
      }
    }
    // Defer dispatch so React's development effect replay does not send a
    // request that is immediately aborted, then repeat the permission calls.
    const start = setTimeout(() => void load(true), 0)
    return () => {
      clearTimeout(start)
      controller.abort()
      clearTimeout(timer)
    }
  }, [path, version, poll])
  const data = resource?.path === path ? resource.data : null
  return {
    data,
    error,
    loading: !!path && data === null && (loading || settledPath !== path),
    isRefreshing: data !== null && loading,
    reload,
  }
}
