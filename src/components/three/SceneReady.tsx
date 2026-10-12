import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useSceneTheme } from './SceneTheme'
import type { SceneLoadingStage } from '../../lib/scene-loading'

/** Compile offscreen, upload the first frames, then hand rendering back to R3F. */
export default function SceneReady({
  onReady,
  onError,
  onStage,
}: {
  onReady: () => void
  onError: () => void
  onStage: (stage: SceneLoadingStage) => void
}) {
  const { gl, scene, camera, invalidate } = useThree()
  const theme = useSceneTheme()
  const [ready, setReady] = useState(false)
  const sent = useRef(false)
  const revealScheduled = useRef(false)
  const compiled = useRef(false)
  const renderedFrames = useRef(0)
  const frame = useRef(0)
  const callbacks = useRef({ onReady, onError, onStage })
  useLayoutEffect(() => {
    callbacks.current = { onReady, onError, onStage }
  }, [onReady, onError, onStage])
  useEffect(() => {
    if (sent.current) return
    let disposed = false
    let idle = 0
    let timer = 0
    compiled.current = false
    revealScheduled.current = false
    renderedFrames.current = 0
    gl.domElement.dataset.sceneStage = 'compiling'
    callbacks.current.onStage('materials')
    const prepare = async () => {
      try {
        await gl.compileAsync(scene, camera)
        if (disposed || gl.getContext().isContextLost()) return
        compiled.current = true
        gl.domElement.dataset.sceneStage = 'warming'
        callbacks.current.onStage('compiled')
        invalidate()
      } catch {
        if (!disposed) callbacks.current.onError()
      }
    }
    // Labels must use the final fonts. Yield before starting shader work so the
    // form and text get a paint and input can run ahead of the optional scene.
    void document.fonts.ready.then(() => {
      if (disposed) return
      if (typeof window.requestIdleCallback === 'function')
        idle = window.requestIdleCallback(() => void prepare(), { timeout: 1200 })
      else timer = window.setTimeout(() => void prepare(), 0)
    })
    return () => {
      disposed = true
      if (idle) window.cancelIdleCallback(idle)
      clearTimeout(timer)
      cancelAnimationFrame(frame.current)
      revealScheduled.current = false
    }
  }, [gl, scene, camera, invalidate, theme])
  // Priority 1 suppresses the automatic first render until compilation is done.
  // Once warm, priority 0 restores R3F's normal renderer (including demand mode).
  useFrame(
    () => {
      if (ready || revealScheduled.current || !compiled.current || gl.getContext().isContextLost())
        return
      gl.render(scene, camera)
      renderedFrames.current++
      if (renderedFrames.current < 2) {
        callbacks.current.onStage('warm')
        invalidate()
        return
      }
      revealScheduled.current = true
      frame.current = requestAnimationFrame(() => {
        if (gl.getContext().isContextLost()) return
        sent.current = true
        gl.domElement.dataset.sceneStage = 'ready'
        setReady(true)
        callbacks.current.onReady()
        callbacks.current.onStage('ready')
      })
    },
    ready ? 0 : 1,
  )
  return null
}
