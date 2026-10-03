import { useMemo, useRef } from 'react'
import { Vector2 } from 'three'
import type { MeshBasicMaterial, Texture } from 'three'
import type { ReactNode } from 'react'
import { landingMetal, landingPaper } from './landingMaterials'
import useSurfaceGrain from './useSurfaceGrain'

/** Hollow glass, a narrow paper wrap and an anodized lid have distinct finishes. */
export default function SavingsVessel({
  label,
  children,
}: {
  label: Texture
  children: ReactNode
}) {
  const grain = useSurfaceGrain()
  const backdrop = useRef<MeshBasicMaterial>(null)
  const wall = useMemo(
    () =>
      [
        [0, -1],
        [0.58, -1],
        [0.7, -0.97],
        [0.77, -0.84],
        [0.78, -0.65],
        [0.78, 0.62],
        [0.74, 0.8],
        [0.66, 0.92],
        [0.66, 1],
        [0.6, 1],
        [0.6, 0.92],
        [0.68, 0.77],
        [0.72, 0.6],
        [0.72, -0.63],
        [0.7, -0.8],
        [0.64, -0.9],
        [0, -0.9],
      ].map(([x, y]) => new Vector2(x, y)),
    [],
  )
  const lid = useMemo(
    () =>
      [
        [0, -0.09],
        [0.66, -0.09],
        [0.695, -0.075],
        [0.71, -0.045],
        [0.71, 0.045],
        [0.695, 0.075],
        [0.66, 0.09],
        [0, 0.09],
      ].map(([x, y]) => new Vector2(x, y)),
    [],
  )
  return (
    <group>
      {/* Three clears transmission buffers white when the canvas has an alpha background.
          Supply charcoal only to that offscreen pass; keep the visible canvas transparent. */}
      <mesh
        position={[0, 0, -1.6]}
        onBeforeRender={(renderer) => {
          if (backdrop.current) backdrop.current.colorWrite = renderer.getRenderTarget() !== null
        }}
      >
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial
          ref={backdrop}
          color="#0e0c16"
          colorWrite={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {children}
      <mesh>
        <latheGeometry args={[wall, 96]} />
        <meshPhysicalMaterial
          color="#e7e2ed"
          transmission={0.96}
          thickness={0.06}
          ior={1.45}
          roughness={0.045}
          metalness={0}
          envMapIntensity={0.8}
        />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.786, 0.786, 0.61, 96, 1, true]} />
        <meshStandardMaterial {...landingPaper} color="#e6e0d5" bumpMap={grain} bumpScale={0.004} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry
          args={[0.788, 0.788, 0.59, 40, 1, true, -Math.PI * 0.27, Math.PI * 0.54]}
        />
        <meshStandardMaterial {...landingPaper} map={label} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.03, 0]}>
        <latheGeometry args={[lid, 96]} />
        <meshPhysicalMaterial {...landingMetal} color="#443255" metalness={0.7} roughness={0.34} />
      </mesh>
      {[-0.04, 0.015].map((offset) => (
        <mesh key={offset} position={[0, 1.03 + offset, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.702, 0.006, 8, 96]} />
          <meshPhysicalMaterial {...landingMetal} color="#b5a6c7" roughness={0.36} />
        </mesh>
      ))}
      <mesh position={[0, 1.122, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.53, 0.065]} />
        <meshStandardMaterial color="#17121f" roughness={0.9} />
      </mesh>
    </group>
  )
}
