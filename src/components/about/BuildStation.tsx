import { aboutContent } from '../../content/about'

interface BuildStationProps {
  isVisible: boolean
  isMobile?: boolean
}

export default function BuildStation({ isVisible, isMobile = false }: BuildStationProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-3">
        {aboutContent.buildPillars.pillars.map((pillar, i) => (
          <div
            key={pillar.number}
            className="flex flex-col gap-2 transition-all duration-500 ease-out"
            style={{
              opacity: isVisible || isMobile ? 1 : 0,
              transform: isVisible || isMobile ? 'translateY(0)' : 'translateY(12px)',
              transitionDelay: `${i * 80}ms`,
            }}
          >
            {/* Hairline drawing from left to right */}
            <div className="w-full h-px bg-[#201415] overflow-hidden">
              <div
                className="w-full h-full bg-[#E8DDD3]/20 origin-left transition-transform duration-700 ease-out"
                style={{
                  transform: isVisible || isMobile ? 'scaleX(1)' : 'scaleX(0)',
                  transitionDelay: `${i * 80}ms`,
                }}
              />
            </div>

            {/* Row: mono number, large heading, one line to the right */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6 pt-1">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs sm:text-sm text-[#F2C14E]">{pillar.number}</span>
                <h4 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#E8DDD3] tracking-tight">
                  {pillar.title}
                </h4>
              </div>
              <p className="font-sans text-[clamp(15px,1.05vw,18px)] text-[#E8DDD3]/80 max-w-sm sm:text-right leading-relaxed">
                {pillar.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Hairline before closing line */}
      <div className="w-full h-px bg-[#201415] overflow-hidden mt-1">
        <div
          className="w-full h-full bg-[#E8DDD3]/20 origin-left transition-transform duration-700 ease-out"
          style={{
            transform: isVisible || isMobile ? 'scaleX(1)' : 'scaleX(0)',
            transitionDelay: '260ms',
          }}
        />
      </div>

      {/* Closing line in mono */}
      <div className="font-mono text-xs sm:text-sm text-[#E8DDD3]/60">
        {aboutContent.buildPillars.closing}
      </div>
    </div>
  )
}
