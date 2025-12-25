/**
 * Bot detection patterns for filtering automated accounts.
 * These patterns are matched case-insensitively against usernames.
 */
export const BOT_PATTERNS = [
  '[bot]',
  'dependabot',
  'renovate',
  'github-actions',
  'codecov',
]

/**
 * Checks if a username belongs to a known bot account.
 * Uses pattern matching against known bot naming conventions.
 */
export function isBot(username: string): boolean {
  if (!username) {
    return false
  }

  const lower = username.toLowerCase()
  return BOT_PATTERNS.some(pattern => lower.includes(pattern))
}
