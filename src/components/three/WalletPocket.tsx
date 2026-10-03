import { useMemo } from 'react'
import { CatmullRomCurve3, Shape, Vector3 } from 'three'
import { satin, softMetal, studio } from './materials'
import useSurfaceGrain from './useSurfaceGrain'
import { landingLeather } from './landingMaterials'

export default function WalletPocket({ finish = 'studio' }: { finish?: 'studio' | 'leather' }) {
  const grain = useSurfaceGrain()
  const { shape, seam } = useMemo(() => {
    const path = new Shape()
    const x = 1.4
    const y = 0.835
    const radius = 0.14
    path.moveTo(-x + radius, y)
    path.lineTo(-0.5, y)
    path.bezierCurveTo(-0.35, y, -0.3, y - 0.18, -0.1, y - 0.18)
    path.lineTo(0.42, y - 0.18)
    path.bezierCurveTo(0.6, y - 0.18, 0.63, y, 0.78, y)
    path.lineTo(x - radius, y)
    path.quadraticCurveTo(x, y, x, y - radius)
    path.lineTo(x, -y + radius)
    path.quadraticCurveTo(x, -y, x - radius, -y)
    path.lineTo(-x + radius, -y)
    path.quadraticCurveTo(-x, -y, -x, -y + radius)
    path.lineTo(-x, y - radius)
    path.quadraticCurveTo(-x, y, -x + radius, y)
    const points = path.getPoints(16)
    points.pop() // The curve closes itself; avoid a zero-length last segment.
    return {
      shape: path,
      seam: new CatmullRomCurve3(
        points.map((point) => new Vector3(point.x * 0.965, point.y * 0.95, 0.245)),
        true,
      ),
    }
  }, [])
  return (
    <group position={[0, -0.2, 0.02]}>
      <mesh>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 0.2,
              bevelEnabled: true,
              bevelSegments: 5,
              steps: 1,
              bevelSize: 0.06,
              bevelThickness: 0.045,
              curveSegments: 20,
            },
          ]}
        />
        <meshPhysicalMaterial
          {...(finish === 'leather' ? landingLeather : { color: studio.violet, ...satin })}
          bumpMap={grain}
          bumpScale={finish === 'leather' ? 0.025 : 0.012}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[seam, 160, 0.007, 6, true]} />
        <meshPhysicalMaterial
          color={finish === 'leather' ? '#977ca9' : studio.lavender}
          {...(finish === 'leather' ? { metalness: 0, roughness: 0.85 } : softMetal)}
        />
      </mesh>
    </group>
  )
}
