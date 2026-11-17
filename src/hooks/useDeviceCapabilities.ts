import { useState, useEffect } from 'react'

/**
 * Checks device capabilities to determine if heavy 3D (Three.js / R3F / GSAP)
 * and intensive cursor effects should be permitted.
 *
 * Disallowed on:
 * - Narrow / mobile screens (< 768px)
 * - Coarse pointer devices (touchscreens / phones / tablets)
 * - Users with prefers-reduced-motion
 * - Devices with <= 4 CPU cores (navigator.hardwareConcurrency <= 4)
 * - Devices with <= 4 GB RAM (navigator.deviceMemory <= 4)
 */
export function is3DAllowed(): boolean {
  if (typeof window === 'undefined') return false

  // 1. Mobile screen width (< 768px)
  if (window.innerWidth < 768) return false

  // 2. Coarse pointer (touchscreen / mobile)
  if (window.matchMedia('(pointer: coarse)').matches) return false

  // 3. Prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false

  // 4. Low CPU hardware concurrency (<= 4 cores)
  const concurrency = navigator.hardwareConcurrency
  if (typeof concurrency === 'number' && concurrency <= 4) return false

  // 5. Low device memory (<= 4 GB)
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory
  if (typeof memory === 'number' && memory <= 4) return false

  return true
}

export function useDeviceCapabilities() {
  const [canRun3D, setCanRun3D] = useState<boolean>(() => is3DAllowed())

  useEffect(() => {
    const handleCheck = () => {
      setCanRun3D(is3DAllowed())
    }

    window.addEventListener('resize', handleCheck, { passive: true })
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', handleCheck)

    return () => {
      window.removeEventListener('resize', handleCheck)
      motionQuery.removeEventListener('change', handleCheck)
    }
  }, [])

  return { canRun3D }
}
