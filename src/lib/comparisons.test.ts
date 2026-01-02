import { describe, it, expect } from 'vitest'
import { compareYears } from './comparisons'
import type { YearStats, ContributionDay } from './github'

describe('compareYears', () => {
  const createDay = (date: string, count: number): ContributionDay => ({
    date,
    contributionCount: count,
    contributionLevel: count > 0 ? 'FIRST_QUARTILE' : 'NONE',
  })

  const createMinimalStats = (
    overrides: Partial<{
      year: number
      totalContributions: number
      activeDays: number
      totalDays: number
      longestStreak: number
      pullRequestsMerged: number
      primaryLanguage: string
      languages: { name: string; percentage: number; color: string }[]
      contributionCalendar: ContributionDay[]
    }> = {}
  ): YearStats => ({
    user: { username: 'testuser', name: 'Test', avatarUrl: 'url' },
    year: overrides.year ?? 2024,
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
      totalDays: overrides.totalDays ?? 365,
      longestStreak: overrides.longestStreak ?? 10,
      currentStreak: 5,
      busiestMonth: 'March',
      busiestMonthCount: 50,
      contributionsByMonth: [],
      contributionCalendar: overrides.contributionCalendar ?? [],
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
      isMergeRateApproximate: false,
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

  describe('full-year comparison (365 days)', () => {
    it('calculates positive contribution delta', () => {
      const current = createMinimalStats({ totalContributions: 200, totalDays: 365 })
      const previous = createMinimalStats({ totalContributions: 100 })

      const result = compareYears(current, previous)

      expect(result.contributionsDelta).toBe(100)
      expect(result.contributionsPercentChange).toBe(100)
      expect(result.comparisonType).toBe('full-year')
    })

    it('calculates negative contribution delta', () => {
      const current = createMinimalStats({ totalContributions: 80, totalDays: 365 })
      const previous = createMinimalStats({ totalContributions: 100 })

      const result = compareYears(current, previous)

      expect(result.contributionsDelta).toBe(-20)
      expect(result.contributionsPercentChange).toBe(-20)
    })

    it('handles zero previous contributions gracefully', () => {
      const current = createMinimalStats({ totalContributions: 100, totalDays: 365 })
      const previous = createMinimalStats({ totalContributions: 0 })

      const result = compareYears(current, previous)

      expect(result.contributionsDelta).toBe(100)
      expect(result.contributionsPercentChange).toBe(0)
    })

    it('calculates active days delta', () => {
      const current = createMinimalStats({ activeDays: 250, totalDays: 365 })
      const previous = createMinimalStats({ activeDays: 200 })

      const result = compareYears(current, previous)

      expect(result.activeDaysDelta).toBe(50)
    })

    it('calculates streak delta', () => {
      const current = createMinimalStats({ longestStreak: 30, totalDays: 365 })
      const previous = createMinimalStats({ longestStreak: 15 })

      const result = compareYears(current, previous)

      expect(result.longestStreakDelta).toBe(15)
    })

    it('calculates PR delta', () => {
      const current = createMinimalStats({ pullRequestsMerged: 25, totalDays: 365 })
      const previous = createMinimalStats({ pullRequestsMerged: 10 })

      const result = compareYears(current, previous)

      expect(result.pullRequestsDelta).toBe(15)
    })

    it('identifies new languages', () => {
      const current = createMinimalStats({
        totalDays: 365,
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
        totalDays: 365,
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
      const current = createMinimalStats({ activeDays: 300, totalDays: 365 })
      const previous = createMinimalStats({ activeDays: 200 })

      const result = compareYears(current, previous)

      expect(result.consistencyImproved).toBe(true)
    })

    it('detects consistency decline', () => {
      const current = createMinimalStats({ activeDays: 150, totalDays: 365 })
      const previous = createMinimalStats({ activeDays: 250 })

      const result = compareYears(current, previous)

      expect(result.consistencyImproved).toBe(false)
    })
  })

  describe('same-period comparison (partial year)', () => {
    it('uses same-period comparison when current year has fewer than 350 days', () => {
      // Create 30 days of data for 2026
      const currentCalendar: ContributionDay[] = []
      for (let i = 1; i <= 30; i++) {
        currentCalendar.push(createDay(`2026-01-${i.toString().padStart(2, '0')}`, 10))
      }

      // Create 365 days for 2025 (30 contributions per day in Jan)
      const previousCalendar: ContributionDay[] = []
      for (let i = 1; i <= 31; i++) {
        previousCalendar.push(createDay(`2025-01-${i.toString().padStart(2, '0')}`, 5))
      }
      for (let i = 1; i <= 334; i++) {
        previousCalendar.push(createDay(`2025-02-${(i % 28 + 1).toString().padStart(2, '0')}`, 1))
      }

      const current = createMinimalStats({
        year: 2026,
        totalContributions: 300, // 30 days * 10
        totalDays: 30,
        contributionCalendar: currentCalendar,
      })
      const previous = createMinimalStats({
        year: 2025,
        totalContributions: 500, // Total for year
        totalDays: 365,
        contributionCalendar: previousCalendar,
      })

      const result = compareYears(current, previous)

      expect(result.comparisonType).toBe('same-period')
      expect(result.periodDays).toBe(30)
      expect(result.previousYearTotal).toBe(500)
      // Same period contributions should be calculated from Jan 1-30 of 2025
      expect(result.samePeriodPreviousContributions).toBe(150) // 30 days * 5
    })

    it('compares against same period of previous year, not total', () => {
      // 10 days in 2026 with 20 contributions per day = 200 total
      const currentCalendar: ContributionDay[] = []
      for (let i = 1; i <= 10; i++) {
        currentCalendar.push(createDay(`2026-01-${i.toString().padStart(2, '0')}`, 20))
      }

      // Create valid dates for 2025 - first 10 days have 10 contributions each
      // Rest of year has 1 contribution each
      const previousCalendar: ContributionDay[] = []
      // January 1-10: 10 contributions each
      for (let i = 1; i <= 10; i++) {
        previousCalendar.push(createDay(`2025-01-${i.toString().padStart(2, '0')}`, 10))
      }
      // January 11-31: 1 contribution each (21 days)
      for (let i = 11; i <= 31; i++) {
        previousCalendar.push(createDay(`2025-01-${i.toString().padStart(2, '0')}`, 1))
      }
      // February 1-28: 1 contribution each
      for (let i = 1; i <= 28; i++) {
        previousCalendar.push(createDay(`2025-02-${i.toString().padStart(2, '0')}`, 1))
      }
      // March through December (for simplicity, just add enough to get 365 days total)
      // Already have 31 + 28 = 59 days, need 306 more
      const months = ['03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
      const daysInMonth = [31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
      for (let m = 0; m < months.length; m++) {
        for (let d = 1; d <= daysInMonth[m]; d++) {
          previousCalendar.push(createDay(`2025-${months[m]}-${d.toString().padStart(2, '0')}`, 1))
        }
      }

      const current = createMinimalStats({
        year: 2026,
        totalContributions: 200,
        totalDays: 10,
        contributionCalendar: currentCalendar,
      })
      const previous = createMinimalStats({
        year: 2025,
        totalContributions: 455, // Total for year
        totalDays: 365,
        contributionCalendar: previousCalendar,
      })

      const result = compareYears(current, previous)

      // Should compare 200 (current 10 days) vs 100 (first 10 days of 2025)
      expect(result.contributionsDelta).toBe(100) // 200 - 100
      expect(result.contributionsPercentChange).toBe(100) // 100% increase
      expect(result.samePeriodPreviousContributions).toBe(100)
    })

    it('calculates projection after 7 days', () => {
      const currentCalendar: ContributionDay[] = []
      for (let i = 1; i <= 10; i++) {
        currentCalendar.push(createDay(`2026-01-${i.toString().padStart(2, '0')}`, 10))
      }

      const current = createMinimalStats({
        year: 2026,
        totalContributions: 100, // 10 days * 10
        totalDays: 10,
        contributionCalendar: currentCalendar,
      })
      const previous = createMinimalStats({
        year: 2025,
        totalContributions: 500,
        totalDays: 365,
        contributionCalendar: [],
      })

      const result = compareYears(current, previous)

      // Projection: (100 / 10) * 365 = 3650
      expect(result.projectedYearTotal).toBe(3650)
    })

    it('does not show projection before 7 days', () => {
      const currentCalendar: ContributionDay[] = []
      for (let i = 1; i <= 5; i++) {
        currentCalendar.push(createDay(`2026-01-${i.toString().padStart(2, '0')}`, 10))
      }

      const current = createMinimalStats({
        year: 2026,
        totalContributions: 50,
        totalDays: 5,
        contributionCalendar: currentCalendar,
      })
      const previous = createMinimalStats({
        year: 2025,
        totalContributions: 500,
        totalDays: 365,
        contributionCalendar: [],
      })

      const result = compareYears(current, previous)

      expect(result.projectedYearTotal).toBeUndefined()
    })

    it('handles no data for same period last year', () => {
      const currentCalendar: ContributionDay[] = []
      for (let i = 1; i <= 10; i++) {
        currentCalendar.push(createDay(`2026-01-${i.toString().padStart(2, '0')}`, 10))
      }

      const current = createMinimalStats({
        year: 2026,
        totalContributions: 100,
        totalDays: 10,
        contributionCalendar: currentCalendar,
      })
      const previous = createMinimalStats({
        year: 2025,
        totalContributions: 0,
        totalDays: 365,
        contributionCalendar: [], // No calendar data
      })

      const result = compareYears(current, previous)

      expect(result.samePeriodPreviousContributions).toBe(0)
      expect(result.contributionsPercentChange).toBe(0) // No division by zero
    })
  })

  describe('narrativeInsights for full-year', () => {
    it('generates positive contribution insight', () => {
      const current = createMinimalStats({ totalContributions: 150, totalDays: 365 })
      const previous = createMinimalStats({ totalContributions: 100 })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('50% more'))).toBe(true)
    })

    it('generates negative contribution insight with positive framing', () => {
      const current = createMinimalStats({ totalContributions: 80, totalDays: 365 })
      const previous = createMinimalStats({ totalContributions: 100 })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('quality over quantity'))).toBe(true)
    })

    it('generates streak improvement insight when delta exceeds threshold', () => {
      const current = createMinimalStats({ longestStreak: 20, totalDays: 365 })
      const previous = createMinimalStats({ longestStreak: 10 })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('streak grew by 10 days'))).toBe(true)
    })

    it('generates new language insight for single language', () => {
      const current = createMinimalStats({
        totalDays: 365,
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
        totalDays: 365,
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
      const current = createMinimalStats({ pullRequestsMerged: 20, totalDays: 365 })
      const previous = createMinimalStats({ pullRequestsMerged: 10 })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('10 more PRs'))).toBe(true)
    })

    it('generates primary language change insight', () => {
      const current = createMinimalStats({ primaryLanguage: 'Rust', totalDays: 365 })
      const previous = createMinimalStats({ primaryLanguage: 'TypeScript' })

      const result = compareYears(current, previous)

      expect(
        result.narrativeInsights.some((i) => i.includes('shifted from TypeScript to Rust'))
      ).toBe(true)
    })

    it('generates consistency insight when consistency improved even with small delta', () => {
      const current = createMinimalStats({ activeDays: 153, totalDays: 365 })
      const previous = createMinimalStats({ activeDays: 150 })

      const result = compareYears(current, previous)

      expect(result.consistencyImproved).toBe(true)
      expect(result.narrativeInsights.some((i) => i.includes('more consistent'))).toBe(true)
    })
  })

  describe('narrativeInsights for same-period (adaptive messaging)', () => {
    it('generates Day 1 message for single day', () => {
      const currentCalendar = [createDay('2026-01-01', 32)]

      const previousCalendar: ContributionDay[] = []
      for (let i = 1; i <= 365; i++) {
        previousCalendar.push(createDay(`2025-01-${((i % 28) + 1).toString().padStart(2, '0')}`, 0))
      }

      const current = createMinimalStats({
        year: 2026,
        totalContributions: 32,
        totalDays: 1,
        contributionCalendar: currentCalendar,
      })
      const previous = createMinimalStats({
        year: 2025,
        totalContributions: 40,
        totalDays: 365,
        contributionCalendar: previousCalendar,
      })

      const result = compareYears(current, previous)

      // New messaging: "32 contributions in 1 day — last year you hadn't started yet."
      expect(result.narrativeInsights.some((i) => i.includes('32 contributions'))).toBe(true)
      expect(result.narrativeInsights.some((i) => i.includes('1 day'))).toBe(true)
    })

    it('generates Q1 message with trajectory (days 31-90)', () => {
      const currentCalendar: ContributionDay[] = []
      for (let i = 1; i <= 60; i++) {
        currentCalendar.push(createDay(`2026-01-${((i % 28) + 1).toString().padStart(2, '0')}`, 31))
      }

      const previousCalendar: ContributionDay[] = []
      for (let i = 1; i <= 365; i++) {
        previousCalendar.push(createDay(`2025-01-${((i % 28) + 1).toString().padStart(2, '0')}`, 0))
      }

      const current = createMinimalStats({
        year: 2026,
        totalContributions: 1860, // 60 * 31
        totalDays: 60,
        contributionCalendar: currentCalendar,
      })
      const previous = createMinimalStats({
        year: 2025,
        totalContributions: 12,
        totalDays: 365,
        contributionCalendar: previousCalendar,
      })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('Through'))).toBe(true)
      expect(result.narrativeInsights.some((i) => i.includes('contributions'))).toBe(true)
    })

    it('generates Q2 message comparing to last year total (days 91-180)', () => {
      const currentCalendar: ContributionDay[] = []
      for (let i = 1; i <= 120; i++) {
        const month = Math.floor((i - 1) / 30) + 1
        const day = ((i - 1) % 30) + 1
        currentCalendar.push(createDay(`2026-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`, 36))
      }

      const previousCalendar: ContributionDay[] = []
      for (let i = 1; i <= 365; i++) {
        previousCalendar.push(createDay(`2025-01-${((i % 28) + 1).toString().padStart(2, '0')}`, 0))
      }

      const current = createMinimalStats({
        year: 2026,
        totalContributions: 4320, // Exceeds last year total
        totalDays: 120,
        contributionCalendar: currentCalendar,
      })
      const previous = createMinimalStats({
        year: 2025,
        totalContributions: 40, // Low total last year
        totalDays: 365,
        contributionCalendar: previousCalendar,
      })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('Through'))).toBe(true)
    })

    it('generates Q3 message with pace comparison (days 181-270)', () => {
      const currentCalendar: ContributionDay[] = []
      for (let i = 1; i <= 200; i++) {
        const month = Math.floor((i - 1) / 30) + 1
        const day = ((i - 1) % 30) + 1
        currentCalendar.push(createDay(`2026-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`, 42))
      }

      const previousCalendar: ContributionDay[] = []
      for (let i = 1; i <= 365; i++) {
        const month = Math.floor((i - 1) / 30) + 1
        const day = ((i - 1) % 30) + 1
        previousCalendar.push(createDay(`2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`, 1))
      }

      const current = createMinimalStats({
        year: 2026,
        totalContributions: 8400,
        totalDays: 200,
        contributionCalendar: currentCalendar,
      })
      const previous = createMinimalStats({
        year: 2025,
        totalContributions: 365,
        totalDays: 365,
        contributionCalendar: previousCalendar,
      })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('At this point'))).toBe(true)
    })

    it('generates Q4 message with reliable projection (days 271-365)', () => {
      const currentCalendar: ContributionDay[] = []
      for (let i = 1; i <= 310; i++) {
        const month = Math.floor((i - 1) / 30) + 1
        const day = ((i - 1) % 30) + 1
        currentCalendar.push(createDay(`2026-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`, 42))
      }

      const previousCalendar: ContributionDay[] = []
      for (let i = 1; i <= 365; i++) {
        const month = Math.floor((i - 1) / 30) + 1
        const day = ((i - 1) % 30) + 1
        previousCalendar.push(createDay(`2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`, 1))
      }

      const current = createMinimalStats({
        year: 2026,
        totalContributions: 13020,
        totalDays: 310,
        contributionCalendar: currentCalendar,
      })
      const previous = createMinimalStats({
        year: 2025,
        totalContributions: 365,
        totalDays: 365,
        contributionCalendar: previousCalendar,
      })

      const result = compareYears(current, previous)

      expect(result.narrativeInsights.some((i) => i.includes('% of the year complete'))).toBe(true)
    })
  })
})
