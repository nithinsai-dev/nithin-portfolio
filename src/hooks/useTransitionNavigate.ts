import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getTargetY, ScrollTargetName } from '../lib/scrollTargets'
import {
  resetMotionToHeroState,
  snapMotionToAboutState,
  snapMotionToContactState,
} from './useObjectMotion'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export type DestinationName = 'Home' | 'About' | 'Work' | 'Contact'

export interface TransitionOptions {
  destination?: DestinationName
  target?: ScrollTargetName
  onCovered?: () => void
  isPopState?: boolean
}

export interface TransitionRequest {
  to?: string
  destination?: DestinationName
  target?: ScrollTargetName
  onCovered?: () => void
  isPopState?: boolean
}

type TransitionListener = (state: {
  isTransitioning: boolean
  destination: DestinationName
  phase: 'idle' | 'covering' | 'holding' | 'revealing'
}) => void

// Global transition singleton
let globalIsTransitioning = false
let globalPhase: 'idle' | 'covering' | 'holding' | 'revealing' = 'idle'
let globalDestination: DestinationName = 'Home'
const listeners = new Set<TransitionListener>()

function notifyListeners() {
  listeners.forEach((l) =>
    l({
      isTransitioning: globalIsTransitioning,
      destination: globalDestination,
      phase: globalPhase,
    })
  )
}

export function subscribeTransition(listener: TransitionListener): () => void {
  listeners.add(listener)
  listener({
    isTransitioning: globalIsTransitioning,
    destination: globalDestination,
    phase: globalPhase,
  })
  return () => {
    listeners.delete(listener)
  }
}

export function setTransitionState(
  isTransitioning: boolean,
  destination: DestinationName,
  phase: 'idle' | 'covering' | 'holding' | 'revealing'
) {
  globalIsTransitioning = isTransitioning
  globalDestination = destination
  globalPhase = phase

  if (typeof document !== 'undefined') {
    if (isTransitioning) {
      document.documentElement.classList.add('page-transitioning')
    } else {
      document.documentElement.classList.remove('page-transitioning')
    }
  }

  notifyListeners()
}

function smoothScrollToY(targetY: number, durationMs = 900): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    const startY = window.scrollY
    const diff = targetY - startY
    if (Math.abs(diff) < 2) {
      resolve()
      return
    }

    const startTime = performance.now()
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    let cancelled = false
    const onUserScroll = () => {
      cancelled = true
      cleanup()
      resolve()
    }

    const cleanup = () => {
      window.removeEventListener('wheel', onUserScroll)
      window.removeEventListener('touchmove', onUserScroll)
    }

    window.addEventListener('wheel', onUserScroll, { passive: true, once: true })
    window.addEventListener('touchmove', onUserScroll, { passive: true, once: true })

    const step = (now: number) => {
      if (cancelled) return
      const elapsed = now - startTime
      const progress = Math.min(1.0, elapsed / durationMs)
      window.scrollTo(0, Math.round(startY + diff * easeInOutCubic(progress)))

      if (progress < 1.0) {
        requestAnimationFrame(step)
      } else {
        cleanup()
        resolve()
      }
    }
    requestAnimationFrame(step)
  })
}

