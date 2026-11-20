import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  subscribeTransition,
  useTransitionNavigate,
  DestinationName,
} from '../hooks/useTransitionNavigate'
import { set3DRenderPaused } from '../hooks/useObjectMotion'

const COLUMNS = [0, 1, 2, 3, 4]
const EXPO_OUT = [0.16, 1, 0.3, 1] as const

export default function PageTransition() {
  const [state, setState] = useState({
    isTransitioning: false,
    destination: 'Home' as DestinationName,
    phase: 'idle' as 'idle' | 'covering' | 'holding' | 'revealing',
  })
  const { navigateWithTransition } = useTransitionNavigate()

  useEffect(() => {
    const unsub = subscribeTransition((nextState) => {
      setState(nextState)
      if (nextState.phase === 'covering' || nextState.phase === 'holding') {
        set3DRenderPaused(true)
      } else if (nextState.phase === 'revealing' || nextState.phase === 'idle') {
        set3DRenderPaused(false)
      }
    })
    return () => {
      unsub()
      set3DRenderPaused(false)
    }
  }, [])

  // Listen for browser back / forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname
      const currentHash = window.location.hash.toLowerCase()

      // Ignore hash-only changes within /projects (e.g. project rows opening/closing)
      if (currentPath === '/projects' && currentHash && !currentHash.startsWith('#contact')) {
        return
      }

      // Destination and target based on new location
      let dest: DestinationName = 'Home'
      let target: 'top' | 'about' | 'contact' = 'top'

      if (currentPath === '/projects') {
        dest = 'Work'
      } else {
        if (currentHash === '#about') {
          dest = 'About'
          target = 'about'
        } else if (currentHash === '#contact') {
          dest = 'Contact'
          target = 'contact'
        } else {
          dest = 'Home'
          target = 'top'
        }
      }

      navigateWithTransition(currentPath, { destination: dest, target, isPopState: true })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigateWithTransition])

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!state.isTransitioning) {
    return null
  }

  // 1. Reduced-motion mode: 150ms simple fade
  if (prefersReduced) {
    return (
      <div
        className="fixed inset-0 z-[9999] pointer-events-auto bg-[#140C0D] transition-opacity duration-150 flex items-center justify-center select-none"
        style={{
          opacity: state.phase === 'holding' ? 1 : 0.8,
        }}
      >
        <span className="font-mono text-xs uppercase tracking-widest text-[#E8DDD3]/50">
          // {state.destination}
        </span>
      </div>
    )
  }

  // 2. Full 5-column curtain animation
  const isCovering = state.phase === 'covering'
  const isHolding = state.phase === 'holding'
  const isRevealing = state.phase === 'revealing'

  return (
    <div
      aria-live="polite"
      aria-label={`Navigating to ${state.destination}`}
      className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden select-none"
    >
      {/* 5 Equal-Width Columns with 1px overlap to guarantee no gaps */}
      {COLUMNS.map((i) => {
        let targetY = '100%' // default below viewport

        if (isCovering || isHolding) {
          targetY = '0%'
        } else if (isRevealing) {
          targetY = '-100%'
        }

        return (
          <motion.div
            key={i}
            initial={{ y: '100%' }}
            animate={{ y: targetY }}
            transition={{
              duration: 0.55,
              delay: i * 0.07,
              ease: EXPO_OUT,
            }}
            className="absolute top-0 bottom-0 bg-[#140C0D] border-t border-[#F2C14E] will-change-transform"
            style={{
              left: `${i * 20}%`,
              width: 'calc(20% + 1px)',
            }}
          />
        )
      })}

      {/* Centered Destination Label in Phase 2 (Hold) */}
      <AnimatePresence>
        {(isCovering || isHolding) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHolding ? 1 : 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
          >
            {/* Top Mono Line */}
            <div className="font-mono text-xs sm:text-sm tracking-widest text-[#E8DDD3]/50 uppercase mb-3">
              // navigating
            </div>

            {/* Destination Name revealed from behind overflow-hidden line */}
            <div className="relative overflow-hidden px-4 py-1">
              <motion.h2
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.5, ease: EXPO_OUT }}
                className="font-heading font-extrabold text-[clamp(40px,7vw,110px)] leading-[0.9] text-[#E8DDD3] tracking-tight"
              >
                {state.destination}
              </motion.h2>

              {/* 1px Yellow Underline drawing beneath */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: EXPO_OUT }}
                className="h-[1px] bg-[#F2C14E] w-full origin-left mt-2"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
