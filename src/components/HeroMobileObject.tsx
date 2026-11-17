import { useState } from 'react'

interface HeroMobileObjectProps {
  variant: 'solid' | 'wire'
}

export default function HeroMobileObject({ variant }: HeroMobileObjectProps) {
  const [wireFailed, setWireFailed] = useState(false)
  const isWire = variant === 'wire'

  return (
    <>
      <style>{`
        @keyframes mobileSphereFloat {
          0%, 100% {
            transform: translate(-50%, -6px);
          }
          50% {
            transform: translate(-50%, 6px);
          }
        }
        .mobile-hero-object {
          position: absolute;
          left: 50%;
          top: 14svh;
          width: 76vw;
          max-width: 340px;
          max-height: 46svh;
          aspect-ratio: 1 / 1;
          pointer-events: none;
          user-select: none;
          animation: mobileSphereFloat 7s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mobile-hero-object {
            animation: none !important;
            transform: translate(-50%, 0) !important;
          }
        }
        @media (min-width: 768px) {
          .mobile-hero-object {
            display: none !important;
          }
        }
      `}</style>
      <div className="mobile-hero-object" aria-hidden="true">
        {isWire ? (
          <img
            src={wireFailed ? '/hero/hero-solid.webp' : '/hero/hero-wire.webp'}
            width="1000"
            height="1000"
            decoding="async"
            fetchPriority="high"
            alt=""
            aria-hidden="true"
            onError={() => setWireFailed(true)}
            className="w-full h-full object-contain pointer-events-none select-none"
            style={
              wireFailed
                ? { filter: 'grayscale(1) brightness(0.6) contrast(1.3)' }
                : undefined
            }
          />
        ) : (
          <img
            src="/hero/hero-solid.webp"
            width="1000"
            height="1000"
            decoding="async"
            fetchPriority="high"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        )}
      </div>
    </>
  )
}
