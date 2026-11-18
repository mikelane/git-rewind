/**
 * Tests for Share a Highlight functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shareHighlight, canUseWebShare, copyToClipboard, generateShareText } from './share'
import type { EpilogueData } from '@/components/chapters/epilogue'

const mockEpilogueData: EpilogueData = {
  year: 2024,
  username: 'testuser',
  totalContributions: 1234,
  activeDays: 200,
  topLanguage: 'TypeScript',
  pullRequestsMerged: 42,
  longestStreak: 30,
}

describe('generateShareText', () => {
  it('returns formatted text with year and username', () => {
    const text = generateShareText(mockEpilogueData)
    expect(text).toContain('2024')
    expect(text).toContain('@testuser')
  })

  it('includes total contributions', () => {
    const text = generateShareText(mockEpilogueData)
    expect(text).toContain('1,234')
  })

  it('includes active days', () => {
    const text = generateShareText(mockEpilogueData)
    expect(text).toContain('200')
  })

  it('does not include "Powered by" branding (Issue #10)', () => {
    const text = generateShareText(mockEpilogueData)
    expect(text).not.toMatch(/powered by/i)
  })

  it('includes longest streak', () => {
    const text = generateShareText(mockEpilogueData)
    expect(text).toContain('30')
  })

  describe('app URL', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('It ends with the normalized app URL when NEXT_PUBLIC_APP_URL ends in a slash', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://git-rewind.dev/')

      const text = generateShareText(mockEpilogueData)

      expect(text.endsWith('Create yours at https://git-rewind.dev')).toBe(true)
    })

    it('It falls back to https://git-rewind.dev when NEXT_PUBLIC_APP_URL is unset', () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', '')

      const text = generateShareText(mockEpilogueData)

      expect(text.endsWith('Create yours at https://git-rewind.dev')).toBe(true)
    })
  })
})

describe('shareHighlight', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      },
      writable: true,
    })
  })

  it('returns copied result when Web Share API is not available', async () => {
    const result = await shareHighlight(mockEpilogueData)
    expect(result.method).toBe('clipboard')
    expect(result.success).toBe(true)
  })

  it('It passes the normalized app URL to the Web Share API', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://git-rewind.dev/')
    const shareFn = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(global, 'navigator', {
      value: { share: shareFn, canShare: vi.fn(() => true) },
      writable: true,
    })

    await shareHighlight(mockEpilogueData)

    expect(shareFn).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://git-rewind.dev' }))
    vi.unstubAllEnvs()
  })

  it('uses Web Share API when available', async () => {
    const shareFn = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(global, 'navigator', {
      value: {
        share: shareFn,
        canShare: vi.fn(() => true),
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      },
      writable: true,
    })

    const result = await shareHighlight(mockEpilogueData)
    expect(result.method).toBe('webshare')
    expect(result.success).toBe(true)
    expect(shareFn).toHaveBeenCalled()
  })

  it('falls back to clipboard when Web Share fails', async () => {
    const shareFn = vi.fn().mockRejectedValue(new Error('User cancelled'))
    Object.defineProperty(global, 'navigator', {
      value: {
        share: shareFn,
        canShare: vi.fn(() => true),
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      },
      writable: true,
    })

    const result = await shareHighlight(mockEpilogueData)
    expect(result.method).toBe('clipboard')
    expect(result.success).toBe(true)
  })
})
