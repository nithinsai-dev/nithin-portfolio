import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useTransitionNavigate } from '../hooks/useTransitionNavigate'
import MobileMenu from './MobileMenu'

type ActiveSection = 'home' | 'about' | 'work' | 'contact'

export default function SiteNav() {
  const location = useLocation()
  const isProjectsPage = location.pathname === '/projects'
  const { transition, isTransitioning } = useTransitionNavigate()

  const [activeSection, setActiveSection] = useState<ActiveSection>(
    isProjectsPage ? 'work' : 'home'
  )
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [isAtTop, setIsAtTop] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const lastScrollYRef = useRef(0)

  // Scroll listener to update active section, top label state, and smart hide/show
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const vh = window.innerHeight / 100

      // Top label visibility rule: visible only when scrollY <= 80px on every route
      setIsAtTop(scrollY <= 80)

      if (isProjectsPage) {
        setActiveSection('work')
        setIsNavVisible(true)
        return
      }

      // Dynamic check for desktop ScrollTrigger without static bundling
      const st = (window as unknown as {
        ScrollTrigger?: { getById: (id: string) => { start: number; end: number } | undefined }
      }).ScrollTrigger?.getById('aboutTrigger')

      // Bounds
      const heroThreshold = 125 * vh
      const aboutStart = st ? st.start : heroThreshold

      const contactEl = document.getElementById('contact')
      const contactTop = contactEl
        ? contactEl.getBoundingClientRect().top + window.scrollY
        : st
        ? st.end - 100
        : 900 * vh

      // 1. Active Section computation from real scroll positions
      if (scrollY < aboutStart - 50) {
        setActiveSection('home')
      } else if (scrollY >= contactTop - 150) {
        setActiveSection('contact')
      } else {
        setActiveSection('about')
      }

      // 2. Nav bar visibility computation
      // Always visible in hero, contact section, or projects
      if (scrollY < heroThreshold || scrollY >= contactTop - 150) {
        setIsNavVisible(true)
      } else {
        // During journey (pinned section): hide on scroll down, show on scroll up (200ms)
        const delta = scrollY - lastScrollYRef.current
        if (Math.abs(delta) > 4) {
          if (delta > 0) {
            setIsNavVisible(false) // Scrolling down
          } else {
            setIsNavVisible(true) // Scrolling up
          }
        }
      }

      lastScrollYRef.current = scrollY
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isProjectsPage])

  const handleNavClick = useCallback(
    (item: ActiveSection) => {
      if (isTransitioning) return

      // Optimistically set activeSection for immediate visual feedback
      setActiveSection(item)

      if (isProjectsPage) {
        if (item === 'work') return // Already on /projects
        if (item === 'home') {
          transition({ to: '/', destination: 'Home', target: 'top' })
        } else if (item === 'about') {
          transition({ to: '/#about', destination: 'About', target: 'about' })
        } else if (item === 'contact') {
          transition({ to: '/#contact', destination: 'Contact', target: 'contact' })
        }
        return
      }

      // On "/"
      if (item === 'work') {
        transition({ to: '/projects', destination: 'Work' })
      } else if (item === 'home') {
        transition({ to: '/', destination: 'Home', target: 'top' })
      } else if (item === 'about') {
        transition({ to: '/#about', destination: 'About', target: 'about' })
      } else if (item === 'contact') {
        transition({ to: '/#contact', destination: 'Contact', target: 'contact' })
      }
    },
    [isProjectsPage, isTransitioning, transition]
  )

  return (
    <>
      <header
        aria-label="Site Header"
        className="fixed top-0 left-0 right-0 z-40 p-5 sm:p-10 md:p-14 flex items-start justify-between pointer-events-none transition-all duration-200 select-none"
        style={{
          transform: isNavVisible ? 'translateY(0)' : 'translateY(-100%)',
          opacity: isNavVisible ? 1 : 0,
        }}
      >
        {/* Top-Left: Fixed label "Nithin / Portfolio 2026", visible only when scrollY <= 80px */}
        <div
          className="transition-all duration-200 ease-out select-none pr-3"
          style={{
            opacity: isAtTop ? 1 : 0,
            transform: isAtTop ? 'translateY(0)' : 'translateY(-8px)',
            pointerEvents: isAtTop ? 'auto' : 'none',
          }}
        >
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('home')
            }}
            aria-label="Return to top"
            className="whitespace-nowrap font-mono text-[11px] sm:text-xs md:text-sm tracking-wide text-[#E8DDD3]/90 hover:text-[#F2C14E] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded px-1 block"
          >
            Nithin / Portfolio 2026
          </a>
        </div>

        {/* Top-Right: Desktop Nav Links (>=768px) with real <a href> links */}
        <nav
          aria-label="Main"
          className="hidden md:flex items-center gap-6 sm:gap-8 font-mono text-xs sm:text-sm tracking-wider text-[#E8DDD3]/80 pointer-events-auto"
        >
          {/* 1. Home */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('home')
            }}
            aria-current={activeSection === 'home' ? 'page' : undefined}
            className={`relative py-1 hover:text-[#F2C14E] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded ${
              activeSection === 'home'
                ? 'text-[#F2C14E] font-medium border-b border-[#F2C14E]'
                : 'text-[#E8DDD3]/80'
            }`}
          >
            Home
          </a>

          {/* 2. About */}
          <a
            href="/#about"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('about')
            }}
            aria-current={activeSection === 'about' ? 'page' : undefined}
            className={`relative py-1 hover:text-[#F2C14E] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded ${
              activeSection === 'about'
                ? 'text-[#F2C14E] font-medium border-b border-[#F2C14E]'
                : 'text-[#E8DDD3]/80'
            }`}
          >
            About
          </a>

          {/* 3. Work */}
          <a
            href="/projects"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('work')
            }}
            aria-current={activeSection === 'work' ? 'page' : undefined}
            className={`relative py-1 hover:text-[#F2C14E] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded ${
              activeSection === 'work'
                ? 'text-[#F2C14E] font-medium border-b border-[#F2C14E]'
                : 'text-[#E8DDD3]/80'
            }`}
          >
            Work
          </a>

          {/* 4. Contact */}
          <a
            href="/#contact"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('contact')
            }}
            aria-current={activeSection === 'contact' ? 'page' : undefined}
            className={`relative py-1 hover:text-[#F2C14E] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded ${
              activeSection === 'contact'
                ? 'text-[#F2C14E] font-medium border-b border-[#F2C14E]'
                : 'text-[#E8DDD3]/80'
            }`}
          >
            Contact
          </a>
        </nav>

        {/* Mobile menu trigger (<768px) */}
        <div className="md:hidden pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="font-mono text-xs uppercase tracking-wider text-[#E8DDD3] hover:text-[#F2C14E] transition-colors px-3 py-1.5 rounded border border-[#E8DDD3]/20 bg-[#140C0D]/80 backdrop-blur-sm cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E]"
          >
            menu
          </button>
        </div>
      </header>

      {/* Full-screen Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeItem={activeSection}
        onSelect={handleNavClick}
      />
    </>
  )
}
