import rawProjectsMarkdown from '../content/projects.md?raw'
import { safeUrl } from './safeUrl'

export interface Project {
  slug: string
  title: string
  year: string
  status: 'completed' | 'building'
  oneLine: string
  stack: string[]
  role: string
  problem: string
  built: string
  image?: string
  breakerTags: string[]
  breakerNote?: string
  links: {
    live?: string
    github?: string
    caseStudy?: string
  }
}

/**
 * Strips HTML/XML tags and control characters to ensure all parsed content is pure plain text.
 */
function stripTags(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '') // remove HTML/XML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // strip control chars
    .trim()
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface RawParsedEntry {
  slug: string
  title: string
  year: string
  status: string
  oneLine: string
  stack: string[]
  role: string
  problem: string
  built: string
  image?: string
  breakerTags: string[]
  breakerNote?: string
  links: {
    live?: string
    github?: string
    caseStudy?: string
  }
}

/**
 * Hand-written validator for Project entries.
 * Enforces strict types, max lengths, permitted status values, and max array sizes.
 * Invalid entries are skipped with a dev-only warning instead of crashing.
 */
function validateProject(entry: RawParsedEntry, index: number): Project | null {
  // 1. Slug: required, string, max 80 chars, strictly lowercase alphanumeric and hyphens
  if (
    !entry.slug ||
    typeof entry.slug !== 'string' ||
    entry.slug.length > 80 ||
    !/^[a-z0-9-]+$/.test(entry.slug)
  ) {
    if (import.meta.env.DEV) {
      console.warn(`[ProjectsValidator] Entry #${index + 1} skipped: invalid slug "${entry.slug}"`)
    }
    return null
  }

  // 2. Title: required, string, max 80 chars
  if (!entry.title || typeof entry.title !== 'string' || entry.title.length > 80) {
    if (import.meta.env.DEV) {
      console.warn(
        `[ProjectsValidator] Entry #${index + 1} (${entry.slug}) skipped: title exceeds 80 chars or missing`
      )
    }
    return null
  }

  // 3. OneLine: required, string, max 200 chars
  if (!entry.oneLine || typeof entry.oneLine !== 'string' || entry.oneLine.length > 200) {
    if (import.meta.env.DEV) {
      console.warn(
        `[ProjectsValidator] Entry #${index + 1} (${entry.slug}) skipped: oneLine exceeds 200 chars or missing`
      )
    }
    return null
  }

  // 4. Status: allowed values: "completed" | "building" (default "completed")
  const status: 'completed' | 'building' =
    entry.status === 'building' ? 'building' : 'completed'

  // 5. Problem & Built: max 600 chars each
  if (typeof entry.problem !== 'string' || entry.problem.length > 600) {
    if (import.meta.env.DEV) {
      console.warn(
        `[ProjectsValidator] Entry #${index + 1} (${entry.slug}) skipped: problem exceeds 600 chars`
      )
    }
    return null
  }

  if (typeof entry.built !== 'string' || entry.built.length > 600) {
    if (import.meta.env.DEV) {
      console.warn(
        `[ProjectsValidator] Entry #${index + 1} (${entry.slug}) skipped: built exceeds 600 chars`
      )
    }
    return null
  }

  // 6. Year & Role
  if (typeof entry.year !== 'string' || entry.year.length > 10) {
    if (import.meta.env.DEV) {
      console.warn(
        `[ProjectsValidator] Entry #${index + 1} (${entry.slug}) skipped: year exceeds 10 chars`
      )
    }
    return null
  }

  if (typeof entry.role !== 'string' || entry.role.length > 100) {
    if (import.meta.env.DEV) {
      console.warn(
        `[ProjectsValidator] Entry #${index + 1} (${entry.slug}) skipped: role exceeds 100 chars`
      )
    }
    return null
  }

  // 7. Stack: array of strings, at most 10 items, each item max 40 chars
  if (
    !Array.isArray(entry.stack) ||
    entry.stack.length > 10 ||
    !entry.stack.every((s) => typeof s === 'string' && s.length <= 40)
  ) {
    if (import.meta.env.DEV) {
      console.warn(
        `[ProjectsValidator] Entry #${index + 1} (${entry.slug}) skipped: stack invalid or exceeds 10 items`
      )
    }
    return null
  }

  // 8. BreakerTags: array of strings, at most 3 items, each item max 50 chars
  if (
    !Array.isArray(entry.breakerTags) ||
    entry.breakerTags.length > 3 ||
    !entry.breakerTags.every((t) => typeof t === 'string' && t.length <= 50)
  ) {
    if (import.meta.env.DEV) {
      console.warn(
        `[ProjectsValidator] Entry #${index + 1} (${entry.slug}) skipped: breakerTags invalid or exceeds 3 items`
      )
    }
    return null
  }

  // 9. BreakerNote: optional string, max 400 chars
  if (entry.breakerNote && (typeof entry.breakerNote !== 'string' || entry.breakerNote.length > 400)) {
    if (import.meta.env.DEV) {
      console.warn(
        `[ProjectsValidator] Entry #${index + 1} (${entry.slug}) skipped: breakerNote exceeds 400 chars`
      )
    }
    return null
  }

  // 10. Links and image URL sanitization via safeUrl
  const validLive = entry.links.live ? safeUrl(entry.links.live) || undefined : undefined
  const validGithub = entry.links.github ? safeUrl(entry.links.github) || undefined : undefined
  const validCaseStudy = entry.links.caseStudy ? safeUrl(entry.links.caseStudy) || undefined : undefined
  const validImage = entry.image ? safeUrl(entry.image) || undefined : undefined

  return {
    slug: entry.slug,
    title: entry.title,
    year: entry.year,
    status,
    oneLine: entry.oneLine,
    stack: entry.stack,
    role: entry.role,
    problem: entry.problem,
    built: entry.built,
    image: validImage,
    breakerTags: entry.breakerTags,
    breakerNote: entry.breakerNote,
    links: {
      live: validLive,
      github: validGithub,
      caseStudy: validCaseStudy,
    },
  }
}

