import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Vector3,
} from 'three'
import type { Group } from 'three'
import type { RefObject } from 'react'

export type UniverseMotion = { time: number; lift: number }

function useAtmosphereTexture(kind: 'haze' | 'star') {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = kind === 'star' ? 64 : 256
    const ctx = canvas.getContext('2d')!
    const center = canvas.width / 2
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
    if (kind === 'star') {
      gradient.addColorStop(0, 'rgba(255,255,255,1)')
      gradient.addColorStop(0.16, 'rgba(235,222,255,.9)')
      gradient.addColorStop(0.4, 'rgba(186,152,244,.2)')
    } else {
      gradient.addColorStop(0, 'rgba(109,70,157,.48)')
      gradient.addColorStop(0.44, 'rgba(73,49,113,.28)')
      gradient.addColorStop(0.75, 'rgba(42,75,98,.1)')
    }
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return new CanvasTexture(canvas)
  }, [kind])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

/** A small, local universe shares the product's centre and actual perspective. */
export default function ProductUniverse({ motion }: { motion: RefObject<UniverseMotion> }) {
  const { size } = useThree()
  const ring = useRef<Group>(null)
  const stars = useRef<Group>(null)
  const nodes = useRef<(Group | null)[]>([])
  const haze = useAtmosphereTexture('haze')
  const glow = useAtmosphereTexture('star')
  const point = useMemo(() => new Vector3(), [])
  const paths = useMemo(
    () =>
      [0, 1].map(
        (index) =>
          new CatmullRomCurve3(
            Array.from({ length: 97 }, (_, i) => {
              const angle = (i / 96) * Math.PI * 2
              return new Vector3(
                Math.cos(angle) * (2.65 + index * 0.12),
                Math.sin(angle) * (1.85 - index * 0.42),
                Math.sin(angle) * (index ? -0.85 : 0.55),
              )
            }),
            true,
          ),
      ),
    [],
  )
  const geometry = useMemo(() => {
    const positions = new Float32Array(72 * 3)
    for (let i = 0; i < 72; i++) {
      const angle = i * 2.399963
      const radius = 2.1 + (i % 11) * 0.13
      positions.set(
        [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.86, -0.65 - (i % 9) * 0.21],
        i * 3,
      )
    }
    const result = new BufferGeometry()
    result.setAttribute('position', new BufferAttribute(positions, 3))
    return result
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => {
    geometry.setDrawRange(0, size.width < 720 ? 24 : 72)
  }, [geometry, size.width])
  useFrame(() => {
    const value = motion.current
    if (ring.current) {
      ring.current.rotation.set(
        0.23 + Math.sin(value.time * 0.13) * 0.12,
        value.lift * 0.12,
        -0.26 + Math.sin(value.time * 0.08) * 0.12,
      )
      ring.current.scale.setScalar(1 + value.lift * 0.045)
    }
    if (stars.current) stars.current.rotation.z = value.time * 0.015
    nodes.current.forEach((node, i) => {
      if (!node) return
      paths[i % 2].getPointAt((value.time * 0.025 + i / 3) % 1, point)
      node.position.copy(point)
    })
  })
  return (
    <group>
      <mesh position={[0, 0.2, -1.9]} renderOrder={-2}>
        <planeGeometry args={[7.2, 6]} />
        <meshBasicMaterial
          map={haze}
          transparent
          opacity={0.72}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <group ref={stars}>
        <points geometry={geometry}>
          <pointsMaterial
            map={glow}
            color="#dacbec"
            size={0.095}
            transparent
            opacity={0.78}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>
      <group ref={ring}>
        {paths.map((curve, i) => (
          <mesh key={i}>
            <tubeGeometry args={[curve, 128, i ? 0.003 : 0.006, 5, true]} />
            <meshBasicMaterial
              color={i ? '#89abb5' : '#a892c2'}
              transparent
              opacity={i ? 0.3 : 0.48}
              depthWrite={false}
            />
          </mesh>
        ))}
        {Array.from({ length: size.width < 720 ? 2 : 3 }, (_, i) => (
          <group
            key={i}
            ref={(node) => {
              nodes.current[i] = node
            }}
          >
            <mesh>
              <sphereGeometry args={[0.026, 12, 8]} />
              <meshBasicMaterial color="#eadcff" />
            </mesh>
            <sprite scale={[0.22, 0.22, 1]}>
              <spriteMaterial
                map={glow}
                color="#d9b8ff"
                transparent
                opacity={0.68}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </sprite>
          </group>
        ))}
      </group>
    </group>
  )
}
