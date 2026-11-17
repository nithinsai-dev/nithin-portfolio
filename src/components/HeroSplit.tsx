import { useState, useRef, useEffect, useCallback } from 'react'
import HeroContent from './HeroContent'
import Divider from './Divider'
import { setHeroDivider, setHeroDragging } from '../store/heroStore'
import { getObjectState, subscribeObjectMotion } from '../hooks/useObjectMotion'
import { useIsMobile } from '../hooks/useIsMobile'

export default function HeroSplit() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // Desktop (768px and up): starts and rests at 50% (0.5)
  // Mobile (< 768px): starts and rests at 88% (0.88)
  const [splitRatio, setSplitRatio] = useState<number>(() => (isMobile ? 0.88 : 0.5))

  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const isVertical = true // Vertical divider dragged left and right
  const autoSweepCancelled = useRef<boolean>(false)
  const [timelineState, setTimelineState] = useState({ dividerProgress: 0, breakerOpacity: 1 })

  // Synchronize initial ratio when device mode changes (e.g. orientation flip across 768px)
  useEffect(() => {
    if (!autoSweepCancelled.current) {
      setSplitRatio(isMobile ? 0.88 : 0.5)
    }
  }, [isMobile])

  // Listen to scroll timeline updates for divider gliding and breaker fading
  useEffect(() => {
    const unsub = subscribeObjectMotion()
    let animId: number
    const check = () => {
      const s = getObjectState()
      setTimelineState({
        dividerProgress: s.dividerProgress,
        breakerOpacity: s.breakerOpacity,
      })
      animId = requestAnimationFrame(check)
    }
    animId = requestAnimationFrame(check)
    return () => {
      unsub()
      cancelAnimationFrame(animId)
    }
  }, [])

  // Measure container dimensions
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      setContainerSize({ width: w, height: h })
    }
  }, [])

  useEffect(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [updateDimensions])

  // Intro sweep on mount:
  // Desktop: starts at 50%, sweeps to ~30%, then ~65%, then rests at 50% over ~2.1s (starting 0.4s after load).
  // Mobile: starts at 88%, sweeps to ~35%, then rests at 88% over ~1.6s (starting 0.4s after load).
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let startTime: number | null = null
    let animId: number

    const animateSweep = (timestamp: number) => {
      if (autoSweepCancelled.current) return
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime

      if (isMobile) {
        if (elapsed < 800) {
          // 0.88 -> 0.35
          const t = elapsed / 800
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          setSplitRatio(0.88 - 0.53 * ease)
        } else if (elapsed < 1600) {
          // 0.35 -> 0.88
          const t = (elapsed - 800) / 800
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          setSplitRatio(0.35 + 0.53 * ease)
        } else {
          setSplitRatio(0.88)
          return
        }
      } else {
        if (elapsed < 600) {
          // 0.5 -> 0.3
          const t = elapsed / 600
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          setSplitRatio(0.5 - 0.2 * ease)
        } else if (elapsed < 1400) {
          // 0.3 -> 0.65
          const t = (elapsed - 600) / 800
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          setSplitRatio(0.3 + 0.35 * ease)
        } else if (elapsed < 2100) {
          // 0.65 -> 0.5
          const t = (elapsed - 1400) / 700
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          setSplitRatio(0.65 - 0.15 * ease)
        } else {
          setSplitRatio(0.5)
          return
        }
      }

      animId = requestAnimationFrame(animateSweep)
    }

    const timer = setTimeout(() => {
      animId = requestAnimationFrame(animateSweep)
    }, 400)

    // Cancel sweep on first touch or pointer interaction
    const cancelSweep = () => {
      autoSweepCancelled.current = true
    }
    window.addEventListener('touchstart', cancelSweep, { passive: true, once: true })
    window.addEventListener('pointerdown', cancelSweep, { passive: true, once: true })

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(animId)
      window.removeEventListener('touchstart', cancelSweep)
      window.removeEventListener('pointerdown', cancelSweep)
    }
  }, [isMobile])

  // Dragging interaction (horizontal only)
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return
      autoSweepCancelled.current = true

      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width

      // Clamp between 5% and 95%
      setSplitRatio(Math.max(0.05, Math.min(0.95, ratio)))
    },
    [isDragging]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  const onStartDrag = () => {
    autoSweepCancelled.current = true
    setIsDragging(true)
  }

  // Calculate base pixel position from user splitRatio
  const baseX = Math.round(splitRatio * (containerSize.width || 1200))
  const baseY = Math.round(0.5 * (containerSize.height || 800))

  // Effective coordinates accounting for scroll timeline glide (dividerProgress: 0 -> 1)
  const x = Math.round(
    baseX + ((containerSize.width || 1200) - baseX) * timelineState.dividerProgress
  )

  // Sync divider coordinates and hero container bounds with shared store
  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect() || null
    setHeroDivider(x, baseY, isVertical, rect)
  }, [x, baseY, isVertical])

  useEffect(() => {
    setHeroDragging(isDragging)
  }, [isDragging])

  // Divider is mounted only while in hero and active.
  const isDividerMounted =
    timelineState.breakerOpacity > 0.01 && timelineState.dividerProgress < 0.98

  useEffect(() => {
    if (!isDividerMounted && isDragging) {
      setIsDragging(false)
    }
  }, [isDividerMounted, isDragging])

  // Exact clipping:
  // Builder: inset(0 calc(100% - ${x}px) 0 0) (visible LEFT of the divider)
  // Breaker: inset(0 0 0 ${x}px) (visible RIGHT)
  const builderClipPath =
    timelineState.dividerProgress >= 0.98
      ? undefined
      : `inset(0 calc(100% - ${x}px) 0 0)`

  const breakerClipPath = `inset(0 0 0 ${x}px)`

  return (
    <section
      id="home"
      ref={containerRef}
      aria-label="Hero Section"
      className="relative w-full h-[100svh] md:h-screen md:h-[100dvh] overflow-hidden bg-transparent select-none touch-pan-y"
      style={{ touchAction: 'pan-y' }}
    >
      {/* 1. BUILDER LAYER WRAPPER
          isolation: isolate with z-index: 0 so nothing inside can draw above breaker layer.
          Clipped to be visible strictly left of the divider. */}
      <div
        className="absolute inset-0 w-full h-full bg-transparent will-change-[clip-path]"
        style={{
          isolation: 'isolate',
          zIndex: 0,
          clipPath: builderClipPath,
          WebkitClipPath: builderClipPath,
        }}
      >
        <HeroContent mode="builder" />
      </div>

      {/* 2. BREAKER LAYER WRAPPER
          isolation: isolate with z-index: 1.
          Clipped to be visible strictly right of the divider.
          Fades out and unmounts/hides via breakerOpacity as user scrolls into About. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 w-full h-full bg-transparent pointer-events-none will-change-[clip-path,opacity] transition-opacity duration-75"
        style={{
          isolation: 'isolate',
          zIndex: 1,
          clipPath: breakerClipPath,
          WebkitClipPath: breakerClipPath,
          opacity: timelineState.breakerOpacity,
          display: timelineState.breakerOpacity <= 0.01 ? 'none' : 'block',
        }}
      >
        <HeroContent mode="breaker" />
      </div>

      {/* 3. DIVIDER
          Vertical 1.5px yellow line + round handle in the middle.
          Unmounted once hero is left, remounts at identical position when scrolling back up. */}
      {isDividerMounted && (
        <Divider
          positionPx={x}
          maxPx={containerSize.width}
          opacity={timelineState.breakerOpacity}
          onMove={(newPx) => {
            autoSweepCancelled.current = true
            const max = containerSize.width
            if (max > 0) {
              setSplitRatio(Math.max(0.05, Math.min(0.95, newPx / max)))
            }
          }}
          onStartDrag={onStartDrag}
          onEndDrag={() => setIsDragging(false)}
        />
      )}
    </section>
  )
}
