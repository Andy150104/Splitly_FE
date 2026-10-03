'use client'

import { useEffect, useState } from 'react'
import { useSplitlyNavigation } from './components/RouteTransition'
import { MotionConfig } from 'motion/react'
import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import StoryResolution from './components/StoryResolution'
import OverviewPreview from './components/OverviewPreview'
import Dreams from './components/Dreams'
import Footer from './components/Footer'
import type { FinanceState } from './types'
import Atmosphere from './components/ui/Atmosphere'

export default function App({
  initialState,
  initialMonth,
  initialYear,
}: {
  initialState: FinanceState
  initialMonth: string
  initialYear: number
}) {
  const navigate = useSplitlyNavigation()
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  const openWallet = () => navigate('/dashboard')
  const about = () => document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })
  return (
    <MotionConfig reducedMotion="user">
      <div className="splitly-landing">
        <Atmosphere />
        <a className="skip-link" href="#discover">
          Đi đến nội dung
        </a>
        <Header ready={hydrated} onAbout={about} onOpenWallet={() => openWallet()} />
        <main data-hydrated={hydrated}>
          <Hero ready={hydrated} onOpenWallet={() => openWallet()} />
          <StoryResolution onOpenWallet={() => openWallet()} />
          <Features
            onOpenWallet={(tab) =>
              navigate(
                tab === 'transactions'
                  ? '/groups'
                  : tab === 'overview'
                    ? '/payout-accounts'
                    : '/bills',
              )
            }
          />
          <OverviewPreview
            state={initialState}
            month={initialMonth}
            onOpenWallet={() => openWallet()}
          />
          <Dreams goals={initialState.goals} onGoal={() => navigate('/groups')} />
        </main>
        <Footer year={initialYear} onOpenWallet={() => openWallet()} onAbout={about} />
      </div>
    </MotionConfig>
  )
}
