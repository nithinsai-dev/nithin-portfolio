import { aboutContent } from '../../content/about'

interface NowNextStationProps {
  isVisible: boolean
  isMobile?: boolean
}

export default function NowNextStation({ isVisible, isMobile = false }: NowNextStationProps) {
  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* 1. NOW: Solid Chips */}
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-xs text-[#F2C14E] uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E]" />
          <span>Now · Active focus</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {aboutContent.nowNext.nowSkills.map((skill, i) => (
            <span
              key={skill}
              data-chip="true"
              data-cursor="pointer"
              tabIndex={0}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] sm:text-[13px] font-mono text-[#E8DDD3] bg-[#201415] border border-[#E8DDD3]/15 hover:border-[#F2C14E] hover:-translate-y-0.5 focus-visible:border-[#F2C14E] focus-visible:outline-none transition-all duration-150 cursor-pointer select-none"
              style={{
                opacity: isVisible || isMobile ? 1 : 0,
                transform: isVisible || isMobile ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity 0.4s ease ${i * 35}ms, transform 0.4s ease ${i * 35}ms, border-color 0.15s, transform 0.15s`,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* 2. NEXT: Dashed Outline Chips */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="font-mono text-xs text-[#E8DDD3]/70 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full border border-dashed border-[#E8DDD3]/70" />
          <span>Next · Roadmap</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {aboutContent.nowNext.nextSkills.map((skill, i) => (
            <span
              key={skill}
              data-chip="true"
              data-cursor="pointer"
              tabIndex={0}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] sm:text-[13px] font-mono text-[#E8DDD3]/80 bg-transparent border border-dashed border-[#E8DDD3]/40 hover:border-[#F2C14E] hover:-translate-y-0.5 focus-visible:border-[#F2C14E] focus-visible:outline-none transition-all duration-150 cursor-pointer select-none"
              style={{
                opacity: isVisible || isMobile ? 1 : 0,
                transform: isVisible || isMobile ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity 0.4s ease ${280 + i * 35}ms, transform 0.4s ease ${280 + i * 35}ms, border-color 0.15s, transform 0.15s`,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Tiny Legend in Mono */}
      <div className="pt-0.5 font-mono text-xs text-[#E8DDD3]/50">
        {aboutContent.nowNext.legend}
      </div>
    </div>
  )
}
