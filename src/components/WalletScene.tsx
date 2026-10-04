import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { flightY, storyRange, storyChapters } from '../lib/story'
import type { StoryDemo } from '../lib/story'
import SplitToken from './three/SplitToken'
import LandingLighting from './three/LandingLighting'
import ProductUniverse from './three/ProductUniverse'
import type { UniverseMotion } from './three/ProductUniverse'
import PaperReceipt from './three/PaperReceipt'
import SavingsVessel from './three/SavingsVessel'
import ScrollParticles from './three/ScrollParticles'
import { landingCard, landingLeather, landingMetal, landingPaper } from './three/landingMaterials'
import WalletPocket from './three/WalletPocket'
import { studio } from './three/materials'

function useLabelTexture(
  kind: 'wallet' | 'card' | 'receipt' | 'share' | 'jar' | 'paid' | 'insight',
  index = 0,
  people = 3,
) {
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let mounted = true
    document.fonts.ready.then(() => {
      if (mounted) setFontsReady(true)
    })
    return () => {
      mounted = false
    }
  }, [])
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = kind === 'receipt' ? 1536 : 640
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = kind === 'card' ? studio.pale : kind === 'receipt' ? '#f2ede4' : studio.violet
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (kind === 'paid') {
      ctx.clearRect(0, 0, 1024, 640)
      ctx.strokeStyle = studio.indigo
      ctx.fillStyle = studio.indigo
      ctx.lineWidth = 18
      ctx.beginPath()
      ctx.roundRect(24, 110, 976, 420, 30)
      ctx.stroke()
      ctx.font = 'bold 180px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('ĐÃ GỌN.', 512, 380)
    } else if (kind === 'share') {
      ctx.fillStyle = [studio.lavender, studio.paper, studio.pale, '#c9b7df'][index]
      ctx.fillRect(0, 0, 1024, 640)
      ctx.fillStyle = '#473252'
      ctx.textAlign = index === 2 ? 'right' : 'left'
      const textX = index === 2 ? 959 : 65
      ctx.font = 'bold 115px sans-serif'
      ctx.fillText('Splitly', textX, 155)
      ctx.font = '27px sans-serif'
      ctx.fillText('A GOOD DINNER, TOGETHER.', textX, 229)
      ctx.font = '26px sans-serif'
      ctx.fillText(['LINH', 'MINH', 'AN', 'BẠN'][index], textX, 356)
      ctx.font = 'bold 91px sans-serif'
      ctx.fillText((720000 / people).toLocaleString('vi-VN'), textX, 474)
      ctx.font = '29px sans-serif'
      ctx.fillText('VND / YOUR LITTLE SHARE', textX, 548)
      const badgeX = index === 2 ? 123 : 901
      ctx.lineWidth = 3
      ctx.strokeStyle = studio.violet
      ctx.beginPath()
      ctx.arc(badgeX, 114, 41, 0, Math.PI * 2)
      ctx.stroke()
      ctx.textAlign = 'center'
      ctx.font = '40px sans-serif'
      ctx.fillText(String(index + 1), badgeX, 128)
    } else if (kind === 'jar') {
      ctx.clearRect(0, 0, 1024, 640)
      ctx.fillStyle = '#30233d'
      ctx.textAlign = 'center'
      ctx.font = fontsReady ? '600 186px Be Vietnam Pro, sans-serif' : 'bold 186px sans-serif'
      ctx.fillText('Splitly', 512, 325)
      ctx.font = '30px sans-serif'
      ctx.fillText('ĐỂ DÀNH CHO ĐIỀU ĐẸP.', 512, 435)
    } else if (kind === 'insight') {
      ctx.fillStyle = '#eee8df'
      ctx.fillRect(0, 0, 1024, 640)
      ctx.fillStyle = '#302339'
      ctx.font = fontsReady ? '600 96px Be Vietnam Pro, sans-serif' : 'bold 96px sans-serif'
      ctx.fillText('Splitly', 64, 132)
      ctx.font = '24px sans-serif'
      ctx.fillText('THÁNG NÀY, RÕ HƠN.', 68, 185)
      ctx.strokeStyle = studio.lavender
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(66, 225)
      ctx.lineTo(958, 225)
      ctx.stroke()
      ctx.fillStyle = '#665471'
      ctx.font = '28px sans-serif'
      ctx.fillText('CHI TIÊU', 70, 305)
      ctx.fillText('DÀNH DỤM', 70, 392)
      ctx.fillText('CÒN LẠI', 70, 479)
      ctx.fillStyle = '#302339'
      ctx.font = 'bold 48px monospace'
      ctx.textAlign = 'right'
      ctx.fillText('34%', 430, 305)
      ctx.fillText('22%', 430, 392)
      ctx.fillText('44%', 430, 479)
      ctx.textAlign = 'left'
      ctx.font = '24px sans-serif'
      ctx.fillStyle = '#665471'
      ctx.fillText('MỖI KHOẢN ĐỀU CÓ CHỖ.', 68, 575)
    } else if (kind === 'wallet') {
      // Brand ink only: the pocket contour, seam and surface grain are real geometry/materials.
      ctx.clearRect(0, 0, 1024, 640)
      ctx.fillStyle = '#e4d8ed'
      ctx.font = fontsReady ? '600 102px Be Vietnam Pro, sans-serif' : 'bold 102px sans-serif'
      ctx.fillText('Splitly', 285, 256)
      ctx.font = '21px sans-serif'
      ctx.fillText('KHOẢN CHUNG. RÕ TỪNG PHẦN.', 75, 530)
    } else if (kind === 'card') {
      ctx.clearRect(0, 0, 1024, 640)
      ctx.fillStyle = '#382b47'
      ctx.font = fontsReady ? '600 112px Be Vietnam Pro, sans-serif' : 'bold 112px sans-serif'
      ctx.fillText('Splitly', 66, 160)
      ctx.font = '22px sans-serif'
      ctx.fillText('KHOẢN CHUNG. RÕ TỪNG PHẦN.', 68, 220)
      ctx.font = '34px monospace'
      ctx.fillText('••••   ••••   ••••   0926', 65, 490)
      ctx.font = '20px sans-serif'
      ctx.fillText('CÙNG NHAU, NHẸ NHÀNG HƠN', 68, 560)
      ctx.strokeStyle = studio.violet
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(880, 120, 32, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(845, 120, 32, 0, Math.PI * 2)
      ctx.stroke()
    } else if (kind === 'receipt') {
      ctx.fillStyle = '#302335'
      ctx.textAlign = 'center'
      ctx.font = fontsReady ? '600 150px Be Vietnam Pro, sans-serif' : 'bold 150px sans-serif'
      ctx.fillText('Splitly', 512, 220)
      ctx.font = '40px monospace'
      ctx.fillText('HÓA ĐƠN THÁNG NÀY', 512, 325)
      ctx.strokeStyle = '#b7a9bd'
      ctx.lineWidth = 3
      ctx.setLineDash([15, 13])
      for (const y of [400, 995]) {
        ctx.beginPath()
        ctx.moveTo(90, y)
        ctx.lineTo(934, y)
        ctx.stroke()
      }
      ctx.textAlign = 'left'
      ctx.font = '42px monospace'
      const lines = [
        ['INTERNET', '250.000'],
        ['KHOẢN CHUNG', 'INTERNET'],
        ['GHI CHÚ', 'CÙNG NHAU'],
      ]
      lines.forEach(([a, b], i) => {
        ctx.fillText(a, 96, 525 + i * 155)
        ctx.textAlign = 'right'
        ctx.fillText(b, 926, 525 + i * 155)
        ctx.textAlign = 'left'
      })
      ctx.font = 'bold 64px monospace'
      ctx.fillText('TỔNG', 96, 1130)
      ctx.textAlign = 'right'
      ctx.fillText('250.000', 926, 1130)
      ctx.fillStyle = '#302335'
      for (let x = 175; x < 850; x += 13) ctx.fillRect(x, 1250, 3 + (x % 8), 100)
      ctx.font = '28px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('MỘT KHOẢN CHUNG. THẬT RÕ.', 512, 1450)
    }
    const result = new THREE.CanvasTexture(canvas)
    result.colorSpace = THREE.SRGBColorSpace
    result.anisotropy = 4
    return result
  }, [kind, index, people, fontsReady])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function Coin({
  position,
  rotation,
  scale = 1,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  scale?: number
}) {
  return <SplitToken finish="metal" position={position} rotation={rotation} scale={scale} />
}

