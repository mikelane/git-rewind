/**
 * Tests for single highlight sharing functionality
 * Following TDD: Write tests first, watch them fail, then implement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  HighlightType,
  generateHighlightShareText,
  shareHighlight,
  canUseWebShare,
  type StreakHighlight,
  type PeakDayHighlight,
  type LanguageHighlight,
  type ActiveDaysHighlight,
  type ContributionsHighlight,
} from './highlight-share'

describe('HighlightType', () => {
  it('defines all expected highlight types', () => {
    expect(HighlightType.Streak).toBe('streak')
    expect(HighlightType.PeakDay).toBe('peak-day')
    expect(HighlightType.Language).toBe('language')
    expect(HighlightType.ActiveDays).toBe('active-days')
    expect(HighlightType.Contributions).toBe('contributions')
  })
})

describe('generateHighlightShareText', () => {
  const baseData = {
    username: 'testuser',
    year: 2024,
  }

  describe('streak highlight', () => {
    const streakHighlight: StreakHighlight = {
      type: HighlightType.Streak,
      ...baseData,
      longestStreak: 45,
    }

    it('generates neutral, factual text for streak', () => {
      const text = generateHighlightShareText(streakHighlight)
      expect(text).toContain('45')
      expect(text).toContain('streak')
      expect(text).toContain('@testuser')
      expect(text).toContain('2024')
    })

    it('uses singular "day" for 1-day streak', () => {
      const text = generateHighlightShareText({ ...streakHighlight, longestStreak: 1 })
      expect(text).toContain('1 day')
      expect(text).not.toContain('1 days')
    })

    it('uses plural "days" for multi-day streak', () => {
      const text = generateHighlightShareText({ ...streakHighlight, longestStreak: 30 })
      expect(text).toContain('30 days')
    })
  })

  describe('peak day highlight', () => {
    const peakDayHighlight: PeakDayHighlight = {
      type: HighlightType.PeakDay,
      ...baseData,
      date: 'March 15',
      commits: 42,
    }

    it('generates neutral, factual text for peak day', () => {
      const text = generateHighlightShareText(peakDayHighlight)
      expect(text).toContain('42')
      expect(text).toContain('March 15')
      expect(text).toContain('@testuser')
      expect(text).toContain('2024')
    })

    it('uses singular "commit" for 1 commit', () => {
      const text = generateHighlightShareText({ ...peakDayHighlight, commits: 1 })
      expect(text).toContain('1 commit')
      expect(text).not.toContain('1 commits')
    })

    it('uses plural "commits" for multiple commits', () => {
      const text = generateHighlightShareText({ ...peakDayHighlight, commits: 42 })
      expect(text).toContain('42 commits')
    })
  })

  describe('language highlight', () => {
    const languageHighlight: LanguageHighlight = {
      type: HighlightType.Language,
      ...baseData,
      language: 'TypeScript',
      percentage: 65,
    }

    it('generates neutral, factual text for language', () => {
      const text = generateHighlightShareText(languageHighlight)
      expect(text).toContain('TypeScript')
      expect(text).toContain('65%')
      expect(text).toContain('@testuser')
      expect(text).toContain('2024')
    })

    it('formats percentage without decimals', () => {
      const text = generateHighlightShareText({ ...languageHighlight, percentage: 73 })
      expect(text).toContain('73%')
    })
  })

  describe('active days highlight', () => {
    const activeDaysHighlight: ActiveDaysHighlight = {
      type: HighlightType.ActiveDays,
      ...baseData,
      activeDays: 287,
      totalDays: 365,
    }

    it('generates neutral, factual text for active days', () => {
      const text = generateHighlightShareText(activeDaysHighlight)
      expect(text).toContain('287')
      expect(text).toContain('@testuser')
      expect(text).toContain('2024')
    })

    it('uses singular "day" for 1 active day', () => {
      const text = generateHighlightShareText({ ...activeDaysHighlight, activeDays: 1 })
      expect(text).toContain('1 active day')
      expect(text).not.toContain('1 active days')
    })

    it('uses plural "days" for multiple active days', () => {
      const text = generateHighlightShareText({ ...activeDaysHighlight, activeDays: 200 })
      expect(text).toContain('200 active days')
    })
  })

  describe('contributions highlight', () => {
    const contributionsHighlight: ContributionsHighlight = {
      type: HighlightType.Contributions,
      ...baseData,
      totalContributions: 1234,
    }

    it('generates neutral, factual text for contributions', () => {
      const text = generateHighlightShareText(contributionsHighlight)
      expect(text).toContain('1,234')
      expect(text).toContain('@testuser')
      expect(text).toContain('2024')
    })

    it('formats large numbers with locale separator', () => {
      const text = generateHighlightShareText({ ...contributionsHighlight, totalContributions: 12345 })
      expect(text).toContain('12,345')
    })

    it('uses singular "contribution" for 1 contribution', () => {
      const text = generateHighlightShareText({ ...contributionsHighlight, totalContributions: 1 })
      expect(text).toContain('1 contribution')
      expect(text).not.toContain('1 contributions')
    })
  })

  describe('all highlights include app URL', () => {
    it('includes gitrewind.dev link in streak highlight', () => {
      const highlight: StreakHighlight = {
        type: HighlightType.Streak,
        ...baseData,
        longestStreak: 30,
      }
      const text = generateHighlightShareText(highlight)
      expect(text).toMatch(/gitrewind\.dev|localhost/)
    })

    it('includes gitrewind.dev link in peak day highlight', () => {
      const highlight: PeakDayHighlight = {
        type: HighlightType.PeakDay,
        ...baseData,
        date: 'March 15',
        commits: 42,
      }
      const text = generateHighlightShareText(highlight)
      expect(text).toMatch(/gitrewind\.dev|localhost/)
    })

    it('includes gitrewind.dev link in language highlight', () => {
      const highlight: LanguageHighlight = {
        type: HighlightType.Language,
        ...baseData,
        language: 'TypeScript',
        percentage: 65,
      }
      const text = generateHighlightShareText(highlight)
      expect(text).toMatch(/gitrewind\.dev|localhost/)
    })
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

  it('returns false when navigator is undefined', () => {
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      writable: true,
    })

    expect(canUseWebShare()).toBe(false)
  })
})

describe('shareHighlight', () => {
  const streakHighlight: StreakHighlight = {
    type: HighlightType.Streak,
    username: 'testuser',
    year: 2024,
    longestStreak: 45,
  }

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

  it('returns clipboard result when Web Share API is not available', async () => {
    const result = await shareHighlight(streakHighlight)
    expect(result.method).toBe('clipboard')
    expect(result.success).toBe(true)
  })

  it('copies correct highlight text to clipboard', async () => {
    await shareHighlight(streakHighlight)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('45 days streak')
    )
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('@testuser')
    )
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

    const result = await shareHighlight(streakHighlight)
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

    const result = await shareHighlight(streakHighlight)
    expect(result.method).toBe('clipboard')
    expect(result.success).toBe(true)
  })

  it('returns failure when both Web Share and clipboard fail', async () => {
    const shareFn = vi.fn().mockRejectedValue(new Error('User cancelled'))
    Object.defineProperty(global, 'navigator', {
      value: {
        share: shareFn,
        canShare: vi.fn(() => true),
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard failed')),
        },
      },
      writable: true,
    })

    const result = await shareHighlight(streakHighlight)
    expect(result.method).toBe('clipboard')
    expect(result.success).toBe(false)
  })
})
