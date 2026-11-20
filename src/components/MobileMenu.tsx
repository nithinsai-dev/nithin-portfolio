import { useEffect, useRef } from 'react'
import { set3DRenderPaused } from '../hooks/useObjectMotion'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  activeItem: 'home' | 'about' | 'work' | 'contact'
  onSelect: (item: 'home' | 'about' | 'work' | 'contact') => void
}

const NAV_ITEMS: { id: 'home' | 'about' | 'work' | 'contact'; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
]

export default function MobileMenu({
  isOpen,
  onClose,
  activeItem,
  onSelect,
}: MobileMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const firstButtonRef = useRef<HTMLButtonElement>(null)

  // Body scroll lock, Escape key listener, and 3D render pause
  useEffect(() => {
    if (!isOpen) return

    set3DRenderPaused(true)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Tab' && containerRef.current) {
        // Focus trap
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === last) {
            first.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    firstButtonRef.current?.focus()

    return () => {
      set3DRenderPaused(false)
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className="fixed inset-0 z-[100] bg-[#140C0D] flex flex-col justify-between p-6 sm:p-10 text-[#E8DDD3] select-none pointer-events-auto"
    >
      {/* Top Header inside overlay */}
      <div className="w-full flex items-center justify-between">
        <span className="font-mono text-xs tracking-widest text-[#E8DDD3]/50 uppercase">
          // menu
        </span>
        <button
          ref={firstButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="font-mono text-xs uppercase tracking-wider text-[#E8DDD3]/80 hover:text-[#F2C14E] transition-colors p-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded cursor-pointer"
        >
          [close ×]
        </button>
      </div>

      {/* 4 Large Links */}
      <nav aria-label="Mobile Navigation" className="flex flex-col gap-6 my-auto">
        {NAV_ITEMS.map((item, idx) => {
          const isActive = activeItem === item.id
          const href =
            item.id === 'home'
              ? '/'
              : item.id === 'about'
              ? '/#about'
              : item.id === 'work'
              ? '/projects'
              : '/#contact'

          return (
            <a
              key={item.id}
              href={href}
              onClick={(e) => {
                e.preventDefault()
                onClose()
                onSelect(item.id)
              }}
              aria-current={isActive ? 'page' : undefined}
              className="text-left font-heading font-extrabold text-5xl sm:text-6xl text-[#E8DDD3] hover:text-[#F2C14E] transition-colors flex items-center gap-4 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C14E] rounded-lg p-1"
            >
              <span className="font-mono text-xs text-[#F2C14E] tracking-widest">
                0{idx + 1}
              </span>
              <span className={isActive ? 'text-[#F2C14E]' : ''}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#F2C14E] ml-2 inline-block" />
              )}
            </a>
          )
        })}
      </nav>

      {/* Bottom Footer inside overlay */}
      <div className="w-full flex items-center justify-between border-t border-[#201415] pt-4 font-mono text-[11px] text-[#E8DDD3]/40">
        <span>Nithin Sai · Portfolio 2026</span>
        <span>Esc to close</span>
      </div>
    </div>
  )
}