function Wallet({
  reducedMotion,
  progress,
  inspectionTurn,
}: {
  reducedMotion: boolean
  progress: React.RefObject<number>
  inspectionTurn: number
}) {
  const group = useRef<THREE.Group>(null)
  const card = useRef<THREE.Group>(null)
  const receipt = useRef<THREE.Group>(null)
  const back = useRef<THREE.Group>(null)
  const front = useRef<THREE.Group>(null)
  const coins = useRef<THREE.Group>(null)
  const atmosphere = useRef<UniverseMotion>({ time: 0, lift: 0 })
  const elapsed = useRef(0)
  const lastInspection = useRef(inspectionTurn)
  const inspectionAge = useRef(Infinity)
  const walletLabel = useLabelTexture('wallet')
  const cardLabel = useLabelTexture('card')
  const receiptLabel = useLabelTexture('receipt')
  useFrame((state, delta) => {
    if (!group.current) return
    const rawProgress = reducedMotion ? 0 : progress.current
    elapsed.current += Math.min(delta, 0.1)
    const idle = !reducedMotion && rawProgress < 0.025
    const time = idle ? elapsed.current : 0
    const launch = reducedMotion ? 1 : storyRange(elapsed.current, 0, 1.8)
    const phase = (Math.max(0, time - 4) % 12) / 3.6
    const automaticLift = time > 4 && phase < 1 ? Math.sin(phase * Math.PI) ** 2 : 0
    if (lastInspection.current !== inspectionTurn) {
      lastInspection.current = inspectionTurn
      inspectionAge.current = 0
    }
    inspectionAge.current += Math.min(delta, 0.1)
    const inspectionLift =
      idle && inspectionAge.current < 1.45
        ? Math.sin((inspectionAge.current / 1.45) * Math.PI) ** 2
        : 0
    const lift = Math.max(automaticLift, inspectionLift)
    atmosphere.current = { time, lift }
    const animation = reducedMotion
      ? 'static'
      : rawProgress > 0.025
        ? 'reading'
        : launch < 1
          ? 'arriving'
          : lift > 0
            ? 'flight'
            : 'floating'
    if (state.gl.domElement.dataset.animation !== animation)
      state.gl.domElement.dataset.animation = animation
    const scroll = storyRange(rawProgress, 0.015, 0.19)
    const organize = storyRange(rawProgress, 0.018, 0.115)
    const focus = storyRange(rawProgress, 0.05, 0.145)
    const split = storyRange(rawProgress, 0.095, 0.18)
    const exit = storyRange(rawProgress, 0.175, 0.245)
    const damp = 1 - Math.exp(-delta * 5)
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      -0.31 +
        (reducedMotion ? 0 : state.pointer.x * 0.08) +
        Math.sin(scroll * Math.PI) * 0.72 +
        split * 0.28,
      damp,
    )
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      0.12 + (reducedMotion ? 0 : state.pointer.y * 0.035) - split * 0.07,
      damp,
    )
    group.current.rotation.z = -0.1 + Math.sin(time * 0.4) * 0.038 + split * 0.12 - lift * 0.07
    group.current.visible = rawProgress < 0.25

    // Give the product a clear silhouette inside the stage, including wide screens.
    const heightFit = THREE.MathUtils.clamp(state.size.height / 980, 0.86, 1.06)
    const widthFit = state.size.width > 1800 ? 1.04 : 1
    const mobileFit = state.size.width < 520 ? 1.02 : 1
    const compositionFit = Math.min(
      0.9,
      heightFit * widthFit * mobileFit * (state.size.width < 520 ? 1.06 : 1.09),
    )
    group.current.position.x = 0
    group.current.position.y =
      (state.size.width < 520 ? -0.1 : 0) + Math.sin(time * 0.8) * 0.045 - split * 0.06 - exit * 5.9
    group.current.position.z = focus * 0.04 - exit * 0.7
    group.current.scale.setScalar(
      (1.02 + focus * 0.14 + Math.sin(split * Math.PI) * 0.035 - exit * 0.13) * compositionFit,
    )
    if (card.current) {
      card.current.position.y =
        1.12 -
        organize * 0.36 +
        Math.sin(time * 0.7) * 0.08 +
        split * 1.02 +
        lift * 0.62 -
        (1 - launch) * 0.72
      card.current.position.x =
        -0.53 + organize * 0.35 - split * 0.62 - lift * 0.2 + Math.sin(time * 0.45) * 0.1
      card.current.position.z = -0.12 * (1 - organize) + split * 0.18 + lift * 0.42
      card.current.rotation.z =
        0.3 - organize * 0.12 + split * 0.34 - lift * 0.17 + Math.sin(time * 0.4) * 0.055
      card.current.rotation.y = -0.18 * (1 - organize) - split * 0.55 + lift * 0.25
      card.current.scale.setScalar(1.08)
    }
    if (receipt.current) {
      receipt.current.rotation.z =
        -0.32 + organize * 0.13 + Math.sin(time * 0.6) * 0.07 - split * 0.38 + lift * 0.16
      receipt.current.rotation.y = -0.24 + organize * 0.12 + split * 0.28
      receipt.current.position.x = 1.54 - organize * 0.32 + split * 0.55 + lift * 0.16
      receipt.current.position.y =
        1.04 -
        organize * 0.27 +
        split * 0.58 +
        lift * 0.45 +
        Math.sin(time * 0.6 + 1) * 0.07 -
        (1 - launch) * 0.5
      receipt.current.position.z = -0.28 + organize * 0.13 - split * 0.16 + lift * 0.28
      receipt.current.scale.setScalar(1.12)
    }
    if (back.current) {
      back.current.position.x = split * 0.34
      back.current.position.y = split * 0.1
      back.current.position.z = -split * 0.18 - lift * 0.16
      back.current.rotation.y = split * 0.17
    }
    if (front.current) {
      front.current.rotation.x = -split * 0.26 - lift * 0.11
      front.current.rotation.y = -split * 0.12
      front.current.position.x = -split * 0.34
      front.current.position.z = split * 0.54 + lift * 0.17
      front.current.position.y = -split * 0.18
    }
    if (coins.current) {
      coins.current.rotation.z =
        -0.18 * (1 - organize) + split * 0.42 + Math.sin(time * 0.25) * 0.12 + lift * 0.32
      coins.current.position.y = 0.14 * (1 - organize) + split * 0.31
      coins.current.position.x = -0.12 * (1 - organize) - split * 0.18
      coins.current.scale.setScalar(1.02 - organize * 0.06 + split * 0.18 + lift * 0.08)
    }
  })
  return (
    <group ref={group} rotation={[0.12, -0.31, -0.1]}>
      <ProductUniverse motion={atmosphere} />
      <group ref={receipt} position={[1.29, 0.65, -0.15]} rotation={[0.02, -0.12, -0.24]}>
        <PaperReceipt label={receiptLabel} />
      </group>
      <group ref={back}>
        <RoundedBox
          args={[2.86, 1.86, 0.26]}
          radius={0.18}
          smoothness={6}
          position={[0, 0.01, -0.12]}
        >
          <meshPhysicalMaterial {...landingLeather} color="#2e233c" />
        </RoundedBox>
      </group>
      <group ref={card} position={[-0.2, 0.68, 0]} rotation={[0, 0, 0.19]}>
        <RoundedBox args={[2.38, 1.5, 0.075]} radius={0.095} smoothness={6}>
          <meshPhysicalMaterial {...landingCard} />
        </RoundedBox>
        <mesh position={[0, 0, 0.041]}>
          <planeGeometry args={[2.25, 1.4]} />
          <meshPhysicalMaterial map={cardLabel} transparent depthWrite={false} {...landingCard} />
        </mesh>
        <RoundedBox
          args={[0.31, 0.22, 0.018]}
          radius={0.025}
          position={[-0.88, -0.05, 0.052]}
          smoothness={4}
        >
          <meshPhysicalMaterial color="#cdbfcf" {...landingMetal} />
        </RoundedBox>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[-0.88, -0.115 + i * 0.065, 0.063]}>
            <boxGeometry args={[0.27, 0.006, 0.003]} />
            <meshStandardMaterial color={studio.indigo} roughness={0.6} />
          </mesh>
        ))}
      </group>
      <group ref={front}>
        <WalletPocket finish="leather" />
        <mesh position={[0, -0.2, 0.271]}>
          <planeGeometry args={[2.73, 1.62]} />
          <meshStandardMaterial map={walletLabel} transparent roughness={0.6} depthWrite={false} />
        </mesh>
        <SplitToken finish="metal" position={[-0.99, 0.13, 0.284]} scale={0.35} />
        <RoundedBox
          args={[0.79, 0.43, 0.115]}
          radius={0.09}
          smoothness={6}
          position={[1.18, -0.14, 0.31]}
        >
          <meshPhysicalMaterial {...landingLeather} color="#39283f" />
        </RoundedBox>
        <mesh position={[1.01, -0.14, 0.39]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.091, 0.091, 0.025, 32]} />
          <meshPhysicalMaterial color="#e4d9e7" {...landingMetal} />
        </mesh>
      </group>
      <group ref={coins}>
        <Coin position={[-1.75, 1.05, 0.25]} rotation={[0.22, -0.45, 0.15]} scale={0.83} />
        <Coin position={[1.58, -1.09, 0.64]} rotation={[-0.28, -0.58, 0.22]} scale={1.15} />
        <Coin position={[-0.84, -1.4, 0.36]} rotation={[0.6, 0.2, -0.3]} scale={0.61} />
      </group>
    </group>
  )
}

