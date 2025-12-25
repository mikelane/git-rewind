import { describe, it, expect } from 'vitest'
import { isBot, BOT_PATTERNS } from './bot-detection'

describe('isBot', () => {
  describe('detects known bot patterns', () => {
    it('detects [bot] suffix pattern', () => {
      expect(isBot('dependabot[bot]')).toBe(true)
      expect(isBot('renovate[bot]')).toBe(true)
      expect(isBot('github-actions[bot]')).toBe(true)
      expect(isBot('codecov[bot]')).toBe(true)
    })

    it('detects dependabot without suffix', () => {
      expect(isBot('dependabot')).toBe(true)
    })

    it('detects renovate bot', () => {
      expect(isBot('renovate')).toBe(true)
    })

    it('detects github-actions', () => {
      expect(isBot('github-actions')).toBe(true)
    })

    it('detects codecov', () => {
      expect(isBot('codecov')).toBe(true)
    })
  })

  describe('is case-insensitive', () => {
    it('detects uppercase bot names', () => {
      expect(isBot('DEPENDABOT')).toBe(true)
      expect(isBot('RENOVATE[BOT]')).toBe(true)
    })

    it('detects mixed case bot names', () => {
      expect(isBot('DependaBot[bot]')).toBe(true)
      expect(isBot('GitHub-Actions[bot]')).toBe(true)
    })
  })

  describe('does not detect real users', () => {
    it('returns false for regular usernames', () => {
      expect(isBot('mikelane')).toBe(false)
      expect(isBot('octocat')).toBe(false)
      expect(isBot('john-doe')).toBe(false)
    })

    it('returns false for usernames containing bot as substring (not pattern)', () => {
      // User whose name happens to contain "bot" but is not a bot
      expect(isBot('robotnik')).toBe(false)
      expect(isBot('abbott')).toBe(false)
    })
  })

  describe('handles edge cases', () => {
    it('returns false for empty string', () => {
      expect(isBot('')).toBe(false)
    })
  })
})

describe('BOT_PATTERNS', () => {
  it('exports the patterns array for external use', () => {
    expect(Array.isArray(BOT_PATTERNS)).toBe(true)
    expect(BOT_PATTERNS.length).toBeGreaterThan(0)
  })

  it('contains expected patterns', () => {
    expect(BOT_PATTERNS).toContain('[bot]')
    expect(BOT_PATTERNS).toContain('dependabot')
    expect(BOT_PATTERNS).toContain('renovate')
    expect(BOT_PATTERNS).toContain('github-actions')
    expect(BOT_PATTERNS).toContain('codecov')
  })
})
