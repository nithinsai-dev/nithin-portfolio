import React, { useState, useEffect } from 'react'

interface DividerProps {
  positionPx: number
  maxPx: number
  isVertical?: boolean
  opacity?: number
  onMove: (newPx: number) => void
  onStartDrag: () => void
  onEndDrag: () => void
}

export default function Divider({
  positionPx,
  maxPx,
  opacity,
  onMove,
  onStartDrag,
  onEndDrag,
}: DividerProps) {
  const percent = maxPx > 0 ? (positionPx / maxPx) * 100 : 50
  const [showHint, setShowHint] = useState<boolean>(true)

  // Hide the "drag" hint after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  const dismissHint = () => {
    setShowHint(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    dismissHint()
    const step = maxPx * 0.02
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onMove(Math.max(maxPx * 0.05, Math.min(maxPx * 0.95, positionPx - step)))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onMove(Math.max(maxPx * 0.05, Math.min(maxPx * 0.95, positionPx + step)))
    }
  }

  const handleHandlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dismissHint()
    onStartDrag()
  }

  const handleLinePointerDown = () => {
    // Allows clicking on the line on desktop; doesn't block touch scroll
    dismissHint()
    onStartDrag()
  }

  return (
    <div
      role="slider"
      aria-label="Builder vs Breaker split comparison slider"
      aria-valuemin={5}
      aria-valuemax={95}
      aria-valuenow={Math.round(percent)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handleLinePointerDown}
      onPointerUp={onEndDrag}
      className="absolute z-10 select-none top-0 bottom-0 w-10 -ml-5 flex justify-center cursor-ew-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C14E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#140C0D]"
      style={{
        left: `${positionPx}px`,
        opacity: opacity !== undefined ? opacity : 1,
        pointerEvents: opacity !== undefined && opacity <= 0.05 ? 'none' : 'auto',
        display: opacity !== undefined && opacity <= 0.01 ? 'none' : 'flex',
        touchAction: 'pan-y', // Full height allows vertical scrolling on mobile touch
      }}
    >
      {/* 1.5px Yellow Line */}
      <div
        className="w-[1.5px] h-full bg-[#F2C14E] pointer-events-none shadow-[0_0_8px_rgba(242,193,78,0.5)]"
      />

      {/* Round Handle in the Middle:
          - Touch target at least 44x44px
          - touch-action: none ONLY on the handle
          - Accessible dragging target */}
      <div
        onPointerDown={handleHandlePointerDown}
        onPointerUp={(e) => {
          e.stopPropagation()
          onEndDrag()
        }}
        className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center cursor-ew-resize select-none focus-visible:outline-none"
        style={{ touchAction: 'none' }}
        aria-hidden="true"
      >
        {/* Visual 28px Circle */}
        <div className="w-7 h-7 rounded-full bg-[#F2C14E] text-[#140C0D] flex items-center justify-center shadow-lg shadow-black/80 hover:scale-110 active:scale-95 transition-transform pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M4 7 L7 4 L7 6 L7 8 L7 10 Z" />
            <path d="M10 7 L7 4 L7 6 L7 8 L7 10 Z" />
            <circle cx="4.5" cy="7" r="1" />
            <circle cx="9.5" cy="7" r="1" />
          </svg>
        </div>
      </div>

      {/* Small mono hint "drag" next to the handle, shown for 4 seconds or until first interaction */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300 ${
          percent > 50 ? 'right-full mr-2' : 'left-full ml-2'
        } ${showHint ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      >
        <span className="font-mono text-[10px] tracking-widest uppercase text-[#F2C14E] bg-[#140C0D]/90 border border-[#F2C14E]/60 px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
          drag
        </span>
      </div>
    </div>
  )
}
