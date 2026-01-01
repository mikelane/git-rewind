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

  it('includes link to app', () => {
    const text = generateShareText(mockEpilogueData)
    expect(text).toMatch(/gitrewind\.dev|localhost/)
  })
})

describe('canUseWebShare', () => {
  const originalNavigator = global.navigator

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    })
  })

  it('returns true when Web Share API is available', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        share: vi.fn(),
        canShare: vi.fn(() => true),
      },
      writable: true,
    })

    expect(canUseWebShare()).toBe(true)
  })

  it('returns false when navigator.share is not available', () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    })

    expect(canUseWebShare()).toBe(false)
  })
})

describe('copyToClipboard', () => {
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

  it('copies text to clipboard successfully', async () => {
    const result = await copyToClipboard('test text')
    expect(result).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
  })

  it('returns false when clipboard API fails', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Failed'))
    const result = await copyToClipboard('test text')
    expect(result).toBe(false)
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
