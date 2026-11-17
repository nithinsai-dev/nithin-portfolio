import { useState, useRef, useEffect, useCallback } from 'react'
import { Project } from '../../lib/loadProjects'
import { safeUrl } from '../../lib/safeUrl'

interface SplitImageProps {
  project: Project
}

export default function SplitImage({ project }: SplitImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const safeImg = project.image ? safeUrl(project.image) : null
  const [splitRatio, setSplitRatio] = useState<number>(0.5) // normalized 0 to 1
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [mobileMode, setMobileMode] = useState<'builder' | 'breaker'>('builder')

  // Dragging logic
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      setSplitRatio(Math.max(0.05, Math.min(0.95, ratio)))
    },
    [isDragging]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSplitRatio((prev) => Math.max(0.05, prev - 0.05))
      e.preventDefault()
    } else if (e.key === 'ArrowRight') {
      setSplitRatio((prev) => Math.min(0.95, prev + 0.05))
      e.preventDefault()
    }
  }

  const splitPercent = splitRatio * 100

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* Mobile Toggle Buttons (<768px) */}
      <div className="flex md:hidden items-center justify-between border-b border-[#E8DDD3]/10 pb-2">
        <span className="font-mono text-xs text-[#E8DDD3]/50 uppercase tracking-widest">
          // view mode
        </span>
        <div className="flex items-center gap-1 bg-[#201415] p-1 rounded-full border border-[#E8DDD3]/20">
          <button
            type="button"
            onClick={() => setMobileMode('builder')}
            className={`px-3 py-1 rounded-full font-mono text-xs transition-colors cursor-pointer ${
              mobileMode === 'builder'
                ? 'bg-[#F2C14E] text-[#140C0D] font-bold'
                : 'text-[#E8DDD3]/70 hover:text-[#E8DDD3]'
            }`}
          >
            builder
          </button>
          <button
            type="button"
            onClick={() => setMobileMode('breaker')}
            className={`px-3 py-1 rounded-full font-mono text-xs transition-colors cursor-pointer ${
              mobileMode === 'breaker'
                ? 'bg-[#F2C14E] text-[#140C0D] font-bold'
                : 'text-[#E8DDD3]/70 hover:text-[#E8DDD3]'
            }`}
          >
            breaker
          </button>
        </div>
      </div>

      {/* Main Visual Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden border border-[#E8DDD3]/20 bg-[#140C0D] shadow-xl group"
      >
        {/* ============================================================== */}
        {/* MOBILE MODE (<768px): clean switch between builder and breaker */}
        {/* ============================================================== */}
        <div className="block md:hidden w-full h-full relative">
          {mobileMode === 'builder' ? (
            safeImg ? (
              <img
                src={safeImg}
                alt={project.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[#E8DDD3]/20 bg-[#201415] p-6 text-center">
                <span className="font-mono text-sm text-[#E8DDD3]/60">[screenshot]</span>
                <span className="font-mono text-xs text-[#F2C14E] mt-2">
                  // {project.title}
                </span>
              </div>
            )
          ) : (
            <div className="relative w-full h-full bg-[#140C0D]">
              {safeImg ? (
                <img
                  src={safeImg}
                  alt={`${project.title} X-ray`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover grayscale brightness-[0.6]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[#F2C14E]/30 bg-[#140C0D] p-6 text-center">
                  <span className="font-mono text-sm text-[#F2C14E]/80">[screenshot]</span>
                  <span className="font-mono text-xs text-[#E8DDD3]/40 mt-2">
                    X-RAY SECURITY INSPECTION
                  </span>
                </div>
              )}

              {/* Dashed Grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(242,193,78,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(242,193,78,0.4) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Breaker tags */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                {project.breakerTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[10px] text-[#F2C14E] bg-[#201415]/90 border border-[#F2C14E]/70 px-2 py-0.5 rounded shadow"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* DESKTOP MODE (>=768px): interactive draggable split slider     */}
        {/* ============================================================== */}
        <div className="hidden md:block w-full h-full relative">
          {/* 1. Left (Builder) Side */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{
              clipPath: `inset(0 calc(100% - ${splitPercent}%) 0 0)`,
            }}
          >
            {safeImg ? (
              <img
                src={safeImg}
                alt={project.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[#E8DDD3]/20 bg-[#201415] p-6 text-center">
                <span className="font-mono text-sm text-[#E8DDD3]/60">[screenshot]</span>
                <span className="font-mono text-xs text-[#F2C14E] mt-2">
                  // {project.title}
                </span>
              </div>
            )}
            <div className="absolute top-3 left-3 font-mono text-[10px] text-[#E8DDD3]/70 bg-[#201415]/80 px-2 py-0.5 rounded border border-[#E8DDD3]/10">
              BUILDER VIEW
            </div>
          </div>

          {/* 2. Right (Breaker) Side */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{
              clipPath: `inset(0 0 0 ${splitPercent}%)`,
            }}
          >
            {safeImg ? (
              <img
                src={safeImg}
                alt={`${project.title} X-ray`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover grayscale brightness-[0.6]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[#F2C14E]/30 bg-[#140C0D] p-6 text-center">
                <span className="font-mono text-sm text-[#F2C14E]/80">[screenshot]</span>
                <span className="font-mono text-xs text-[#E8DDD3]/40 mt-2">
                  X-RAY INSPECT
                </span>
              </div>
            )}

            {/* Dashed Grid Overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(242,193,78,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(242,193,78,0.4) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Breaker tags */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
              {project.breakerTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[10px] text-[#F2C14E] bg-[#201415]/90 border border-[#F2C14E]/70 px-2 py-0.5 rounded shadow"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="absolute bottom-3 right-3 font-mono text-[10px] text-[#F2C14E]/80 bg-[#140C0D]/90 px-2 py-0.5 rounded border border-[#F2C14E]/30">
              BREAKER VIEW
            </div>
          </div>

          {/* 3. Draggable Divider Handle */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Builder vs Breaker visual split"
            aria-valuenow={Math.round(splitPercent)}
            aria-valuemin={5}
            aria-valuemax={95}
            onKeyDown={handleKeyDown}
            onPointerDown={() => setIsDragging(true)}
            className="absolute top-0 bottom-0 w-[1.5px] bg-[#F2C14E] -translate-x-1/2 cursor-ew-resize z-20 flex items-center justify-center focus-visible:outline-none"
            style={{ left: `${splitPercent}%` }}
          >
            {/* Round handle in middle */}
            <div className="w-7 h-7 rounded-full bg-[#140C0D] border-2 border-[#F2C14E] flex items-center justify-center shadow-lg shadow-black/80 hover:scale-110 active:scale-95 transition-transform group-focus-visible:ring-2 group-focus-visible:ring-[#F2C14E]">
              <div className="flex items-center gap-0.5">
                <span className="w-0.5 h-2.5 bg-[#F2C14E] rounded-full" />
                <span className="w-0.5 h-2.5 bg-[#F2C14E] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
