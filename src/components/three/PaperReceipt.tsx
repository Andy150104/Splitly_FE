import { useEffect, useMemo } from 'react'
import { DoubleSide, PlaneGeometry } from 'three'
import type { Texture } from 'three'
import useSurfaceGrain from './useSurfaceGrain'
import { landingPaper } from './landingMaterials'

/** The paper and print use the same curved surface, so ink never intersects its sheet. */
export default function PaperReceipt({ label }: { label: Texture }) {
  const grain = useSurfaceGrain()
  const paper = useMemo(() => {
    const shape = new PlaneGeometry(1.14, 1.95, 24, 40)
    const positions = shape.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      if (y < -0.974 && i % 2 === 0) positions.setY(i, y + 0.035)
      positions.setZ(i, x * x * 0.13 + Math.sin(y * 2.5) * 0.025)
    }
    shape.computeVertexNormals()
    return shape
  }, [])
  useEffect(() => () => paper.dispose(), [paper])
  return (
    <mesh geometry={paper}>
      <meshStandardMaterial
        {...landingPaper}
        map={label}
        bumpMap={grain}
        bumpScale={0.003}
        side={DoubleSide}
      />
    </mesh>
  )
}
