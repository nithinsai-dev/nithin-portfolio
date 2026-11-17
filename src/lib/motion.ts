// Shared motion configurations and transitions for smooth staggered reveals
export const easeCustom = [0.25, 0.1, 0.25, 1] as const
export const easeOutQuart = [0.16, 1, 0.3, 1] as const

export const staggerStandard = 0.08 // 80ms stagger
export const staggerChips = 0.04 // 40ms stagger for chip tags

export const motionVariants = {
  rise: {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay,
        ease: easeCustom,
      },
    }),
  },
  mask: {
    hidden: { y: '100%', opacity: 0 },
    visible: (delay = 0) => ({
      y: '0%',
      opacity: 1,
      transition: {
        duration: 0.8,
        delay,
        ease: easeOutQuart,
      },
    }),
  },
  line: {
    hidden: { scaleX: 0 },
    visible: (delay = 0) => ({
      scaleX: 1,
      transition: {
        duration: 0.65,
        delay,
        ease: easeCustom,
      },
    }),
  },
}
