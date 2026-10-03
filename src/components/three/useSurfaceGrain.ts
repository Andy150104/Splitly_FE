import { useEffect, useMemo } from 'react'
import { DataTexture, RepeatWrapping, RGBAFormat } from 'three'

export default function useSurfaceGrain() {
  const texture = useMemo(() => {
    const pixels = new Uint8Array(64 * 64 * 4)
    let seed = 71
    for (let i = 0; i < pixels.length; i += 4) {
      seed = (seed * 16807) % 2147483647
      const value = 112 + (seed % 32)
      pixels.set([value, value, value, 255], i)
    }
    const grain = new DataTexture(pixels, 64, 64, RGBAFormat)
    grain.wrapS = grain.wrapT = RepeatWrapping
    grain.repeat.set(7, 5)
    grain.needsUpdate = true
    return grain
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}