function SharingCard({
  index,
  progress,
  people,
}: {
  index: number
  progress: React.RefObject<number>
  people: number
}) {
  const group = useRef<THREE.Group>(null)
  const label = useLabelTexture('share', index, people)
  useFrame((state) => {
    if (!group.current) return
    const spread = storyRange(progress.current, 0.205, 0.28)
    const offset = index - (people - 1) / 2
    const fan = state.size.width < 520 ? (people === 4 ? 0.95 : 1.1) : people === 4 ? 1.16 : 1.68
    group.current.position.set(
      offset * (0.08 + spread * fan),
      -Math.abs(offset) * 0.16 * spread + Math.sin(spread * Math.PI) * (index % 2 ? 0.1 : -0.08),
      index === 1 ? 0.4 : -Math.abs(offset) * 0.12,
    )
    group.current.rotation.set(-0.08, offset * -0.12 * spread, offset * -0.15 * spread)
  })
  return (
    <group ref={group}>
      <RoundedBox args={[2.08, 1.34, 0.055]} radius={0.09} smoothness={6}>
        <meshPhysicalMaterial
          color={[studio.lavender, studio.paper, studio.pale, '#c9b7df'][index]}
          metalness={0.32}
          roughness={0.48}
          clearcoat={0.03}
        />
      </RoundedBox>
      <mesh position={[0, 0, 0.031]}>
        <planeGeometry args={[1.98, 1.24]} />
        <meshStandardMaterial map={label} roughness={0.68} />
      </mesh>
    </group>
  )
}

