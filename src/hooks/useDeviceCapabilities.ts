import { useState, useEffect } from 'react'

export interface WebGLTestResult {
  supported: boolean
  version: 'webgl2' | 'webgl1' | 'none'
  renderer?: string
  error?: string
}

export interface Debug3DInfo {
  canRun3D: boolean
  reason: string
  webglVersion: 'webgl2' | 'webgl1' | 'none'
  renderer?: string
  hardwareConcurrency?: number
  deviceMemory?: number
  chunkStatus: 'pending' | 'loaded' | 'retried' | 'failed' | 'skipped'
  chunkError?: string
}

let cachedWebGLTest: WebGLTestResult | null = null

/**
 * Performs real WebGL feature detection:
 * Can a WebGL2 (or fallback WebGL1) context be created and rendered to once?
 * Does NOT check or rely on renderer strings, hardwareConcurrency, deviceMemory,
 * or canvas readbacks (readPixels/toDataURL).
 */
export function testWebGL(): WebGLTestResult {
  if (cachedWebGLTest) return cachedWebGLTest

  if (typeof window === 'undefined') {
    cachedWebGLTest = { supported: false, version: 'none', error: 'Window undefined (SSR)' }
    return cachedWebGLTest
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  let gl: WebGL2RenderingContext | WebGLRenderingContext | null = null
  let version: 'webgl2' | 'webgl1' | 'none' = 'none'

  try {
    gl = canvas.getContext('webgl2')
    if (gl) {
      version = 'webgl2'
    } else {
      gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
      if (gl) {
        version = 'webgl1'
      }
    }
  } catch (e) {
    cachedWebGLTest = { supported: false, version: 'none', error: `Context creation error: ${e}` }
    return cachedWebGLTest
  }

  if (!gl) {
    cachedWebGLTest = { supported: false, version: 'none', error: 'Context creation returned null' }
    return cachedWebGLTest
  }

  // Real render test: clear color and draw a basic clear buffer
  try {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
  } catch (e) {
    cachedWebGLTest = { supported: false, version, error: `WebGL clear render failed: ${e}` }
    return cachedWebGLTest
  }

  // Optional renderer extraction for debugging only (never used to gate)
  let renderer: string | undefined
  try {
    const dbgExt = gl.getExtension('WEBGL_debug_renderer_info')
    if (dbgExt) {
      renderer = gl.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) || undefined
    }
    if (!renderer) {
      renderer = gl.getParameter(gl.RENDERER) || undefined
    }
  } catch {}

  // Clean up context if possible
  try {
    const loseExt = gl.getExtension('WEBGL_lose_context')
    if (loseExt) loseExt.loseContext()
  } catch {}

  cachedWebGLTest = { supported: true, version, renderer }
  return cachedWebGLTest
}

// Module-level diagnostic state for ?debug3d=1
let globalChunkStatus: 'pending' | 'loaded' | 'retried' | 'failed' | 'skipped' = 'pending'
let globalChunkError: string | undefined

const listeners = new Set<() => void>()

export function set3DChunkStatus(
  status: 'pending' | 'loaded' | 'retried' | 'failed' | 'skipped',
  error?: string
) {
  globalChunkStatus = status
  globalChunkError = error
  listeners.forEach((l) => l())
}

export function subscribe3DDebug(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function get3DDiagnostic(): Debug3DInfo {
  const isWidthOk = typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  const isPointerOk = typeof window !== 'undefined' ? !window.matchMedia('(pointer: coarse)').matches : false
  const isMotionOk = typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  const glTest = testWebGL()

  let reason = 'Active (all capabilities passed)'
  let canRun = true

  if (!isWidthOk) {
    canRun = false
    reason = `Mobile screen width (< 768px, current: ${typeof window !== 'undefined' ? window.innerWidth : 0}px)`
  } else if (!isPointerOk) {
    canRun = false
    reason = 'Coarse pointer device (touchscreen / mobile)'
  } else if (!isMotionOk) {
    canRun = false
    reason = 'prefers-reduced-motion: reduce'
  } else if (!glTest.supported) {
    canRun = false
    reason = `WebGL context or render failed: ${glTest.error || 'unavailable'}`
  }

  return {
    canRun3D: canRun,
    reason,
    webglVersion: glTest.version,
    renderer: glTest.renderer,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined,
    deviceMemory: typeof navigator !== 'undefined' ? (navigator as unknown as { deviceMemory?: number }).deviceMemory : undefined,
    chunkStatus: globalChunkStatus,
    chunkError: globalChunkError,
  }
}

/**
 * Checks device capabilities to determine if 3D should be permitted.
 * Depends ONLY on real feature detection (viewport >= 768px, fine pointer,
 * no reduced-motion, and working WebGL2/WebGL1 context).
 * DOES NOT gate on hardwareConcurrency, deviceMemory, renderer strings,
 * or canvas readbacks.
 */
export function is3DAllowed(): boolean {
  if (typeof window === 'undefined') return false

  // 1. Mobile screen width (< 768px)
  if (window.innerWidth < 768) return false

  // 2. Coarse pointer (touchscreen / mobile)
  if (window.matchMedia('(pointer: coarse)').matches) return false

  // 3. Prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false

  // 4. Real WebGL capability
  const glTest = testWebGL()
  if (!glTest.supported) return false

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
