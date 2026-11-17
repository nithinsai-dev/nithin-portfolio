import { useMemo } from 'react'
import { ValueItem } from '../../content/about'
import { getCachedJourneyCurve, getUnitsPerPixel } from '../../lib/journeyPath'
import { getObjectState } from '../../hooks/useObjectMotion'

interface WaypointTagProps {
  value: ValueItem
  progressU: number // 0.05, 0.10, 0.15, 0.20
  journeyProgress: number
  totalTravelPx: number
  winW: number
  winH: number
}

export default function WaypointTag({
  value,
  progressU,
  journeyProgress,
  totalTravelPx,
  winW,
  winH,
}: WaypointTagProps) {
  const { curve } = useMemo(() => getCachedJourneyCurve(), [])
  const unitsPerPx = useMemo(() => getUnitsPerPixel(), [])
  const s = getObjectState()

  // 1. Attach to path: compute tag's exact vertical position from path curve at progressU
  // using identical px-to-3D mapping as stations
  const { xWorld, pathYPx } = useMemo(() => {
    const pt = curve.getPoint(Math.max(0, Math.min(1, progressU)))
    const x = winW / 2 + progressU * totalTravelPx
    const yPx = winH / 2 - pt.y / unitsPerPx
    return { xWorld: x, pathYPx: yPx }
  }, [curve, progressU, totalTravelPx, unitsPerPx, winW, winH])

  // Screen distance from coin (coin is at screen center)
  const distFromCoin = (progressU - journeyProgress) * totalTravelPx
  const normDist = distFromCoin / (winW || 1200)

  // 2. Fade rule:
  // - Fades in as coin approaches (about 40% of screen away)
  // - Stays at about 55% opacity after coin passes it
  let tagOpacity = 0
  if (normDist >= 0.40) {
    tagOpacity = 0
  } else if (normDist >= 0) {
    // Approaching: smoothstep from 0 to 1.0
    const t = (0.40 - normDist) / 0.40
    tagOpacity = t * t * (3 - 2 * t)
  } else {
    // Passed: smoothly settle from 1.0 to 0.55, then stay at 0.55
    const t = Math.min(1.0, -normDist / 0.12)
    tagOpacity = 1.0 * (1 - t) + 0.55 * t
  }

  // Next station (Station 2 at u = 0.25) panel visibility check:
  // "fades to 0 once the NEXT station's panel is more than 30% visible"
  const station2Dist = (0.25 - journeyProgress) * totalTravelPx
  const s2NormDist = Math.abs(station2Dist) / (winW || 1200)
  let s2PanelVisibility = 0
  if (s2NormDist < 0.90) {
    if (s2NormDist <= 0.55) {
      s2PanelVisibility = 1.0
    } else {
      const t = (s2NormDist - 0.55) / 0.35
      s2PanelVisibility = 1.0 - t * t * (3 - 2 * t)
    }
  }

  if (s2PanelVisibility >= 0.30) {
    tagOpacity = 0
  } else if (s2PanelVisibility > 0) {
    tagOpacity *= Math.max(0, 1.0 - s2PanelVisibility / 0.30)
  }

  // Fade out over last 6% of journey (progress >= 0.94)
  if (journeyProgress >= 0.94) {
    const endFade = Math.max(0, 1.0 - (journeyProgress - 0.94) / 0.06)
    tagOpacity *= endFade
  }

  // Keep hidden while shards are in flight during blast (< 85% blast)
  if (s.blast < 0.85 && journeyProgress <= 0.001) {
    tagOpacity = 0
  }

  // 2.5vh in pixels (height above path)
  const gap2_5vh = winH * 0.025

  return (
    <div
      aria-hidden="true"
      className="absolute pointer-events-none select-none transition-opacity duration-150"
      style={{
        left: `${xWorld}px`,
        top: `${pathYPx}px`,
        opacity: tagOpacity,
        visibility: tagOpacity <= 0.01 ? 'hidden' : 'visible',
      }}
    >
      {/* Short vertical tick crossing the line (height 18px, from -9px to +9px) */}
      <div
        className="absolute w-[1.5px] h-[18px] bg-[#F2C14E] -translate-x-1/2 -translate-y-1/2"
        style={{ left: 0, top: 0 }}
      />

      {/* Small dot exactly ON the line */}
      <div
        className="absolute w-[5px] h-[5px] rounded-full bg-[#F2C14E] shadow-[0_0_6px_rgba(242,193,78,0.8)] -translate-x-1/2 -translate-y-1/2"
        style={{ left: 0, top: 0 }}
      />

      {/* Thin connector hairline from tick top to bottom edge of card (from -9px up to -2.5vh) */}
      <div
        className="absolute w-px bg-[#F2C14E]/40 -translate-x-1/2"
        style={{
          left: 0,
          bottom: '9px',
          height: `${Math.max(0, gap2_5vh - 9)}px`,
        }}
      />

      {/* Tag Card:
          Sits ABOVE its tick with bottom edge 2.5vh above the path.
          Compact: width: max-content; min-width 15rem; max-width 22rem;
          mono number + bold title (16px) on one line,
          the one-line description (14px) under it, allowing at most 2 lines. */}
      <div
        className="absolute -translate-x-1/2 flex flex-col gap-1 px-3.5 py-2.5 rounded-lg bg-[#201415]/95 border border-[#E8DDD3]/20 shadow-lg shadow-black/50 backdrop-blur-md w-max min-w-[15rem] max-w-[22rem]"
        style={{
          left: 0,
          bottom: `${gap2_5vh}px`,
        }}
      >
        {/* Line 1: mono number + bold title (16px) */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-mono text-xs text-[#F2C14E]">{value.number}</span>
          <span className="font-heading font-bold text-base text-[#E8DDD3] tracking-tight">
            {value.title}
          </span>
        </div>

        {/* Line 2: one-line description (14px) under it, allowing at most 2 lines. Never one word per line */}
        <p className="font-sans text-sm text-[#E8DDD3]/80 leading-snug line-clamp-2">
          {value.description}
        </p>
      </div>
    </div>
  )
}
