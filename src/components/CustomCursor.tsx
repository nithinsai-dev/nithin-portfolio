import { useEffect, useRef } from 'react'
import { getHeroState } from '../store/heroStore'

export default function CustomCursor() {
  const glowRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const crosshairHRef = useRef<HTMLDivElement>(null)
  const crosshairVRef = useRef<HTMLDivElement>(null)
  const dragLabelRef = useRef<HTMLSpanElement>(null)
  const coordsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only enable on desktop with fine pointer and hover support
    const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!hasHover || prefersReducedMotion) {
      return
    }

    // Add class to <html> only while active to hide native cursor
    document.documentElement.classList.add('custom-cursor-active')

    let mouseX = -9999
    let mouseY = -9999
    let dotX = -9999
    let dotY = -9999
    let ringX = -9999
    let ringY = -9999
    let glowX = -9999
    let glowY = -9999

    let isVisible = false
    let isOverInteractive = false
    let isOverDivider = false
    let isOverContactText = false
    let currentCursorLabel: string | null = null
    let animId: number

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      if (!isVisible) {
        isVisible = true
        dotX = mouseX
        dotY = mouseY
        ringX = mouseX
        ringY = mouseY
        glowX = mouseX
        glowY = mouseY
      }

      // Check hovered elements
      const target = e.target as HTMLElement | null
      if (target) {
        const hero = getHeroState()
        const inHeroNow = hero.heroBounds
          ? e.clientY >= hero.heroBounds.top - window.scrollY &&
            e.clientY <= hero.heroBounds.bottom - window.scrollY &&
            e.clientX >= hero.heroBounds.left - window.scrollX &&
            e.clientX <= hero.heroBounds.right - window.scrollX
          : false

        const isInteractive = !!target.closest(
          'a, button, [role="button"], [role="link"], input[type="submit"], [data-cursor="pointer"], [data-chip]'
        )
        const isDivider = inHeroNow && !!target.closest('[role="slider"], .divider-handle')
        const isContactText = !!target.closest('[data-contact-text]')
        const cursorLabelEl = target.closest('[data-cursor-label]') as HTMLElement | null
        currentCursorLabel = cursorLabelEl ? cursorLabelEl.getAttribute('data-cursor-label') : null

        isOverInteractive = isInteractive
        isOverDivider = isDivider
        isOverContactText = isContactText
      }
    }

    const handleMouseLeave = () => {
      isVisible = false
    }

    const handleMouseEnter = () => {
      isVisible = true
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    const animate = () => {
      if (isVisible) {
        // 1. Dot follows mouse exactly
        dotX = mouseX
        dotY = mouseY

        // 2. Ring follows with smooth lag (lerp ~0.18)
        ringX += (mouseX - ringX) * 0.18
        ringY += (mouseY - ringY) * 0.18

        // 3. Glow follows with slower lag (lerp ~0.08)
        glowX += (mouseX - glowX) * 0.08
        glowY += (mouseY - glowY) * 0.08

        // Read hero state from shared store
        const hero = getHeroState()
        const inHero = hero.heroBounds
          ? mouseY >= hero.heroBounds.top - window.scrollY &&
            mouseY <= hero.heroBounds.bottom - window.scrollY &&
            mouseX >= hero.heroBounds.left - window.scrollX &&
            mouseX <= hero.heroBounds.right - window.scrollX
          : false

        // Breaker state: inside hero AND to the right of divider
        const isBreaker = inHero && mouseX > hero.dividerX
        const isDragging = hero.isDragging

        const isTransitioning = document.documentElement.classList.contains('page-transitioning')

        // Update 360px Gold Glow Light (mix-blend-mode: screen)
        // Hidden during page transition
        if (glowRef.current) {
          glowRef.current.style.transform = `translate3d(${glowX - 180}px, ${glowY - 180}px, 0)`
          glowRef.current.style.opacity = isTransitioning ? '0' : '1'
        }

        // If transitioning, hide cursor parts
        if (isTransitioning) {
          if (ringRef.current) ringRef.current.style.opacity = '0'
          if (dotRef.current) dotRef.current.style.opacity = '0'
          if (coordsRef.current) coordsRef.current.style.opacity = '0'
          animId = requestAnimationFrame(animate)
          return
        }

        // Determine ring appearance and dimensions
        let ringSize = 34
        let ringBorder = '1px solid rgba(232, 221, 211, 0.4)'
        let ringBg = 'transparent'
        let showCrosshair = false
        let showLabel = false
        let labelText = ''
        let showCoords = false
        let hideDot = false

        if (isDragging && inHero) {
          // While dragging divider: shrink to 20px
          ringSize = 20
          ringBorder = '1.5px solid #F2C14E'
          ringBg = 'rgba(242, 193, 78, 0.2)'
        } else if (currentCursorLabel) {
          // Hover over project row: cursor ring grows with mono label "open" or "close"
          ringSize = 64
          ringBorder = '1.5px solid #F2C14E'
          ringBg = 'rgba(20, 12, 13, 0.85)'
          showLabel = true
          labelText = currentCursorLabel
          hideDot = true
        } else if (isOverInteractive) {
          // Hover over links and buttons: 56px with faint gold fill (12%) and dot hides
          ringSize = 56
          ringBorder = '1px solid rgba(242, 193, 78, 0.5)'
          ringBg = 'rgba(242, 193, 78, 0.12)'
          hideDot = true
        } else if (isOverContactText) {
          // Hover over contact text: hide/shrink ring so it never obscures the typography
          ringSize = 0
          ringBorder = 'none'
          ringBg = 'transparent'
        } else if (isOverDivider && inHero) {
          // Hover over divider handle: shows "drag" label strictly inside hero
          ringSize = 42
          ringBorder = '1.5px solid #F2C14E'
          ringBg = 'rgba(242, 193, 78, 0.15)'
          showLabel = true
          labelText = 'drag'
        } else if (isBreaker) {
          // Breaker state: crosshair + dashed ring + coordinates label
          ringSize = 34
          ringBorder = '1px dashed rgba(242, 193, 78, 0.65)'
          ringBg = 'transparent'
          showCrosshair = true
          showCoords = true
        }

        // Update Ring transform & styles
        if (ringRef.current) {
          const half = ringSize / 2
          ringRef.current.style.transform = `translate3d(${ringX - half}px, ${ringY - half}px, 0)`
          ringRef.current.style.width = `${ringSize}px`
          ringRef.current.style.height = `${ringSize}px`
          ringRef.current.style.border = ringBorder
          ringRef.current.style.backgroundColor = ringBg
          ringRef.current.style.opacity = '1'
        }

        // Update Central Dot transform & opacity
        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${dotX - 3}px, ${dotY - 3}px, 0)`
          dotRef.current.style.opacity = hideDot ? '0' : '1'
        }

        // Crosshair lines (+ shape)
        if (crosshairHRef.current) {
          crosshairHRef.current.style.opacity = showCrosshair ? '1' : '0'
        }
        if (crosshairVRef.current) {
          crosshairVRef.current.style.opacity = showCrosshair ? '1' : '0'
        }

        // Label inside ring ("drag", "open", "close")
        if (dragLabelRef.current) {
          dragLabelRef.current.style.opacity = showLabel ? '1' : '0'
          if (showLabel) {
            dragLabelRef.current.textContent = labelText
          }
        }

        // Live coordinates label ("x:812 y:304") in Geist Mono, 10px, sand
        if (coordsRef.current) {
          if (showCoords) {
            coordsRef.current.style.transform = `translate3d(${ringX + 22}px, ${ringY - 7}px, 0)`
            coordsRef.current.style.opacity = '1'
            coordsRef.current.textContent = `x:${Math.round(mouseX)} y:${Math.round(mouseY)}`
          } else {
            coordsRef.current.style.opacity = '0'
          }
        }
      } else {
        // Out of window: hide elements
        if (glowRef.current) glowRef.current.style.opacity = '0'
        if (ringRef.current) ringRef.current.style.opacity = '0'
        if (dotRef.current) dotRef.current.style.opacity = '0'
        if (coordsRef.current) coordsRef.current.style.opacity = '0'
      }

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)

    return () => {
      document.documentElement.classList.remove('custom-cursor-active')
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <>
      {/* 1. Gold Glow Light: 360px soft glow, sits above page (z-30) and below cursor (z-50) */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed top-0 left-0 w-[360px] h-[360px] rounded-full z-30 will-change-transform select-none opacity-0 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(242, 193, 78, 0.14), transparent 70%)',
          mixBlendMode: 'screen',
          transform: 'translate3d(-9999px, -9999px, 0)',
        }}
        aria-hidden="true"
      />

      {/* 2. Cursor Layer (z-50) */}
      <div
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none"
        aria-hidden="true"
      >
        {/* Ring / Crosshair container (lerped ~0.18, 150ms transition) */}
        <div
          ref={ringRef}
          className="pointer-events-none fixed top-0 left-0 rounded-full flex items-center justify-center will-change-transform opacity-0 transition-[width,height,border,background-color] duration-150 ease-out"
          style={{
            width: '34px',
            height: '34px',
            border: '1px solid rgba(232, 221, 211, 0.4)',
            transform: 'translate3d(-9999px, -9999px, 0)',
          }}
        >
          {/* Horizontal crosshair line (16px x 1px gold) */}
          <div
            ref={crosshairHRef}
            className="absolute bg-[#F2C14E] pointer-events-none opacity-0 transition-opacity duration-150"
            style={{ width: '16px', height: '1px' }}
          />

          {/* Vertical crosshair line (1px x 16px gold) */}
          <div
            ref={crosshairVRef}
            className="absolute bg-[#F2C14E] pointer-events-none opacity-0 transition-opacity duration-150"
            style={{ width: '1px', height: '16px' }}
          />

          {/* "drag" label inside ring when hovering divider */}
          <span
            ref={dragLabelRef}
            className="font-mono text-[9px] uppercase tracking-wider text-[#F2C14E] pointer-events-none opacity-0 transition-opacity duration-150"
          >
            drag
          </span>
        </div>

        {/* 6px Gold Dot (follows mouse exactly) */}
        <div
          ref={dotRef}
          className="pointer-events-none fixed top-0 left-0 w-[6px] h-[6px] rounded-full bg-[#F2C14E] will-change-transform opacity-0 transition-opacity duration-150 ease-out"
          style={{
            transform: 'translate3d(-9999px, -9999px, 0)',
          }}
        />

        {/* Live Coordinates Label in Breaker mode (Geist Mono, 10px, sand) */}
        <div
          ref={coordsRef}
          className="pointer-events-none fixed top-0 left-0 font-mono text-[10px] text-[#E8DDD3] tracking-wider whitespace-nowrap will-change-transform opacity-0 transition-opacity duration-150 ease-out"
          style={{
            transform: 'translate3d(-9999px, -9999px, 0)',
          }}
        />
      </div>
    </>
  )
}
