import { contactContent } from '../../content/contact'

export default function SiteFooter() {
  const { copyright, motto, backToTop } = contactContent.footer

  const handleScrollToTop = () => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      window.scrollTo(0, 0)
      return
    }

    const startY = window.scrollY
    if (startY === 0) return

    const duration = 1600 // ~1.6s smooth scroll
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1.0, elapsed / duration)
      // EaseInOutQuad: smooth start and gentle stop
      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress

      window.scrollTo(0, startY * (1 - ease))

      if (progress < 1.0) {
        requestAnimationFrame(step)
      } else {
        window.scrollTo(0, 0)
      }
    }

    requestAnimationFrame(step)
  }

  return (
    <footer className="w-full border-t border-[#E8DDD3]/10 py-6 px-6 sm:px-12 md:px-20 text-xs">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Copyright */}
        <div className="font-sans text-[#E8DDD3]/70 select-none">
          {copyright}
        </div>

        {/* Centre: Discipline over motivation in mono, slightly dimmer */}
        <div className="font-mono text-[#E8DDD3]/45 tracking-widest uppercase select-none text-center">
          {motto}
        </div>

        {/* Right: Back to top button */}
        <button
          type="button"
          onClick={handleScrollToTop}
          data-cursor="pointer"
          aria-label="Scroll back to top of page"
          className="font-mono text-[#F2C14E] hover:text-[#E8DDD3] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded px-1.5 py-0.5"
        >
          {backToTop}
        </button>
      </div>
    </footer>
  )
}
