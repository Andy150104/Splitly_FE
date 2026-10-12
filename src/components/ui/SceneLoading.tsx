'use client'

import { useEffect, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { SCENE_LOADING_PROGRESS } from '../../lib/scene-loading'
import type { SceneLoadingStage } from '../../lib/scene-loading'

/** A small preparation meter; no ticking timer or extra rendering while loading. */
export default function SceneLoading({ stage }: { stage: SceneLoadingStage }) {
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    setDismissed(false)
    if (stage !== 'ready') return
    const timer = window.setTimeout(() => setDismissed(true), 650)
    return () => clearTimeout(timer)
  }, [stage])
  if (stage === 'fallback' || dismissed) return null
  const value = SCENE_LOADING_PROGRESS[stage]
  const complete = stage === 'ready'
  const label = complete ? 'Không gian đã sẵn sàng' : 'Chuẩn bị không gian 3D'
  return (
    <div
      className="scene-loading"
      data-stage={stage}
      role="progressbar"
      aria-label="Chuẩn bị không gian 3D"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${label}, ${value}%`}
    >
      <span className="scene-loading-icon" aria-hidden="true">
        {complete ? <Check size={14} /> : <Sparkles size={14} />}
      </span>
      <span className="scene-loading-copy">
        <span className="scene-loading-heading">
          <span>{label}</span>
          <span className="scene-loading-value">
            {value}
            <small>%</small>
          </span>
        </span>
        <span className="scene-loading-track" aria-hidden="true">
          <span className="scene-loading-fill" style={{ transform: `scaleX(${value / 100})` }} />
        </span>
      </span>
    </div>
  )
}
