import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from 'motion/react'

interface ScrollTextFillProps {
  text: string
  className?: string
}

interface WordProps {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}

function Word({ children, progress, range }: WordProps) {
  const color = useTransform(progress, range, ['#5A4A47', '#E8DDD3'])

  return (
    <motion.span style={{ color }} className="inline-block mr-[0.28em]">
      {children}
    </motion.span>
  )
}

export default function ScrollTextFill({ text, className = '' }: ScrollTextFillProps) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'end 0.45'],
  })

  const words = text.split(/\s+/).filter(Boolean)

  if (shouldReduceMotion) {
    return (
      <p className={`text-[#E8DDD3] ${className}`}>
        {text}
      </p>
    )
  }

  return (
    <p ref={containerRef} className={`leading-relaxed select-none ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length
        const end = Math.min(1, start + 1.5 / words.length)
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        )
      })}
    </p>
  )
}
