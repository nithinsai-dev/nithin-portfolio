import { useState, useEffect, useRef } from 'react'
import CopyEmail from './CopyEmail'
import SiteFooter from './SiteFooter'
import StaticSvgCoin from './StaticSvgCoin'
import { contactContent } from '../../content/contact'
import { safeUrl } from '../../lib/safeUrl'
import { getObjectState, subscribeObjectMotion } from '../../hooks/useObjectMotion'
import { is3DAllowed, useDeviceCapabilities } from '../../hooks/useDeviceCapabilities'

function getCoimbatoreTime(): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())
  } catch {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
}

export default function ContactSection() {
  const { canRun3D } = useDeviceCapabilities()
  const [localTime, setLocalTime] = useState<string>(getCoimbatoreTime())
  // If 3D is not allowed, heading and content are immediately visible on first paint
  const [isRevealed, setIsRevealed] = useState<boolean>(() => !is3DAllowed())
  const sectionRef = useRef<HTMLElement>(null)

  // Live Coimbatore local time updated every minute
  useEffect(() => {
    setLocalTime(getCoimbatoreTime())
    const interval = setInterval(() => {
      setLocalTime(getCoimbatoreTime())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Choreograph text reveal with scene transition progress
  useEffect(() => {
    if (!canRun3D) {
      setIsRevealed(true)
      return
    }

    // Desktop 3D: tie text reveal strictly to contact transition progress (60-70% through transition)
    const unsub = subscribeObjectMotion()
    let animId: number

    const checkTransition = () => {
      const s = getObjectState()
      const inContactView = sectionRef.current
        ? sectionRef.current.getBoundingClientRect().top < window.innerHeight * 0.85
        : false

      const transitionP = s.contactTransition !== undefined ? s.contactTransition : (s.reassemblyProgress || 0)
      // Reveal text when transition is ~60-70% complete (>= 0.65) or when scrolling directly into Contact
      if (transitionP >= 0.65 || inContactView) {
        setIsRevealed(true)
      } else if (transitionP < 0.35 && !inContactView) {
        setIsRevealed(false)
      }

      animId = requestAnimationFrame(checkTransition)
    }

    animId = requestAnimationFrame(checkTransition)
    return () => {
      unsub()
      cancelAnimationFrame(animId)
    }
  }, [canRun3D])

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Transition helper for elements staggering in ~80-100ms apart
  const getItemStyle = (delayMs: number, isHeading = false) => {
    // If not running 3D or reduced motion, headings must never wait
    if (!canRun3D || prefersReducedMotion) {
      return {
        opacity: 1,
        willChange: 'auto',
      }
    }
    // Heading visible on first paint when revealed
    if (isHeading) {
      return {
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed ? 'translate3d(0, 0, 0)' : 'translate3d(0, 16px, 0)',
        transition: `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: 'opacity, transform',
      }
    }
    return {
      opacity: isRevealed ? 1 : 0,
      transform: isRevealed ? 'translate3d(0, 0, 0)' : 'translate3d(0, 20px, 0)',
      transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
      willChange: 'opacity, transform',
    }
  }

  return (
    <section
      id="contact"
      ref={sectionRef}
      aria-label="Contact Section"
      className="relative w-full min-h-screen min-h-[100dvh] bg-transparent text-[#E8DDD3] flex flex-col justify-between z-10 select-none overflow-hidden"
    >
      {/* Content Container (Left half on desktop so 3D coin remains visible at 70% on the right) */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 md:px-20 pt-24 sm:pt-32 pb-16 flex-1 flex flex-col justify-center">
        <div
          data-contact-text="true"
          className="w-full md:w-[56%] max-w-2xl flex flex-col gap-6 sm:gap-8"
        >
          {/* Static SVG coin for mobile & low-end devices (~96px, positioned above heading, never behind or over text) */}
          {!canRun3D && (
            <div className="w-[96px] h-[96px] mb-1 pointer-events-none select-none">
              <StaticSvgCoin size={96} />
            </div>
          )}

          {/* Element 0: Label & Heading together (~0ms delay) - Never show label alone */}
          <div style={getItemStyle(0, true)} className="flex flex-col gap-4">
            <div className="font-mono text-xs sm:text-sm text-[#F2C14E] tracking-widest uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E]" />
              <span>{contactContent.label}</span>
            </div>

            <h2 className="font-heading font-extrabold text-[clamp(36px,8vw,44px)] sm:text-5xl md:text-[clamp(48px,7vw,120px)] leading-[1.05] tracking-tight text-[#E8DDD3]">
              {contactContent.heading}
            </h2>
          </div>

          {/* Element 1: Paragraph / Subline (~90ms delay) */}
          <div style={getItemStyle(90)}>
            <p className="font-sans text-base sm:text-[18px] text-[#E8DDD3]/80 leading-relaxed max-w-xl">
              {contactContent.subline}
            </p>
          </div>

          {/* Element 2: Copy Email (~180ms delay) */}
          <div style={getItemStyle(180)} className="pt-1">
            <CopyEmail email={contactContent.email} />
          </div>

          {/* Element 3: Row of Links (~270ms delay) */}
          <div style={getItemStyle(270)}>
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1">
              {contactContent.socialLinks.map((link) => {
                const href = safeUrl(link.url)
                if (!href) return null
                const isExternal = href.startsWith('https:')
                return (
                  <a
                    key={link.name}
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    data-cursor="pointer"
                    className="font-mono text-sm text-[#E8DDD3]/80 hover:text-[#F2C14E] transition-colors relative py-0.5 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-[#F2C14E] after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded"
                  >
                    {link.name}
                  </a>
                )
              })}
            </div>
          </div>

          {/* Element 4: Location line (~360ms delay): Coimbatore, IN · localTime */}
          <div style={getItemStyle(360)}>
            <div className="font-mono text-xs text-[#E8DDD3]/50 tracking-wider pt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E]/70 animate-pulse" />
              <span>
                {contactContent.location || 'Coimbatore, IN'} · {localTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer inside the same screen, at its bottom, hairline above */}
      <SiteFooter />
    </section>
  )
}
