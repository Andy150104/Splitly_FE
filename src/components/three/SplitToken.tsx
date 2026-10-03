import { useLayoutEffect, useMemo, useRef } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { Object3D, Vector2 } from 'three'
import type { InstancedMesh } from 'three'
import LinkedLoop from './LinkedLoop'
import { satin, softMetal, studio } from './materials'
import { landingMetal } from './landingMaterials'

export default function SplitToken({
  finish = 'studio',
  ...props
}: ThreeElements['group'] & { finish?: 'studio' | 'metal' }) {
  const metallic = finish === 'metal'
  const milling = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!milling.current) return
    const ridge = new Object3D()
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2
      ridge.position.set(Math.cos(angle) * 0.378, Math.sin(angle) * 0.378, 0)
      ridge.rotation.z = angle
      ridge.updateMatrix()
      milling.current.setMatrixAt(i, ridge.matrix)
    }
    milling.current.instanceMatrix.needsUpdate = true
  }, [])
  const edge = useMemo(
    () =>
      [
        [0, -0.05],
        [0.345, -0.05],
        [0.37, -0.043],
        [0.38, -0.025],
        [0.38, 0.025],
        [0.37, 0.043],
        [0.345, 0.05],
        [0, 0.05],
      ].map(([radius, height]) => new Vector2(radius, height)),
    [],
  )
  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <latheGeometry args={[edge, 64]} />
        <meshPhysicalMaterial
          color={metallic ? '#c7bfd5' : studio.lavender}
          {...(metallic ? landingMetal : softMetal)}
        />
      </mesh>
      <instancedMesh ref={milling} args={[undefined, undefined, 48]}>
        <boxGeometry args={[0.009, 0.014, 0.065]} />
        <meshPhysicalMaterial
          color={metallic ? '#aaa0b9' : studio.indigo}
          {...(metallic ? landingMetal : softMetal)}
        />
      </instancedMesh>
      {[-1, 1].map((side) => (
        <group key={side} rotation={[0, side === -1 ? Math.PI : 0, 0]}>
          <mesh position={[0, 0, 0.051]}>
            <circleGeometry args={[0.32, 64]} />
            <meshPhysicalMaterial
              color={metallic ? '#4d3c64' : studio.indigo}
              {...(metallic ? { metalness: 0.7, roughness: 0.36 } : satin)}
            />
          </mesh>
          <mesh position={[0, 0, 0.055]}>
            <torusGeometry args={[0.324, 0.009, 8, 64]} />
            <meshPhysicalMaterial color={studio.pale} {...(metallic ? landingMetal : softMetal)} />
          </mesh>
          <group position={[0, 0, 0.065]} scale={0.215}>
            <LinkedLoop
              polished={metallic}
              color={studio.pale}
              thickness={0.14}
              position={[-0.12, 0.28, 0]}
              rotation={[0, 0, 0.15]}
            />
            <LinkedLoop
              polished={metallic}
              color={studio.lavender}
              thickness={0.14}
              position={[0.12, -0.28, 0.04]}
              rotation={[0, 0, Math.PI + 0.15]}
            />
          </group>
        </group>
      ))}
    </group>
  )
}
