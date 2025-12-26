import { describe, it, expect } from 'vitest'
import { escapeHtml, generateHTML } from './export'
import type { YearStats } from './github'

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('escapes less-than', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b')
  })

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s')
  })

  it('handles XSS attack patterns', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('handles malicious repo names', () => {
    const maliciousName = '"><img src=x onerror=alert(1)>'
    const escaped = escapeHtml(maliciousName)
    expect(escaped).not.toContain('<')
    expect(escaped).not.toContain('>')
    expect(escaped).not.toContain('"')
  })

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('handles null-like values gracefully', () => {
    // The function should handle edge cases
    expect(escapeHtml(undefined as unknown as string)).toBe('')
    expect(escapeHtml(null as unknown as string)).toBe('')
  })
})

describe('generateHTML', () => {
  const createMinimalStats = (overrides: Partial<YearStats> = {}): YearStats => ({
    user: {
      username: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://github.com/testuser.png',
    },
    year: 2024,
    totalContributions: 100,
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
      activeDays: 50,
      totalDays: 365,
      longestStreak: 10,
      currentStreak: 5,
      busiestMonth: 'January',
      busiestMonthCount: 30,
      contributionsByMonth: [],
    },
    craft: {
      primaryLanguage: 'TypeScript',
      primaryLanguagePercentage: 60,
      languages: [],
      topRepository: 'user/repo',
    },
    collaboration: {
      pullRequestsOpened: 10,
      pullRequestsMerged: 8,
      pullRequestsReviewed: 5,
      issuesClosed: 3,
      uniqueCollaborators: 2,
      topCollaborators: [],
      reviewStyle: 'balanced',
      isMergeRateApproximate: false,
    },
    peakMoments: {
      busiestDay: null,
      favoriteTimeOfDay: 'morning',
      favoriteDaysOfWeek: ['Monday'],
      lateNightCommits: 0,
      weekendCommits: 10,
      averageCommitsPerActiveDay: 2,
    },
    ...overrides,
  })

  describe('XSS prevention', () => {
    it('escapes malicious username in title', () => {
      const stats = createMinimalStats({
        user: {
          username: '<script>alert("xss")</script>',
          name: 'Hacker',
          avatarUrl: 'https://github.com/hacker.png',
        },
      })

      const html = generateHTML(stats)

      expect(html).not.toContain('<script>alert("xss")</script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('escapes malicious repo name', () => {
      const stats = createMinimalStats({
        craft: {
          primaryLanguage: 'TypeScript',
          primaryLanguagePercentage: 60,
          languages: [],
          topRepository: '"><img src=x onerror=alert(1)>',
        },
      })

      const html = generateHTML(stats)

      // The < and > should be escaped, making it safe text
      expect(html).not.toContain('<img')
      expect(html).toContain('&lt;img')
      expect(html).toContain('&gt;')
    })

    it('escapes malicious language name', () => {
      const stats = createMinimalStats({
        craft: {
          primaryLanguage: '<script>evil()</script>',
          primaryLanguagePercentage: 60,
          languages: [],
          topRepository: null,
        },
      })

      const html = generateHTML(stats)

      expect(html).not.toContain('<script>evil()</script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('handles all injection points safely', () => {
      const malicious = '<script>alert(1)</script>'
      const stats = createMinimalStats({
        user: {
          username: malicious,
          name: malicious,
          avatarUrl: 'https://github.com/user.png',
        },
        rhythm: {
          activeDays: 50,
          totalDays: 365,
          longestStreak: 10,
          currentStreak: 5,
          busiestMonth: malicious,
          busiestMonthCount: 30,
          contributionsByMonth: [],
        },
        craft: {
          primaryLanguage: malicious,
          primaryLanguagePercentage: 60,
          languages: [],
          topRepository: malicious,
        },
        peakMoments: {
          busiestDay: null,
          favoriteTimeOfDay: 'morning',
          favoriteDaysOfWeek: [malicious],
          lateNightCommits: 0,
          weekendCommits: 10,
          averageCommitsPerActiveDay: 2,
        },
      })

      const html = generateHTML(stats)

      // Count occurrences of unescaped script tags
      const unescapedScripts = (html.match(/<script>/g) || []).length
      expect(unescapedScripts).toBe(0)
    })
  })
})
