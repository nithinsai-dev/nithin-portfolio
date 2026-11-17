import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import HeroSplit from '../components/HeroSplit'
import AboutSection from '../components/about/AboutSection'
import ContactSection from '../components/contact/ContactSection'
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities'
import { getTargetY, ScrollTargetName } from '../lib/scrollTargets'
import {
  resetMotionToHeroState,
  snapMotionToAboutState,
  snapMotionToContactState,
} from '../hooks/useObjectMotion'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function Home() {
  const location = useLocation()
  const { canRun3D } = useDeviceCapabilities()
  const [StageComponent, setStageComponent] = useState<React.ComponentType | null>(null)

  // Load 3D stage and ScrollTrigger journey ONLY when 3D is allowed
  useEffect(() => {
    if (!canRun3D) return

    let cancelled = false
    let timelineCleanup: (() => void) | null = null

    Promise.all([
      import('../components/ObjectStage'),
      import('../lib/scrollTimeline'),
    ]).then(([stageMod, timelineMod]) => {
      if (cancelled) return
      setStageComponent(() => stageMod.default)
      timelineCleanup = timelineMod.initScrollTimeline()

      // Handle initial hash or state target immediately after ScrollTrigger pin is mounted
      const stateTarget = (location.state as { scrollTarget?: string })?.scrollTarget
      const hash = window.location.hash.toLowerCase()
      const rawTarget = stateTarget || (hash === '#about' ? 'about' : hash === '#contact' ? 'contact' : null)
      const target = rawTarget as ScrollTargetName | null
      if (target) {
        requestAnimationFrame(() => {
          const targetY = getTargetY(target)
          window.scrollTo({ top: targetY, behavior: 'instant' })
          if (target === 'top') {
            resetMotionToHeroState()
          } else if (target === 'contact') {
            snapMotionToContactState()
          } else if (target === 'about') {
            snapMotionToAboutState()
          }
          const ST = (window as unknown as { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger || ScrollTrigger
          if (ST) {
            ;(ST as unknown as { update: (reset?: boolean) => void }).update(true)
            try {
              ST.refresh()
            } catch {}
          }
          window.dispatchEvent(new Event('scroll'))
        })
      }
    })

    return () => {
      cancelled = true
      if (timelineCleanup) {
        timelineCleanup()
      }
    }
  }, [canRun3D])

  // Handle scroll target from navigation state or URL hash on load
  useEffect(() => {
    const stateTarget = (location.state as { scrollTarget?: string })?.scrollTarget
    const hash = window.location.hash.toLowerCase()
    const rawTarget = stateTarget || (hash === '#about' ? 'about' : hash === '#contact' ? 'contact' : null)
    const target = rawTarget as ScrollTargetName | null

    if (target) {
      const timer = setTimeout(async () => {
        const targetY = getTargetY(target)
        window.scrollTo({ top: targetY, behavior: 'instant' })

        if (target === 'top') {
          resetMotionToHeroState()
        } else if (target === 'contact') {
          snapMotionToContactState()
        } else if (target === 'about') {
          snapMotionToAboutState()
        }

        const ST = (window as unknown as { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger || ScrollTrigger
        if (ST) {
          ;(ST as unknown as { update: (reset?: boolean) => void }).update(true)
          try {
            ST.refresh()
          } catch {}
        }

        // Wait two frames so 3D scene renders
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve()
            })
          })
        })

        window.dispatchEvent(new Event('scroll'))
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [location.state])

  return (
    <main
      id="main"
      className="relative w-full flex flex-col bg-[#140C0D] text-[#E8DDD3] min-h-screen"
    >
      {/* Persistent Full-Viewport 3D Object Stage: Only dynamically imported and mounted when 3D is allowed */}
      {canRun3D && StageComponent && <StageComponent />}

      {/* 1. Home Section: HeroSplit ("Builder vs Breaker") */}
      <HeroSplit />

      {/* 2. About Section */}
      <AboutSection />

      {/* 3. Final Screen: Contact Section with SiteFooter inside it */}
      <ContactSection />
    </main>
  )
}
