import { STATIONS_CONFIG } from '../../lib/journeyPath'
import { useJourneyProgress } from '../../hooks/useJourneyProgress'

export default function JourneyMiniMap() {
  const { progress, activeStationIndex, journeyActive, contactFade } = useJourneyProgress()

  const handleStationClick = (targetProgress: number) => {
    import('../../lib/scrollTimeline').then((m) => {
      m.scrollToStationProgress(targetProgress)
    })
  }

  // Requirement: Fade out over the last part of the journey or as Contact transition begins
  const stationFade = progress >= 0.94 ? Math.max(0, 1.0 - (progress - 0.94) / 0.06) : 1.0
  const endFade = stationFade * (contactFade !== undefined ? contactFade : 1.0)
  const isVisible = journeyActive && endFade > 0.01
  const mapOpacity = journeyActive ? endFade : 0

  return (
    <nav
      aria-label="Journey Mini-map"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none transition-opacity duration-200"
      style={{
        opacity: mapOpacity,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div className="relative flex items-center gap-7 sm:gap-9 px-5 py-2 rounded-full bg-[#140C0D]/90 border border-[#E8DDD3]/20 backdrop-blur-md shadow-lg shadow-black/40">
        {/* Continuous Connecting Line Behind Nodes */}
        <div
          aria-hidden="true"
          className="absolute left-7 right-7 top-[15px] h-[2px] bg-[#E8DDD3]/20 -z-0 rounded-full overflow-hidden"
        >
          {/* Gold fill line advancing with journeyProgress */}
          <div
            className="h-full bg-[#F2C14E] transition-[width] duration-150 ease-out origin-left rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          />
        </div>

        {/* 5 Station Interactive Nodes */}
        {STATIONS_CONFIG.map((station, idx) => {
          const isCurrent = activeStationIndex === idx
          const isPassed = !isCurrent && progress > station.progress

          return (
            <button
              key={station.id}
              type="button"
              onClick={() => handleStationClick(station.progress)}
              aria-label={`Go to ${station.shortLabel} station`}
              aria-current={isCurrent ? 'step' : undefined}
              className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer focus-visible:outline-none"
            >
              {/* Node indicator */}
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 flex items-center justify-center group-focus-visible:ring-2 group-focus-visible:ring-[#F2C14E] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#140C0D] group-hover:scale-110 ${
                  isCurrent
                    ? 'border-2 border-[#F2C14E] bg-[#140C0D] ring-2 ring-[#F2C14E]/60 animate-pulse'
                    : isPassed
                    ? 'bg-[#F2C14E] border border-[#F2C14E]'
                    : 'bg-transparent border border-dashed border-[#E8DDD3]/40 group-hover:border-[#F2C14E]'
                }`}
              >
                {/* Tiny center dot for current station */}
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E]" />}
              </div>

              {/* Station mono label */}
              <span
                className={`font-mono text-[10px] tracking-wider uppercase transition-colors duration-150 ${
                  isCurrent
                    ? 'text-[#F2C14E] font-bold'
                    : isPassed
                    ? 'text-[#E8DDD3]'
                    : 'text-[#E8DDD3]/50 group-hover:text-[#E8DDD3]'
                }`}
              >
                {station.shortLabel}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
