import { ScrollTrigger } from 'gsap/ScrollTrigger'

export type ScrollTargetName = 'top' | 'about' | 'contact'

/**
 * Computes exact scroll target Y coordinates dynamically from ScrollTrigger pin geometry
 * and real DOM layout. Never hard-codes pixels.
 */
export function getTargetY(target: ScrollTargetName): number {
  if (typeof window === 'undefined') return 0

  if (target === 'top') {
    return 0
  }

  // Get ScrollTrigger instance
  const ST =
    (window as unknown as { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger || ScrollTrigger

  if (target === 'about') {
    const st = ST?.getById?.('aboutTrigger')
    if (st) {
      // The journey's pin start (where blast finishes and Station 1 intro text is readable)
      // 125vh / 862.5vh = 0.1449 fraction of pinned journey
      return Math.round(st.start + 0.145 * (st.end - st.start))
    }
    const aboutEl = typeof document !== 'undefined' ? document.getElementById('about') : null
    if (aboutEl) {
      return Math.round(aboutEl.getBoundingClientRect().top + window.scrollY)
    }
    const vh = window.innerHeight / 100
    return Math.round(250 * vh)
  }

  if (target === 'contact') {
    // Refresh ScrollTrigger so pin-spacer dimensions and flow offsets are 100% computed
    if (ST && typeof ST.refresh === 'function') {
      try {
        ST.refresh()
      } catch {}
    }

    // The #contact element's y measured with getBoundingClientRect().top + window.scrollY
    // AFTER ScrollTrigger.refresh(), so it includes the pin-spacer.
    const contactEl = typeof document !== 'undefined' ? document.getElementById('contact') : null
    if (contactEl) {
      const rect = contactEl.getBoundingClientRect()
      return Math.round(rect.top + window.scrollY)
    }

    const st = ST?.getById?.('aboutTrigger')
    if (st) {
      return Math.round(st.end + 20)
    }
    return Math.round(window.innerHeight * 9.875)
  }

  return 0
}
