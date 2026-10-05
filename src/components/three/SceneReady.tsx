import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/** Notify after a rendered frame, rather than after the chunk or Canvas has mounted. */
export default function SceneReady({ onReady }: { onReady: () => void }) {
  const sent = useRef(false)
  const frame = useRef(0)
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      sent.current = false
    },
    [],
  )
  useFrame(({ gl }) => {
    if (sent.current || gl.getContext().isContextLost()) return
    sent.current = true
    frame.current = requestAnimationFrame(onReady)
  })
  return null
}