function SharingScene({ progress, people }: { progress: React.RefObject<number>; people: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    const p = progress.current
    const enter = storyRange(p, 0.165, 0.215)
    const leave = storyRange(p, 0.345, 0.39)
    group.current.visible = p > 0.16 && p < 0.43
    group.current.position.set(
      0,
      flightY(p, 0.165, 0.215, 0.345, 0.39),
      -0.5 * (1 - enter) - leave * 0.8,
    )
    group.current.rotation.set(
      (1 - enter) * 0.6 + 0.1 + leave * 0.4,
      (1 - enter) * -0.8 + leave * 0.55,
      (1 - enter) * 0.15 - leave * 0.18,
    )
    group.current.scale.setScalar(
      Math.min(1.13, state.viewport.width / 6.6) * (0.9 + enter * 0.14 - leave * 0.08),
    )
  })
  return (
    <group ref={group} visible={false}>
      {Array.from({ length: people }, (_, index) => (
        <SharingCard key={index} index={index} progress={progress} people={people} />
      ))}
    </group>
  )
}

function BillScene({ progress, paid }: { progress: React.RefObject<number>; paid: boolean }) {
  const group = useRef<THREE.Group>(null)
  const stamp = useRef<THREE.Mesh>(null)
  const label = useLabelTexture('receipt')
  const paidLabel = useLabelTexture('paid')
  const stampProgress = useRef(0)
  useFrame((state, delta) => {
    if (!group.current) return
    const p = progress.current
    const enter = storyRange(p, 0.365, 0.415)
    const rotate = storyRange(p, 0.42, 0.535)
    const leave = storyRange(p, 0.54, 0.585)
    group.current.visible = p > 0.35 && p < 0.63
    group.current.position.set(
      0,
      flightY(p, 0.365, 0.415, 0.54, 0.585),
      -0.4 * (1 - enter) - leave * 0.5,
    )
    group.current.rotation.set(
      (1 - enter) * -0.5 + 0.08 + leave * 0.55,
      (1 - enter) * -1.7 + rotate * 0.35 + leave * 1.2,
      -0.15 + rotate * 0.24 + leave * 0.35,
    )
    group.current.scale.setScalar(
      Math.min(1.32, state.viewport.width / 2.8) * (0.92 + enter * 0.08 - leave * 0.12),
    )
    if (stamp.current) {
      stampProgress.current = THREE.MathUtils.damp(stampProgress.current, paid ? 1 : 0, 12, delta)
      const amount = stampProgress.current
      stamp.current.visible = amount > 0.001
      stamp.current.position.set(0, 0.2 - amount * 0.35, 0.035 + (1 - amount) * 0.8)
      stamp.current.scale.setScalar(1 + (1 - amount) * 0.4)
      ;(stamp.current.material as THREE.MeshBasicMaterial).opacity = amount
    }
  })
  return (
    <group ref={group} visible={false}>
      <PaperReceipt label={label} />
      <Coin position={[0.94, -0.44, 0.35]} rotation={[0.1, -0.38, 0.13]} scale={0.72} />
      <Coin position={[-0.89, 0.58, -0.1]} rotation={[0.12, 0.6, -0.2]} scale={0.5} />
      <mesh ref={stamp} rotation={[0, 0, -0.15]} visible={false}>
        <planeGeometry args={[1.02, 0.64]} />
        <meshBasicMaterial map={paidLabel} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

function InsightsScene({ progress }: { progress: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null)
  const bars = useRef<(THREE.Group | null)[]>([])
  const label = useLabelTexture('insight')
  const heights = [0.82, 0.53, 1.06]
  useFrame((state) => {
    if (!group.current) return
    const p = progress.current
    const enter = storyRange(p, 0.555, 0.605)
    const reveal = storyRange(p, 0.62, 0.705)
    const leave = storyRange(p, 0.735, 0.785)
    group.current.visible = p > 0.54 && p < 0.82
    group.current.position.set(
      0,
      flightY(p, 0.555, 0.605, 0.735, 0.785),
      -0.5 * (1 - enter) - leave * 0.55,
    )
    group.current.rotation.set(
      (1 - enter) * 0.45 + 0.06 + leave * 0.38,
      (1 - enter) * -1.05 + reveal * 0.16 + leave * 0.78,
      (1 - enter) * 0.12 - reveal * 0.05 + leave * 0.24,
    )
    group.current.scale.setScalar(
      Math.min(1.12, state.viewport.width / 4.5) * (0.92 + enter * 0.08 - leave * 0.07),
    )
    bars.current.forEach((bar, index) => {
      if (!bar) return
      const grow = storyRange(p, 0.58 + index * 0.01, 0.61 + index * 0.01)
      bar.scale.y = Math.max(0.035, grow)
      bar.position.y = -0.69 + (heights[index] * grow) / 2
    })
  })
  return (
    <group ref={group} visible={false}>
      <RoundedBox args={[3.15, 2.05, 0.085]} radius={0.035} smoothness={7}>
        <meshPhysicalMaterial {...landingMetal} color="#b0a4bd" metalness={0.7} roughness={0.38} />
      </RoundedBox>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[3.02, 1.92]} />
        <meshStandardMaterial {...landingPaper} map={label} />
      </mesh>
      <group position={[0.84, 0.05, 0.17]}>
        {heights.map((height, index) => (
          <group
            key={height}
            ref={(node) => {
              bars.current[index] = node
            }}
            position={[-0.45 + index * 0.44, -0.69 + height / 2, 0]}
          >
            <RoundedBox args={[0.27, height, 0.2]} radius={0.035} smoothness={5}>
              <meshPhysicalMaterial
                {...landingMetal}
                color={['#a994c4', '#483154', '#c7bfcd'][index]}
                metalness={0.65}
                roughness={0.4}
              />
            </RoundedBox>
          </group>
        ))}
        <mesh position={[0, -0.73, 0.01]}>
          <boxGeometry args={[1.3, 0.018, 0.025]} />
          <meshStandardMaterial color="#ad9cbe" roughness={0.65} />
        </mesh>
      </group>
      <Coin position={[-1.72, -0.88, 0.1]} rotation={[0.4, -0.2, 0.18]} scale={0.35} />
    </group>
  )
}

function SavingsScene({ progress, saved }: { progress: React.RefObject<number>; saved: number }) {
  const group = useRef<THREE.Group>(null)
  const coins = useRef<(THREE.Group | null)[]>([])
  const label = useLabelTexture('jar')
  const deposited = useRef<THREE.Group>(null)
  const lastSaved = useRef(saved)
  const drop = useRef(1)
  useFrame((state, delta) => {
    if (!group.current) return
    const p = progress.current
    const enter = storyRange(p, 0.755, 0.805)
    const leave = storyRange(p, 0.965, 1)
    group.current.visible = p > 0.74
    group.current.position.set(0, 5.8 * (1 - enter) - 0.15 - leave * 4.3, -0.5 * (1 - enter))
    group.current.rotation.set(
      (1 - enter) * -0.5 + 0.05 + leave * 0.35,
      (1 - enter) * -1.3 + storyRange(p, 0.825, 0.95) * 0.27,
      -0.08 + enter * 0.08 + leave * 0.3,
    )
    group.current.scale.setScalar(Math.min(1.14, state.viewport.width / 2.8) - leave * 0.2)
    if (lastSaved.current !== saved) {
      lastSaved.current = saved
      drop.current = 0
    }
    drop.current = Math.min(1, drop.current + delta / 0.85)
    if (deposited.current) {
      const fall = storyRange(drop.current, 0, 1)
      deposited.current.visible = saved > 0
      deposited.current.position.set(0.08, 1.7 * (1 - fall) - 0.44 * fall, 0.24)
      deposited.current.rotation.set(0.2 + fall, (1 - fall) * 2, fall * 0.4)
    }
    coins.current.forEach((coin, i) => {
      if (!coin) return
      // Three coins are already inside at the chapter's reading pose. Two remain
      // airborne and drop on the next scroll, instead of hiding the whole balance.
      const from = i < 3 ? 0.795 + i * 0.01 : 0.865 + (i - 3) * 0.016
      const to = i < 3 ? 0.82 + i * 0.01 : 0.9 + (i - 3) * 0.016
      const fall = storyRange(p, from, to)
      coin.visible = p >= (i < 3 ? from - 0.01 : 0.825)
      const x = [-0.35, 0.29, 0, -0.19, 0.33][i]
      const airborneY = i < 3 ? 1.9 : 1.65 + (i - 3) * 0.18
      coin.position.set(
        (i < 3 ? 0 : i === 3 ? -0.38 : 0.43) * (1 - fall) + x * fall,
        airborneY * (1 - fall) + (-0.65 + i * 0.095) * fall,
        0.14 + (i % 2) * 0.2,
      )
      coin.rotation.set(0.1 + fall * 0.08, (1 - fall) * 1.4 + i * 0.16, i * 0.31 + (1 - fall) * 0.9)
    })
  })
  return (
    <group ref={group} visible={false}>
      <SavingsVessel label={label}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group
            key={i}
            ref={(node) => {
              coins.current[i] = node
            }}
            visible={false}
          >
            <Coin position={[0, 0, 0]} rotation={[0, 0, 0]} scale={0.64} />
          </group>
        ))}
        <group ref={deposited} visible={false}>
          <Coin position={[0, 0, 0]} rotation={[0, 0, 0]} scale={0.64} />
        </group>
      </SavingsVessel>
    </group>
  )
}

