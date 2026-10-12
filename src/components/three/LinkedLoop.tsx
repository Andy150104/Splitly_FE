import type { ThreeElements } from '@react-three/fiber'
import { SphereGeometry, TorusGeometry } from 'three'
import { softMetal } from './materials'
import { landingMetal } from './landingMaterials'
import { useSceneGeometry } from './SceneTheme'

type Props = ThreeElements['group'] & {
  color: string
  radius?: number
  thickness?: number
  polished?: boolean
}

// Rounded end caps close the torus segment; no open holes or cut metal edges.
export default function LinkedLoop({
  color,
  radius = 0.64,
  thickness = 0.18,
  polished = false,
  ...props
}: Props) {
  const arc = Math.PI * 1.58
  const loop = useSceneGeometry(
    `loop:${radius}:${thickness}`,
    () => new TorusGeometry(radius, thickness, 20, 64, arc),
  )
  const cap = useSceneGeometry(`loop-cap:${thickness}`, () => new SphereGeometry(thickness, 20, 12))
  return (
    <group {...props}>
      <mesh geometry={loop}>
        <meshPhysicalMaterial color={color} {...(polished ? landingMetal : softMetal)} />
      </mesh>
      {[0, arc].map((angle) => (
        <mesh
          geometry={cap}
          key={angle}
          position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}
        >
          <meshPhysicalMaterial color={color} {...(polished ? landingMetal : softMetal)} />
        </mesh>
      ))}
    </group>
  )
}
