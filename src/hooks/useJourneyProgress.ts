import { useState, useEffect } from 'react'
import { getObjectState, subscribeObjectMotion } from './useObjectMotion'
import { STATIONS_CONFIG } from '../lib/journeyPath'

export interface JourneyProgressState {
  progress: number // 0.0 to 1.0
  activeStationIndex: number // 0 to 4
  isHintVisible: boolean // true when progress < 0.02
  journeyActive: boolean
  contactFade: number // 1.0 in journey -> 0.0 at end of journey
}

export function useJourneyProgress(): JourneyProgressState {
  const [state, setState] = useState<JourneyProgressState>({
    progress: 0,
    activeStationIndex: 0,
    isHintVisible: true,
    journeyActive: false,
    contactFade: 1.0,
  })

  useEffect(() => {
    const unsub = subscribeObjectMotion()
    let animId: number

    const check = () => {
      const s = getObjectState()
      const p = Math.max(0, Math.min(1, s.journeyProgress))
      const transitionP = s.contactTransition !== undefined ? s.contactTransition : (s.reassemblyProgress || 0)
      const cFade = Math.max(0, 1.0 - transitionP)

      // Identify closest station
      let activeIdx = 0
      let minDiff = 999
      for (let i = 0; i < STATIONS_CONFIG.length; i++) {
        const diff = Math.abs(p - STATIONS_CONFIG[i].progress)
        if (diff < minDiff) {
          minDiff = diff
          activeIdx = i
        }
      }

      setState((prev) => {
        if (
          Math.abs(prev.progress - p) < 0.0001 &&
          prev.activeStationIndex === activeIdx &&
          prev.isHintVisible === (p < 0.02 && s.journeyActive) &&
          prev.journeyActive === (s.journeyActive && s.opacity > 0.1 && cFade > 0.01) &&
          Math.abs(prev.contactFade - cFade) < 0.0001
        ) {
          return prev
        }
        return {
          progress: p,
          activeStationIndex: activeIdx,
          isHintVisible: p < 0.02 && s.journeyActive,
          journeyActive: s.journeyActive && s.opacity > 0.1 && cFade > 0.01,
          contactFade: cFade,
        }
      })

      animId = requestAnimationFrame(check)
    }

    animId = requestAnimationFrame(check)

    return () => {
      unsub()
      cancelAnimationFrame(animId)
    }
  }, [])

  return state
}
