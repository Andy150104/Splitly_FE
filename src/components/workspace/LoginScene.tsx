'use client'

import { Component, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useReducedMotion } from 'motion/react'
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import type { Group, Mesh, MeshBasicMaterial, PointLight } from 'three'
import Brand from '../ui/Brand'
import LinkedLoop from '../three/LinkedLoop'
import SplitToken from '../three/SplitToken'
import StudioLighting from '../three/StudioLighting'
import { satin, softMetal, studio } from '../three/materials'

type Pointer = RefObject<{
  x: number
  y: number
  active: boolean
  dragX: number
  dragY: number
  pulseAt: number
  idleTime: number
  dragging: boolean
  showcaseTime: number
}>

type SceneLayout = {
  width: number
  height: number
  centerX: number
  centerY: number
  stageWidth: number
  stageHeight: number
}

// A short choreographed flourish, followed by a quiet interval. Pointer input restarts it.
function idleSequence(pointer: Pointer) {
  const automatic = Math.max(0, pointer.current.idleTime - 4) % 14
  const phase = pointer.current.showcaseTime < 5.4 ? pointer.current.showcaseTime : automatic
  const separation = MathUtils.smootherstep(phase, 0.15, 1.4)
  const assembly = 1 - MathUtils.smootherstep(phase, 3.3, 5.4)
  return {
    energy: separation * assembly,
    turn: MathUtils.smootherstep(phase, 1.1, 4.8),
  }
}

function pulseProgress(pointer: Pointer) {
  return MathUtils.clamp((performance.now() / 1000 - pointer.current.pulseAt) / 1.5, 0, 1)
}
function Fallback({ layout }: { layout?: SceneLayout }) {
  return (
    <div
      className="login-sculpture-fallback"
      style={
        layout
          ? {
              position: 'absolute',
              left: layout.centerX,
              top: layout.centerY,
              width: 120,
              height: 120,
              transform: 'translate(-50%, -50%)',
              background: 'transparent',
            }
          : undefined
      }
    >
      <Brand compact />
    </div>
  )
}
class SceneBoundary extends Component<
  { children: ReactNode; layout: SceneLayout },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <Fallback layout={this.props.layout} /> : this.props.children
  }
}

function SpatialCamera({
  still,
  pointer,
  mobile,
}: {
  still: boolean
  pointer: Pointer
  mobile: boolean
}) {
  const light = useRef<PointLight>(null)
  useFrame(({ camera, clock }, delta) => {
    if (still) return
    const step = Math.min(delta, 0.05)
    if (!pointer.current.dragging) {
      if (pointer.current.showcaseTime >= 5.4) pointer.current.idleTime += step
      pointer.current.showcaseTime += step
    }
    const idle = idleSequence(pointer)
    const t = clock.elapsedTime
    const movement = mobile ? 0 : 1
    camera.position.x = MathUtils.damp(
      camera.position.x,
      pointer.current.x * 0.22 * movement + Math.sin(t * 0.12) * 0.025,
      3,
      step,
    )
    camera.position.y = MathUtils.damp(
      camera.position.y,
      pointer.current.y * 0.13 * movement,
      3,
      step,
    )
    camera.lookAt(0, 0, 0)
    if (light.current) {
      light.current.position.x = MathUtils.damp(
        light.current.position.x,
        -3 +
          pointer.current.x * 0.35 * movement +
          Math.sin(idle.turn * Math.PI * 2) * 4 * idle.energy,
        2,
        step,
      )
      light.current.intensity = MathUtils.damp(
        light.current.intensity,
        3 +
          pointer.current.y * 0.5 * movement +
          Math.sin(pulseProgress(pointer) * Math.PI) * 2 +
          idle.energy * 3,
        2,
        step,
      )
    }
  })
  return <pointLight ref={light} position={[-3, -1, 3]} intensity={3} color="#bda6da" />
}

