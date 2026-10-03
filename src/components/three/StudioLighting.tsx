import { Environment, Lightformer } from '@react-three/drei'

export default function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[-3, 5, 5]} intensity={2.7} color="#f5f0f8" />
      <directionalLight position={[4, 2, -3]} intensity={1.5} color="#c9b6e5" />
      <directionalLight position={[3, -1, 3]} intensity={0.45} color="#b9abd1" />
      <Environment resolution={128} frames={1}>
        <Lightformer position={[-3, 4, 4]} scale={[6, 4, 1]} intensity={1.6} />
        <Lightformer
          position={[4, 1, -1]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[2, 5, 1]}
          intensity={1.1}
          color="#ddd0ee"
        />
      </Environment>
    </>
  )
}
