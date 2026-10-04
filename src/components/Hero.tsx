import { Component, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import {
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
  MoveUpRight,
  Rotate3D,
  Sparkles,
} from 'lucide-react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import { storyChapter, storyChapters, storyRange, storyOpacity, storyTarget } from '../lib/story'
import type { StoryDemo } from '../lib/story'
import StoryInteraction from './StoryInteraction'
import { useDeferredScene } from '../hooks/useDeferredScene'

const WalletScene = dynamic(() => import('./WalletScene'), { ssr: false, loading: StaticWallet })

function StaticWallet() {
  return (
    <div className="wallet-fallback" aria-hidden="true">
      <div className="fallback-card">
        <b>Splitly</b>
        <span>A LITTLE BETTER, EVERY DAY.</span>
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

class SceneBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    return this.state.hasError ? <StaticWallet /> : this.props.children
  }
}

function StoryChapter({
  index,
  scroll,
  active,
  demo,
  onDemoChange,
  onOpenWallet,
}: {
  index: number
  scroll: MotionValue<number>
  active: boolean
  demo: StoryDemo
  onDemoChange: (patch: Partial<StoryDemo>) => void
  onOpenWallet: () => void
}) {
  const chapter = storyChapters[index]
  const opacity = useTransform(() => storyOpacity(scroll.get(), index))
  const y = useTransform(
    () => 16 * (1 - storyRange(scroll.get(), chapter.from, chapter.from + 0.035)),
  )
  return (
    <motion.div
      className={`hero-narrative narrative-${chapter.id}`}
      style={{ opacity, y }}
      aria-hidden={!active}
      inert={!active}
    >
      <span className="narrative-backdrop" aria-hidden="true">
        {chapter.word}
      </span>
      <div className="narrative-copy">
        <span className="eyebrow">
          0{index + 1} / {chapter.label}
        </span>
        <h2>
          {chapter.title[0]}
          <br />
          {chapter.title[1]}
        </h2>
        <p>{chapter.description}</p>
        <StoryInteraction
          chapter={index}
          demo={demo}
          onChange={onDemoChange}
          onOpenWallet={onOpenWallet}
        />
      </div>
      <div className="narrative-aside">
        {index === 1 && (
          <div className="story-avatars" aria-hidden="true">
            <span>L</span>
            <span>M</span>
            <span>A</span>
          </div>
        )}
        <span>{chapter.aside[0]}</span>
        <b>{chapter.aside[1]}</b>
      </div>
    </motion.div>
  )
}

export default function Hero({
  onOpenWallet,
  ready,
}: {
  onOpenWallet: () => void
  ready: boolean
}) {
  const motionPreference = useReducedMotion()
  const [viewportReady, setViewportReady] = useState(false)
  const reducedMotion = viewportReady && !!motionPreference
  const section = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const [visible, setVisible] = useState(true)
  const sceneReady = useDeferredScene(visible)
  const [tallEnough, setTallEnough] = useState(true)
  const [chapter, setChapter] = useState(0)
  const [inspectionTurn, setInspectionTurn] = useState(0)
  const [demo, setDemo] = useState<StoryDemo>({ people: 3, paid: false, saved: 0 })
  const updateDemo = (patch: Partial<StoryDemo>) => setDemo((current) => ({ ...current, ...patch }))
  const [manualOrbit, setManualOrbit] = useState({ x: 0, y: 0 })
  const drag = useRef({ active: false, x: 0, y: 0 })
  const pinned = tallEnough && !reducedMotion
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  // Each value is derived from scroll, including reverse scrolling. No timed scene changes.
  const copyOpacity = useTransform(() => storyOpacity(scrollYProgress.get(), 0))
  const copyY = useTransform(() => -34 * storyRange(scrollYProgress.get(), 0.055, 0.17))
  const trailOpacity = useTransform(() => storyRange(scrollYProgress.get(), 0.04, 0.15))
  const trailScale = useTransform(() => 0.16 + scrollYProgress.get() * 0.84)
  const orbitRotation = useTransform(scrollYProgress, [0, 1], [0, 160])
  const annotationsOpacity = useTransform(() => 1 - storyRange(scrollYProgress.get(), 0.025, 0.125))
  // The film reference is not a narrow illustration column: the canvas is a full
  // cinematic stage. The 3D rig itself moves from the right into the centre and zooms
  // forward as the copy clears, which keeps the object physically large instead of
  // merely stretching an empty canvas.
  const backdrop = useTransform(() => {
    const value = scrollYProgress.get()
    const clarity = storyRange(value, 0.52, 0.76)
    const calm = storyRange(value, 0.82, 1)
    return `rgb(${Math.round(13 + clarity * 4 - calm * 2)}, ${Math.round(
      11 + clarity * 2 - calm,
    )}, ${Math.round(20 + clarity * 8 - calm * 4)})`
  })
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (!pinned) return
    progress.current = value
    setChapter(storyChapter(value))
  })
  useEffect(() => {
    const onResize = () => {
      setTallEnough(window.innerHeight >= 650)
    }
    onResize()
    setViewportReady(true)
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])
  useEffect(() => {
    if (!pinned) {
      progress.current = 0
      setChapter(0)
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: '100px',
    })
    if (section.current) observer.observe(section.current)
    return () => observer.disconnect()
  }, [pinned])
  const jumpToChapter = (index: number) => {
    const node = section.current
    if (!node) return
    const target = storyTarget(index)
    window.scrollTo({
      top: node.offsetTop + (node.offsetHeight - window.innerHeight) * target,
      behavior: reducedMotion ? 'instant' : 'smooth',
    })
  }
  const continueStory = () => {
    if (!pinned) {
      document
        .getElementById('discover')
        ?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' })
      return
    }
    if (chapter < storyChapters.length - 1) {
      jumpToChapter(chapter + 1)
      return
    }
    document
      .getElementById('discover')
      ?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' })
  }
  return (
    <motion.section
      className={`hero-shell hero-universe ${pinned ? 'hero-shell-pinned' : ''}`}
      ref={section}
      id="home"
      aria-labelledby="hero-title"
      style={pinned ? { backgroundColor: backdrop } : undefined}
    >
      <div className="hero" data-chapter={chapter} data-scene={storyChapters[chapter].id}>
        <div className="hero-topline">
          <span>ÍT LO TOAN. NHIỀU ĐIỀU ĐẸP.</span>
          <span>
            MỘT KHỞI ĐẦU NHẸ TÊNH <MoveUpRight size={13} />
          </span>
        </div>
        <div className="hero-main">
          <motion.div
            className="hero-copy-motion"
            style={pinned ? { opacity: copyOpacity, y: copyY } : undefined}
          >
            <div className="hero-copy" inert={pinned && chapter > 0 ? true : undefined}>
              <div className="eyebrow">
                <span className="status-dot" /> KHÔNG GIAN TÀI CHÍNH CỦA BẠN
              </div>
              <h1 id="hero-title">
                TIỀN BẠC,
                <br />
                ĐÔI KHI <span className="outlined-word">HƠI RỐI.</span>
                <br />
                <span className="hero-highlight">
                  MÌNH GỠ TỪNG CHÚT.
                  <span className="highlight-stroke" />
                </span>
              </h1>
              <p>
                Một khoản chung. Một hóa đơn. Một điều đang để dành.
                <br />
                Cuộn xuống — mọi thứ sẽ tự tìm về đúng chỗ.
              </p>
              <button
                onClick={onOpenWallet}
                className="button button-dark hero-cta"
                disabled={!ready}
              >
                Bắt đầu cùng Splitly <ArrowUpRight size={20} />
              </button>
              <div className="hero-note">
                <span className="little-star">✳</span>
                <span>
                  Không cần bắt đầu thật giỏi.
                  <br />
                  <b>Chỉ cần bắt đầu thật gọn.</b>
                </span>
              </div>
            </div>
          </motion.div>
          {pinned &&
            storyChapters.map((_, index) =>
              index === 0 ? null : (
                <StoryChapter
                  key={index}
                  index={index}
                  scroll={scrollYProgress}
                  active={chapter === index}
                  demo={demo}
                  onDemoChange={updateDemo}
                  onOpenWallet={onOpenWallet}
                />
              ),
            )}
          <motion.div
            className="hero-art"
            onPointerDown={(event) => {
              if (reducedMotion || event.pointerType !== 'mouse') return
              if ((event.target as HTMLElement).closest('button')) return
              drag.current = { active: true, x: event.clientX, y: event.clientY }
              event.currentTarget.setPointerCapture(event.pointerId)
              event.currentTarget.classList.add('is-dragging')
            }}
            onPointerUp={(event) => {
              drag.current.active = false
              setManualOrbit({ x: 0, y: 0 })
              event.currentTarget.classList.remove('is-dragging')
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
              }
            }}
            onPointerCancel={(event) => {
              drag.current.active = false
              setManualOrbit({ x: 0, y: 0 })
              event.currentTarget.classList.remove('is-dragging')
            }}
            onPointerMove={(event) => {
              if (event.pointerType !== 'mouse' || reducedMotion) return
              const bounds = event.currentTarget.getBoundingClientRect()
              event.currentTarget.style.setProperty(
                '--spot-x',
                `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
              )
              event.currentTarget.style.setProperty(
                '--spot-y',
                `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
              )
              if (drag.current.active) {
                const dx = event.clientX - drag.current.x
                const dy = event.clientY - drag.current.y
                drag.current.x = event.clientX
                drag.current.y = event.clientY
                setManualOrbit((value) => ({
                  x: Math.max(-0.31, Math.min(0.31, value.x + dx * 0.0019)),
                  y: Math.max(-0.14, Math.min(0.14, value.y + dy * 0.00145)),
                }))
              }
            }}
          >
            {pinned && (
              <motion.div
                className="flight-stage"
                style={{ opacity: trailOpacity }}
                aria-hidden="true"
              >
                <motion.span className="flight-orbit" style={{ rotate: orbitRotation }} />
                <motion.span className="flight-line" style={{ scaleY: trailScale }} />
                <span className="flight-coordinate">MỖI CHÚT NHỎ · MỘT BƯỚC XA</span>
              </motion.div>
            )}
            <motion.div
              className="hero-art-annotations"
              style={pinned ? { opacity: annotationsOpacity } : undefined}
            >
              <span className="art-orbit orbit-one" />
              <span className="art-orbit orbit-two" />
            </motion.div>
            <div
              className="scene-container"
              role="img"
              aria-label={`Cảnh 3D ${storyChapters[chapter].label.toLocaleLowerCase('vi')} — chuyển động theo thao tác cuộn`}
            >
              <SceneBoundary>
                {sceneReady ? (
                  <WalletScene
                    reducedMotion={reducedMotion || !pinned}
                    progress={progress}
                    inspectionTurn={inspectionTurn}
                    manualOrbit={manualOrbit}
                    demo={demo}
                  />
                ) : (
                  <StaticWallet />
                )}
              </SceneBoundary>
            </div>
            {pinned && (
              <div className="scene-gesture-hint" aria-hidden="true">
                <span /> KÉO NHẸ ĐỂ NHÌN · CUỘN ĐỂ TIẾP CÂU CHUYỆN
              </div>
            )}
            {pinned && (
              <button
                className="scene-interact"
                aria-label="Xoay vật thể 3D"
                disabled={!ready}
                onClick={() => setInspectionTurn((value) => value + 1)}
              >
                <Rotate3D size={15} strokeWidth={1.4} /> <span>Xoay mô hình</span>
              </button>
            )}
            <motion.div
              className="hero-art-annotations"
              style={pinned ? { opacity: annotationsOpacity } : undefined}
            >
              <div className="floating-label label-income">
                <span className="tiny-icon">
                  <ArrowDownRight size={17} />
                </span>
                <div>
                  <span>Một bữa ăn cùng nhau</span>
                  <b>3 người · 240.000 ₫ / người</b>
                </div>
                <span className="label-dot" />
              </div>
              <div className="floating-label label-bill">
                <span className="label-check">✓</span>
                <div>
                  <b>Hóa đơn đã gọn.</b>
                  <span>Thêm một điều bớt lo.</span>
                </div>
              </div>
              <div className="art-caption">
                <span className="hand-note">Ví nhỏ, ước mơ to.</span>
                <ArrowUpRight size={31} strokeWidth={1} />
              </div>
              <div className="round-stamp">
                <Sparkles size={21} />
                <span>
                  TIỀN CÓ CHỖ
                  <br />
                  KHOẢN CHUNG CÓ CHỖ
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
        <div className="hero-bottom">
          <button className="scroll-hint" onClick={continueStory}>
            <span className="scroll-circle">
              <ArrowDown size={17} />
            </span>
            {pinned && chapter < storyChapters.length - 1 ? (
              <>
                Tiếp theo <b>{storyChapters[chapter + 1].nav}</b>
              </>
            ) : (
              'KHÁM PHÁ KHÔNG GIAN CỦA BẠN'
            )}
          </button>
          {pinned && (
            <nav className="story-chapter-nav" aria-label="Các chương câu chuyện">
              {storyChapters.map((item, index) => (
                <button
                  key={item.id}
                  className={chapter === index ? 'is-active' : ''}
                  aria-current={chapter === index ? 'step' : undefined}
                  aria-label={`Chuyển tới cảnh ${item.nav}`}
                  onClick={() => jumpToChapter(index)}
                >
                  <span className="chapter-number">0{index + 1}</span>
                  <span>{item.word.replace('.', '')}</span>
                </button>
              ))}
            </nav>
          )}
          {pinned && (
            <motion.span className="hero-scroll-progress" style={{ scaleX: scrollYProgress }} />
          )}
        </div>
      </div>
    </motion.section>
  )
}