export function WalletFallback() {
  return (
    <div className="wallet-fallback" aria-hidden="true">
      <div className="fallback-card">
        <b>Splitly</b>
        <span>YOUR EVERYDAY, A LITTLE BETTER</span>
      </div>
      <div className="fallback-receipt">
        Splitly
        <hr />A GOOD LITTLE DAY
        <hr />
        65.000 ₫
      </div>
      <div className="fallback-wallet">
        <b>Splitly</b>
        <span>A LITTLE SPACE. A LIGHTER MIND.</span>
        <i />
      </div>
      <div className="fallback-coin">₫</div>
    </div>
  )
}

function CinematicCamera({
  progress,
  reducedMotion,
}: {
  progress: React.RefObject<number>
  reducedMotion: boolean
}) {
  useFrame((state) => {
    const camera = state.camera
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    const p = reducedMotion ? 0 : progress.current
    const focus = storyRange(p, 0.05, 0.145)
    const ending = storyRange(p, 0.93, 1)
    camera.position.x = reducedMotion ? 0 : state.pointer.x * 0.04 * focus
    camera.position.y = 0.1 + (reducedMotion ? 0 : state.pointer.y * 0.028 * focus)
    camera.position.z = 7.65 - focus * 0.18 + ending * 0.22
    const nextFov = 40 - focus * 0.7 + ending * 0.5
    if (Math.abs(camera.fov - nextFov) > 0.001) {
      camera.fov = nextFov
      camera.updateProjectionMatrix()
    }
  })
  return null
}

