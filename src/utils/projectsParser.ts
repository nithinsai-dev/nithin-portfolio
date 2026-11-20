export interface ProjectItem {
  id: string // e.g. "01"
  title: string
  slug: string
  tagline: string
  year: string
  role: string
  status?: 'completed' | 'building'
  stack: string[]
  repo?: string
  live?: string
  image?: string
  xray?: string
  problem: string
  built: string
  outcome: string
}

export function parseProjectsMarkdown(markdown: string): ProjectItem[] {
  const projects: ProjectItem[] = []
  if (!markdown) return projects

  // Split by markdown h2 headers (## )
  const rawSections = markdown.split(/\n(?=##\s+)/g)

  let projectIndex = 0
  rawSections.forEach((sectionStr) => {
    const trimmed = sectionStr.trim()
    if (!trimmed || !trimmed.startsWith('##')) return

    projectIndex++
    const lines = trimmed.split('\n')
    const headerLine = lines[0].replace(/^##\s+/, '').trim()
    const id = String(projectIndex).padStart(2, '0')

    const project: ProjectItem = {
      id,
      title: headerLine || `Project ${id}`,
      slug: `project-${projectIndex}`,
      tagline: 'TODO one-line summary',
      year: '2026',
      role: 'TODO',
      status: 'completed',
      stack: ['TODO'],
      problem: 'TODO',
      built: 'TODO',
      outcome: '∴ TODO',
    }

    let currentSection: 'meta' | 'problem' | 'built' | 'outcome' = 'meta'
    const sectionBuffers: Record<'problem' | 'built' | 'outcome', string[]> = {
      problem: [],
      built: [],
      outcome: [],
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      if (trimmedLine.startsWith('### Problem')) {
        currentSection = 'problem'
        continue
      } else if (trimmedLine.startsWith('### Built')) {
        currentSection = 'built'
        continue
      } else if (trimmedLine.startsWith('### Outcome')) {
        currentSection = 'outcome'
        continue
      }

      if (currentSection === 'meta') {
        const bulletMatch = line.match(/^\s*-\s*([a-zA-Z0-9_-]+)\s*:\s*(.*)$/)
        if (bulletMatch) {
          const key = bulletMatch[1].toLowerCase()
          const val = bulletMatch[2].trim()

          switch (key) {
            case 'slug':
              if (val) project.slug = val
              break
            case 'tagline':
              if (val) project.tagline = val
              break
            case 'year':
              if (val) project.year = val
              break
            case 'role':
              if (val) project.role = val
              break
            case 'status':
              if (val.toLowerCase() === 'building') {
                project.status = 'building'
              } else {
                project.status = 'completed'
              }
              break
            case 'stack':
              if (val) {
                project.stack = val
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              }
              break
            case 'repo':
              if (val && !val.includes('(leave empty') && !val.includes('TODO')) {
                project.repo = val
              } else if (val && val.startsWith('http')) {
                project.repo = val
              }
              break
            case 'live':
              if (val && !val.includes('(leave empty') && val.startsWith('http')) {
                project.live = val
              }
              break
            case 'image':
              if (val && !val.includes('(optional path')) {
                project.image = val
              }
              break
            case 'xray':
              if (val && !val.includes('(optional path')) {
                project.xray = val
              }
              break
          }
        }
      } else {
        sectionBuffers[currentSection].push(line)
      }
    }

    const problemText = sectionBuffers.problem.join('\n').trim()
    if (problemText) project.problem = problemText

    const builtText = sectionBuffers.built.join('\n').trim()
    if (builtText) project.built = builtText

    const outcomeText = sectionBuffers.outcome.join('\n').trim()
    if (outcomeText) {
      // Ensure outcome starts with ∴
      project.outcome = outcomeText.startsWith('∴')
        ? outcomeText
        : `∴ ${outcomeText}`
    }

    projects.push(project)
  })

  return projects
}
