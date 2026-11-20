import { useEffect, useRef, useState } from 'react'
import { Project } from '../../lib/loadProjects'
import { safeUrl } from '../../lib/safeUrl'

interface HoverPreviewProps {
  project: Project | null
  mouseX: number
  mouseY: number
  rowRatio?: number
  isVisible: boolean
}

export default function HoverPreview({
  project,
  mouseX,
  mouseY,
  rowRatio = 0.5,
  isVisible,
}: HoverPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: mouseX, y: mouseY })
  const wasVisibleRef = useRef(false)
  const [localSplitX, setLocalSplitX] = useState(130) // split at center of 260px preview

  // On pointerenter, initialize immediately from current mouse position - never lerp from 0,0 or -9999
  useEffect(() => {
    if (isVisible && !wasVisibleRef.current) {
      posRef.current = { x: mouseX, y: mouseY }
    }
    wasVisibleRef.current = isVisible
  }, [isVisible, mouseX, mouseY])

  // Reset state when not visible
  useEffect(() => {
    if (!isVisible) {
      posRef.current = { x: -9999, y: -9999 }
    }
  }, [isVisible])

  // Update split divider to follow cursor across the full 260px width of the preview
  useEffect(() => {
    if (isVisible) {
      const split = Math.round(Math.max(10, Math.min(250, rowRatio * 260)))
      setLocalSplitX(split)
    }
  }, [rowRatio, isVisible])

  useEffect(() => {
    if (!isVisible) return

    let animId: number
    const animate = () => {
      // Light lag interpolation (0.18)
      posRef.current.x += (mouseX - posRef.current.x) * 0.18
      posRef.current.y += (mouseY - posRef.current.y) * 0.18

      if (containerRef.current) {
        const winW = window.innerWidth
        const winH = window.innerHeight
        const cardWidth = 260
        const cardHeight = 170

        // If card would overflow right edge, flip to left of cursor
        const flipLeft = posRef.current.x + 24 + cardWidth > winW - 16
        const targetLeft = flipLeft
          ? posRef.current.x - cardWidth - 24
          : posRef.current.x + 24
        const targetTop = posRef.current.y - 85

        // Clamp inside viewport so preview never clips or appears offscreen
        const clampedLeft = Math.max(16, Math.min(winW - cardWidth - 16, targetLeft))
        const clampedTop = Math.max(16, Math.min(winH - cardHeight - 16, targetTop))

        containerRef.current.style.transform = `translate3d(${clampedLeft}px, ${clampedTop}px, 0)`
      }

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [mouseX, mouseY, isVisible])

  if (!isVisible || !project) return null

  const safeImg = project.image ? safeUrl(project.image) : null

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-40 w-[260px] h-[170px] rounded-lg overflow-hidden border border-[#E8DDD3]/20 bg-[#140C0D] shadow-2xl shadow-black/80 will-change-transform select-none hidden md:block"
      style={{
        transform: `translate3d(${mouseX > 0 ? mouseX + 24 : -9999}px, ${mouseY > 0 ? mouseY - 85 : -9999}px, 0)`,
      }}
    >
      {/* 1. Left (Builder) Side: Normal Image or Screenshot Frame */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{
          clipPath: `inset(0 calc(100% - ${localSplitX}px) 0 0)`,
        }}
      >
        {safeImg ? (
          <img
            src={safeImg}
            alt={project.title}
            loading="lazy"
            decoding="async"
            width={260}
            height={170}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-[#E8DDD3]/30 bg-[#201415]/70 p-3 text-center">
            <span className="font-mono text-xs text-[#E8DDD3]/50">[screenshot]</span>
            <span className="font-mono text-[10px] text-[#F2C14E] mt-1">// {project.title}</span>
          </div>
        )}
      </div>

      {/* 2. Right (Breaker) Side: Grayscale + Brightness 0.6 + Dashed Grid + Breaker Tags */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{
          clipPath: `inset(0 0 0 ${localSplitX}px)`,
        }}
      >
        {safeImg ? (
          <img
            src={safeImg}
            alt={`${project.title} X-ray`}
            loading="lazy"
            decoding="async"
            width={260}
            height={170}
            className="w-full h-full object-cover grayscale brightness-[0.6]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-[#F2C14E]/40 bg-[#140C0D] p-3 text-center">
            <span className="font-mono text-xs text-[#F2C14E]/70">[screenshot]</span>
            <span className="font-mono text-[9px] text-[#E8DDD3]/40 mt-1">X-RAY INSPECT</span>
          </div>
        )}

        {/* Dashed Grid Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(242,193,78,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(242,193,78,0.4) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Breaker tags */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end pointer-events-none">
          {project.breakerTags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="font-mono text-[9px] text-[#F2C14E] bg-[#201415]/90 border border-[#F2C14E]/60 px-1.5 py-0.5 rounded shadow"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Thin Yellow Split Line */}
      <div
        className="absolute top-0 bottom-0 w-[1.5px] bg-[#F2C14E] z-10 pointer-events-none shadow-[0_0_8px_rgba(242,193,78,0.8)]"
        style={{ left: `${localSplitX}px` }}
      />
    </div>
  )
}
