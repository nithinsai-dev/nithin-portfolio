import { Project } from '../../lib/loadProjects'
import { safeUrl } from '../../lib/safeUrl'
import SplitImage from './SplitImage'

interface ProjectDetailProps {
  project: Project
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const liveUrl = project.links.live ? safeUrl(project.links.live) : null
  const githubUrl = project.links.github ? safeUrl(project.links.github) : null
  const caseStudyUrl = project.links.caseStudy ? safeUrl(project.links.caseStudy) : null

  const hasLinks = !!(liveUrl || githubUrl || caseStudyUrl)

  return (
    <div className="w-full pt-4 pb-8 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start select-text">
      {/* Left Column (~58%): Visual with Draggable Builder/Breaker Split */}
      <div className="w-full lg:w-[58%] select-none">
        <SplitImage project={project} />
      </div>

      {/* Right Column (~42%): Project Information */}
      <div className="w-full lg:w-[42%] flex flex-col gap-6 select-text">
        {/* 1. Problem */}
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs text-[#F2C14E] tracking-widest uppercase">
            // problem
          </span>
          <p className="font-sans text-sm sm:text-base text-[#E8DDD3]/90 leading-relaxed m-0">
            {project.problem}
          </p>
        </div>

        {/* 2. What I built (Includes role) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#F2C14E] tracking-widest uppercase">
              // what I built
            </span>
            {project.role && project.role !== 'TODO' && (
              <span className="font-mono text-[11px] text-[#E8DDD3]/60 bg-[#201415] px-2 py-0.5 rounded border border-[#E8DDD3]/15">
                role: {project.role}
              </span>
            )}
          </div>
          <p className="font-sans text-sm sm:text-base text-[#E8DDD3]/90 leading-relaxed m-0 whitespace-pre-line">
            {project.built}
          </p>
        </div>

        {/* 3. Stack Chips (solid like Now/Next chips) */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs text-[#F2C14E] tracking-widest uppercase">
            // stack
          </span>
          <div className="flex flex-wrap gap-2">
            {project.stack.map((item, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded bg-[#201415] border border-[#E8DDD3]/20 font-mono text-xs text-[#E8DDD3] tracking-wide"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* 4. Breaker's Note (Only if present!) */}
        {project.breakerNote && (
          <div className="border-l-2 border-[#F2C14E] pl-4 py-2 bg-[#F2C14E]/5 rounded-r">
            <div className="font-mono text-[11px] text-[#F2C14E] tracking-widest uppercase mb-1">
              // breaker&apos;s note
            </div>
            <p className="font-mono text-xs sm:text-sm text-[#E8DDD3]/90 leading-relaxed m-0 whitespace-pre-line">
              {project.breakerNote}
            </p>
          </div>
        )}

        {/* 5. Links Row */}
        {hasLinks && (
          <div className="pt-2 flex flex-wrap items-center gap-6 font-mono text-xs sm:text-sm">
            {liveUrl && (
              <a
                href={liveUrl}
                target={liveUrl.startsWith('https:') ? '_blank' : undefined}
                rel={liveUrl.startsWith('https:') ? 'noopener noreferrer' : undefined}
                className="text-[#E8DDD3] hover:text-[#F2C14E] hover:underline underline-offset-4 decoration-[#F2C14E] transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded px-1"
              >
                <span>Live</span>
                <span className="text-[#F2C14E]">&nearr;</span>
              </a>
            )}

            {githubUrl && (
              <a
                href={githubUrl}
                target={githubUrl.startsWith('https:') ? '_blank' : undefined}
                rel={githubUrl.startsWith('https:') ? 'noopener noreferrer' : undefined}
                className="text-[#E8DDD3] hover:text-[#F2C14E] hover:underline underline-offset-4 decoration-[#F2C14E] transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded px-1"
              >
                <span>GitHub</span>
                <span className="text-[#F2C14E]">&nearr;</span>
              </a>
            )}

            {caseStudyUrl && (
              <a
                href={caseStudyUrl}
                target={caseStudyUrl.startsWith('https:') ? '_blank' : undefined}
                rel={caseStudyUrl.startsWith('https:') ? 'noopener noreferrer' : undefined}
                className="text-[#E8DDD3] hover:text-[#F2C14E] hover:underline underline-offset-4 decoration-[#F2C14E] transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C14E] rounded px-1"
              >
                <span>Full case study</span>
                <span className="text-[#F2C14E]">&rarr;</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
