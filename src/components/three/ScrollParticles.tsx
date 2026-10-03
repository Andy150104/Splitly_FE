import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  ShaderMaterial,
} from 'three'
import type { Points } from 'three'
import type { RefObject } from 'react'
import { storyChapters } from '../../lib/story'

/** A paused GSAP score follows the existing scroll clock, including reverse scrolling. */
export default function ScrollParticles({
  progress,
  reducedMotion,
}: {
  progress: RefObject<number>
  reducedMotion: boolean
}) {
  const { size, gl } = useThree()
  const points = useRef<Points>(null)
  const score = useRef<gsap.core.Timeline | null>(null)
  const pose = useRef({ turn: 0, spread: 1, rise: 0, opacity: 1 })
  const previous = useRef(0)
  const still = useRef(1)
  const activity = useRef(0)
  const compact = size.width < 520
  const geometry = useMemo(() => {
    const result = new BufferGeometry()
    const positions = new Float32Array(96 * 3)
    const seeds = new Float32Array(96)
    for (let i = 0; i < 96; i++) {
      const angle = i * 2.399963
      const radius = 1.85 + ((i * 17) % 23) * 0.055
      positions.set(
        [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.82, -0.7 - (i % 7) * 0.18],
        i * 3,
      )
      seeds[i] = ((i * 31) % 97) / 97
    }
    result.setAttribute('position', new BufferAttribute(positions, 3))
    result.setAttribute('aSeed', new BufferAttribute(seeds, 1))
    return result
  }, [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTurn: { value: 0 },
          uSpread: { value: 1 },
          uRise: { value: 0 },
          uActivity: { value: 0 },
          uDirection: { value: 1 },
          uOpacity: { value: 1 },
          uDpr: { value: 1 },
          uSafeX: { value: 0 },
          uColor: { value: new Color('#c8b3f0') },
        },
        vertexShader: `
          attribute float aSeed;
          uniform float uTurn, uSpread, uRise, uActivity, uDpr, uSafeX;
          varying float vAlpha, vSeed;
          void main() {
            float angle = uTurn * (0.8 + aSeed * 0.4);
            vec3 p = position;
            p.xy = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p.xy;
            p.xy *= uSpread;
            p.y += uRise + sin(angle * 2.0 + aSeed * 6.28) * 0.12;
            p.z += sin(angle + aSeed * 6.28) * 0.18;
            vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * viewPosition;
            float ndcX = gl_Position.x / gl_Position.w;
            vAlpha = smoothstep(uSafeX, uSafeX + 0.12, ndcX);
            vSeed = aSeed;
            gl_PointSize = (4.0 + aSeed * 4.0 + uActivity * 15.0) * uDpr
              * min(1.4, 6.0 / -viewPosition.z);
          }
        `,
        fragmentShader: `
          uniform float uActivity, uDirection, uOpacity;
          uniform vec3 uColor;
          varying float vAlpha, vSeed;
          void main() {
            vec2 p = gl_PointCoord - 0.5;
            float angle = -0.6 * uDirection;
            p = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p;
            vec2 core = p * vec2(1.0, 1.0 + uActivity * 3.5);
            float halo = exp(-dot(core, core) * 22.0);
            float center = exp(-dot(core, core) * 130.0);
            float alpha = (halo * 0.28 + center * 0.72)
              * (0.22 + uActivity * 0.72) * vAlpha * uOpacity;
            if (alpha < 0.005) discard;
            vec3 tint = mix(uColor, vec3(0.62, 0.82, 0.91), step(0.72, vSeed));
            gl_FragColor = vec4(mix(tint, vec3(1.0), center * 0.6), alpha);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  )
  useEffect(() => {
    pose.current = { turn: 0, spread: 1, rise: 0, opacity: 1 }
    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.inOut', lazy: false },
    })
    const spreads = [1, 1.12, 0.72, 0.97, 0.76]
    for (const [index, chapter] of storyChapters.entries()) {
      if (!index) continue
      timeline.to(
        pose.current,
        {
          turn: index * 0.95,
          spread: spreads[index],
          rise: index % 2 ? 0.06 : -0.08,
          duration: 0.1,
        },
        chapter.from - 0.025,
      )
    }
    timeline.to(pose.current, { opacity: 0, duration: 0.04 }, 0.96)
    score.current = timeline
    return () => {
      timeline.kill()
      score.current = null
    }
  }, [])
  useEffect(() => {
    geometry.setDrawRange(0, compact ? 24 : 96)
  }, [geometry, compact])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])
  useFrame((_, delta) => {
    const p = MathUtils.clamp(progress.current, 0, 1)
    const change = p - previous.current
    const moved = Math.abs(change) > 0.000001
    still.current = moved ? 0 : still.current + delta
    activity.current =
      reducedMotion || still.current > 0.14
        ? 0
        : MathUtils.damp(
            activity.current,
            Math.min(1, (Math.abs(change) / Math.max(delta, 0.016)) * 8),
            18,
            delta,
          )
    score.current?.progress(p, true)
    previous.current = p
    if (points.current) points.current.visible = !reducedMotion && p > 0.045 && p < 0.995
    const uniforms = material.uniforms
    uniforms.uTurn.value = pose.current.turn + p * 1.7
    uniforms.uSpread.value = pose.current.spread
    uniforms.uRise.value = pose.current.rise
    uniforms.uOpacity.value = pose.current.opacity
    uniforms.uActivity.value = activity.current
    if (!activity.current) uniforms.uDirection.value = 1
    else if (moved) uniforms.uDirection.value = Math.sign(change)
    uniforms.uDpr.value = gl.getPixelRatio()
    // The desktop's full-width canvas also covers the headline. Keep dust on the art side.
    uniforms.uSafeX.value = window.innerWidth > 1024 ? 0 : -1.2
    const motion = reducedMotion ? 'disabled' : activity.current > 0.02 ? 'moving' : 'settled'
    if (gl.domElement.dataset.particles !== motion) gl.domElement.dataset.particles = motion
  })
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
