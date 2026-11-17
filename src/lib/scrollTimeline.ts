import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { timelineTargets, resetMotionToHeroState } from '../hooks/useObjectMotion'

gsap.registerPlugin(ScrollTrigger)

if (typeof window !== 'undefined') {
  ;(window as unknown as { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger
}

/**
 * Requirement 5: Scroll Slowdown
 * 20% slower by making every scroll distance 25% longer (SCROLL_SLOWDOWN = 1.25).
 * Multiplies all scroll lengths: hero-to-About travel, arrival hold, blast,
 * journey pin distance (700vh becomes 875vh), and final reassembly distance.
 */
export const SCROLL_SLOWDOWN = 1.25

export const HERO_TRAVEL_VH = 100 * SCROLL_SLOWDOWN // 125vh
export const ARRIVAL_HOLD_VH = 30 * SCROLL_SLOWDOWN // 37.5vh
export const BLAST_VH = 70 * SCROLL_SLOWDOWN // 87.5vh
export const JOURNEY_VH = 560 * SCROLL_SLOWDOWN // 700vh
export const END_TRANSITION_VH = 30 * SCROLL_SLOWDOWN // 37.5vh (30vh * SCROLL_SLOWDOWN)
export const TOTAL_ABOUT_PIN_VH =
  ARRIVAL_HOLD_VH + BLAST_VH + JOURNEY_VH + END_TRANSITION_VH // 862.5vh

export function initScrollTimeline(): () => void {
  if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return () => {}
  }

  const heroEl = document.getElementById('home')
  const aboutEl = document.getElementById('about')

  if (!heroEl || !aboutEl) {
    return () => {}
  }

  // Force clean state on mount if starting at top
  if (typeof window !== 'undefined' && window.scrollY === 0) {
    resetMotionToHeroState()
  }

  const ctx = gsap.context(() => {
    // 1. HERO SCROLL TIMELINE (scaled by SCROLL_SLOWDOWN: 0 to 125vh)
    // scrub smoothing set to 0.8 so the scene catches up gently
    const tlHero = gsap.timeline({
      scrollTrigger: {
        trigger: heroEl,
        start: 'top top',
        end: () => `+=${HERO_TRAVEL_VH * (window.innerHeight / 100)}`,
        scrub: 0.8,
        onUpdate: (self) => {
          if (self.progress <= 0.001) {
            timelineTargets.dividerProgress = 0
            timelineTargets.breakerOpacity = 1
            timelineTargets.isWireMounted = true
            timelineTargets.posX = 0.10
            timelineTargets.posY = 0.08
            timelineTargets.scaleMultiplier = 1.0
            if (window.scrollY === 0) {
              resetMotionToHeroState()
            }
          }
        },
      },
    })

    // Phase 1: Scroll 0 to 25% of hero scroll length
    // - Divider glides smoothly to right edge (dividerProgress: 0 -> 1)
    // - Breaker layer fades out (breakerOpacity: 1 -> 0)
    // - Wireframe unmounts after 25%
    tlHero.to(
      timelineTargets,
      {
        dividerProgress: 1,
        breakerOpacity: 0,
        duration: 0.25 * SCROLL_SLOWDOWN,
        ease: 'power1.out',
        onUpdate: () => {
          timelineTargets.isWireMounted = timelineTargets.breakerOpacity > 0.02
        },
      },
      0
    )

    // Phase 2: Scroll 25% to 100% of hero scroll length (Hero-to-About travel)
    // - Object travels DOWN and toward viewport centre/right (posX: 0.10 -> 0.12, posY: 0.08 -> 0.0)
    // - Scales up slightly (1.0 -> 1.25)
    // - Arrives at ~62% horizontal position as About enters
    tlHero.to(
      timelineTargets,
      {
        posX: 0.12,
        posY: 0.0,
        scaleMultiplier: 1.25,
        duration: 0.75 * SCROLL_SLOWDOWN,
        ease: 'power2.inOut',
      },
      0.25 * SCROLL_SLOWDOWN
    )

    // 2. ABOUT SCROLL TIMELINE: Pinned horizontal journey
    // Total pinned scroll distance: 37.5vh (arrival) + 87.5vh (blast) + 700vh (journey) + 50vh (hold & fade) = 875vh
    // pinSpacing: true reserves exactly 875vh so Contact/footer stay below in normal flow
    // scrub smoothing set to 0.8 so the scene catches up gently
    const tlAbout = gsap.timeline({
      scrollTrigger: {
        id: 'aboutTrigger',
        trigger: aboutEl,
        start: 'top top',
        end: () => `+=${TOTAL_ABOUT_PIN_VH * (window.innerHeight / 100)}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (self.progress <= 0.001) {
            timelineTargets.spread = 0
            timelineTargets.blast = 0
            timelineTargets.journeyActive = false
            timelineTargets.journeyProgress = 0
            timelineTargets.contactTransition = 0
            timelineTargets.reassemblyProgress = 0
          }
        },
      },
    })

    // Phase 3: Arrival (holds assembled for beat of ARRIVAL_HOLD_VH)
    tlAbout.to(
      timelineTargets,
      {
        spread: 0,
        blast: 0,
        journeyActive: false,
        journeyProgress: 0,
        duration: ARRIVAL_HOLD_VH,
      },
      0
    )

    // Phase 4: BLAST (over BLAST_VH of scroll: ARRIVAL_HOLD_VH to journeyStartTime)
    // Shards explode outward into a field; coin aligns to horizontal centre and drops to lower curve start (posY: -0.276)
    const journeyStartTime = ARRIVAL_HOLD_VH + BLAST_VH

    tlAbout.to(
      timelineTargets,
      {
        spread: 0.6,
        blast: 1.0,
        posX: 0.0, // center horizontally for path
        posY: -0.276, // drop to lower path height (~72% viewport height)
        duration: BLAST_VH,
        ease: 'power3.out',
      },
      ARRIVAL_HOLD_VH
    )

    // Light flash & settle during blast
    tlAbout.to(
      timelineTargets,
      {
        coreLightIntensity: 5.5,
        duration: BLAST_VH * 0.5,
        ease: 'power2.out',
      },
      ARRIVAL_HOLD_VH
    )
    tlAbout.to(
      timelineTargets,
      {
        coreLightIntensity: 2.0,
        duration: BLAST_VH * 0.5,
        ease: 'power1.inOut',
      },
      ARRIVAL_HOLD_VH + BLAST_VH * 0.5
    )

    // Phase 5: The Horizontal Journey (JOURNEY_VH: journeyStartTime to reassemblyStartTime)
    // Begins right after blast finishes; journeyProgress scrubs 0 -> 1 linearly
    tlAbout.set(
      timelineTargets,
      {
        journeyActive: true,
      },
      journeyStartTime
    )

    tlAbout.to(
      timelineTargets,
      {
        journeyProgress: 1.0,
        duration: JOURNEY_VH,
        ease: 'none',
      },
      journeyStartTime
    )

    // Phase 6: End of Journey (over 30vh * SCROLL_SLOWDOWN, scrubbed, eased easeInOutCubic / power3.inOut)
    // - Shards fade out (opacity to 0, slow drift only, no position changes depending on scroll)
    // - Path, markers, clusters, and mini-map fade out
    // - Coin glides from path position to Contact position:
    //   x about 70% of viewport width (posX: 0.20), y about 50% (posY: 0.0), scale about 2.3x
    // - Coin faces camera at end of glide, then keeps spinning
    const endTransitionStartTime = journeyStartTime + JOURNEY_VH

    tlAbout.to(
      timelineTargets,
      {
        contactTransition: 1.0,
        reassemblyProgress: 1.0,
        posX: 0.20, // 70% from left edge (0.70 - 0.50 = +0.20)
        posY: 0.0, // 50% from top (vertically centered)
        scaleMultiplier: 2.3, // scale about 2.3x
        duration: END_TRANSITION_VH,
        ease: 'power3.inOut', // easeInOutCubic
      },
      endTransitionStartTime
    )
  })

  // Refresh ScrollTrigger after layout settling, web fonts ready, and window resize
  const refreshTimer = setTimeout(() => {
    ScrollTrigger.refresh()
  }, 300)

  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh()
    })
  }

  const handleResize = () => {
    ScrollTrigger.refresh()
  }
  window.addEventListener('resize', handleResize)

  // Listen for scroll to top to reset motion state completely
  const handleScroll = () => {
    if (window.scrollY <= 1) {
      if (
        timelineTargets.blast !== 0 ||
        timelineTargets.spread !== 0 ||
        timelineTargets.journeyProgress !== 0
      ) {
        resetMotionToHeroState()
      }
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true })

  return () => {
    clearTimeout(refreshTimer)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', handleScroll)
    ctx.revert()
  }
}

/**
 * Smoothly scrolls the window to the exact pin scroll position corresponding
 * to the given station journeyProgress (0.0 to 1.0).
 * Derived directly from the scaled timeline constants.
 */
export function scrollToStationProgress(progress: number) {
  const st = ScrollTrigger.getById('aboutTrigger')
  if (st) {
    // In tlAbout: journey runs from journeyStartTime for duration JOURNEY_VH out of TOTAL_ABOUT_PIN_VH
    const journeyStartTime = ARRIVAL_HOLD_VH + BLAST_VH
    const timelineTime = journeyStartTime + progress * JOURNEY_VH
    const fraction = timelineTime / TOTAL_ABOUT_PIN_VH
    const targetScroll = st.start + fraction * (st.end - st.start)
    window.scrollTo({ top: targetScroll, behavior: 'smooth' })
    return
  }

  const aboutEl = document.getElementById('about')
  if (aboutEl) {
    const vh = (window.innerHeight || 800) / 100
    const journeyStartTime = ARRIVAL_HOLD_VH + BLAST_VH
    const targetScroll =
      aboutEl.offsetTop + vh * (journeyStartTime + progress * JOURNEY_VH)
    window.scrollTo({ top: targetScroll, behavior: 'smooth' })
  }
}
