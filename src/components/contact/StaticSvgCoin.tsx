import { COIN_SYMBOL } from '../../lib/coinConfig'

interface StaticSvgCoinProps {
  size?: number
}

export default function StaticSvgCoin({ size = 96 }: StaticSvgCoinProps) {
  return (
    <div
      className="inline-block pointer-events-none select-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_16px_rgba(242,193,78,0.25)]"
      >
        <defs>
          {/* Subtle gold gradient for coin face */}
          <radialGradient id="contact-coin-grad" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#FBD67A" />
            <stop offset="60%" stopColor="#F2C14E" />
            <stop offset="100%" stopColor="#C9982E" />
          </radialGradient>
          {/* Edge shadow */}
          <linearGradient id="contact-coin-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F2C14E" />
            <stop offset="100%" stopColor="#8A641A" />
          </linearGradient>
        </defs>

        {/* Outer Coin Body */}
        <circle cx="50" cy="50" r="46" fill="url(#contact-coin-grad)" stroke="#1A0F10" strokeWidth="2.5" />

        {/* Outer Inset Rim */}
        <circle cx="50" cy="50" r="41" stroke="#E5B33E" strokeWidth="1.2" fill="none" opacity="0.8" />

        {/* Inner Decorative Ring */}
        <circle cx="50" cy="50" r="34" stroke="#1A0F10" strokeWidth="1" fill="none" opacity="0.6" />

        {/* Coin Symbol: "chevrons" or "N" (solid #1A0F10 dark wine) */}
        {COIN_SYMBOL === 'chevrons' ? (
          <g
            stroke="#1A0F10"
            strokeWidth="3.2"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            fill="none"
          >
            {/* Top Chevron */}
            <polyline points="38,40 50,30 62,40" />
            {/* Middle Chevron */}
            <polyline points="38,52 50,42 62,52" />
            {/* Bottom Chevron */}
            <polyline points="38,64 50,54 62,64" />
          </g>
        ) : (
          <text
            x="50"
            y="52"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#1A0F10"
            fontFamily="Bricolage Grotesque, sans-serif"
            fontWeight="800"
            fontSize="36"
          >
            N
          </text>
        )}
      </svg>
    </div>
  )
}
