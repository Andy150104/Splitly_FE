import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { storyChapter, storyChapters, storyTarget } from '../lib/story'
import Brand from './ui/Brand'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

type ActiveSection = 'home' | 'discover' | 'dreams'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const sectionCopy: Record<Exclude<ActiveSection, 'home'>, { eyebrow: string; title: string }> = {
  discover: {
    eyebrow: 'KHÁM PHÁ',
    title: 'Từ câu chuyện đến cách Splitly hoạt động',
  },
  dreams: {
    eyebrow: 'CÙNG NHAU',
    title: 'Dành một khoảng nhỏ cho điều đẹp phía trước',
  },
}

function CollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={collapsed ? 'm6 9 6 6 6-6' : 'm6 15 6-6 6 6'} />
    </svg>
  )
}

export default function Header({
  onAbout,
  onOpenWallet,
  ready,
}: {
  onAbout: () => void
  onOpenWallet: () => void
  ready: boolean
}) {
  const [open, setOpen] = useState(false)
  const [manualCollapsed, setManualCollapsed] = useState(false)
  const [quickNavOpen, setQuickNavOpen] = useState(false)
  const reduced = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const [activeSection, setActiveSection] = useState<ActiveSection>('home')
  const [storyProgress, setStoryProgress] = useState(0)
  const [storyIndex, setStoryIndex] = useState(0)
  const [inStory, setInStory] = useState(false)
  const [pageProgress, setPageProgress] = useState(0)
  const menuButton = useRef<HTMLButtonElement>(null)
  const quickNavTrigger = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (quickNavOpen) {
        setQuickNavOpen(false)
        quickNavTrigger.current?.focus()
        return
      }
      if (open) {
        setOpen(false)
        menuButton.current?.focus()
      }
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open, quickNavOpen])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!quickNavOpen) return
      const node = headerRef.current
      if (node && !node.contains(event.target as Node)) setQuickNavOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [quickNavOpen])

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout> | null = null
    let frame = 0
    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0
    let accumulatedDelta = 0

    const syncScrollState = () => {
      frame = 0
      const scrollY = window.scrollY
      const hasScrolled = scrollY > 34
      setScrolled(hasScrolled)

      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      setPageProgress(clamp01(scrollY / scrollable))

      // Derive the active section from one reversible scroll position instead of
      // relying on IntersectionObserver history. This makes scrolling back to the
      // hero reliably restore "Trang đầu", even after jumping around from the nav.
      const discover = document.getElementById('discover')
      const dreams = document.getElementById('dreams')
      const readingLine = scrollY + window.innerHeight * 0.34
      if (dreams && readingLine >= dreams.offsetTop) setActiveSection('dreams')
      else if (discover && readingLine >= discover.offsetTop) setActiveSection('discover')
      else setActiveSection('home')

      const hero = document.getElementById('home')
      if (hero) {
        const heroTravel = Math.max(1, hero.offsetHeight - window.innerHeight)
        const relative = scrollY - hero.offsetTop
        const progress = clamp01(relative / heroTravel)
        const insidePinnedStory =
          hero.classList.contains('hero-shell-pinned') &&
          relative >= 18 &&
          relative <= heroTravel + 36
        setStoryProgress(progress)
        setStoryIndex(storyChapter(progress))
        setInStory(hasScrolled && insidePinnedStory)
      }
    }

    const onScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY
      lastScrollY = currentScrollY

      if (!frame) frame = window.requestAnimationFrame(syncScrollState)

      if (currentScrollY > 34) {
        setScrolled(true)
        if ((delta > 0 && accumulatedDelta < 0) || (delta < 0 && accumulatedDelta > 0)) {
          accumulatedDelta = 0
        }
        accumulatedDelta += delta

        if (accumulatedDelta <= -16) {
          // Scrolling UP intentionally by at least 16px: expand navbar back to full HUD
          setScrolling(false)
          accumulatedDelta = 0
        } else if (accumulatedDelta >= 14 || delta > 12) {
          // Scrolling DOWN intentionally by at least 14px (or jump): collapse navbar into compact pill
          setScrolling(true)
          setQuickNavOpen(false)
        }

        if (settleTimer) clearTimeout(settleTimer)
        settleTimer = setTimeout(() => {
          setScrolling(false)
          accumulatedDelta = 0
        }, 340)
      } else {
        setScrolling(false)
        accumulatedDelta = 0
      }
    }

    syncScrollState()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', syncScrollState, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', syncScrollState)
      if (settleTimer) clearTimeout(settleTimer)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const closeMenu = () => setOpen(false)
  const closeQuickNav = () => setQuickNavOpen(false)

  const jumpToStoryChapter = (index: number) => {
    const hero = document.getElementById('home')
    if (!hero) return
    if (!hero.classList.contains('hero-shell-pinned')) {
      document
        .getElementById(index === 0 ? 'home' : 'discover')
        ?.scrollIntoView({ behavior: 'instant' })
      closeQuickNav()
      return
    }
    const target = storyTarget(index)
    const top = hero.offsetTop + Math.max(0, hero.offsetHeight - window.innerHeight) * target
    closeQuickNav()
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const jumpToSection = (id: ActiveSection) => {
    closeQuickNav()
    setOpen(false)
    setActiveSection(id)

    // Home is special: go to the true document top so the opening navigation
    // state comes back as well, rather than stopping at a stale anchor offset.
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const currentChapter = storyChapters[storyIndex]
  const contextualProgress = inStory ? storyProgress : pageProgress
  const progressStyle = {
    '--nav-progress': `${Math.round(contextualProgress * 1000) / 10}%`,
  } as CSSProperties

  const currentSectionCopy = activeSection === 'home' ? null : sectionCopy[activeSection]

  const contextualEyebrow = inStory
    ? `${String(storyIndex + 1).padStart(2, '0')} — ${currentChapter.nav.toUpperCase()}`
    : (currentSectionCopy?.eyebrow ?? 'TRANG ĐẦU')

  const contextualTitle = inStory
    ? currentChapter.label
    : (currentSectionCopy?.title ?? 'Tiền bạc nhẹ đầu hơn, từng chút một')

  const contextualCount = inStory
    ? `${String(storyIndex + 1).padStart(2, '0')} / 05`
    : `${Math.round(pageProgress * 100)}%`

  const collapsedLabel = inStory
    ? `${String(storyIndex + 1).padStart(2, '0')} · ${currentChapter.nav}`
    : activeSection === 'home'
      ? 'Trang đầu'
      : sectionCopy[activeSection].eyebrow.toLocaleLowerCase('vi-VN')

  const autoCompact = !manualCollapsed && scrolled && scrolling && !quickNavOpen && !open
  const compact = manualCollapsed || autoCompact

  const toggleCollapsed = () => {
    // Manual collapse is a persistent preference. Auto-compact is temporary and
    // releases as soon as scrolling settles. Clicking the control while auto-
    // compact pins the compact state; clicking again restores the full navigator.
    setManualCollapsed((value) => (autoCompact && !value ? true : !value))
    setQuickNavOpen(false)
    setOpen(false)
  }

  const openFromCompact = () => {
    if (manualCollapsed) {
      setManualCollapsed(false)
      return
    }
    // During auto-compact, a deliberate click should win over the passive scroll
    // behaviour and reveal the full controls immediately.
    setScrolling(false)
  }

  return (
    <div className="site-header-shell">
      <header
        ref={headerRef}
        style={{
          backdropFilter: 'blur(24px) saturate(148%)',
          WebkitBackdropFilter: 'blur(24px) saturate(148%)',
        }}
        className={`site-header section-${activeSection} ${scrolled ? 'is-scrolled' : ''} ${scrolling ? 'is-scrolling' : 'is-settled'} ${inStory ? 'is-story-mode' : 'is-page-mode'} ${open ? 'is-open' : ''} ${quickNavOpen ? 'is-quick-nav-open' : ''} ${compact ? 'is-collapsed' : ''} ${autoCompact ? 'is-auto-compact' : ''} ${manualCollapsed ? 'is-manual-collapsed' : ''}`}
      >
        <a
          className="brand"
          href="#home"
          aria-label="Splitly — Về đầu trang"
          onClick={(event) => {
            event.preventDefault()
            jumpToSection('home')
          }}
        >
          <Brand />
        </a>

        {compact ? (
          <button
            className="nav-collapsed-context"
            type="button"
            onClick={openFromCompact}
            aria-label={`${manualCollapsed ? 'Mở rộng' : 'Hiện đầy đủ'} thanh điều hướng — ${collapsedLabel}`}
          >
            <span>{inStory ? contextualCount : `${Math.round(pageProgress * 100)}%`}</span>
            <strong>{collapsedLabel}</strong>
          </button>
        ) : !scrolled ? (
          <>
            <nav className="desktop-nav" aria-label="Điều hướng chính">
              <a
                href="#home"
                aria-current={activeSection === 'home' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  jumpToSection('home')
                }}
              >
                Trang đầu
              </a>
              <a
                href="#discover"
                aria-current={activeSection === 'discover' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  jumpToSection('discover')
                }}
              >
                Khám phá
              </a>
              <a
                href="#dreams"
                aria-current={activeSection === 'dreams' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  jumpToSection('dreams')
                }}
              >
                Cùng nhau
              </a>
              <button onClick={onAbout}>Câu chuyện</button>
            </nav>
            <button
              ref={quickNavTrigger}
              type="button"
              className="nav-story-teaser"
              aria-expanded={quickNavOpen}
              aria-controls="nav-quick-panel"
              aria-label="Mở danh sách 5 chương"
              onClick={() => setQuickNavOpen((value) => !value)}
            >
              <span>01</span>
              <i />
              <span>05</span>
            </button>
          </>
        ) : (
          <div className="nav-context" style={progressStyle} aria-live="polite">
            <button
              ref={quickNavTrigger}
              type="button"
              className="nav-context-trigger"
              aria-expanded={quickNavOpen}
              aria-controls="nav-quick-panel"
              aria-label={`Mở điều hướng nhanh — ${contextualEyebrow}`}
              onClick={() => setQuickNavOpen((value) => !value)}
            >
              <span
                className="nav-context-copy"
                key={`${inStory ? 'story' : activeSection}-${storyIndex}`}
              >
                <span className="nav-context-eyebrow">{contextualEyebrow}</span>
                <strong>{contextualTitle}</strong>
              </span>
              <span className="nav-context-chevron" aria-hidden="true" />
            </button>

            <div className="nav-progress-block">
              <div className="nav-progress-track" aria-hidden="true">
                <span className="nav-progress-fill" />
                <span className="nav-progress-glow" />
              </div>

              {inStory ? (
                <div className="nav-story-steps" aria-label="Chuyển chương câu chuyện">
                  {storyChapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      className={`${index === storyIndex ? 'is-active' : ''} ${index < storyIndex ? 'is-passed' : ''}`}
                      aria-label={`Đi tới chương ${chapter.nav} từ thanh điều hướng`}
                      aria-current={index === storyIndex ? 'step' : undefined}
                      data-label={`${String(index + 1).padStart(2, '0')} · ${chapter.nav}`}
                      onClick={() => jumpToStoryChapter(index)}
                    >
                      <span />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <span className="nav-context-count">{contextualCount}</span>
          </div>
        )}

        {!compact ? (
          <button onClick={onOpenWallet} className="nav-cta" disabled={!ready}>
            <span>BẮT ĐẦU</span>
            <ArrowUpRight size={14} />
          </button>
        ) : null}

        {!compact && scrolled && inStory ? (
          <span className="nav-mobile-step" aria-hidden="true">
            {String(storyIndex + 1).padStart(2, '0')}/05
          </span>
        ) : null}

        {!compact ? (
          <button
            ref={menuButton}
            className="menu-toggle"
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        ) : null}

        <button
          className="nav-collapse-toggle"
          type="button"
          aria-label={
            manualCollapsed
              ? 'Mở rộng thanh điều hướng'
              : autoCompact
                ? 'Giữ thanh ở chế độ thu gọn'
                : 'Thu gọn thanh điều hướng'
          }
          title={
            manualCollapsed
              ? 'Mở rộng thanh điều hướng'
              : autoCompact
                ? 'Giữ thanh thu gọn'
                : 'Thu gọn thanh điều hướng'
          }
          onClick={toggleCollapsed}
        >
          <CollapseGlyph collapsed={compact} />
        </button>

        <AnimatePresence>
          {!compact && quickNavOpen ? (
            <motion.nav
              key="quick-nav"
              id="nav-quick-panel"
              className="nav-quick-panel"
              aria-label="Điều hướng nhanh"
              initial={{ opacity: 0, x: '-50%', y: reduced ? 0 : -12, scale: reduced ? 1 : 0.97 }}
              animate={{ opacity: 1, x: '-50%', y: 0, scale: 1 }}
              exit={{ opacity: 0, x: '-50%', y: reduced ? 0 : -8, scale: reduced ? 1 : 0.98 }}
              transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="nav-quick-head">
                <span>ĐI NHANH TỚI</span>
                <strong>
                  {inStory ? 'Chọn một chương để tiếp tục câu chuyện' : 'Chọn nơi bạn muốn ghé'}
                </strong>
              </div>

              <div className="nav-quick-sections" aria-label="Các phần chính">
                <button
                  className={activeSection === 'home' ? 'is-active' : ''}
                  onClick={() => jumpToSection('home')}
                >
                  Trang đầu
                </button>
                <button
                  className={activeSection === 'discover' ? 'is-active' : ''}
                  onClick={() => jumpToSection('discover')}
                >
                  Khám phá
                </button>
                <button
                  className={activeSection === 'dreams' ? 'is-active' : ''}
                  onClick={() => jumpToSection('dreams')}
                >
                  Cùng nhau
                </button>
                <button
                  onClick={() => {
                    closeQuickNav()
                    onAbout()
                  }}
                >
                  Câu chuyện
                </button>
              </div>

              <div className="nav-quick-divider" />

              <div className="nav-quick-chapters" aria-label="Các chương trong câu chuyện">
                {storyChapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    className={index === storyIndex && inStory ? 'is-active' : ''}
                    aria-current={index === storyIndex && inStory ? 'step' : undefined}
                    onClick={() => jumpToStoryChapter(index)}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{chapter.nav}</strong>
                    <small>{chapter.label}</small>
                  </button>
                ))}
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {open && !compact ? (
            <motion.nav
              key="mobile-menu"
              id="mobile-menu"
              className="mobile-menu"
              aria-label="Điều hướng di động"
              initial={{ opacity: 0, y: reduced ? 0 : -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -10 }}
              transition={{ duration: reduced ? 0 : 0.22 }}
            >
              <a
                href="#home"
                onClick={(event) => {
                  event.preventDefault()
                  jumpToSection('home')
                }}
                aria-current={activeSection === 'home' ? 'page' : undefined}
              >
                Trang đầu <ArrowUpRight />
              </a>
              <a
                href="#discover"
                onClick={(event) => {
                  event.preventDefault()
                  jumpToSection('discover')
                }}
                aria-current={activeSection === 'discover' ? 'page' : undefined}
              >
                Khám phá <ArrowUpRight />
              </a>
              <a
                href="#dreams"
                onClick={(event) => {
                  event.preventDefault()
                  jumpToSection('dreams')
                }}
                aria-current={activeSection === 'dreams' ? 'page' : undefined}
              >
                Cùng nhau <ArrowUpRight />
              </a>
              <button
                onClick={() => {
                  closeMenu()
                  onAbout()
                }}
              >
                Câu chuyện <ArrowUpRight />
              </button>
              {inStory ? (
                <div className="mobile-story-chapters" aria-label="Chọn chương câu chuyện">
                  <span>CHƯƠNG</span>
                  <div>
                    {storyChapters.map((chapter, index) => (
                      <button
                        key={chapter.id}
                        className={index === storyIndex ? 'is-active' : ''}
                        aria-label={`Đi tới chương ${chapter.nav}`}
                        onClick={() => {
                          closeMenu()
                          jumpToStoryChapter(index)
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <button
                className="mobile-wallet-cta"
                onClick={() => {
                  closeMenu()
                  onOpenWallet()
                }}
              >
                Bắt đầu cùng Splitly <ArrowUpRight />
              </button>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </header>
    </div>
  )
}
