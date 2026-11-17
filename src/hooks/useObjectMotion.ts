import { useEffect, useState } from 'react'
import { getJourneyCurveEvaluation } from '../lib/journeyPath'

export interface StageObjectState {
  // Positioning normalized to Three.js viewport
  posX: number // 0.10 in hero -> 0.12 in About -> 0.0 in Journey
  posY: number // 0.08 in hero -> 0.0 in About -> follows curve in Journey
  scaleMultiplier: number // 1.0 -> 1.25
  spread: number // 0 -> 0.6
  blast: number // 0 -> 1.0 (outward 2 to 7 units)
  driftTime: number
  opacity: number
  coreLightIntensity: number // 2.2 -> 5.5 -> 2.0
  dividerProgress: number // 0 -> 1 (glides divider to right edge)
  breakerOpacity: number // 1 -> 0
  isWireMounted: boolean // true only while scroll < 0.25 hero

  // Journey Stage 2 properties
  journeyProgress: number // 0.0 to 1.0
  journeyActive: boolean
  contactTransition: number // 0.0 (during journey) -> 1.0 (in Contact state)
  reassemblyProgress: number // backwards compatibility alias to contactTransition
  worldX: number // Amount to shift the 3D world left
  coinCurveY: number // Y position of the coin on the S-curve
  coinTiltZ: number // Coin tilt toward curve tangent
  coinSpinSpeed: number

  // Contact state & coin flip
  contactTiltX: number
  contactTiltZ: number
  flipRotationX: number
  flipHopY: number
  flipLightPulse: number

  // Sways and spins
  shellRotationX: number
  shellRotationY: number
  shellRotationZ: number
  coinRotationY: number
}

export interface SmoothedMouse {
  normX: number
  normY: number
}

// Current interpolated motion state
const objectState: StageObjectState = {
  posX: 0.10,
  posY: 0.08,
  scaleMultiplier: 1.0,
  spread: 0,
  blast: 0,
  driftTime: 0,
  opacity: 1.0,
  coreLightIntensity: 2.2,
  dividerProgress: 0,
  breakerOpacity: 1.0,
  isWireMounted: true,

  journeyProgress: 0,
  journeyActive: false,
  contactTransition: 0,
  reassemblyProgress: 0,
  worldX: 0,
  coinCurveY: 0,
  coinTiltZ: 0,
  coinSpinSpeed: 0.95,

  contactTiltX: 0,
  contactTiltZ: 0,
  flipRotationX: 0,
  flipHopY: 0,
  flipLightPulse: 0,

  shellRotationX: 0,
  shellRotationY: 0,
  shellRotationZ: 0,
  coinRotationY: 0,
}

// Targets driven by scrollTimeline
export const timelineTargets = {
  posX: 0.10,
  posY: 0.08,
  scaleMultiplier: 1.0,
  spread: 0,
  blast: 0,
  opacity: 1.0,
  coreLightIntensity: 2.2,
  dividerProgress: 0,
  breakerOpacity: 1.0,
  isWireMounted: true,

  journeyProgress: 0,
  journeyActive: false,
  contactTransition: 0,
  reassemblyProgress: 0,
}

export function resetMotionToHeroState() {
  timelineTargets.posX = 0.10
  timelineTargets.posY = 0.08
  timelineTargets.scaleMultiplier = 1.0
  timelineTargets.spread = 0
  timelineTargets.blast = 0
  timelineTargets.opacity = 1.0
  timelineTargets.coreLightIntensity = 2.2
  timelineTargets.dividerProgress = 0
  timelineTargets.breakerOpacity = 1.0
  timelineTargets.isWireMounted = true
  timelineTargets.journeyProgress = 0
  timelineTargets.journeyActive = false
  timelineTargets.contactTransition = 0
  timelineTargets.reassemblyProgress = 0

  objectState.posX = 0.10
  objectState.posY = 0.08
  objectState.scaleMultiplier = 1.0
  objectState.spread = 0
  objectState.blast = 0
  objectState.opacity = 1.0
  objectState.coreLightIntensity = 2.2
  objectState.dividerProgress = 0
  objectState.breakerOpacity = 1.0
  objectState.isWireMounted = true
  objectState.journeyProgress = 0
  objectState.journeyActive = false
  objectState.contactTransition = 0
  objectState.reassemblyProgress = 0
  objectState.worldX = 0
  objectState.coinCurveY = 0
  objectState.coinTiltZ = 0
  objectState.contactTiltX = 0
  objectState.contactTiltZ = 0
  objectState.flipRotationX = 0
  objectState.flipHopY = 0
  objectState.flipLightPulse = 0
}

