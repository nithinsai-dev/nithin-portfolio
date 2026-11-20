import { useEffect, useState } from 'react'
import { get3DDiagnostic, subscribe3DDebug } from '../hooks/useDeviceCapabilities'

export default function Debug3DOverlay() {
  const isDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug3d') === '1'

  const [diagnostic, setDiagnostic] = useState(get3DDiagnostic)

  useEffect(() => {
    if (!isDebug) return

    // Console logging
    console.log('[debug3d] Initial 3D Diagnostics:', get3DDiagnostic())

    const unsub = subscribe3DDebug(() => {
      const updated = get3DDiagnostic()
      console.log('[debug3d] Updated 3D Diagnostics:', updated)
      setDiagnostic(updated)
    })

    return unsub
  }, [isDebug])

  if (!isDebug) return null

  return (
    <div
      id="debug-3d-overlay"
      className="fixed bottom-4 left-4 z-[9999] bg-[#140C0D]/95 border border-[#F2C14E] text-[#E8DDD3] p-3 rounded-lg font-mono text-[11px] leading-relaxed shadow-2xl backdrop-blur-md max-w-sm pointer-events-none select-none"
    >
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#F2C14E]/30 text-[#F2C14E] font-bold">
        <span>// 3D DIAGNOSTICS (?debug3d=1)</span>
        <span className={diagnostic.canRun3D ? 'text-[#84E296]' : 'text-[#E07A5F]'}>
          {diagnostic.canRun3D ? '● 3D ACTIVE' : '○ 3D OFF'}
        </span>
      </div>
      <div>
        <span className="text-[#E8DDD3]/60">Reason:</span> {diagnostic.reason}
      </div>
      <div>
        <span className="text-[#E8DDD3]/60">WebGL:</span> {diagnostic.webglVersion.toUpperCase()}
      </div>
      <div className="truncate">
        <span className="text-[#E8DDD3]/60">Renderer:</span>{' '}
        {diagnostic.renderer || 'Masked / Unavailable'}
      </div>
      <div>
        <span className="text-[#E8DDD3]/60">CPU Cores:</span>{' '}
        {diagnostic.hardwareConcurrency !== undefined
          ? `${diagnostic.hardwareConcurrency}`
          : 'N/A'}{' '}
        <span className="text-[#E8DDD3]/60">| RAM:</span>{' '}
        {diagnostic.deviceMemory ? `${diagnostic.deviceMemory}GB` : 'N/A'}
      </div>
      <div>
        <span className="text-[#E8DDD3]/60">Chunk Load:</span>{' '}
        <span
          className={
            diagnostic.chunkStatus === 'loaded'
              ? 'text-[#84E296]'
              : diagnostic.chunkStatus === 'failed'
              ? 'text-[#E07A5F]'
              : 'text-[#F2C14E]'
          }
        >
          {diagnostic.chunkStatus}
          {diagnostic.chunkError ? ` (${diagnostic.chunkError})` : ''}
        </span>
      </div>
    </div>
  )
}
