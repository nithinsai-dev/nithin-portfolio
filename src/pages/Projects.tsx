import React, { useState, useEffect } from 'react'
import { loadProjects, Project } from '../lib/loadProjects'
import { contactContent } from '../content/contact'
import Reveal from '../components/Reveal'
import ProjectRow from '../components/work/ProjectRow'
import HoverPreview from '../components/work/HoverPreview'
import SiteFooter from '../components/contact/SiteFooter'
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities'
import { safeUrl } from '../lib/safeUrl'

export default function Projects() {
  const { canRun3D } = useDeviceCapabilities()
  const [projects] = useState<Project[]>(() => loadProjects())
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  // Route title update for /projects
  useEffect(() => {
    const originalTitle = document.title
    document.title = 'Projects — Nithin Sai'
    return () => {
      document.title = originalTitle
    }
  }, [])

  // Hover state for floating preview
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null)
  const [mousePos, setMousePos] = useState({ x: -9999, y: -9999 })
  const [rowRatio, setRowRatio] = useState(0.5)
  const [isHoveringRow, setIsHoveringRow] = useState(false)

  // Reset hover state on unmount / route leave
  useEffect(() => {
    return () => {
      setIsHoveringRow(false)
      setHoveredProject(null)
      setMousePos({ x: -9999, y: -9999 })
    }
  }, [])

  // GitHub URL from contactContent (sanitized with safeUrl)
  const rawGithub =
    contactContent.socialLinks.find((s) => s.name.toLowerCase() === 'github')?.url ||
    'https://github.com'
  const githubLink = safeUrl(rawGithub)

  // Initialize expanded row from URL hash or default to first project
  useEffect(() => {
    if (projects.length === 0) return

    const initialHash = window.location.hash.replace(/^#/, '').toLowerCase()
    const matchingProject = projects.find((p) => p.slug.toLowerCase() === initialHash)

    if (matchingProject) {
      setExpandedSlug(matchingProject.slug)
      // Scroll into view gently after layout settles
      setTimeout(() => {
        const el = document.getElementById(matchingProject.slug)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else {
      // Default: first project is expanded on load
      setExpandedSlug(projects[0].slug)
    }
  }, [projects])

  // Sync back/forward button for hashes within /projects and Esc key to close
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '').toLowerCase()
      if (!hash) {
        setExpandedSlug(null)
      } else {
        const match = projects.find((p) => p.slug.toLowerCase() === hash)
        if (match) {
          setExpandedSlug(match.slug)
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedSlug(null)
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [projects])

  const handleToggleRow = (slug: string) => {
    if (expandedSlug === slug) {
      // Close row: remove hash without triggering curtain
      setExpandedSlug(null)
      window.history.replaceState(null, '', window.location.pathname)
    } else {
      // Open row: update hash without triggering curtain
      setExpandedSlug(slug)
      window.history.replaceState(null, '', `${window.location.pathname}#${slug}`)
    }
  }

  const handleRowMouseMove = (e: React.MouseEvent, project: Project) => {
    const currentTarget = e.currentTarget as HTMLElement
    const rect = currentTarget.getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    const ratio = rect.width > 0 ? Math.max(0, Math.min(1, relativeX / rect.width)) : 0.5

    setMousePos({ x: e.clientX, y: e.clientY })
    setRowRatio(ratio)
    setHoveredProject(project)
    setIsHoveringRow(true)
  }

  const handleRowMouseLeave = () => {
    setIsHoveringRow(false)
    setHoveredProject(null)
    setMousePos({ x: -9999, y: -9999 })
  }

  const counterStr = `${String(projects.length).padStart(2, '0')} projects`

  return (
    <div className="relative min-h-screen bg-[#140C0D] text-[#E8DDD3] flex flex-col justify-between selection:bg-[#F2C14E] selection:text-[#140C0D]">
      {/* Subtle Grain Overlay: Only rendered on capable devices */}
      {canRun3D && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-10 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Main Content Area */}
      <main
        id="main"
        className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 md:px-14 pt-32 sm:pt-40 pb-24 flex flex-col flex-1"
      >
        {/* Header Section */}
        <header className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 border-b border-[#E8DDD3]/10">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs sm:text-sm text-[#F2C14E] tracking-widest uppercase">
              // projects
            </span>
            {/* LCP Heading: Visible on first paint immediately without observer delay */}
            <h1 className="font-heading font-extrabold text-[clamp(56px,9vw,150px)] leading-[0.88] text-[#E8DDD3] tracking-tight">
              Selected work.
            </h1>
          </div>

          <div className="shrink-0 md:pb-3">
            <span className="font-mono text-xs sm:text-sm text-[#E8DDD3]/60 tracking-widest uppercase">
              {counterStr}
            </span>
          </div>
        </header>

        {/* The Index: Project Rows separated by 1px hairlines */}
        <div className="w-full flex flex-col">
          {projects.map((project, idx) => (
            <React.Fragment key={project.slug}>
              <ProjectRow
                project={project}
                index={idx}
                isExpanded={expandedSlug === project.slug}
                isHovered={hoveredProject?.slug === project.slug}
                isAnyHovered={isHoveringRow}
                onToggle={() => handleToggleRow(project.slug)}
                onMouseEnter={(e) => handleRowMouseMove(e, project)}
                onMouseMove={(e) => handleRowMouseMove(e, project)}
                onMouseLeave={handleRowMouseLeave}
              />
              {/* Hairline Separator with line reveal */}
              <Reveal variant="line" delay={idx * 0.05} />
            </React.Fragment>
          ))}
        </div>

        {/* Page End Link: More on GitHub -> */}
        {githubLink && (
          <div className="w-full pt-16 pb-8 flex items-center justify-start">
            <a
              href={githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs sm:text-sm text-[#E8DDD3]/80 hover:text-[#F2C14E] hover:underline underline-offset-4 decoration-[#F2C14E] transition-colors inline-flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded px-1.5 py-1"
            >
              <span>More on GitHub</span>
              <span className="text-[#F2C14E] group-hover:translate-x-1.5 transition-transform duration-200">
                &rarr;
              </span>
            </a>
          </div>
        )}
      </main>

      {/* Floating Hover Preview (Desktop fine pointer only) */}
      <HoverPreview
        project={hoveredProject}
        mouseX={mousePos.x}
        mouseY={mousePos.y}
        rowRatio={rowRatio}
        isVisible={isHoveringRow}
      />

      {/* Site Footer */}
      <div className="relative z-20 w-full">
        <SiteFooter />
      </div>
    </div>
  )
}