export function snapMotionToContactState() {
  timelineTargets.posX = 0.20
  timelineTargets.posY = 0.0
  timelineTargets.scaleMultiplier = 2.3
  timelineTargets.spread = 0.6
  timelineTargets.blast = 1.0
  timelineTargets.opacity = 1.0
  timelineTargets.coreLightIntensity = 2.6
  timelineTargets.dividerProgress = 1.0
  timelineTargets.breakerOpacity = 0.0
  timelineTargets.isWireMounted = false
  timelineTargets.journeyProgress = 1.0
  timelineTargets.journeyActive = true
  timelineTargets.contactTransition = 1.0
  timelineTargets.reassemblyProgress = 1.0

  objectState.posX = 0.20
  objectState.posY = 0.0
  objectState.scaleMultiplier = 2.3
  objectState.spread = 0.6
  objectState.blast = 1.0
  objectState.opacity = 1.0
  objectState.coreLightIntensity = 2.6
  objectState.dividerProgress = 1.0
  objectState.breakerOpacity = 0.0
  objectState.isWireMounted = false
  objectState.journeyProgress = 1.0
  objectState.journeyActive = true
  objectState.contactTransition = 1.0
  objectState.reassemblyProgress = 1.0
}

export function snapMotionToAboutState() {
  timelineTargets.posX = 0.0
  timelineTargets.posY = -0.276
  timelineTargets.scaleMultiplier = 1.15
  timelineTargets.spread = 0.6
  timelineTargets.blast = 1.0
  timelineTargets.opacity = 1.0
  timelineTargets.coreLightIntensity = 2.0
  timelineTargets.dividerProgress = 1.0
  timelineTargets.breakerOpacity = 0.0
  timelineTargets.isWireMounted = false
  timelineTargets.journeyProgress = 0.0
  timelineTargets.journeyActive = true
  timelineTargets.contactTransition = 0.0
  timelineTargets.reassemblyProgress = 0.0

  objectState.posX = 0.0
  objectState.posY = -0.276
  objectState.scaleMultiplier = 1.15
  objectState.spread = 0.6
  objectState.blast = 1.0
  objectState.opacity = 1.0
  objectState.coreLightIntensity = 2.0
  objectState.dividerProgress = 1.0
  objectState.breakerOpacity = 0.0
  objectState.isWireMounted = false
  objectState.journeyProgress = 0.0
  objectState.journeyActive = true
  objectState.contactTransition = 0.0
  objectState.reassemblyProgress = 0.0
}

const smoothedNormMouse: SmoothedMouse = {
  normX: 0,
  normY: 0,
}

let activeSubscribers = 0
let animFrameId: number | null = null
let isPaused = false
let lastTimestamp = 0
let baseTime = 0
let coinSpinAngle = 0
let coinSpinVelocity = 0

let targetTiltX = 0
let targetTiltY = 0
let currentTiltX = 0
let currentTiltY = 0

let rawNormX = 0
let rawNormY = 0

const handleMouseMove = (e: MouseEvent) => {
  rawNormX = (e.clientX / window.innerWidth) * 2 - 1
  rawNormY = -(e.clientY / window.innerHeight) * 2 + 1
  targetTiltX = rawNormY * 0.18
  targetTiltY = rawNormX * 0.22
}

let isCustomPaused = false
const pauseListeners = new Set<(paused: boolean) => void>()

export function set3DRenderPaused(paused: boolean) {
  isCustomPaused = paused
  isPaused = document.hidden || isCustomPaused
  if (!isPaused) {
    lastTimestamp = performance.now()
  }
  pauseListeners.forEach((fn) => fn(isCustomPaused))
}

export function subscribe3DPause(callback: (paused: boolean) => void) {
  pauseListeners.add(callback)
  return () => {
    pauseListeners.delete(callback)
  }
}

const handleVisibilityChange = () => {
  isPaused = document.hidden || isCustomPaused
  if (!isPaused) {
    lastTimestamp = performance.now()
  }
}

let isFlipping = false
let flipStartTime = 0
const FLIP_DURATION = 900 // 0.9s

