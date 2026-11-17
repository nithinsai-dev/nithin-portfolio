import { aboutContent } from '../../content/about'

interface LifeStationProps {
  isVisible: boolean
  isMobile?: boolean
}

export default function LifeStation({ isVisible, isMobile = false }: LifeStationProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Off-screen interest rows with hairlines */}
      <div className="flex flex-col gap-2.5">
        {aboutContent.offScreenEducation.items.map((item, i) => (
          <div
            key={item.name}
            className="flex flex-col gap-2 transition-all duration-500 ease-out"
            style={{
              opacity: isVisible || isMobile ? 1 : 0,
              transform: isVisible || isMobile ? 'translateY(0)' : 'translateY(10px)',
              transitionDelay: `${i * 70}ms`,
            }}
          >
            {/* Hairline drawing from left to right */}
            <div className="w-full h-px bg-[#201415] overflow-hidden">
              <div
                className="w-full h-full bg-[#E8DDD3]/20 origin-left transition-transform duration-700 ease-out"
                style={{
                  transform: isVisible || isMobile ? 'scaleX(1)' : 'scaleX(0)',
                  transitionDelay: `${i * 70}ms`,
                }}
              />
            </div>

            {/* Name on left, description on right */}
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="font-heading font-bold text-base sm:text-lg text-[#E8DDD3]">
                {item.name}
              </span>
              <span className="font-sans text-[clamp(15px,1.05vw,18px)] text-[#E8DDD3]/80">
                {item.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Hairline before education line */}
      <div className="w-full h-px bg-[#201415] overflow-hidden mt-2">
        <div
          className="w-full h-full bg-[#E8DDD3]/20 origin-left transition-transform duration-700 ease-out"
          style={{
            transform: isVisible || isMobile ? 'scaleX(1)' : 'scaleX(0)',
            transitionDelay: '300ms',
          }}
        />
      </div>

      {/* Quiet education line */}
      <p className="pt-2 font-mono text-xs sm:text-sm text-[#E8DDD3]/60 leading-relaxed">
        {aboutContent.offScreenEducation.education}
      </p>
    </div>
  )
}
