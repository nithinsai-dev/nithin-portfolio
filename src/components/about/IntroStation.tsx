import { useMemo } from 'react'
import { aboutContent } from '../../content/about'
import { getObjectState } from '../../hooks/useObjectMotion'
import { STATIONS_CONFIG } from '../../lib/journeyPath'

interface IntroStationProps {
  journeyProgress: number
  isVisible: boolean
  isMobile?: boolean
}

export default function IntroStation({
  journeyProgress,
  isVisible,
  isMobile = false,
}: IntroStationProps) {
  const words = useMemo(() => aboutContent.intro.statement.split(' '), [])
  const s = getObjectState()

  // Keep text hidden (opacity 0) until the blast is at least 85% complete,
  // so it never overlaps the shards in flight
  const blastReady = isVisible && (isMobile || s.blast >= 0.85 || journeyProgress > 0.005)

  // Reveal range compressed: paragraph reveal must complete within the first ~35-40% of ABOUT's scroll range
  // then HOLD at 100% white for the rest of the time on screen.
  // Starts earlier during the sphere-to-about transition (s.blast >= 0.85).
  const uBuild = STATIONS_CONFIG[1]?.progress || 0.20
  const revealThreshold = uBuild * 0.36

  let fillRatio = 1.0
  if (!isMobile) {
    if (journeyProgress >= revealThreshold) {
      fillRatio = 1.0 // Hold at 100% white
    } else {
      const blastFactor = Math.min(1.0, Math.max(0, (s.blast - 0.85) / 0.15))
      const journeyFactor = Math.min(1.0, Math.max(0, journeyProgress / revealThreshold))
      fillRatio = Math.min(1.0, Math.max(0.35, blastFactor * 0.40 + journeyFactor * 0.60))
    }
  }

  // All 4 value cards must be fully visible and fully lit by the time the paragraph finishes,
  // then stay lit until the section exits.
  const isCardsFullyLit = isMobile || blastReady || journeyProgress >= revealThreshold

  return (
    <div
      className="flex flex-col gap-4 w-full transition-opacity duration-300"
      style={{
        opacity: blastReady ? 1 : 0,
        pointerEvents: blastReady ? 'auto' : 'none',
      }}
    >
      {/* Statement: responsive typography with smooth word fill */}
      <h3 className="font-heading font-medium sm:font-semibold text-[clamp(16px,1.4vw,22px)] leading-[1.35] tracking-tight max-w-[52rem]">
        {words.map((word, i) => {
          const isFilled = isMobile || i / words.length <= fillRatio
          return (
            <span
              key={`${word}-${i}`}
              className={`transition-colors duration-150 inline-block mr-[0.26em] ${
                isFilled ? 'text-[#E8DDD3]' : 'text-[#5A4A47]'
              }`}
            >
              {word}
            </span>
          )
        })}
      </h3>

      {/* Dedicated 4 Values Panel: 2x2 grid on desktop, stacked on mobile */}
      <div className="w-full mt-1">
        <div className="font-mono text-[11px] sm:text-xs text-[#F2C14E] uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E]" />
          <span>Core Values</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full">
          {aboutContent.intro.values.map((v, i) => (
            <div
              key={v.number}
              className="relative z-20 flex flex-col gap-1 p-3 sm:p-3.5 rounded-lg bg-[#201415]/90 backdrop-blur-md border border-[#F2C14E]/20 shadow-md shadow-black/40 hover:border-[#F2C14E]/40 transition-colors"
              style={{
                opacity: isCardsFullyLit ? 1 : 0,
                transform: isCardsFullyLit ? 'translateY(0)' : 'translateY(16px)',
                transition:
                  journeyProgress >= 0.09 || isMobile
                    ? 'border-color 0.15s'
                    : `opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms, border-color 0.15s`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#F2C14E] font-medium">{v.number}</span>
                <span className="font-heading font-semibold text-sm sm:text-[15px] text-[#E8DDD3] tracking-tight">
                  {v.title}
                </span>
              </div>
              <p className="font-sans text-xs sm:text-[13px] text-[#E8DDD3]/90 leading-relaxed pl-5">
                {v.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
