import { lazy, Suspense } from 'react'
import HeroMobileObject from './HeroMobileObject'
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities'
import { useIsMobile } from '../hooks/useIsMobile'

const WireframeBackground = lazy(() => import('./WireframeBackground'))

interface HeroContentProps {
  mode: 'builder' | 'breaker'
}

export default function HeroContent({ mode }: HeroContentProps) {
  const isBreaker = mode === 'breaker'
  const { canRun3D } = useDeviceCapabilities()
  const isMobile = useIsMobile()

  return (
    <>
      <style>{`
        /* Desktop default rules (768px and up) */
        .hero-name {
          font-size: 20vw;
          line-height: 0.8;
          letter-spacing: -0.02em;
        }
        @media (min-width: 640px) {
          .hero-name {
            font-size: 19vw;
          }
        }
        @media (min-width: 1024px) {
          .hero-name {
            font-size: 18vw;
          }
        }

        .hero-tagline {
          font-size: clamp(14px, 1.05vw, 20px);
        }

        /* Breaker Layer Overlays & Labels (All strictly max-content, 11px mono, pointer-events none) */
        .breaker-tag, .breaker-size-label {
          position: absolute;
          pointer-events: none;
          display: inline-block !important;
          width: max-content !important;
          height: auto !important;
          white-space: nowrap !important;
          padding: 2px 8px !important;
          font-family: var(--font-mono, monospace) !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
          flex: none !important;
          min-height: 0 !important;
          box-sizing: border-box;
          z-index: 30;
        }

        .breaker-size-label {
          color: rgba(232, 221, 211, 0.6);
          background-color: #201415;
          border: 1px solid rgba(232, 221, 211, 0.2);
        }

        .breaker-tag-yellow {
          color: #F2C14E;
          background-color: #201415;
          border: 1px solid rgba(242, 193, 78, 0.7);
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        /* Strictly scoped mobile rules (max-width: 767px) */
        @media (max-width: 767px) {
          .hero-main-container {
            padding: 1.5rem !important;
          }
          .hero-bottom-row {
            position: absolute !important;
            top: 60svh !important;
            left: 0 !important;
            width: 100% !important;
            padding-left: 4vw !important;
            padding-right: 4vw !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            padding-bottom: max(1.25rem, env(safe-area-inset-bottom)) !important;
            gap: 0.75rem !important;
            z-index: 20 !important;
          }
          .hero-name {
            font-size: 27vw !important;
            line-height: 0.8 !important;
            letter-spacing: -0.02em !important;
            white-space: nowrap !important;
          }
          .hero-tagline {
            font-size: max(13px, 3.6vw) !important;
            white-space: nowrap !important;
          }
        }
      `}</style>

      <div
        className={`hero-main-container relative w-full h-full flex flex-col justify-between p-6 sm:p-10 md:p-14 bg-transparent text-[#E8DDD3] select-none ${isBreaker ? 'pointer-events-none' : ''
          }`}
      >
        {/* 3D Wireframe Mesh Background - Loaded dynamically ONLY on desktop in Breaker mode when 3D is allowed */}
        {isBreaker && canRun3D && !isMobile && (
          <Suspense fallback={null}>
            <WireframeBackground />
          </Suspense>
        )}

        {/* Mobile Pre-rendered Hero Object (Solid in builder, Wire in breaker) - Strictly below 768px */}
        {isMobile && (
          <HeroMobileObject variant={isBreaker ? 'wire' : 'solid'} />
        )}

        {/* Top Header Row (z-20 sits above 3D canvases) */}
        <div className="relative w-full flex items-start justify-between z-20">
          {/* Top-left: reserve exact layout space for breaker x-ray box, but keep text hidden so SiteNav's fixed label is clean */}
          <div className="relative inline-block">
            <div className="font-mono text-xs sm:text-sm tracking-wide text-[#E8DDD3]/90 opacity-0 pointer-events-none select-none">
              Nithin / Portfolio 2026
            </div>

            {/* Breaker X-Ray Overlay: Desktop only (strictly excluded on mobile) */}
            {isBreaker && (
              <div className="hidden md:block absolute -inset-1 border border-dashed border-[#E8DDD3]/40 pointer-events-none">
                <span
                  className="breaker-size-label"
                  style={{ top: '-14px', left: '0px' }}
                >
                  w:186 h:26
                </span>
                <span
                  className="breaker-tag breaker-tag-yellow"
                  style={{ top: 'calc(100% + 6px)', left: '4px' }}
                >
                  CORS: * ?
                </span>
              </div>
            )}
          </div>

          {/* Top-right: Real nav is rendered by global <SiteNav>. In breaker mode on desktop, keep decorative X-ray overlay */}
          {isBreaker ? (
            <div className="relative inline-block w-[320px] sm:w-[340px] h-[32px] pointer-events-none">
              <div className="hidden md:block absolute -inset-1.5 border border-dashed border-[#E8DDD3]/40 pointer-events-none">
                <span
                  className="breaker-size-label"
                  style={{ top: '-14px', right: '0px' }}
                >
                  w:340 h:32
                </span>
                <span
                  className="breaker-tag breaker-tag-yellow"
                  style={{ top: 'calc(100% + 6px)', right: '4px' }}
                >
                  JWT: expires?
                </span>
              </div>
            </div>
          ) : (
            <div className="w-[320px] sm:w-[340px] h-[32px] pointer-events-none" />
          )}
        </div>

        {/* Large empty spacer on desktop */}
        <div className="flex-1" />

        {/* Bottom Row:
            Desktop: Name + Subtitle on bottom-left
            Mobile: Positioned at 60svh, 4vw padding, stacking Name -> Tagline */}
        <div className="hero-bottom-row relative w-full flex flex-col sm:flex-row sm:items-end justify-between gap-6 z-20">
          {/* Bottom-left: Name + Tagline */}
          <div className="flex flex-col -ml-[1vw]">
            <div className="relative inline-block">
              {isBreaker ? (
                <span
                  aria-hidden="true"
                  className="hero-name font-heading font-extrabold m-0 select-none text-stroke-sand block"
                >
                  NITHIN
                </span>
              ) : (
                <h1 className="hero-name font-heading font-extrabold m-0 select-none text-[#E8DDD3] block">
                  NITHIN
                </h1>
              )}

              {/* Breaker X-Ray Overlay:
                  Desktop: Bounding box with size label + <input> tag
                  Mobile: Dashed box around name only with <input> tag (no size label) */}
              {isBreaker && (
                <div className="absolute -inset-2 border border-dashed border-[#E8DDD3]/40 pointer-events-none">
                  <span
                    className="hidden md:inline-block breaker-size-label"
                    style={{ top: '-14px', left: '0px' }}
                  >
                    w:1240 h:310
                  </span>
                  <span
                    className="breaker-tag breaker-tag-yellow"
                    style={{
                      top: '-14px',
                      left: isMobile ? '0px' : '120px',
                    }}
                  >
                    &lt;input&gt; unsanitized?
                  </span>
                </div>
              )}
            </div>

            <div className="relative inline-block mt-3 sm:mt-4 ml-1">
              <p className="hero-tagline font-mono text-[#E8DDD3]/80 tracking-wider m-0">
                full-stack · agentic AI · appsec
              </p>

              {/* Breaker Subtitle bounding box: Desktop only */}
              {isBreaker && (
                <div className="hidden md:block absolute -inset-1 border border-dashed border-[#E8DDD3]/30 pointer-events-none">
                  <span
                    className="breaker-size-label"
                    style={{ top: '-14px', left: '0px' }}
                  >
                    w:260 h:20
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
