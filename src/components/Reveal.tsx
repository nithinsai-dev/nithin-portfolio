import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { easeCustom, easeOutQuart } from '../lib/motion'

interface RevealProps {
  children?: React.ReactNode
  variant?: 'rise' | 'mask' | 'line'
  delay?: number
  className?: string
}

export default function Reveal({
  children,
  variant = 'rise',
  delay = 0,
  className = '',
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    if (variant === 'line') {
      return <div className={`h-[1px] bg-[#E8DDD3]/15 w-full ${className}`} />
    }
    return <div className={className}>{children}</div>
  }

  if (variant === 'line') {
    return (
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.65, delay, ease: easeCustom }}
        className={`h-[1px] bg-[#E8DDD3]/15 w-full origin-left ${className}`}
      />
    )
  }

  if (variant === 'mask') {
    return (
      <div className={`overflow-hidden ${className}`}>
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          whileInView={{ y: '0%', opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay, ease: easeOutQuart }}
        >
          {children}
        </motion.div>
      </div>
    )
  }

  // Default 'rise' variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: easeCustom }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
