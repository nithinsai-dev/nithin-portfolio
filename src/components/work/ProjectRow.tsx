import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Project } from '../../lib/loadProjects'
import ProjectDetail from './ProjectDetail'

interface ProjectRowProps {
  project: Project
  index: number
  isExpanded: boolean
  isHovered: boolean
  isAnyHovered: boolean
  onToggle: () => void
  onMouseEnter: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseLeave: () => void
}

const EXPO_OUT = [0.16, 1, 0.3, 1] as const

export default function ProjectRow({
  project,
  index,
  isExpanded,
  isHovered,
  isAnyHovered,
  onToggle,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
}: ProjectRowProps) {
  const numberStr = String(index + 1).padStart(2, '0')
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Dim other rows to 40% when another row is hovered
  const opacityClass =
    isAnyHovered && !isHovered ? 'opacity-40' : 'opacity-100'

  return (
    <article
      id={project.slug}
      className={`w-full transition-opacity duration-200 ${opacityClass}`}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Collapsed Row Header: Real Button */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`project-detail-${project.slug}`}
        data-cursor-label={isExpanded ? 'close' : 'open'}
        className="w-full py-7 sm:py-9 flex flex-col md:flex-row md:items-center justify-between gap-5 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded-md px-1 select-none"
      >
        {/* Left Side: Mono Number (yellow) + Title (Bricolage Grotesque 800, sand) */}
        <div className="flex items-baseline gap-4 sm:gap-6 min-w-0">
          <span className="font-mono text-sm sm:text-base text-[#F2C14E] font-medium tracking-widest shrink-0">
            {numberStr}
          </span>
          <h2 className="font-heading font-extrabold text-[clamp(34px,5.5vw,92px)] leading-[0.95] text-[#E8DDD3] group-hover:text-[#F2C14E] transition-colors tracking-tight truncate">
            {project.title}
          </h2>
        </div>

        {/* Right Side: Year, Status Pill, One-line summary, Stack chips */}
        <div className="flex flex-col md:items-end gap-2 md:text-right shrink-0 max-w-xl">
          <div className="flex items-center gap-3">
            {/* Year */}
            <span className="font-mono text-xs text-[#E8DDD3]/60 tracking-wider">
              {project.year}
            </span>

            {/* Status Pill */}
            {project.status === 'live' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wider bg-[#F2C14E]/10 border border-[#F2C14E]/40 text-[#F2C14E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F2C14E] animate-pulse" />
                <span>live</span>
              </span>
            )}
            {project.status === 'building' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wider border border-dashed border-[#F2C14E]/60 text-[#F2C14E]">
                building
              </span>
            )}
            {project.status === 'archived' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wider border border-[#E8DDD3]/20 text-[#E8DDD3]/40">
                archived
              </span>
            )}
          </div>

          {/* One-Line Summary */}
          <p className="font-sans text-[clamp(15px,1.05vw,18px)] text-[#E8DDD3]/80 leading-snug m-0">
            {project.oneLine}
          </p>

          {/* Up to 4 Stack Names in Mono (13px) */}
          <div className="flex flex-wrap md:justify-end gap-2 pt-0.5">
            {project.stack.slice(0, 4).map((tech, tIdx) => (
              <span
                key={tIdx}
                className="font-mono text-[13px] text-[#E8DDD3]/60 group-hover:text-[#E8DDD3]/90 transition-colors"
              >
                {tech}
                {tIdx < Math.min(3, project.stack.length - 1) && (
                  <span className="text-[#E8DDD3]/30 ml-2">&middot;</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </button>

      {/* Expanded Row: Smooth Height Animation (0.5s expo-out) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`project-detail-${project.slug}`}
            initial={prefersReduced ? { opacity: 1, height: 'auto' } : { height: 0, opacity: 0 }}
            animate={prefersReduced ? { opacity: 1, height: 'auto' } : { height: 'auto', opacity: 1 }}
            exit={prefersReduced ? { opacity: 0, height: 0 } : { height: 0, opacity: 0 }}
            transition={{
              duration: prefersReduced ? 0.01 : 0.5,
              ease: EXPO_OUT,
            }}
            className="overflow-hidden"
          >
            <ProjectDetail project={project} />
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}
