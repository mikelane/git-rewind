import { describe, it, expect } from 'vitest'
import { compareYears } from './comparisons'
import type { YearStats } from './github'

describe('compareYears', () => {
  const createMinimalStats = (
    overrides: Partial<{
      totalContributions: number
      activeDays: number
      longestStreak: number
      pullRequestsMerged: number
      primaryLanguage: string
      languages: { name: string; percentage: number; color: string }[]
    }> = {}
  ): YearStats => ({
    user: { username: 'testuser', name: 'Test', avatarUrl: 'url' },
    year: 2024,
    totalContributions: overrides.totalContributions ?? 100,
    dataCompleteness: {
      restrictedContributions: 0,
      percentageAccessible: 100,
      reposAnalyzed: 5,
      truncation: {
        pullRequests: false,
        pullRequestReviews: false,
        issues: false,
        repositories: false,
      },
    },
    rhythm: {
      activeDays: overrides.activeDays ?? 200,
      totalDays: 365,
      longestStreak: overrides.longestStreak ?? 10,
      currentStreak: 5,
      busiestMonth: 'March',
      busiestMonthCount: 50,
      contributionsByMonth: [],
    },
    craft: {
      primaryLanguage: overrides.primaryLanguage ?? 'TypeScript',
      primaryLanguagePercentage: 60,
      languages: overrides.languages ?? [
        { name: 'TypeScript', percentage: 60, color: '#3178C6' },
        { name: 'Python', percentage: 30, color: '#3776AB' },
      ],
      topRepository: 'user/repo',
    },
    collaboration: {
      pullRequestsOpened: 20,
      pullRequestsMerged: overrides.pullRequestsMerged ?? 15,
      pullRequestsReviewed: 10,
      issuesClosed: 5,
      uniqueCollaborators: 8,
      topCollaborators: [],
      reviewStyle: 'balanced',
    },
    peakMoments: {
      busiestDay: { date: '2024-03-15', formattedDate: 'March 15th', commits: 20 },
      favoriteTimeOfDay: 'evening',
      favoriteDaysOfWeek: ['Monday'],
      lateNightCommits: 10,
      weekendCommits: 30,
      averageCommitsPerActiveDay: 2.5,
    },
  })

  it('calculates positive contribution delta', () => {
    const current = createMinimalStats({ totalContributions: 200 })
    const previous = createMinimalStats({ totalContributions: 100 })

    const result = compareYears(current, previous)

    expect(result.contributionsDelta).toBe(100)
    expect(result.contributionsPercentChange).toBe(100)
  })

  it('calculates negative contribution delta', () => {
    const current = createMinimalStats({ totalContributions: 80 })
    const previous = createMinimalStats({ totalContributions: 100 })

    const result = compareYears(current, previous)

    expect(result.contributionsDelta).toBe(-20)
    expect(result.contributionsPercentChange).toBe(-20)
  })

  it('handles zero previous contributions gracefully', () => {
    const current = createMinimalStats({ totalContributions: 100 })
    const previous = createMinimalStats({ totalContributions: 0 })

    const result = compareYears(current, previous)

    expect(result.contributionsDelta).toBe(100)
    expect(result.contributionsPercentChange).toBe(0)
  })

  it('calculates active days delta', () => {
    const current = createMinimalStats({ activeDays: 250 })
    const previous = createMinimalStats({ activeDays: 200 })

    const result = compareYears(current, previous)

    expect(result.activeDaysDelta).toBe(50)
  })

  it('calculates streak delta', () => {
    const current = createMinimalStats({ longestStreak: 30 })
    const previous = createMinimalStats({ longestStreak: 15 })

    const result = compareYears(current, previous)

    expect(result.longestStreakDelta).toBe(15)
  })

  it('calculates PR delta', () => {
    const current = createMinimalStats({ pullRequestsMerged: 25 })
    const previous = createMinimalStats({ pullRequestsMerged: 10 })

    const result = compareYears(current, previous)

    expect(result.pullRequestsDelta).toBe(15)
  })

  it('identifies new languages', () => {
    const current = createMinimalStats({
      languages: [
        { name: 'TypeScript', percentage: 50, color: '#3178C6' },
        { name: 'Rust', percentage: 30, color: '#DEA584' },
      ],
    })
    const previous = createMinimalStats({
      languages: [{ name: 'TypeScript', percentage: 100, color: '#3178C6' }],
    })

    const result = compareYears(current, previous)

    expect(result.newLanguages).toContain('Rust')
    expect(result.newLanguages).not.toContain('TypeScript')
  })

  it('identifies dropped languages', () => {
    const current = createMinimalStats({
      languages: [{ name: 'TypeScript', percentage: 100, color: '#3178C6' }],
    })
    const previous = createMinimalStats({
      languages: [
        { name: 'TypeScript', percentage: 50, color: '#3178C6' },
        { name: 'Python', percentage: 50, color: '#3776AB' },
      ],
    })

    const result = compareYears(current, previous)

    expect(result.droppedLanguages).toContain('Python')
    expect(result.droppedLanguages).not.toContain('TypeScript')
  })

  it('detects consistency improvement', () => {
    const current = createMinimalStats({ activeDays: 300 })
    const previous = createMinimalStats({ activeDays: 200 })

    const result = compareYears(current, previous)

    expect(result.consistencyImproved).toBe(true)
  })

  it('detects consistency decline', () => {
    const current = createMinimalStats({ activeDays: 150 })
    const previous = createMinimalStats({ activeDays: 250 })

    const result = compareYears(current, previous)

    expect(result.consistencyImproved).toBe(false)
  })

  describe('narrativeInsights', () => {
    it('generates positive contribution insight', () => {
      const current = createMinimalStats({ totalContributions: 150 })
      const previous = createMinimalStats({ totalContributions: 100 })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('50% more'))).toBe(true)
    })

    it('generates negative contribution insight with positive framing', () => {
      const current = createMinimalStats({ totalContributions: 80 })
      const previous = createMinimalStats({ totalContributions: 100 })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('quality over quantity'))).toBe(true)
    })

    it('generates streak improvement insight when delta exceeds threshold', () => {
      const current = createMinimalStats({ longestStreak: 20 })
      const previous = createMinimalStats({ longestStreak: 10 })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('streak grew by 10 days'))).toBe(true)
    })

    it('generates new language insight for single language', () => {
      const current = createMinimalStats({
        languages: [
          { name: 'TypeScript', percentage: 50, color: '#3178C6' },
          { name: 'Go', percentage: 50, color: '#00ADD8' },
        ],
      })
      const previous = createMinimalStats({
        languages: [{ name: 'TypeScript', percentage: 100, color: '#3178C6' }],
      })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('Go entered your stack'))).toBe(true)
    })

    it('generates new languages insight for multiple languages', () => {
      const current = createMinimalStats({
        languages: [
          { name: 'TypeScript', percentage: 40, color: '#3178C6' },
          { name: 'Go', percentage: 30, color: '#00ADD8' },
          { name: 'Rust', percentage: 30, color: '#DEA584' },
        ],
      })
      const previous = createMinimalStats({
        languages: [{ name: 'TypeScript', percentage: 100, color: '#3178C6' }],
      })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('New languages this year'))).toBe(true)
    })

    it('generates PR insight when delta exceeds threshold', () => {
      const current = createMinimalStats({ pullRequestsMerged: 20 })
      const previous = createMinimalStats({ pullRequestsMerged: 10 })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('10 more PRs'))).toBe(true)
    })

    it('generates primary language change insight', () => {
      const current = createMinimalStats({ primaryLanguage: 'Rust' })
      const previous = createMinimalStats({ primaryLanguage: 'TypeScript' })

      const result = compareYears(current, previous)

      expect(
        result.narrativeInsights.some((i) => i.includes('shifted from TypeScript to Rust'))
      ).toBe(true)
    })

    it('generates consistency insight when consistency improved even with small delta', () => {
      // 153 active days this year (41.9% consistency)
      // 150 active days last year (41.1% consistency)
      // Delta is only 3 days (below threshold of 5), but consistency DID improve
      const current = createMinimalStats({ activeDays: 153 })
      const previous = createMinimalStats({ activeDays: 150 })

      const result = compareYears(current, previous)

      expect(result.consistencyImproved).toBe(true)
      expect(result.narrativeInsights.some((i) => i.includes('more consistent'))).toBe(true)
    })
  })
})
