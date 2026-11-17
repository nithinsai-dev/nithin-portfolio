import React, { useState, useRef } from 'react'
import { triggerCoinFlip } from '../../hooks/useObjectMotion'
import { safeUrl } from '../../lib/safeUrl'

interface CopyEmailProps {
  email: string
}

export default function CopyEmail({ email }: CopyEmailProps) {
  const [copied, setCopied] = useState<boolean>(false)
  const [toastPos, setToastPos] = useState<{ x: number; y: number } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)

  const mailtoHref = safeUrl(`mailto:${email}`)

  const handleCopy = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If user holds Ctrl/Cmd or uses middle click, allow default mailto behavior
    if (e.metaKey || e.ctrlKey || e.button !== 0) {
      return
    }

    e.preventDefault()

    // Determine toast position relative to clicked position or link
    const rect = linkRef.current?.getBoundingClientRect()
    if (rect) {
      setToastPos({
        x: Math.min(Math.max(10, e.clientX - rect.left), rect.width),
        y: -10,
      })
    }

    navigator.clipboard.writeText(email)
      .then(() => {
        setCopied(true)
        triggerCoinFlip()
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          setCopied(false)
        }, 1500)
      })
      .catch(() => {
        triggerCoinFlip()
        // Fallback: trigger normal mailto link
        window.location.href = `mailto:${email}`
      })
  }

  if (!mailtoHref) {
    return (
      <div className="relative inline-flex items-center">
        <span className="font-sans font-medium text-[clamp(22px,2.6vw,44px)] text-[#E8DDD3]/40 select-none py-1">
          {email}
        </span>
      </div>
    )
  }

  return (
    <div className="relative inline-flex items-center">
      <a
        ref={linkRef}
        href={mailtoHref}
        onClick={handleCopy}
        aria-label={`Copy email ${email} or click to send email`}
        data-cursor="pointer"
        className="group relative inline-block font-sans font-medium text-[clamp(22px,2.6vw,44px)] text-[#E8DDD3] hover:text-[#F2C14E] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded py-1"
      >
        <span>{email}</span>

        {/* Drawn Underline on Hover */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full h-[2px] bg-[#F2C14E] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
        />
      </a>

      {/* "copied" Toast near cursor / email for 1.5s */}
      {toastPos && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute z-30 pointer-events-none transition-all duration-200 ease-out ${
            copied ? 'opacity-100 -translate-y-10 scale-100' : 'opacity-0 translate-y-0 scale-95'
          }`}
          style={{
            left: `${toastPos.x}px`,
            top: `${toastPos.y}px`,
          }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#201415] border border-[#F2C14E]/50 text-[#F2C14E] font-mono text-xs shadow-lg shadow-black/80 backdrop-blur-md whitespace-nowrap -translate-x-1/2">
            <span>copied to clipboard</span>
            <span>&check;</span>
          </div>
        </div>
      )}
    </div>
  )
}
