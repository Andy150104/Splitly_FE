import type { ThreeElements } from '@react-three/fiber'
import { softMetal } from './materials'
import { landingMetal } from './landingMaterials'

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
  return (
    <group {...props}>
      <mesh>
        <torusGeometry args={[radius, thickness, 20, 64, arc]} />
        <meshPhysicalMaterial color={color} {...(polished ? landingMetal : softMetal)} />
      </mesh>
      {[0, arc].map((angle) => (
        <mesh key={angle} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}>
          <sphereGeometry args={[thickness, 20, 12]} />
          <meshPhysicalMaterial color={color} {...(polished ? landingMetal : softMetal)} />
        </mesh>
      ))}
    </group>
  )
}