export function triggerCoinFlip() {
  if (typeof window !== 'undefined') {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
  }
  if (isFlipping) return // ignore if already playing (no stacking)
  isFlipping = true
  flipStartTime = performance.now()
}

let currentContactTiltX = 0
let currentContactTiltZ = 0

function motionLoop(timestamp: number) {
  if (!lastTimestamp) lastTimestamp = timestamp
  const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1)
  lastTimestamp = timestamp

  if (!isPaused) {
    baseTime += delta

    // Smooth cursor tilt
    currentTiltX += (targetTiltX - currentTiltX) * 0.06
    currentTiltY += (targetTiltY - currentTiltY) * 0.06

    // Smooth cursor light tracking
    smoothedNormMouse.normX += (rawNormX - smoothedNormMouse.normX) * 0.08
    smoothedNormMouse.normY += (rawNormY - smoothedNormMouse.normY) * 0.08

    // Smooth lerp toward timeline targets
    objectState.posX += (timelineTargets.posX - objectState.posX) * 0.1
    objectState.posY += (timelineTargets.posY - objectState.posY) * 0.1
    objectState.scaleMultiplier += (timelineTargets.scaleMultiplier - objectState.scaleMultiplier) * 0.1
    objectState.spread += (timelineTargets.spread - objectState.spread) * 0.1
    objectState.blast += (timelineTargets.blast - objectState.blast) * 0.08
    objectState.opacity += (timelineTargets.opacity - objectState.opacity) * 0.1
    objectState.coreLightIntensity += (timelineTargets.coreLightIntensity - objectState.coreLightIntensity) * 0.1
    objectState.dividerProgress += (timelineTargets.dividerProgress - objectState.dividerProgress) * 0.12
    objectState.breakerOpacity += (timelineTargets.breakerOpacity - objectState.breakerOpacity) * 0.12
    objectState.isWireMounted = timelineTargets.isWireMounted
    objectState.contactTransition += (timelineTargets.contactTransition - objectState.contactTransition) * 0.1
    objectState.reassemblyProgress = objectState.contactTransition

    // Snap to zero when targets are 0 to prevent lingering asymptotic lerp tails
    if (timelineTargets.blast === 0 && Math.abs(objectState.blast) < 0.002) objectState.blast = 0
    if (timelineTargets.spread === 0 && Math.abs(objectState.spread) < 0.002) objectState.spread = 0
    if (timelineTargets.journeyProgress === 0 && Math.abs(objectState.journeyProgress) < 0.002) objectState.journeyProgress = 0
    if (timelineTargets.contactTransition === 0 && Math.abs(objectState.contactTransition) < 0.002) objectState.contactTransition = 0
    if (timelineTargets.contactTransition === 1.0 && Math.abs(1.0 - objectState.contactTransition) < 0.002) objectState.contactTransition = 1.0
    if (timelineTargets.dividerProgress === 0 && Math.abs(objectState.dividerProgress) < 0.002) objectState.dividerProgress = 0
    if (timelineTargets.dividerProgress === 1 && Math.abs(1.0 - objectState.dividerProgress) < 0.005) objectState.dividerProgress = 1
    if (timelineTargets.breakerOpacity === 1.0 && Math.abs(1.0 - objectState.breakerOpacity) < 0.002) objectState.breakerOpacity = 1.0
    if (timelineTargets.breakerOpacity === 0 && Math.abs(objectState.breakerOpacity) < 0.005) objectState.breakerOpacity = 0

    // Journey interpolation
    const prevJourneyP = objectState.journeyProgress
    objectState.journeyProgress += (timelineTargets.journeyProgress - objectState.journeyProgress) * 0.1
    if (timelineTargets.journeyProgress === 0 && Math.abs(objectState.journeyProgress) < 0.002) {
      objectState.journeyProgress = 0
    }
    objectState.journeyActive = timelineTargets.journeyActive

    const T = objectState.contactTransition

    // Continuous spin: velocity-accelerated in journey, smoothly settling to ~8s per revolution (2*PI / 8 = PI / 4 rad/s) in Contact
    const deltaJourney = Math.abs(objectState.journeyProgress - prevJourneyP)
    coinSpinVelocity += deltaJourney * 35.0
    coinSpinVelocity *= 0.90
    const journeySpinSpeed = 0.95 + Math.min(coinSpinVelocity, 6.0)
    const contactSpinSpeed = Math.PI / 4 // 8s per revolution
    const activeSpinSpeed = journeySpinSpeed * (1 - T) + contactSpinSpeed * T
    objectState.coinSpinSpeed = activeSpinSpeed

    coinSpinAngle += delta * activeSpinSpeed
    objectState.coinRotationY = coinSpinAngle

    // Small cursor tilt in Contact state (max about 12 degrees = 0.2094 rad)
    const targetContactTiltX = rawNormY * 0.2094
    const targetContactTiltZ = -rawNormX * 0.2094
    currentContactTiltX += (targetContactTiltX - currentContactTiltX) * 0.08
    currentContactTiltZ += (targetContactTiltZ - currentContactTiltZ) * 0.08
    objectState.contactTiltX = currentContactTiltX
    objectState.contactTiltZ = currentContactTiltZ

    // Coin flip on email copy: 360-deg rotation on horizontal axis + 0.4 hop + light pulse over 0.9s
    let flipRotX = 0
    let flipHop = 0
    let flipLight = 0
    if (isFlipping) {
      const elapsed = timestamp - flipStartTime
      const t = Math.min(1.0, elapsed / FLIP_DURATION)
      const easeOut = 1 - Math.pow(1 - t, 3)
      flipRotX = easeOut * Math.PI * 2 // full 360-deg rotation around horizontal X axis
      flipHop = Math.sin(t * Math.PI) * 0.4 // hop up about 0.4 units and back
      flipLight = Math.sin(t * Math.PI) * 2.8 // gold pulse on point light

      if (t >= 1.0) {
        isFlipping = false
        flipRotX = 0
        flipHop = 0
        flipLight = 0
      }
    }
    objectState.flipRotationX = flipRotX
    objectState.flipHopY = flipHop
    objectState.flipLightPulse = flipLight

    // S-curve evaluation: worldX translation, coin curve Y offset, and tangent tilt
    if (objectState.journeyActive || objectState.journeyProgress > 0.001) {
      const evalCurve = getJourneyCurveEvaluation(objectState.journeyProgress)
      objectState.worldX = evalCurve.worldX
      objectState.coinCurveY = evalCurve.coinY
      objectState.coinTiltZ = evalCurve.coinTiltZ
    } else {
      objectState.worldX = 0
      objectState.coinCurveY = 0
      objectState.coinTiltZ = 0
    }

    objectState.driftTime = baseTime

    // Shell Sway: +/- 25 degrees (0.436 rad) on Y, +/- 8 degrees (0.140 rad) on X so opening stays visible
    objectState.shellRotationX = Math.cos(baseTime * 0.6) * 0.14 + currentTiltX * 0.2
    objectState.shellRotationY = Math.sin(baseTime * 0.8) * 0.436 + currentTiltY * 0.3
    objectState.shellRotationZ = Math.sin(baseTime * 0.4) * 0.05
  }

  if (activeSubscribers > 0) {
    animFrameId = requestAnimationFrame(motionLoop)
  }
}

