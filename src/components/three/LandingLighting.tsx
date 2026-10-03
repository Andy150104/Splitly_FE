import { Environment, Lightformer } from '@react-three/drei'

/** Long softboxes produce directional highlights rather than a uniform plastic shine. */
export default function LandingLighting() {
  return (
    <>
      <ambientLight intensity={0.38} />
      <directionalLight position={[-3, 5, 6]} intensity={2.3} color="#fff4e8" />
      <directionalLight position={[4, 2, -3]} intensity={2.4} color="#bda2f0" />
      <directionalLight position={[-4, -1, 2]} intensity={0.5} color="#a4cbd4" />
      <Environment resolution={128} frames={1}>
        <Lightformer position={[-3, 4, 4]} scale={[5, 2, 1]} intensity={2.2} />
        <Lightformer
          position={[4, 1, 1]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[0.7, 6, 1]}
          intensity={2.6}
          color="#e4d6ff"
        />
        <Lightformer position={[-2, -3, 3]} scale={[4, 0.5, 1]} intensity={1.2} color="#c1ddd9" />
      </Environment>
    </>
  )
}