export function loadProjects(): Project[] {
  const markdown = rawProjectsMarkdown || ''
  const projects: Project[] = []
  if (!markdown.trim()) return projects

  // Split markdown by h2 sections (## )
  const sections = markdown.split(/\n(?=##\s+)/g)

  sections.forEach((sectionStr, index) => {
    const trimmed = sectionStr.trim()
    if (!trimmed || !trimmed.startsWith('##')) return

    const lines = trimmed.split('\n')
    const rawTitle = lines[0].replace(/^##\s+/, '').trim()
    // Strip tags and clean placeholder markers for title
    const cleanTitle = stripTags(rawTitle.replace(/\s*\((?:placeholder|wip)\)/i, '')) || `Project ${index + 1}`

    const meta: Record<string, string> = {}
    const subSections: Record<'problem' | 'built' | 'outcome' | 'other', string[]> = {
      problem: [],
      built: [],
      outcome: [],
      other: [],
    }
    let currentSection: 'meta' | 'problem' | 'built' | 'outcome' | 'other' = 'meta'

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      if (/^###\s+Problem/i.test(trimmedLine)) {
        currentSection = 'problem'
        continue
      } else if (/^###\s+Built/i.test(trimmedLine)) {
        currentSection = 'built'
        continue
      } else if (/^###\s+(?:Outcome|Breaker(?:'s)?\s*Note)/i.test(trimmedLine)) {
        currentSection = 'outcome'
        continue
      } else if (/^###\s+/i.test(trimmedLine)) {
        currentSection = 'other'
        continue
      }

      if (currentSection === 'meta') {
        const bulletMatch = line.match(/^\s*-\s*([a-zA-Z0-9_-]+)\s*:\s*(.*)$/)
        if (bulletMatch) {
          const key = bulletMatch[1].toLowerCase()
          const val = stripTags(bulletMatch[2])
          meta[key] = val
        }
      } else {
        subSections[currentSection].push(stripTags(line))
      }
    }

    // Normalization & Tag Stripping
    const slug = meta['slug'] ? slugify(meta['slug']) : slugify(cleanTitle) || `project-${index + 1}`
    const year = meta['year'] || '2026'

    // Status mapping: "completed" | "building" (default "completed")
    let status: 'completed' | 'building' = 'completed'
    const rawStatus = (meta['status'] || '').toLowerCase()
    if (rawStatus === 'building') {
      status = 'building'
    } else {
      status = 'completed'
    }

    const oneLine = meta['tagline'] || meta['oneline'] || 'TODO one-line summary'
    const role = meta['role'] || 'TODO'

    const stackRaw = meta['stack'] || ''
    const stack = stackRaw
      ? stackRaw
          .split(',')
          .map((s) => stripTags(s))
          .filter(Boolean)
          .slice(0, 10) // cap at 10 items
      : ['TODO', 'TODO', 'TODO']

    const problem = subSections.problem.join('\n').trim() || 'TODO'
    const built = subSections.built.join('\n').trim() || 'TODO'

    // Optional image field
    const image =
      meta['image'] && !meta['image'].includes('(optional') && meta['image'] !== 'TODO'
        ? meta['image']
        : undefined

    // Breaker tags
    const rawTags = meta['breakertags'] || meta['tags'] || meta['xray'] || ''
    const breakerTags = rawTags
      ? rawTags
          .split(',')
          .map((s) => stripTags(s))
          .filter(Boolean)
          .slice(0, 3) // cap at 3 items
      : ['AUTH: bypass?', 'SQLi: unchecked', 'RATE-LIMIT: none']

    // Breaker note
    const outcomeText = subSections.outcome.join('\n').trim()
    const breakerNote =
      outcomeText && outcomeText !== '∴ TODO' && outcomeText !== 'TODO'
        ? outcomeText
        : meta['breakernote'] && meta['breakernote'] !== 'TODO'
        ? meta['breakernote']
        : undefined

    // Links
    const live =
      meta['live'] && meta['live'].startsWith('http') && !meta['live'].includes('TODO')
        ? meta['live']
        : undefined

    const github =
      meta['repo'] && meta['repo'].startsWith('http') && !meta['repo'].includes('TODO')
        ? meta['repo']
        : meta['github'] && meta['github'].startsWith('http') && !meta['github'].includes('TODO')
        ? meta['github']
        : undefined

    const caseStudy =
      meta['casestudy'] && meta['casestudy'].startsWith('http')
        ? meta['casestudy']
        : undefined

    const rawEntry: RawParsedEntry = {
      slug,
      title: cleanTitle,
      year,
      status,
      oneLine,
      stack,
      role,
      problem,
      built,
      image,
      breakerTags,
      breakerNote,
      links: {
        live,
        github,
        caseStudy,
      },
    }

    // Validate entry before adding
    const validEntry = validateProject(rawEntry, index)
    if (validEntry) {
      projects.push(validEntry)
    }
  })

  // In dev only, console.warn the list of projects that still contain placeholder text
  if (import.meta.env.DEV) {
    const placeholderProjects = projects.filter((p) =>
      /TODO|placeholder|lorem/i.test(
        `${p.title} ${p.oneLine} ${p.problem} ${p.built} ${p.role}`
      )
    )
    if (placeholderProjects.length > 0) {
      console.warn(
        '[Portfolio] Projects containing placeholder text:',
        placeholderProjects.map((p) => p.title)
      )
    }
  }

  return projects
}
