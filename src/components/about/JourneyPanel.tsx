import { StationConfig, STATIONS_CONFIG } from '../../lib/journeyPath'
import { getObjectState } from '../../hooks/useObjectMotion'
import Reveal from '../Reveal'
import IntroStation from './IntroStation'
import BuildStation from './BuildStation'
import NowNextStation from './NowNextStation'
import SkillsStation from './SkillsStation'
import LifeStation from './LifeStation'

interface JourneyPanelProps {
  station: StationConfig
  journeyProgress: number
  stationXPx: number
  totalTravelPx: number
  isMobileStack?: boolean
}

function renderStationBody(
  stationId: number,
  isVisible: boolean,
  isMobile: boolean,
  journeyProgress: number
) {
  switch (stationId) {
    case 1:
      return (
        <IntroStation
          journeyProgress={journeyProgress}
          isVisible={isVisible}
          isMobile={isMobile}
        />
      )
    case 2:
      return <BuildStation isVisible={isVisible} isMobile={isMobile} />
    case 3:
      return <NowNextStation isVisible={isVisible} isMobile={isMobile} />
    case 4:
      return <SkillsStation isVisible={isVisible} isMobile={isMobile} />
    case 5:
      return <LifeStation isVisible={isVisible} isMobile={isMobile} />
    default:
      return null
  }
}

export default function JourneyPanel({
  station,
  journeyProgress,
  stationXPx,
  totalTravelPx,
  isMobileStack = false,
}: JourneyPanelProps) {
  const s = getObjectState()

  // 1. MOBILE VERTICAL STACK MODE
  if (isMobileStack) {
    return (
      <article
        aria-label={station.label}
        className="w-full max-w-2xl py-12 border-b border-[#201415] last:border-none flex flex-col gap-3"
      >
        <Reveal delay={0}>
          <div className="font-mono text-xs sm:text-sm text-[#F2C14E] tracking-widest uppercase mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E]" />
            <span>{station.label}</span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {renderStationBody(station.id, true, true, 1.0)}
        </Reveal>
      </article>
    )
  }

  // 2. DESKTOP PINNED HORIZONTAL JOURNEY MODE
  const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  // Distance from screen center (coin is at screen center winWidth / 2)
  const currentWorldShift = journeyProgress * totalTravelPx
  const screenDist = (stationXPx - currentWorldShift) - (winWidth / 2)

  const normDist = Math.abs(screenDist) / (winWidth || 1200)

  let opacity = 0
  let stationOffsetPx = 0
  let slideX = 0

  if (station.id === 1) {
    // Station 1 (ABOUT) Scroll Behavior:
    // Scroll range: journeyProgress 0.0 to uBuild (to BUILD)
    // 1. Reveal Range: centered & static at screen center, opacity = 1.0.
    // 2. Hold Period: stays 100% lit and static at screen center, opacity = 1.0.
    // 3. Exit Pan/Fade: only begins after hold period, panning out to the left and fading to 0.
    const uBuild = STATIONS_CONFIG[1]?.progress || 0.25
    const holdEnd = uBuild * 0.65
    if (journeyProgress <= holdEnd) {
      // Counter world shift so Station 1 stays completely static at screen center
      stationOffsetPx = currentWorldShift
      opacity = 1.0
      slideX = 0
    } else if (journeyProgress < uBuild) {
      // Exit pan/fade to BUILD over journeyProgress holdEnd to uBuild
      const tExit = (journeyProgress - holdEnd) / (uBuild - holdEnd) // 0 to 1
      const smoothExit = tExit * tExit * (3 - 2 * tExit)
      // Pan left toward BUILD
      stationOffsetPx = (holdEnd * totalTravelPx) * (1 - tExit)
      opacity = 1.0 - smoothExit
      slideX = Math.max(-24, Math.min(24, -tExit * 24))
    } else {
      opacity = 0
      stationOffsetPx = 0
      slideX = -24
    }

    // Keep Station 1 hidden until blast is at least 85% complete when arriving from hero
    if (s.blast < 0.85 && journeyProgress <= 0.001) {
      opacity = 0
    }
  } else {
    // Other stations (BUILD, WORK, NOW, SKILLS, LIFE): 100% UNTOUCHED
    if (normDist < 0.90) {
      if (normDist <= 0.55) {
        opacity = 1.0
      } else {
        const t = (normDist - 0.55) / 0.35 // 0 to 1
        opacity = 1.0 - t * t * (3 - 2 * t) // smoothstep to 0.0
      }
    } else {
      opacity = 0
    }
    slideX = Math.max(-24, Math.min(24, -screenDist * 0.035))
  }

  // Smoothly fade panels out during end transition before section unpins
  // so Station 5 stays fully visible until the transition begins
  const transitionP = s.contactTransition !== undefined ? s.contactTransition : (s.reassemblyProgress || 0)
  if (transitionP > 0) {
    const transitionFade = Math.max(0, 1.0 - transitionP / 0.35)
    opacity *= transitionFade
  }

  const isVisible = opacity > 0.4

  return (
    <article
      aria-label={station.label}
      tabIndex={opacity > 0.05 ? 0 : -1}
      className="absolute top-[6vh] w-[min(70vw,980px)] max-h-[58vh] select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] flex flex-col gap-2.5"
      style={{
        left: `${stationXPx}px`,
        transform: `translate3d(calc(-50% + ${(slideX + stationOffsetPx).toFixed(2)}px), 0, 0)`,
        opacity,
        visibility: opacity <= 0.01 ? 'hidden' : 'visible',
        pointerEvents: opacity <= 0.05 ? 'none' : 'auto',
        willChange: 'transform, opacity',
        transition: 'opacity 0.1s linear',
      }}
    >
      {/* Mono label */}
      <div className="font-mono text-xs sm:text-sm text-[#F2C14E] tracking-widest uppercase mb-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E]" />
        <span>{station.label}</span>
      </div>

      {/* Station Specific Real Content */}
      {renderStationBody(station.id, isVisible, false, journeyProgress)}
    </article>
  )
}
