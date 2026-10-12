import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, SRGBColorSpace } from 'three'
import type { BufferGeometry } from 'three'
import { useTheme, useThemeTransition } from '../../hooks/useTheme'
import type { Theme } from '../../lib/theme'

// Shift the original violet pigments to blue, preserving their saturation and lightness.
// Other pigments and the established dark materials keep their original values.
const blueColors = new Map<string, string>()
function blue(color: string) {
  const cached = blueColors.get(color)
  if (cached) return cached
  const pigment = new Color(color)
  const hsl = pigment.getHSL({ h: 0, s: 0, l: 0 }, SRGBColorSpace)
  const value =
    hsl.h >= 250 / 360 && hsl.h <= 330 / 360 && hsl.s > 0.04
      ? `#${pigment.setHSL(210 / 360, hsl.s, hsl.l, SRGBColorSpace).getHexString()}`
      : color
  blueColors.set(color, value)
  return value
}
const original = (color: string) => color
const PaletteContext = createContext<{ theme: Theme; color: typeof original }>({
  theme: 'dark',
  color: original,
})
const GeometryContext = createContext<Map<string, BufferGeometry> | null>(null)

/** Repeated emblems share their immutable geometry and GPU buffers within one canvas. */
export function useSceneGeometry(key: string, create: () => BufferGeometry) {
  const cache = useContext(GeometryContext)
  const geometry = useMemo(() => {
    const existing = cache?.get(key)
    if (existing) return existing
    const value = create()
    cache?.set(key, value)
    return value
  }, [cache, key, create])
  useEffect(
    () => () => {
      if (!cache) geometry.dispose()
    },
    [cache, geometry],
  )
  return geometry
}

export const useSceneColor = () => useContext(PaletteContext).color
export const useSceneTheme = () => useContext(PaletteContext).theme

const palettes = {
  dark: { theme: 'dark' as const, color: original },
  light: { theme: 'light' as const, color: blue },
}

/** Apply the app palette within a canvas while preserving the original dark materials. */
export default function SceneTheme({ children }: { children: ReactNode }) {
  const theme = useTheme()
  const transitioning = useThemeTransition()
  const { gl, invalidate, frameloop } = useThree()
  const elapsed = useRef(0)
  const geometries = useMemo(() => new Map<string, BufferGeometry>(), [])
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries])
  // R3F resets clock.elapsedTime when changing frameloop. Keep a continuous
  // scene clock so pausing/resuming the reveal cannot snap the model or orbits.
  useFrame(({ clock }, delta) => {
    if (!transitioning) elapsed.current += Math.min(delta, 0.05)
    clock.elapsedTime = elapsed.current
  }, -1000)
  useLayoutEffect(() => {
    gl.domElement.dataset.palette = theme
    gl.domElement.dataset.renderLoop = frameloop
    invalidate()
  }, [gl, invalidate, theme, frameloop])
  return (
    <GeometryContext value={geometries}>
      <PaletteContext value={palettes[theme]}>{children}</PaletteContext>
    </GeometryContext>
  )
}
