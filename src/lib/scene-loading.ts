// Progress represents completed preparation milestones, not downloaded bytes.
export const SCENE_LOADING_PROGRESS = {
  loading: 0,
  renderer: 35,
  materials: 60,
  compiled: 88,
  warm: 96,
  ready: 100,
  fallback: 0,
} as const

export type SceneLoadingStage = keyof typeof SCENE_LOADING_PROGRESS