function MoneyOrbit({
  still,
  pointer,
  layout,
}: {
  still: boolean
  pointer: Pointer
  layout: SceneLayout
}) {
  const nodes = useRef<Group>(null)
  const orbit = useRef<Group>(null)
  const outerOrbit = useRef<Group>(null)
  const outerNodes = useRef<Group>(null)
  const wave = useRef<Mesh>(null)
  const waveMaterial = useRef<MeshBasicMaterial>(null)
  const trackMaterial = useRef<MeshBasicMaterial>(null)
  const travel = useRef(0)
  const rotationPhase = useRef(0)
  const viewport = useThree((state) => state.viewport)
  const size = useThree((state) => state.size)
  // Keep line and light sizes consistent when the canvas spans the entire login page.
  const pixel = viewport.height / Math.max(1, size.height)
  const radiusX = (viewport.width * layout.stageWidth * 0.52) / layout.width
  const radiusY = (viewport.height * layout.stageHeight * 0.44) / layout.height
  const curve = useMemo(
    () =>
      new CatmullRomCurve3(
        Array.from({ length: 64 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2
          return new Vector3(
            Math.cos(angle) * radiusX,
            Math.sin(angle) * radiusY,
            Math.sin(angle) * 0.25 - 0.08,
          )
        }),
        true,
      ),
    [radiusX, radiusY],
  )
  const extension = useMemo(
    () =>
      new CatmullRomCurve3(
        Array.from({ length: 64 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2
          const reach = ((layout.width - layout.centerX - 100) / layout.width) * viewport.width
          return new Vector3(
            Math.cos(angle) * Math.max(radiusX, reach),
            Math.sin(angle) * radiusY * 1.2,
            Math.sin(angle) * 0.25 - 0.2,
          )
        }),
        true,
      ),
    [layout.width, layout.centerX, viewport.width, radiusX, radiusY],
  )
  useFrame((_, delta) => {
    if (still) {
      orbit.current?.rotation.set(0.04, -0.04, -0.16)
      outerOrbit.current?.rotation.set(0.12, -0.08, 0.08)
      if (waveMaterial.current) waveMaterial.current.opacity = 0
      if (trackMaterial.current) trackMaterial.current.opacity = 0.42
      return
    }
    if (!nodes.current) return
    const progress = pulseProgress(pointer)
    const energy = Math.max(Math.sin(progress * Math.PI), idleSequence(pointer).energy * 0.7)
    travel.current += Math.min(delta, 0.05) * (0.024 + energy * 0.16)
    rotationPhase.current += Math.min(delta, 0.05)
    const time = rotationPhase.current
    if (orbit.current) {
      orbit.current.rotation.set(
        0.1 + Math.sin(time * 0.24) * 0.3,
        -0.08 + Math.cos(time * 0.19) * 0.22,
        -0.16 + Math.sin(time * 0.17) * 0.11,
      )
    }
    if (outerOrbit.current) {
      outerOrbit.current.rotation.set(
        0.12 + Math.sin(time * 0.15) * 0.34,
        -0.08 + Math.cos(time * 0.12) * 0.26,
        0.08 + time * 0.055,
      )
    }
    if (wave.current) wave.current.scale.setScalar(1 + progress * 0.065)
    if (waveMaterial.current) waveMaterial.current.opacity = energy * 0.5
    if (trackMaterial.current) trackMaterial.current.opacity = 0.42 + energy * 0.38
    nodes.current.children.forEach((node, index) => {
      node.position.copy(curve.getPointAt((travel.current + index / 3) % 1))
      node.scale.setScalar((node.position.z < -0.7 ? 0.65 : 1) * (1 + energy * 0.6))
    })
    outerNodes.current?.children.forEach((node, index) => {
      node.position.copy(extension.getPointAt((travel.current * 0.7 + index / 2) % 1))
    })
  })
  return (
    <group>
      <group ref={outerOrbit} rotation={[0.12, -0.08, 0.08]}>
        <mesh>
          <tubeGeometry args={[extension, 256, pixel * 0.5, 8, true]} />
          <meshBasicMaterial color="#b49bcf" transparent opacity={0.23} depthWrite={false} />
        </mesh>
        <group ref={outerNodes}>
          {[0, 0.5].map((position) => (
            <mesh key={position} position={extension.getPointAt(position)}>
              <sphereGeometry args={[pixel * 2.4, 12, 12]} />
              <meshBasicMaterial color="#dcc8f4" transparent opacity={0.6} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>
      <group ref={orbit} rotation={[0.04, -0.04, -0.16]}>
        <mesh>
          <tubeGeometry args={[curve, 256, pixel * 0.7, 8, true]} />
          <meshBasicMaterial ref={trackMaterial} color="#b49bcf" transparent opacity={0.42} />
        </mesh>
        <mesh>
          <tubeGeometry args={[curve, 256, pixel * 3, 8, true]} />
          <meshBasicMaterial color="#a282c9" transparent opacity={0.055} depthWrite={false} />
        </mesh>
        <mesh ref={wave}>
          <tubeGeometry args={[curve, 256, pixel * 1.2, 8, true]} />
          <meshBasicMaterial
            ref={waveMaterial}
            color="#ddc8ff"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
        <group ref={nodes}>
          {Array.from({ length: 3 }, (_, i) => (
            <group key={i} position={curve.getPointAt(i / 3)}>
              <mesh>
                <sphereGeometry args={[pixel * 3, 12, 12]} />
                <meshStandardMaterial
                  color="#eee2ff"
                  emissive="#b08adb"
                  emissiveIntensity={0.75}
                  roughness={0.25}
                />
              </mesh>
              <mesh>
                <sphereGeometry args={[pixel * 8, 12, 12]} />
                <meshBasicMaterial color="#b99bdf" transparent opacity={0.12} depthWrite={false} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}

function Sculpture({
  still,
  pointer,
  mobile,
  layout,
}: {
  still: boolean
  pointer: Pointer
  mobile: boolean
  layout: SceneLayout
}) {
  const group = useRef<Group>(null)
  const assembly = useRef<Group>(null)
  const ringOne = useRef<Group>(null)
  const ringTwo = useRef<Group>(null)
  const tokens = useRef<Group>(null)
  const backCard = useRef<Mesh>(null)
  const frontCard = useRef<Group>(null)
  const middleCard = useRef<Mesh>(null)
  const emblem = useRef<Group>(null)
  const entered = useRef(0)
  const viewport = useThree((state) => state.viewport)
  const anchorX = (layout.centerX / layout.width - 0.5) * viewport.width
  const anchorY = (0.5 - layout.centerY / layout.height) * viewport.height
  const modelScale = Math.min(
    2.2,
    (viewport.width * layout.stageWidth) / layout.width / 4.6,
    (viewport.height * layout.stageHeight) / layout.height / 3.5,
  )
  useFrame(({ clock }, delta) => {
    if (!group.current || !assembly.current) return
    assembly.current.position.set(anchorX, anchorY, 0)
    if (still) {
      group.current.scale.setScalar(modelScale)
      group.current.position.set(0, 0, 0)
      group.current.rotation.x = pointer.current.dragY * 0.28
      group.current.rotation.y = -0.1 + pointer.current.dragX * 0.5
      if (ringOne.current && ringTwo.current) {
        ringOne.current.position.x = -0.15
        ringTwo.current.position.x = 0.15
        ringOne.current.position.y = 0.32
        ringTwo.current.position.y = -0.32
        ringOne.current.rotation.set(0, 0, 0.15)
        ringTwo.current.rotation.set(0, 0, Math.PI + 0.15)
      }
      if (backCard.current) {
        backCard.current.position.set(0.22, -0.1, -0.55)
        backCard.current.rotation.set(0.08, 0, -0.16)
      }
      if (frontCard.current) {
        frontCard.current.position.set(0, 0, 0)
        frontCard.current.rotation.set(0, 0, 0)
      }
      if (middleCard.current) {
        middleCard.current.position.set(0.08, -0.04, -0.28)
        middleCard.current.rotation.set(0, 0, -0.06)
      }
      if (emblem.current) emblem.current.position.set(0, 0.08, 0.45)
      if (tokens.current) tokens.current.rotation.set(0, 0, 0)
      return
    }
    const step = Math.min(delta, 0.05)
    entered.current = Math.min(1, entered.current + step / 0.9)
    const entrance = 1 - (1 - entered.current) ** 3
    const t = clock.elapsedTime
    const idle = idleSequence(pointer)
    const energy = Math.sin(pulseProgress(pointer) * Math.PI)
    group.current.scale.setScalar(
      modelScale * (0.92 + entrance * 0.08 + energy * 0.025 - idle.energy * 0.1),
    )
    group.current.position.set(0, -(1 - entrance) * 0.1, -0.25 * (1 - entrance))
    assembly.current.position.y += idle.energy * 0.035
    group.current.rotation.y = MathUtils.damp(
      group.current.rotation.y,
      -0.1 +
        Math.sin(t * 0.16) * 0.035 +
        pointer.current.dragX * 0.5 +
        Math.sin(idle.turn * Math.PI * 2) * idle.energy * 0.48,
      3,
      step,
    )
    group.current.rotation.x = MathUtils.damp(
      group.current.rotation.x,
      pointer.current.dragY * 0.28 - idle.energy * 0.12,
      5,
      step,
    )
    const proximity =
      pointer.current.active && !mobile
        ? Math.max(0, 1 - Math.hypot(pointer.current.x, pointer.current.y) / 0.8)
        : 0
    if (tokens.current) {
      tokens.current.rotation.y = MathUtils.damp(
        tokens.current.rotation.y,
        Math.sin(idle.turn * Math.PI * 2) * idle.energy * 0.35,
        4,
        step,
      )
      tokens.current.rotation.z = idle.energy * -0.12
    }
    if (ringOne.current && ringTwo.current) {
      ringOne.current.position.x = MathUtils.damp(
        ringOne.current.position.x,
        -0.15 - proximity * 0.055 - energy * 0.09 - idle.energy * 0.5,
        5,
        step,
      )
      ringTwo.current.position.x = MathUtils.damp(
        ringTwo.current.position.x,
        0.15 + proximity * 0.055 + energy * 0.09 + idle.energy * 0.5,
        5,
        step,
      )
      ringOne.current.position.y = MathUtils.damp(
        ringOne.current.position.y,
        0.32 + idle.energy * 0.15,
        5,
        step,
      )
      ringTwo.current.position.y = MathUtils.damp(
        ringTwo.current.position.y,
        -0.32 - idle.energy * 0.15,
        5,
        step,
      )
      ringOne.current.rotation.y = Math.sin(t * 0.19) * 0.08 + idle.energy * 0.65
      ringTwo.current.rotation.x = Math.sin(t * 0.16 + 1.1) * 0.07 - idle.energy * 0.6
      const blend = 1 - Math.exp(-8 * step)
      const firstAngle = 0.15 + idle.turn * Math.PI * 2 - ringOne.current.rotation.z
      const secondAngle = Math.PI + 0.15 - idle.turn * Math.PI * 2 - ringTwo.current.rotation.z
      ringOne.current.rotation.z += Math.atan2(Math.sin(firstAngle), Math.cos(firstAngle)) * blend
      ringTwo.current.rotation.z += Math.atan2(Math.sin(secondAngle), Math.cos(secondAngle)) * blend
    }
    if (backCard.current) {
      backCard.current.position.x = MathUtils.damp(
        backCard.current.position.x,
        0.22 - idle.energy * 1.35,
        5,
        step,
      )
      backCard.current.position.z = MathUtils.damp(
        backCard.current.position.z,
        -0.55 - idle.energy * 0.55,
        5,
        step,
      )
      backCard.current.rotation.y = MathUtils.damp(
        backCard.current.rotation.y,
        -idle.energy * 0.28,
        5,
        step,
      )
      backCard.current.position.y = MathUtils.damp(
        backCard.current.position.y,
        -0.1 + idle.energy * 0.15,
        5,
        step,
      )
      backCard.current.rotation.z = -0.16 - idle.energy * 0.24
    }
    if (middleCard.current) {
      middleCard.current.position.x = MathUtils.damp(
        middleCard.current.position.x,
        0.08 + idle.energy * 0.95,
        5,
        step,
      )
      middleCard.current.rotation.y = MathUtils.damp(
        middleCard.current.rotation.y,
        idle.energy * 0.38,
        5,
        step,
      )
      middleCard.current.rotation.z = -0.06 + idle.energy * 0.1
      middleCard.current.position.y = MathUtils.damp(
        middleCard.current.position.y,
        -0.04 - idle.energy * 0.15,
        5,
        step,
      )
    }
    if (frontCard.current) {
      frontCard.current.position.z = MathUtils.damp(
        frontCard.current.position.z,
        idle.energy * 0.38,
        5,
        step,
      )
      frontCard.current.position.x = MathUtils.damp(
        frontCard.current.position.x,
        idle.energy * 0.12,
        5,
        step,
      )
      frontCard.current.rotation.y = MathUtils.damp(
        frontCard.current.rotation.y,
        idle.energy * 0.18,
        5,
        step,
      )
    }
    if (emblem.current) {
      emblem.current.position.z = MathUtils.damp(
        emblem.current.position.z,
        0.45 + idle.energy * 1.0,
        5,
        step,
      )
      emblem.current.position.y = MathUtils.damp(
        emblem.current.position.y,
        0.08 + idle.energy * 0.14,
        5,
        step,
      )
    }
  })
  return (
    <group ref={assembly} position={[anchorX, anchorY, 0]}>
      <MoneyOrbit still={still} pointer={pointer} layout={layout} />
      <group ref={group} scale={modelScale} rotation={[0, -0.1, -0.12]}>
        <RoundedBox
          ref={backCard}
          args={[3.5, 2.15, 0.24]}
          radius={0.18}
          position={[0.22, -0.1, -0.55]}
          rotation={[0.08, 0, -0.16]}
          smoothness={4}
        >
          <meshPhysicalMaterial color={studio.ink} {...satin} />
        </RoundedBox>
        <RoundedBox
          ref={middleCard}
          args={[3.35, 2.05, 0.07]}
          radius={0.16}
          position={[0.08, -0.04, -0.28]}
          rotation={[0, 0, -0.06]}
          smoothness={4}
        >
          <meshPhysicalMaterial color={studio.lavender} {...satin} />
        </RoundedBox>
        <group ref={frontCard}>
          <group rotation={[0.05, 0.08, 0.06]}>
            <RoundedBox args={[3.5, 2.15, 0.28]} radius={0.18} smoothness={4}>
              <meshPhysicalMaterial color={studio.indigo} {...satin} />
            </RoundedBox>
            <RoundedBox
              args={[3.18, 1.82, 0.08]}
              radius={0.12}
              position={[0, 0, 0.17]}
              smoothness={4}
            >
              <meshPhysicalMaterial color={studio.violet} {...satin} />
            </RoundedBox>
            <mesh position={[-1.12, -0.69, 0.23]}>
              <boxGeometry args={[0.55, 0.032, 0.015]} />
              <meshStandardMaterial color={studio.pale} roughness={0.65} />
            </mesh>
            {[0, 1, 2].map((i) => (
              <RoundedBox
                key={i}
                args={[0.035, 0.17 + i * 0.06, 0.012]}
                radius={0.006}
                position={[1.11 + i * 0.08, 0.59, 0.225]}
                smoothness={2}
              >
                <meshPhysicalMaterial color={studio.lavender} {...softMetal} />
              </RoundedBox>
            ))}
          </group>
        </group>
        <group ref={emblem} position={[0, 0.08, 0.45]} rotation={[0.12, -0.16, 0]}>
          <LinkedLoop
            ref={ringOne}
            color={studio.pale}
            position={[-0.15, 0.32, 0]}
            rotation={[0, 0, 0.15]}
          />
          <LinkedLoop
            ref={ringTwo}
            color={studio.violet}
            position={[0.15, -0.32, 0.14]}
            rotation={[0, 0, Math.PI + 0.15]}
          />
        </group>
        <group ref={tokens}>
          <SplitToken position={[-2.03, 0.76, -0.15]} rotation={[0.35, 0.25, -0.25]} scale={0.76} />
          <SplitToken position={[1.92, -0.73, 0.15]} rotation={[-0.24, -0.45, 0.18]} scale={0.55} />
        </group>
      </group>
    </group>
  )
}

export default function LoginScene({ frameRef }: { frameRef: RefObject<HTMLDivElement | null> }) {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [interaction, setInteraction] = useState('rest')
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const [layout, setLayout] = useState<SceneLayout>({
    width: 1,
    height: 1,
    centerX: 0.5,
    centerY: 0.5,
    stageWidth: 0,
    stageHeight: 0,
  })
  const hintId = useId()
  const root = useRef<HTMLDivElement>(null)
  const pointer = useRef({
    x: 0,
    y: 0,
    active: false,
    dragX: 0,
    dragY: 0,
    pulseAt: -Infinity,
    idleTime: 0,
    dragging: false,
    showcaseTime: Infinity,
  })
  const drag = useRef({ x: 0, y: 0, active: false, moved: false })
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const invalidate = useRef<() => void>(() => {})
  function pulse() {
    pointer.current.idleTime = 0
    pointer.current.showcaseTime = 0
    pointer.current.pulseAt = performance.now() / 1000
    setInteraction('pulse')
    invalidate.current()
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setInteraction('rest'), reduced ? 1500 : 5600)
  }
  function move(event: ReactPointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    pointer.current.x = MathUtils.clamp(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -1,
      1,
    )
    pointer.current.y = MathUtils.clamp(
      1 - ((event.clientY - bounds.top) / bounds.height) * 2,
      -1,
      1,
    )
    pointer.current.active = true
    pointer.current.idleTime = 0
    if (drag.current.active) {
      const dx = event.clientX - drag.current.x
      const dy = event.clientY - drag.current.y
      if (Math.hypot(dx, dy) > 6) drag.current.moved = true
      pointer.current.dragX = MathUtils.clamp(dx / (bounds.width * 0.3), -1, 1)
      pointer.current.dragY = MathUtils.clamp(dy / (bounds.height * 0.5), -1, 1)
    }
    invalidate.current()
  }
  function release() {
    drag.current.active = false
    pointer.current.dragging = false
    pointer.current.dragX = 0
    pointer.current.dragY = 0
    setInteraction('rest')
    invalidate.current()
  }
  useEffect(() => {
    const target = frameRef.current
    const stage = root.current
    if (!target || !stage) return
    setFrame(target)
    const measure = () => {
      const area = target.getBoundingClientRect()
      const bounds = stage.getBoundingClientRect()
      if (!area.width || !area.height || !bounds.height) return
      setLayout({
        width: area.width,
        height: area.height,
        centerX: bounds.x + bounds.width / 2 - area.x,
        centerY: bounds.y + bounds.height / 2 - area.y,
        stageWidth: bounds.width,
        stageHeight: bounds.height,
      })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(target)
    observer.observe(stage)
    const story = stage.closest('.ws-login-story')
    if (story) observer.observe(story)
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [frameRef])
  useEffect(() => {
    let inView = true
    const update = () => setVisible(inView && document.visibilityState === 'visible')
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      update()
    })
    const media = window.matchMedia('(max-width: 900px)')
    const resize = () => setMobile(media.matches)
    resize()
    if (root.current) observer.observe(root.current)
    media.addEventListener('change', resize)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', resize)
      document.removeEventListener('visibilitychange', update)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])
  return (
    <div className="login-sculpture login-spatial-scene" ref={root} data-interaction={interaction}>
      {frame &&
        layout.stageHeight > 0 &&
        !mobile &&
        createPortal(
          <div className="login-scene-canvas" aria-hidden="true">
            <SceneBoundary layout={layout}>
              <Suspense fallback={<Fallback layout={layout} />}>
                <Canvas
                  style={{ pointerEvents: 'none' }}
                  camera={{ position: [0, 0, 7.8], fov: 37 }}
                  dpr={mobile ? [1, 1.25] : [1, 1.5]}
                  frameloop={reduced || !visible ? 'demand' : 'always'}
                  gl={{ antialias: !mobile, alpha: true }}
                  fallback={<Fallback layout={layout} />}
                  onCreated={(state) => {
                    invalidate.current = state.invalidate
                  }}
                >
                  <StudioLighting />
                  <SpatialCamera still={!!reduced} pointer={pointer} mobile={mobile} />
                  <Sculpture still={!!reduced} pointer={pointer} mobile={mobile} layout={layout} />
                </Canvas>
              </Suspense>
            </SceneBoundary>
          </div>,
          frame,
        )}
      <button
        type="button"
        className="login-scene-interaction"
        aria-label="Tương tác với ví Splitly"
        aria-describedby={hintId}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          if (resetTimer.current) clearTimeout(resetTimer.current)
          drag.current = { x: event.clientX, y: event.clientY, active: true, moved: false }
          pointer.current.dragging = true
          pointer.current.showcaseTime = Infinity
          pointer.current.idleTime = 0
          event.currentTarget.setPointerCapture(event.pointerId)
          setInteraction('dragging')
        }}
        onPointerMove={move}
        onPointerUp={(event) => {
          release()
          if (drag.current.moved) pulse()
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
        onPointerCancel={release}
        onLostPointerCapture={() => {
          if (drag.current.active) release()
        }}
        onPointerLeave={() => {
          pointer.current.active = false
          if (!drag.current.active) {
            pointer.current.x = 0
            pointer.current.y = 0
          }
        }}
        onClick={(event) => {
          if (event.detail === 0 || !drag.current.moved) pulse()
        }}
      >
        <span id={hintId} className="login-scene-hint">
          Kéo để nghiêng ví <span aria-hidden="true">·</span> Chạm để tách & ghép
        </span>
      </button>
    </div>
  )
}
