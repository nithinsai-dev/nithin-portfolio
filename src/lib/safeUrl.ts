/**
 * Safe URL Validator and Sanitizer
 *
 * Enforces strict URL scheme validation:
 * - Allows ONLY:
 *   1. 'https:' external URLs
 *   2. 'mailto:' email scheme URLs
 *   3. Same-site relative paths (starting with '/' or '#', rejecting protocol-relative '//' or backslashes)
 *
 * Rejects everything else:
 *   - 'javascript:', 'data:', 'vbscript:', 'http:', 'file:', etc.
 *   - Protocol-relative URLs (e.g. '//evil.com')
 *   - Malformed URLs or control characters
 */
export function safeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // Reject control characters, newlines, tabs, and backslashes
  if (/[\u0000-\u001F\u007F-\u009F\\]/.test(trimmed)) {
    return null
  }

  // Same-site relative paths starting with / or #
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    // Prevent protocol-relative evasion (//evil.com) or backslash evasion (/\evil.com)
    if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
      return null
    }

    try {
      // Parse against a dummy same-origin base to verify syntax
      const parsed = new URL(trimmed, 'https://same-site-origin.local')
      if (parsed.origin !== 'https://same-site-origin.local') {
        return null
      }
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
      return null
    }
  }

  try {
    const parsed = new URL(trimmed)
    const protocol = parsed.protocol.toLowerCase()

    if (protocol === 'https:') {
      return parsed.href
    }

    if (protocol === 'mailto:') {
      return parsed.href
    }

    return null
  } catch {
    return null
  }
}