export function subscribeObjectMotion() {
  activeSubscribers++

  if (activeSubscribers === 1) {
    isPaused = typeof document !== 'undefined' ? document.hidden : false
    lastTimestamp = performance.now()
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    animFrameId = requestAnimationFrame(motionLoop)
  }

  return () => {
    activeSubscribers--
    if (activeSubscribers <= 0) {
      activeSubscribers = 0
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId)
        animFrameId = null
      }
    }
  }
}

export function getObjectState(): Readonly<StageObjectState> {
  return objectState
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { __getObjectState?: () => Readonly<StageObjectState> }).__getObjectState = getObjectState
}

export function getSmoothedNormMouse(): Readonly<SmoothedMouse> {
  return smoothedNormMouse
}

export function setObjectMotionPaused(paused: boolean) {
  isPaused = paused
  if (!isPaused) {
    lastTimestamp = performance.now()
  }
}

export function useObjectMotion() {
  const [isTabVisible, setIsTabVisible] = useState(true)

  useEffect(() => {
    const unsub = subscribeObjectMotion()
    const handleVis = () => setIsTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', handleVis)

    return () => {
      unsub()
      document.removeEventListener('visibilitychange', handleVis)
    }
  }, [])

  return {
    isTabVisible,
    getState: getObjectState,
    getSmoothedNormMouse,
  }
}