function StageComposition({
  reducedMotion,
  stacked,
  children,
}: {
  reducedMotion: boolean
  stacked: boolean
  children: React.ReactNode
}) {
  const { viewport } = useThree()
  return (
    <group position={[reducedMotion || stacked ? 0 : viewport.width * 0.22, 0, 0]}>
      {children}
    </group>
  )
}

function SceneRig({
  inspectionTurn,
  reducedMotion,
  manualOrbit,
  children,
}: {
  inspectionTurn: number
  reducedMotion: boolean
  manualOrbit: { x: number; y: number }
  children: React.ReactNode
}) {
  const rig = useRef<THREE.Group>(null)
  const lastTurn = useRef(inspectionTurn)
  const turnProgress = useRef(1)
  const orbitY = useRef(0)
  useFrame((state, delta) => {
    if (!rig.current) return
    if (lastTurn.current !== inspectionTurn) {
      lastTurn.current = inspectionTurn
      turnProgress.current = 0
    }
    turnProgress.current = Math.min(1, turnProgress.current + delta / 1.45)
    const turn = storyRange(turnProgress.current, 0, 1)
    const spin = (inspectionTurn - 1 + turn) * Math.PI * 2
    const damp = 1 - Math.exp(-delta * 7)
    const targetY = reducedMotion
      ? 0
      : THREE.MathUtils.clamp(manualOrbit.x, -0.31, 0.31) + state.pointer.x * 0.055
    const targetX = reducedMotion
      ? 0
      : THREE.MathUtils.clamp(manualOrbit.y, -0.14, 0.14) + state.pointer.y * 0.035
    orbitY.current = THREE.MathUtils.lerp(orbitY.current, targetY, damp)
    rig.current.rotation.y = (reducedMotion ? 0 : spin) + orbitY.current
    rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, targetX, damp)
    rig.current.position.x = THREE.MathUtils.lerp(
      rig.current.position.x,
      reducedMotion ? 0 : state.pointer.x * 0.02,
      damp,
    )
    rig.current.position.y = THREE.MathUtils.lerp(
      rig.current.position.y,
      reducedMotion ? 0 : state.pointer.y * 0.014,
      damp,
    )
  })
  return <group ref={rig}>{children}</group>
}

