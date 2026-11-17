import { useState, useEffect } from 'react'

/**
 * Custom hook to detect mobile viewport (< 768px).
 * Strictly based on matchMedia("(max-width: 767px)") with a change listener.
 * Never reads window.innerWidth.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 767px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia('(max-width: 767px)')
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    // Set initial value from MediaQueryList
    setIsMobile(mql.matches)

    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}
