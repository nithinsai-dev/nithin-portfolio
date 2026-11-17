import { aboutContent } from '../../content/about'

interface SkillsStationProps {
  isVisible: boolean
  isMobile?: boolean
}

export default function SkillsStation({ isVisible, isMobile = false }: SkillsStationProps) {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* 5 skill groups arranged in balanced 3-column grid with Frameworks spanning 2 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {aboutContent.skills.groups.map((grp, gIdx) => {
          const isFrameworks = grp.name === 'Frameworks'
          return (
            <div
              key={grp.name}
              className={`group flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-lg bg-[#201415]/85 border border-[#E8DDD3]/10 hover:border-[#F2C14E]/40 transition-all duration-200 ${
                isFrameworks ? 'sm:col-span-2' : ''
              }`}
              style={{
                opacity: isVisible || isMobile ? 1 : 0,
                transform: isVisible || isMobile ? 'translateY(0)' : 'translateY(10px)',
                transitionDelay: `${gIdx * 50}ms`,
              }}
            >
              {/* Group Header */}
              <div className="font-mono text-xs text-[#F2C14E] tracking-wider uppercase flex items-center justify-between">
                <span>{grp.name}</span>
                <span className="text-[11px] text-[#E8DDD3]/40 font-mono">
                  {grp.skills.length}
                </span>
              </div>

              {/* Chips: If a skill group is hovered, its chips get a thin yellow border */}
              <div className="flex flex-wrap gap-1.5">
                {grp.skills.map((skill) => (
                  <span
                    key={skill}
                    data-chip="true"
                    data-cursor="pointer"
                    tabIndex={0}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[12px] sm:text-[13px] font-mono text-[#E8DDD3]/90 bg-[#140C0D] border border-[#E8DDD3]/15 group-hover:border-[#F2C14E] hover:border-[#F2C14E] hover:-translate-y-0.5 focus-visible:border-[#F2C14E] focus-visible:outline-none transition-all duration-150 cursor-pointer select-none"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
