import { useEffect, useState } from 'react'

export interface ObjectTransform {
  rotationX: number
  rotationY: number
  rotationZ: number
}

export interface SmoothedMouse {
  normX: number
  normY: number
}

// Shell sway transformation (+/- 25 deg on Y, +/- 8 deg on X + cursor tilt)
const shellTransform: ObjectTransform = {
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
}

// Independent coin spin transformation (continuous spin on vertical Y axis)
const coinTransform: ObjectTransform = {
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
}

// Smoothed normalized mouse for 3D gold point light
const smoothedNormMouse: SmoothedMouse = {
  normX: 0,
  normY: 0,
}

// Shared spread state (0 = assembled, 1 = fully apart)
let targetSpread = 0
let currentSpread = 0
const BUILDER_DEFAULT_SPREAD = 0
const BREAKER_DEFAULT_SPREAD = 0.12

let activeSubscribers = 0
let animFrameId: number | null = null
let isPaused = false
let lastTimestamp = 0
let baseTime = 0

// Mouse tilt targets and smoothed values
let targetTiltX = 0
let targetTiltY = 0
let currentTiltX = 0
let currentTiltY = 0

let rawNormX = 0
let rawNormY = 0

const handleMouseMove = (e: MouseEvent) => {
  // Normalize cursor to -1 .. 1
  rawNormX = (e.clientX / window.innerWidth) * 2 - 1
  rawNormY = -(e.clientY / window.innerHeight) * 2 + 1
  // Small angle limits (max ~0.25 rad)
  targetTiltX = rawNormY * 0.2
  targetTiltY = rawNormX * 0.25
}

const handleVisibilityChange = () => {
  isPaused = document.hidden
  if (!isPaused) {
    lastTimestamp = performance.now()
  }
}

function motionLoop(timestamp: number) {
  if (!lastTimestamp) lastTimestamp = timestamp
  const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1)
  lastTimestamp = timestamp

  if (!isPaused) {
    baseTime += delta * 0.35

    // Smooth lerp for cursor tilt
    currentTiltX += (targetTiltX - currentTiltX) * 0.06
    currentTiltY += (targetTiltY - currentTiltY) * 0.06

    // Smooth lerp for 3D gold light (~0.08)
    smoothedNormMouse.normX += (rawNormX - smoothedNormMouse.normX) * 0.08
    smoothedNormMouse.normY += (rawNormY - smoothedNormMouse.normY) * 0.08

    // Smooth lerp for spread
    currentSpread += (targetSpread - currentSpread) * 0.08

    // 1. Shell Sway: +/- 25 degrees (0.436 rad) on Y, +/- 8 degrees (0.140 rad) on X so opening stays visible
    shellTransform.rotationX = Math.cos(baseTime * 0.6) * 0.14 + currentTiltX * 0.2
    shellTransform.rotationY = Math.sin(baseTime * 0.8) * 0.436 + currentTiltY * 0.3
    shellTransform.rotationZ = Math.sin(baseTime * 0.4) * 0.05

    // 2. Coin Spin: spinning continuously on its vertical axis
    coinTransform.rotationX = currentTiltX * 0.1
    coinTransform.rotationY = baseTime * 0.95
    coinTransform.rotationZ = 0
  }

  if (activeSubscribers > 0) {
    animFrameId = requestAnimationFrame(motionLoop)
  }
}

export function subscribeKnotMotion() {
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

// Backward-compatible alias for knotTransform
export function getKnotTransform(): Readonly<ObjectTransform> {
  return shellTransform
}

export function getShellTransform(): Readonly<ObjectTransform> {
  return shellTransform
}

export function getCoinTransform(): Readonly<ObjectTransform> {
  return coinTransform
}

export function getSmoothedNormMouse(): Readonly<SmoothedMouse> {
  return smoothedNormMouse
}

export function setTargetSpread(value: number) {
  targetSpread = Math.max(0, Math.min(1, value))
}

export function getSpread(variant: 'solid' | 'wire'): number {
  if (variant === 'solid') {
    return BUILDER_DEFAULT_SPREAD + currentSpread * (1 - BUILDER_DEFAULT_SPREAD)
  } else {
    return BREAKER_DEFAULT_SPREAD + currentSpread * (1 - BREAKER_DEFAULT_SPREAD)
  }
}

export function setKnotPaused(paused: boolean) {
  isPaused = paused
  if (!isPaused) {
    lastTimestamp = performance.now()
  }
}

export function useKnotMotion() {
  const [isTabVisible, setIsTabVisible] = useState(true)

  useEffect(() => {
    const unsub = subscribeKnotMotion()
    const handleVis = () => setIsTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', handleVis)

    return () => {
      unsub()
      document.removeEventListener('visibilitychange', handleVis)
    }
  }, [])

  return {
    isTabVisible,
    getShellTransform,
    getCoinTransform,
    getSmoothedNormMouse,
    getSpread,
    setTargetSpread,
  }
}