// Mount upcoming chapters near their scroll boundary, then retain visited scenes.
// The opening wallet avoids compiling the glass shader and building every label at once.
function SecondaryScenes({
  progress,
  demo,
}: {
  progress: React.RefObject<number>
  demo: StoryDemo
}) {
  const visited = useRef(0)
  const [mounted, setMounted] = useState(0)
  useFrame(() => {
    let next = visited.current
    storyChapters.slice(1).forEach((chapter, index) => {
      if (progress.current >= chapter.from - 0.035 && progress.current <= chapter.to) {
        next |= 1 << index
      }
    })
    if (next !== visited.current) {
      visited.current = next
      setMounted(next)
    }
  })
  return (
    <>
      {!!(mounted & 1) && <SharingScene progress={progress} people={demo.people} />}
      {!!(mounted & 2) && <BillScene progress={progress} paid={demo.paid} />}
      {!!(mounted & 4) && <InsightsScene progress={progress} />}
      {!!(mounted & 8) && <SavingsScene progress={progress} saved={demo.saved} />}
    </>
  )
}

export default function WalletScene({
  reducedMotion,
  progress,
  inspectionTurn,
  manualOrbit,
  demo,
}: {
  reducedMotion: boolean
  progress: React.RefObject<number>
  inspectionTurn: number
  manualOrbit: { x: number; y: number }
  demo: StoryDemo
}) {
  const [webGLAvailable] = useState(() => {
    try {
      const probe = document.createElement('canvas').getContext('webgl2')
      if (!probe) return false
      probe.getExtension('WEBGL_lose_context')?.loseContext()
      return true
    } catch {
      return false
    }
  })
  const [contextLost, setContextLost] = useState(false)
  const [stacked, setStacked] = useState(() => window.innerWidth <= 1024)
  useEffect(() => {
    const resize = () => setStacked(window.innerWidth <= 1024)
    window.addEventListener('resize', resize, { passive: true })
    return () => window.removeEventListener('resize', resize)
  }, [])
  if (!webGLAvailable || contextLost) return <WalletFallback />
  return (
    <Canvas
      camera={{ position: [0, 0.1, 7.65], fov: 40 }}
      dpr={[1, stacked ? 1.25 : 1.6]}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      frameloop={reducedMotion ? 'demand' : 'always'}
      onCreated={({ gl }) => {
        gl.transmissionResolutionScale = window.innerWidth <= 640 ? 0.5 : 0.75
        gl.domElement.addEventListener('webglcontextlost', () => setContextLost(true), {
          once: true,
        })
      }}
      fallback={<WalletFallback />}
    >
      <Suspense fallback={null}>
        <LandingLighting />
        <CinematicCamera progress={progress} reducedMotion={reducedMotion} />
        <StageComposition reducedMotion={reducedMotion} stacked={stacked}>
          <ScrollParticles progress={progress} reducedMotion={reducedMotion} />
          <SceneRig
            inspectionTurn={inspectionTurn}
            reducedMotion={reducedMotion}
            manualOrbit={manualOrbit}
          >
            <Wallet
              reducedMotion={reducedMotion}
              progress={progress}
              inspectionTurn={inspectionTurn}
            />
            {!reducedMotion && <SecondaryScenes progress={progress} demo={demo} />}
          </SceneRig>
          <ContactShadows
            position={[0, -1.8, 0]}
            opacity={0.18}
            scale={7}
            blur={3}
            far={3}
            resolution={256}
            frames={1}
            color={studio.ink}
          />
        </StageComposition>
      </Suspense>
    </Canvas>
  )
}
