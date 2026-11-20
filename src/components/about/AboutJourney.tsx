import { useState, useEffect, useRef } from 'react'
import {
  STATIONS_CONFIG,
  getJourneyDimensions,
} from '../../lib/journeyPath'
import { useJourneyProgress } from '../../hooks/useJourneyProgress'
import { is3DAllowed } from '../../hooks/useDeviceCapabilities'
import JourneyPanel from './JourneyPanel'
import JourneyMiniMap from './JourneyMiniMap'

export default function AboutJourney() {
  const containerRef = useRef<HTMLElement>(null)
  const { progress, isHintVisible } = useJourneyProgress()
  const [isFallback, setIsFallback] = useState<boolean>(() => !is3DAllowed())
  const [dimensions, setDimensions] = useState(getJourneyDimensions())

  // Detect mobile screens (<768px), low-end devices, reduced-motion, and window resizes
  useEffect(() => {
    const checkFallback = () => {
      setIsFallback(!is3DAllowed())
      setDimensions(getJourneyDimensions())
    }
    checkFallback()
    window.addEventListener('resize', checkFallback)
    return () => window.removeEventListener('resize', checkFallback)
  }, [])

  const { winW, stationSpacingPx, totalTravelPx } = dimensions

  // 1. MOBILE / REDUCED-MOTION FALLBACK: Vertical Stack of Panels (No pin, no 3D, no mini-map)
  if (isFallback) {
    return (
      <section
        id="about"
        ref={containerRef}
        aria-label="About Section - Stations"
        className="relative w-full bg-[#140C0D] text-[#E8DDD3] py-24 px-6 sm:px-12 flex flex-col gap-12 z-10"
      >
        <div className="max-w-2xl mx-auto w-full flex flex-col">
          <div className="font-mono text-xs text-[#F2C14E] tracking-widest uppercase mb-8">
            // journey · {STATIONS_CONFIG.length} stations
          </div>
          {STATIONS_CONFIG.map((station) => (
            <JourneyPanel
              key={station.id}
              station={station}
              journeyProgress={0}
              stationXPx={0}
              totalTravelPx={0}
              isMobileStack={true}
            />
          ))}
        </div>
      </section>
    )
  }

  // 2. DESKTOP PINNED HORIZONTAL JOURNEY
  // Translates the HTML world across the 5 stations with transform: translate3d
  const worldTranslateX = -progress * totalTravelPx

  return (
    <section
      id="about"
      ref={containerRef}
      aria-label="About Section - Horizontal Journey"
      className="relative w-full h-screen h-[100dvh] overflow-hidden bg-transparent select-none z-10"
    >
      {/* HTML World: Translates horizontally in sync with 3D world */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform pointer-events-none z-20"
        style={{
          transform: `translate3d(${worldTranslateX}px, 0, 0)`,
        }}
      >
        {STATIONS_CONFIG.map((station, idx) => {
          // Station 1 aligns with screen center (winW / 2) at progress 0
          const stationXPx = winW / 2 + idx * stationSpacingPx
          return (
            <JourneyPanel
              key={station.id}
              station={station}
              journeyProgress={progress}
              stationXPx={stationXPx}
              totalTravelPx={totalTravelPx}
              isMobileStack={false}
            />
          )
        })}
      </div>

      {/* Fixed Journey Mini-map (Desktop only, active during journey) */}
      <JourneyMiniMap />

      {/* "Scroll to explore" Hint at start of journey */}
      <div
        aria-hidden="true"
        className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2.5 font-mono text-xs text-[#E8DDD3]/70 tracking-widest uppercase transition-opacity duration-500 pointer-events-none z-20"
        style={{
          opacity: isHintVisible ? 1 : 0,
        }}
      >
        <span className="text-[#F2C14E]" aria-hidden="true">↓</span>
        <span>scroll to explore</span>
        <span className="text-[#F2C14E]" aria-hidden="true">→</span>
      </div>
    </section>
  )
}
