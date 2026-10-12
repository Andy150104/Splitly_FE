'use client'

import { useCallback, useState } from 'react'
import { SCENE_LOADING_PROGRESS } from '../lib/scene-loading'
import type { SceneLoadingStage } from '../lib/scene-loading'

export function useSceneLoading() {
  const [stage, setStage] = useState<SceneLoadingStage>('loading')
  const onStage = useCallback((next: SceneLoadingStage) => {
    setStage((current) => {
      if (next === 'fallback') return next
      if (current === 'fallback') return current
      return SCENE_LOADING_PROGRESS[next] > SCENE_LOADING_PROGRESS[current] ? next : current
    })
  }, [])
  const reset = useCallback(() => setStage('loading'), [])
  return { stage, onStage, reset }
}