export function useTransitionNavigate() {
  const navigate = useNavigate()
  const location = useLocation()
  const [transitionState, setLocalState] = useState({
    isTransitioning: globalIsTransitioning,
    destination: globalDestination,
    phase: globalPhase,
  })

  useEffect(() => {
    return subscribeTransition(setLocalState)
  }, [])

  const transition = useCallback(
    async (requestOrTo: string | TransitionRequest, maybeOptions?: TransitionOptions) => {
      // Ignore if transition already running
      if (globalIsTransitioning) return

      // Normalize parameters
      let to: string | undefined
      let destination: DestinationName | undefined
      let target: ScrollTargetName | undefined
      let onCovered: (() => void) | undefined
      let isPopState = false

      if (typeof requestOrTo === 'string') {
        to = requestOrTo
        destination = maybeOptions?.destination
        target = maybeOptions?.target
        onCovered = maybeOptions?.onCovered
        isPopState = !!maybeOptions?.isPopState
      } else {
        to = requestOrTo.to
        destination = requestOrTo.destination
        target = requestOrTo.target
        onCovered = requestOrTo.onCovered
        isPopState = !!requestOrTo.isPopState
      }

      // Infer destination label if not provided
      if (!destination) {
        if (to === '/projects') {
          destination = 'Work'
        } else if (target === 'about' || to === '/#about') {
          destination = 'About'
        } else if (target === 'contact' || to === '/#contact') {
          destination = 'Contact'
        } else {
          destination = 'Home'
        }
      }

      // Infer scrollTarget if not provided
      if (!target) {
        if (to === '/#about' || destination === 'About') {
          target = 'about'
        } else if (to === '/#contact' || destination === 'Contact') {
          target = 'contact'
        } else if (to === '/' || destination === 'Home') {
          target = 'top'
        }
      }

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const pathname = location.pathname
      const isTargetProjects = to === '/projects'
      const isTargetHome = to === '/' || to?.startsWith('/#') || !to

      // Safety timer (3 seconds max) to guarantee isTransitioning is NEVER stuck
      let safetyTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
        if (globalIsTransitioning) {
          console.warn('[Transition] 3s safety timeout reached — resetting state.')
          setTransitionState(false, globalDestination, 'idle')
        }
      }, 3000)

      try {
        // ----------------------------------------------------
        // A. Same-page navigation on "/"
        // ----------------------------------------------------
        if (pathname === '/' && isTargetHome) {
          const scrollTarget = target || 'top'
          const targetY = getTargetY(scrollTarget)
          const currentY = window.scrollY
          const scrollDistance = Math.abs(targetY - currentY)
          const screenHeight = window.innerHeight || 800

          const newHash = scrollTarget === 'about' ? '#about' : scrollTarget === 'contact' ? '#contact' : ''
          const newUrl = newHash ? `/${newHash}` : '/'

          // Rule: distance under 3 screen heights = smooth scroll; longer = curtain + instant jump.
          // Home <-> Contact is always >= 3 screen heights.
          const isLongDistance = scrollDistance >= 3 * screenHeight

          if (!isLongDistance && scrollTarget !== 'contact') {
            if (!isPopState) {
              const currentHash = window.location.hash
              if (currentHash !== (newHash ? `${newHash}` : '')) {
                window.history.pushState({ scrollTarget }, '', newUrl)
              }
            }
            await smoothScrollToY(targetY, 900)
            window.dispatchEvent(new Event('scroll'))
            return
          }

          // Long distance jump: curtain Phase 1 -> Hold + instant jump -> Phase 3 Reveal
          setTransitionState(true, destination, 'covering')
          const coverTime = prefersReduced ? 75 : 820
          await new Promise((r) => setTimeout(r, coverTime))

          // Phase 2: Hold (perform instant jump while covered)
          setTransitionState(true, destination, 'holding')

          if (onCovered) {
            onCovered()
          } else {
            window.scrollTo({ top: targetY, behavior: 'instant' })
          }

          // Update hash in URL
          if (!isPopState) {
            const currentHash = window.location.hash
            if (currentHash !== (newHash ? `${newHash}` : '')) {
              window.history.pushState({ scrollTarget }, '', newUrl)
            }
          }

          // Sync ScrollTrigger immediately
          const ST = (window as unknown as { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger || ScrollTrigger
          if (ST) {
            ;(ST as unknown as { update: (reset?: boolean) => void }).update(true)
            try {
              ST.refresh()
            } catch {}
          }

          // Snap 3D targets to the destination state
          if (scrollTarget === 'top') {
            resetMotionToHeroState()
          } else if (scrollTarget === 'contact') {
            snapMotionToContactState()
          } else if (scrollTarget === 'about') {
            snapMotionToAboutState()
          }

          // Wait two animation frames so the 3D store and scene catch up
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve()
              })
            })
          })

          // Dispatch scroll to update active navbar link
          window.dispatchEvent(new Event('scroll'))

          const holdTime = prefersReduced ? 0 : 250
          await new Promise((r) => setTimeout(r, holdTime))

          // Phase 3: Reveal
          setTransitionState(true, destination, 'revealing')
          const revealTime = prefersReduced ? 75 : 820
          await new Promise((r) => setTimeout(r, revealTime))

          return
        }

        // ----------------------------------------------------
        // B. Cross-page navigation (between "/" and "/projects")
        // ----------------------------------------------------
        setTransitionState(true, destination, 'covering')
        const coverTime = prefersReduced ? 75 : 820
        await new Promise((r) => setTimeout(r, coverTime))

        // Phase 2: Hold - route change
        setTransitionState(true, destination, 'holding')

        if (onCovered) {
          onCovered()
        }

        if (!isPopState) {
          navigate(to || '/', {
            state: { scrollTarget: target || 'top' },
          })
        }

        if (isTargetProjects) {
          window.scrollTo({ top: 0, behavior: 'instant' })
        } else {
          const scrollTarget = target || 'top'
          const targetY = getTargetY(scrollTarget)
          window.scrollTo({ top: targetY, behavior: 'instant' })

          if (scrollTarget === 'top') {
            resetMotionToHeroState()
          } else if (scrollTarget === 'contact') {
            snapMotionToContactState()
          } else if (scrollTarget === 'about') {
            snapMotionToAboutState()
          }

          const ST = (window as unknown as { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger || ScrollTrigger
          if (ST) {
            ;(ST as unknown as { update: (reset?: boolean) => void }).update(true)
            try {
              ST.refresh()
            } catch {}
          }
        }

        // Wait two animation frames
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve()
            })
          })
        })

        window.dispatchEvent(new Event('scroll'))

        const holdTime = prefersReduced ? 0 : 300
        await new Promise((r) => setTimeout(r, holdTime))

        // Phase 3: Reveal
        setTransitionState(true, destination, 'revealing')
        const revealTime = prefersReduced ? 75 : 820
        await new Promise((r) => setTimeout(r, revealTime))
      } finally {
        if (safetyTimer) {
          clearTimeout(safetyTimer)
          safetyTimer = null
        }
        setTransitionState(false, destination, 'idle')
      }
    },
    [location.pathname, navigate]
  )

  return {
    transition,
    navigateWithTransition: transition, // alias for backwards compatibility
    isTransitioning: transitionState.isTransitioning,
    phase: transitionState.phase,
    destination: transitionState.destination,
  }
}
