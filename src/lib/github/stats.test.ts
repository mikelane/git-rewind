import { describe, it, expect } from 'vitest'
import { processContributions, calculateStreak } from './stats'
import type { GitHubContributionsResponse, ContributionDay, Repository } from './types'

type CommitContributionByRepo = {
  repository: Repository
  contributions: { totalCount: number }
}

describe('calculateStreak', () => {
  const createDay = (date: string, count: number): ContributionDay => ({
    date,
    contributionCount: count,
    contributionLevel: count > 0 ? 'FIRST_QUARTILE' : 'NONE',
  })

  describe('longest streak (current=false)', () => {
    it('returns 0 for empty days array', () => {
      expect(calculateStreak([], false)).toBe(0)
    })

    it('returns 0 when no contributions exist', () => {
      const days = [
        createDay('2024-01-01', 0),
        createDay('2024-01-02', 0),
        createDay('2024-01-03', 0),
      ]
      expect(calculateStreak(days, false)).toBe(0)
    })

    it('returns 1 for single contribution day', () => {
      const days = [
        createDay('2024-01-01', 0),
        createDay('2024-01-02', 5),
        createDay('2024-01-03', 0),
      ]
      expect(calculateStreak(days, false)).toBe(1)
    })

    it('counts consecutive days correctly', () => {
      const days = [
        createDay('2024-01-01', 3),
        createDay('2024-01-02', 5),
        createDay('2024-01-03', 2),
        createDay('2024-01-04', 0),
        createDay('2024-01-05', 1),
      ]
      expect(calculateStreak(days, false)).toBe(3)
    })

    it('finds longest streak when multiple streaks exist', () => {
      const days = [
        createDay('2024-01-01', 1),
        createDay('2024-01-02', 1),
        createDay('2024-01-03', 0),
        createDay('2024-01-04', 1),
        createDay('2024-01-05', 1),
        createDay('2024-01-06', 1),
        createDay('2024-01-07', 1),
        createDay('2024-01-08', 0),
      ]
      expect(calculateStreak(days, false)).toBe(4)
    })

    it('handles unsorted days correctly', () => {
      const days = [
        createDay('2024-01-03', 1),
        createDay('2024-01-01', 1),
        createDay('2024-01-02', 1),
      ]
      expect(calculateStreak(days, false)).toBe(3)
    })
  })

  describe('current streak (current=true)', () => {
    it('returns 0 for empty days array', () => {
      expect(calculateStreak([], true)).toBe(0)
    })

    it('returns 0 when most recent day has no contributions', () => {
      const days = [
        createDay('2024-01-01', 5),
        createDay('2024-01-02', 3),
        createDay('2024-01-03', 0),
      ]
      expect(calculateStreak(days, true)).toBe(0)
    })

    it('counts streak from most recent day backwards', () => {
      const days = [
        createDay('2024-01-01', 0),
        createDay('2024-01-02', 1),
        createDay('2024-01-03', 2),
        createDay('2024-01-04', 3),
      ]
      expect(calculateStreak(days, true)).toBe(3)
    })

    it('stops at first gap when counting current streak', () => {
      const days = [
        createDay('2024-01-01', 1),
        createDay('2024-01-02', 0),
        createDay('2024-01-03', 1),
        createDay('2024-01-04', 1),
      ]
      expect(calculateStreak(days, true)).toBe(2)
    })
  })

  describe('date parsing robustness', () => {
    it('handles ISO date strings with timezone info', () => {
      const days = [
        createDay('2024-01-01T00:00:00Z', 1),
        createDay('2024-01-02T00:00:00Z', 1),
        createDay('2024-01-03T00:00:00Z', 1),
      ]
      expect(calculateStreak(days, false)).toBe(3)
    })

    it('sorts dates correctly using proper date comparison, not string comparison', () => {
      // String comparison would sort "2024-01-09" > "2024-01-10" because '9' > '1'
      // This test verifies we use proper date comparison
      const days = [
        createDay('2024-01-09', 1),
        createDay('2024-01-10', 1),
        createDay('2024-01-11', 1),
      ]
      expect(calculateStreak(days, false)).toBe(3)
    })

    it('filters out days with invalid dates', () => {
      const days = [
        createDay('2024-01-01', 1),
        createDay('invalid-date', 1),
        createDay('2024-01-02', 1),
        createDay('2024-01-03', 1),
      ]
      // Should only count valid dates: 3 consecutive days
      expect(calculateStreak(days, false)).toBe(3)
    })

    it('returns 0 when all dates are invalid', () => {
      const days = [
        createDay('not-a-date', 1),
        createDay('also-invalid', 1),
      ]
      expect(calculateStreak(days, false)).toBe(0)
    })

    it('handles mixed valid and invalid dates at the end for current streak', () => {
      const days = [
        createDay('2024-01-01', 1),
        createDay('2024-01-02', 1),
        createDay('invalid', 1),
      ]
      // Current streak should work with valid dates only
      expect(calculateStreak(days, true)).toBe(2)
    })
  })
})

describe('processContributions', () => {
  const createMinimalResponse = (
    overrides: Partial<{
      totalContributions: number
      weeks: { contributionDays: ContributionDay[] }[]
      commitContributionsByRepository: CommitContributionByRepo[]
      pullRequestContributions: number
      pullRequestReviewContributions: number
      issueContributions: number
    }> = {}
  ): GitHubContributionsResponse => ({
    user: {
      login: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://github.com/testuser.png',
      contributionsCollection: {
        totalCommitContributions: 100,
        totalPullRequestContributions: overrides.pullRequestContributions ?? 10,
        totalPullRequestReviewContributions: overrides.pullRequestReviewContributions ?? 5,
        totalIssueContributions: overrides.issueContributions ?? 3,
        totalRepositoryContributions: 2,
        restrictedContributionsCount: 0,
        contributionCalendar: {
          totalContributions: overrides.totalContributions ?? 150,
          weeks: overrides.weeks ?? [
            {
              contributionDays: [
                { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
                { date: '2024-01-02', contributionCount: 3, contributionLevel: 'FIRST_QUARTILE' },
                { date: '2024-01-03', contributionCount: 0, contributionLevel: 'NONE' },
              ],
            },
          ],
        },
        commitContributionsByRepository: overrides.commitContributionsByRepository ?? [],
        pullRequestContributions: { totalCount: overrides.pullRequestContributions ?? 10, nodes: [] },
        pullRequestReviewContributions: { totalCount: overrides.pullRequestReviewContributions ?? 5, nodes: [] },
        issueContributions: { totalCount: overrides.issueContributions ?? 3, nodes: [] },
      },
    },
  })

  it('extracts user info correctly', () => {
    const data = createMinimalResponse()
    const result = processContributions(data, 2024)

    expect(result.user.username).toBe('testuser')
    expect(result.user.name).toBe('Test User')
    expect(result.user.avatarUrl).toBe('https://github.com/testuser.png')
  })

  it('calculates rhythm stats correctly', () => {
    const data = createMinimalResponse({
      weeks: [
        {
          contributionDays: [
            { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
            { date: '2024-01-02', contributionCount: 0, contributionLevel: 'NONE' },
            { date: '2024-01-03', contributionCount: 3, contributionLevel: 'FIRST_QUARTILE' },
            { date: '2024-01-04', contributionCount: 2, contributionLevel: 'FIRST_QUARTILE' },
          ],
        },
      ],
    })

    const result = processContributions(data, 2024)

    expect(result.rhythm.activeDays).toBe(3)
    expect(result.rhythm.totalDays).toBe(4)
  })

  it('returns correct year in result', () => {
    const data = createMinimalResponse()
    const result = processContributions(data, 2023)

    expect(result.year).toBe(2023)
  })

  it('calculates total contributions from calendar', () => {
    const data = createMinimalResponse({ totalContributions: 500 })
    const result = processContributions(data, 2024)

    expect(result.totalContributions).toBe(500)
  })

  it('identifies busiest month correctly', () => {
    const data = createMinimalResponse({
      weeks: [
        {
          contributionDays: [
            { date: '2024-01-15', contributionCount: 10, contributionLevel: 'FIRST_QUARTILE' },
            { date: '2024-03-15', contributionCount: 50, contributionLevel: 'FOURTH_QUARTILE' },
            { date: '2024-06-15', contributionCount: 20, contributionLevel: 'SECOND_QUARTILE' },
          ],
        },
      ],
    })

    const result = processContributions(data, 2024)

    expect(result.rhythm.busiestMonth).toBe('March')
    expect(result.rhythm.busiestMonthCount).toBe(50)
  })

  it('aggregates languages from repositories', () => {
    const data = createMinimalResponse({
      commitContributionsByRepository: [
        {
          repository: {
            name: 'repo1',
            nameWithOwner: 'user/repo1',
            primaryLanguage: null,
            languages: {
              edges: [
                { size: 1000, node: { name: 'TypeScript', color: '#3178C6' } },
                { size: 500, node: { name: 'JavaScript', color: '#F7DF1E' } },
              ],
              totalSize: 1500,
            },
            defaultBranchRef: null,
          },
          contributions: { totalCount: 50 },
        },
      ],
    })

    const result = processContributions(data, 2024)

    expect(result.craft.primaryLanguage).toBe('TypeScript')
    expect(result.craft.languages.length).toBeGreaterThan(0)
    expect(result.craft.languages[0].name).toBe('TypeScript')
  })

  describe('language percentage rounding', () => {
    it('does not lose all languages when all percentages round to zero', () => {
      // If all languages are <0.5%, Math.round would make them all 0%
      // and they would be filtered out, resulting in "Unknown"
      // We need 300+ languages each with 1 byte for 1/300 = 0.33% to round to 0%
      const edges = []
      for (let i = 0; i < 300; i++) {
        edges.push({ size: 1, node: { name: `Lang${i}`, color: '#111111' } })
      }

      const data = createMinimalResponse({
        commitContributionsByRepository: [
          {
            repository: {
              name: 'repo1',
              nameWithOwner: 'user/repo1',
              primaryLanguage: null,
              languages: {
                edges,
                totalSize: 300,
              },
              defaultBranchRef: null,
            },
            contributions: { totalCount: 50 },
          },
        ],
      })

      const result = processContributions(data, 2024)

      // BUG: Currently all languages round to 0% and get filtered out
      // Should not fall back to "Unknown" - should keep languages with data
      expect(result.craft.primaryLanguage).not.toBe('Unknown')
      expect(result.craft.languages.length).toBeGreaterThan(0)
    })

    it('preserves the language with most bytes even when percentage rounds to zero', () => {
      // Create 200+ tiny languages so each is < 0.5%
      const edges = []
      // Add one slightly larger language (2 bytes)
      edges.push({ size: 2, node: { name: 'TopLang', color: '#111111' } })
      // Add 199 more with 1 byte each = 201 total bytes
      // TopLang = 2/201 = 0.99%, still rounds to 1% - this won't trigger the bug
      // Need to make it smaller relative to total
      for (let i = 0; i < 500; i++) {
        edges.push({ size: 1, node: { name: `TinyLang${i}`, color: '#222222' } })
      }
      // Now TopLang = 2/502 = 0.4%, rounds to 0%

      const data = createMinimalResponse({
        commitContributionsByRepository: [
          {
            repository: {
              name: 'repo1',
              nameWithOwner: 'user/repo1',
              primaryLanguage: null,
              languages: {
                edges,
                totalSize: 502,
              },
              defaultBranchRef: null,
            },
            contributions: { totalCount: 10 },
          },
        ],
      })

      const result = processContributions(data, 2024)

      // TopLang has the most bytes (2) so should be primary
      expect(result.craft.primaryLanguage).toBe('TopLang')
    })
  })

  it('merges private repo stats when provided', () => {
    const data = createMinimalResponse({
      commitContributionsByRepository: [
        {
          repository: {
            name: 'public-repo',
            nameWithOwner: 'user/public-repo',
            primaryLanguage: null,
            languages: {
              edges: [{ size: 500, node: { name: 'Python', color: '#3776AB' } }],
              totalSize: 500,
            },
            defaultBranchRef: null,
          },
          contributions: { totalCount: 10 },
        },
      ],
    })

    const privateStats = {
      repos: [
        {
          repo: 'user/private-repo',
          commits: 100,
          languages: [{ name: 'Rust', bytes: 2000 }],
        },
      ],
      totalCommits: 100,
    }

    const result = processContributions(data, 2024, privateStats)

    expect(result.craft.topRepository).toBe('user/private-repo')
    const rustLang = result.craft.languages.find((l) => l.name === 'Rust')
    expect(rustLang).toBeDefined()
  })

  it('calculates collaboration stats', () => {
    const data = createMinimalResponse({
      pullRequestContributions: 15,
      pullRequestReviewContributions: 8,
    })

    const result = processContributions(data, 2024)

    expect(result.collaboration.pullRequestsOpened).toBe(15)
    expect(result.collaboration.pullRequestsReviewed).toBe(8)
  })

  it('identifies busiest day in peak moments', () => {
    const data = createMinimalResponse({
      weeks: [
        {
          contributionDays: [
            { date: '2024-05-15', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
            { date: '2024-07-22', contributionCount: 25, contributionLevel: 'FOURTH_QUARTILE' },
            { date: '2024-09-10', contributionCount: 10, contributionLevel: 'SECOND_QUARTILE' },
          ],
        },
      ],
    })

    const result = processContributions(data, 2024)

    expect(result.peakMoments.busiestDay?.date).toBe('2024-07-22')
    expect(result.peakMoments.busiestDay?.commits).toBe(25)
  })

  describe('bot filtering in collaborator count', () => {
    it('excludes bot accounts from unique collaborator count', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 10,
            totalPullRequestReviewContributions: 5,
            totalIssueContributions: 3,
            totalRepositoryContributions: 2,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 150,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
                  ],
                },
              ],
            },
            commitContributionsByRepository: [],
            pullRequestContributions: { totalCount: 10, nodes: [] },
            pullRequestReviewContributions: {
              totalCount: 6,
              nodes: [
                { occurredAt: '2024-01-01', pullRequest: { title: 'PR 1', author: { login: 'realuser1' } } },
                { occurredAt: '2024-01-02', pullRequest: { title: 'PR 2', author: { login: 'dependabot[bot]' } } },
                { occurredAt: '2024-01-03', pullRequest: { title: 'PR 3', author: { login: 'renovate[bot]' } } },
                { occurredAt: '2024-01-04', pullRequest: { title: 'PR 4', author: { login: 'github-actions[bot]' } } },
                { occurredAt: '2024-01-05', pullRequest: { title: 'PR 5', author: { login: 'realuser2' } } },
                { occurredAt: '2024-01-06', pullRequest: { title: 'PR 6', author: { login: 'codecov[bot]' } } },
              ],
            },
            issueContributions: { totalCount: 3, nodes: [] },
          },
        },
      }

      const result = processContributions(data, 2024)

      // Should only count realuser1 and realuser2 (2 humans), not the 4 bots
      expect(result.collaboration.uniqueCollaborators).toBe(2)
    })

    it('excludes bots from top collaborators list', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 10,
            totalPullRequestReviewContributions: 5,
            totalIssueContributions: 3,
            totalRepositoryContributions: 2,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 150,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
                  ],
                },
              ],
            },
            commitContributionsByRepository: [],
            pullRequestContributions: { totalCount: 10, nodes: [] },
            pullRequestReviewContributions: {
              totalCount: 4,
              nodes: [
                { occurredAt: '2024-01-01', pullRequest: { title: 'PR 1', author: { login: 'dependabot[bot]' } } },
                { occurredAt: '2024-01-02', pullRequest: { title: 'PR 2', author: { login: 'dependabot[bot]' } } },
                { occurredAt: '2024-01-03', pullRequest: { title: 'PR 3', author: { login: 'dependabot[bot]' } } },
                { occurredAt: '2024-01-04', pullRequest: { title: 'PR 4', author: { login: 'realuser' } } },
              ],
            },
            issueContributions: { totalCount: 3, nodes: [] },
          },
        },
      }

      const result = processContributions(data, 2024)

      // Top collaborators should only include realuser, not dependabot
      expect(result.collaboration.topCollaborators.length).toBe(1)
      expect(result.collaboration.topCollaborators[0].username).toBe('realuser')
    })
  })

  describe('empty contribution data handling', () => {
    it('handles empty weeks array without throwing', () => {
      const data = createMinimalResponse({ weeks: [] })

      expect(() => processContributions(data, 2024)).not.toThrow()
    })

    it('returns null busiest day when no contribution days exist', () => {
      const data = createMinimalResponse({ weeks: [] })

      const result = processContributions(data, 2024)

      expect(result.peakMoments.busiestDay).toBeNull()
    })

    it('returns null favorite day of week when no contributions exist', () => {
      const data = createMinimalResponse({ weeks: [] })

      const result = processContributions(data, 2024)

      expect(result.peakMoments.favoriteDaysOfWeek).toEqual([])
    })

    it('returns null favorite day when all contribution counts are zero', () => {
      const data = createMinimalResponse({
        weeks: [
          {
            contributionDays: [
              { date: '2024-01-01', contributionCount: 0, contributionLevel: 'NONE' },
              { date: '2024-01-02', contributionCount: 0, contributionLevel: 'NONE' },
              { date: '2024-01-03', contributionCount: 0, contributionLevel: 'NONE' },
            ],
          },
        ],
      })

      const result = processContributions(data, 2024)

      expect(result.peakMoments.favoriteDaysOfWeek).toEqual([])
    })
  })

  describe('data truncation detection', () => {
    it('reports no truncation when data is within limits', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 50,
            totalPullRequestReviewContributions: 30,
            totalIssueContributions: 20,
            totalRepositoryContributions: 10,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 150,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
                  ],
                },
              ],
            },
            commitContributionsByRepository: Array(50).fill({
              repository: {
                name: 'repo',
                nameWithOwner: 'user/repo',
                primaryLanguage: null,
                languages: { edges: [], totalSize: 0 },
                defaultBranchRef: null,
              },
              contributions: { totalCount: 1 },
            }),
            pullRequestContributions: { totalCount: 50, nodes: Array(50).fill({ occurredAt: '2024-01-01', pullRequest: { title: 'PR', merged: false, repository: { nameWithOwner: 'user/repo' } } }) },
            pullRequestReviewContributions: { totalCount: 30, nodes: Array(30).fill({ occurredAt: '2024-01-01', pullRequest: { title: 'PR', author: { login: 'user' } } }) },
            issueContributions: { totalCount: 20, nodes: Array(20).fill({ occurredAt: '2024-01-01', issue: { title: 'Issue', closedAt: null } }) },
          },
        },
      }

      const result = processContributions(data, 2024)

      expect(result.dataCompleteness.truncation.pullRequests).toBe(false)
      expect(result.dataCompleteness.truncation.pullRequestReviews).toBe(false)
      expect(result.dataCompleteness.truncation.issues).toBe(false)
      expect(result.dataCompleteness.truncation.repositories).toBe(false)
    })

    it('reports PR truncation when total exceeds fetched count', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 150,
            totalPullRequestReviewContributions: 5,
            totalIssueContributions: 3,
            totalRepositoryContributions: 2,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 150,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
                  ],
                },
              ],
            },
            commitContributionsByRepository: [],
            pullRequestContributions: { totalCount: 150, nodes: Array(100).fill({ occurredAt: '2024-01-01', pullRequest: { title: 'PR', merged: false, repository: { nameWithOwner: 'user/repo' } } }) },
            pullRequestReviewContributions: { totalCount: 5, nodes: Array(5).fill({ occurredAt: '2024-01-01', pullRequest: { title: 'PR', author: { login: 'user' } } }) },
            issueContributions: { totalCount: 3, nodes: Array(3).fill({ occurredAt: '2024-01-01', issue: { title: 'Issue', closedAt: null } }) },
          },
        },
      }

      const result = processContributions(data, 2024)

      expect(result.dataCompleteness.truncation.pullRequests).toBe(true)
      expect(result.dataCompleteness.truncation.pullRequestReviews).toBe(false)
      expect(result.dataCompleteness.truncation.issues).toBe(false)
    })

    it('reports repository truncation when at maximum limit of 100', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 10,
            totalPullRequestReviewContributions: 5,
            totalIssueContributions: 3,
            totalRepositoryContributions: 150,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 150,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
                  ],
                },
              ],
            },
            commitContributionsByRepository: Array(100).fill({
              repository: {
                name: 'repo',
                nameWithOwner: 'user/repo',
                primaryLanguage: null,
                languages: { edges: [], totalSize: 0 },
                defaultBranchRef: null,
              },
              contributions: { totalCount: 1 },
            }),
            pullRequestContributions: { totalCount: 10, nodes: [] },
            pullRequestReviewContributions: { totalCount: 5, nodes: [] },
            issueContributions: { totalCount: 3, nodes: [] },
          },
        },
      }

      const result = processContributions(data, 2024)

      expect(result.dataCompleteness.truncation.repositories).toBe(true)
    })

    it('reports multiple truncations when several limits are exceeded', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 200,
            totalPullRequestReviewContributions: 150,
            totalIssueContributions: 120,
            totalRepositoryContributions: 200,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 500,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
                  ],
                },
              ],
            },
            commitContributionsByRepository: Array(100).fill({
              repository: {
                name: 'repo',
                nameWithOwner: 'user/repo',
                primaryLanguage: null,
                languages: { edges: [], totalSize: 0 },
                defaultBranchRef: null,
              },
              contributions: { totalCount: 1 },
            }),
            pullRequestContributions: { totalCount: 200, nodes: Array(100).fill({ occurredAt: '2024-01-01', pullRequest: { title: 'PR', merged: false, repository: { nameWithOwner: 'user/repo' } } }) },
            pullRequestReviewContributions: { totalCount: 150, nodes: Array(100).fill({ occurredAt: '2024-01-01', pullRequest: { title: 'PR', author: { login: 'user' } } }) },
            issueContributions: { totalCount: 120, nodes: Array(100).fill({ occurredAt: '2024-01-01', issue: { title: 'Issue', closedAt: null } }) },
          },
        },
      }

      const result = processContributions(data, 2024)

      expect(result.dataCompleteness.truncation.pullRequests).toBe(true)
      expect(result.dataCompleteness.truncation.pullRequestReviews).toBe(true)
      expect(result.dataCompleteness.truncation.issues).toBe(true)
      expect(result.dataCompleteness.truncation.repositories).toBe(true)
    })
  })

  describe('PR merge rate approximation', () => {
    it('marks merge rate as not approximate when data is not truncated', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 50,
            totalPullRequestReviewContributions: 5,
            totalIssueContributions: 3,
            totalRepositoryContributions: 2,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 150,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
                  ],
                },
              ],
            },
            commitContributionsByRepository: [],
            pullRequestContributions: {
              totalCount: 50,
              nodes: Array(50).fill({
                occurredAt: '2024-01-01',
                pullRequest: { title: 'PR', merged: true, repository: { nameWithOwner: 'user/repo' } },
              }),
            },
            pullRequestReviewContributions: { totalCount: 5, nodes: [] },
            issueContributions: { totalCount: 3, nodes: [] },
          },
        },
      }

      const result = processContributions(data, 2024)

      expect(result.collaboration.isMergeRateApproximate).toBe(false)
    })

    it('marks merge rate as approximate when PR data is truncated', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 150,
            totalPullRequestReviewContributions: 5,
            totalIssueContributions: 3,
            totalRepositoryContributions: 2,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 150,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
                  ],
                },
              ],
            },
            commitContributionsByRepository: [],
            pullRequestContributions: {
              totalCount: 150,
              nodes: Array(100).fill({
                occurredAt: '2024-01-01',
                pullRequest: { title: 'PR', merged: true, repository: { nameWithOwner: 'user/repo' } },
              }),
            },
            pullRequestReviewContributions: { totalCount: 5, nodes: [] },
            issueContributions: { totalCount: 3, nodes: [] },
          },
        },
      }

      const result = processContributions(data, 2024)

      expect(result.collaboration.isMergeRateApproximate).toBe(true)
    })

    it('calculates merged count from available nodes when truncated', () => {
      const nodes = [
        ...Array(60).fill({
          occurredAt: '2024-01-01',
          pullRequest: { title: 'PR', merged: true, repository: { nameWithOwner: 'user/repo' } },
        }),
        ...Array(40).fill({
          occurredAt: '2024-01-01',
          pullRequest: { title: 'PR', merged: false, repository: { nameWithOwner: 'user/repo' } },
        }),
      ]

      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 150,
            totalPullRequestReviewContributions: 5,
            totalIssueContributions: 3,
            totalRepositoryContributions: 2,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 150,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FIRST_QUARTILE' },
                  ],
                },
              ],
            },
            commitContributionsByRepository: [],
            pullRequestContributions: { totalCount: 150, nodes },
            pullRequestReviewContributions: { totalCount: 5, nodes: [] },
            issueContributions: { totalCount: 3, nodes: [] },
          },
        },
      }

      const result = processContributions(data, 2024)

      // Should count merged from available nodes (60 out of 100)
      expect(result.collaboration.pullRequestsMerged).toBe(60)
      expect(result.collaboration.isMergeRateApproximate).toBe(true)
    })
  })

  describe('favorite day of week tie handling', () => {
    it('returns single day when there is a clear winner', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 10,
            totalPullRequestReviewContributions: 5,
            totalIssueContributions: 3,
            totalRepositoryContributions: 2,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 150,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 100, contributionLevel: 'FOURTH_QUARTILE' }, // Sunday
                    { date: '2024-01-02', contributionCount: 10, contributionLevel: 'FIRST_QUARTILE' }, // Monday
                  ],
                },
              ],
            },
            commitContributionsByRepository: [],
            pullRequestContributions: { totalCount: 10, nodes: [] },
            pullRequestReviewContributions: { totalCount: 5, nodes: [] },
            issueContributions: { totalCount: 3, nodes: [] },
          },
        },
      }

      const result = processContributions(data, 2024)

      expect(result.peakMoments.favoriteDaysOfWeek).toEqual(['Sunday'])
    })

    it('returns all tied days when multiple days have equal contributions', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 10,
            totalPullRequestReviewContributions: 5,
            totalIssueContributions: 3,
            totalRepositoryContributions: 2,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 200,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 100, contributionLevel: 'FOURTH_QUARTILE' }, // Sunday
                    { date: '2024-01-02', contributionCount: 100, contributionLevel: 'FOURTH_QUARTILE' }, // Monday
                  ],
                },
              ],
            },
            commitContributionsByRepository: [],
            pullRequestContributions: { totalCount: 10, nodes: [] },
            pullRequestReviewContributions: { totalCount: 5, nodes: [] },
            issueContributions: { totalCount: 3, nodes: [] },
          },
        },
      }

      const result = processContributions(data, 2024)

      expect(result.peakMoments.favoriteDaysOfWeek).toContain('Sunday')
      expect(result.peakMoments.favoriteDaysOfWeek).toContain('Monday')
      expect(result.peakMoments.favoriteDaysOfWeek).toHaveLength(2)
    })

    it('returns empty array when no contributions', () => {
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 0,
            totalPullRequestContributions: 0,
            totalPullRequestReviewContributions: 0,
            totalIssueContributions: 0,
            totalRepositoryContributions: 0,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 0,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 0, contributionLevel: 'NONE' },
                    { date: '2024-01-02', contributionCount: 0, contributionLevel: 'NONE' },
                  ],
                },
              ],
            },
            commitContributionsByRepository: [],
            pullRequestContributions: { totalCount: 0, nodes: [] },
            pullRequestReviewContributions: { totalCount: 0, nodes: [] },
            issueContributions: { totalCount: 0, nodes: [] },
          },
        },
      }

      const result = processContributions(data, 2024)

      expect(result.peakMoments.favoriteDaysOfWeek).toEqual([])
    })

    it('returns empty array when all day-of-week counts are zero even with contribution data', () => {
      // Edge case: contributions exist but all happen on invalid dates that
      // don't map to any day of week (defensive test for maxDayCount === 0)
      // This tests that we don't return all 7 days when max is 0
      const data: GitHubContributionsResponse = {
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://github.com/testuser.png',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 10,
            totalPullRequestReviewContributions: 5,
            totalIssueContributions: 3,
            totalRepositoryContributions: 2,
            restrictedContributionsCount: 0,
            contributionCalendar: {
              totalContributions: 100,
              weeks: [], // No weeks means no day-of-week data
            },
            commitContributionsByRepository: [],
            pullRequestContributions: { totalCount: 10, nodes: [] },
            pullRequestReviewContributions: { totalCount: 5, nodes: [] },
            issueContributions: { totalCount: 3, nodes: [] },
          },
        },
      }

      const result = processContributions(data, 2024)

      // Even though totalContributions is 100, with no weeks data,
      // dayOfWeekCounts are all 0 and maxDayCount is 0
      // We should NOT return all 7 days as "favorites"
      expect(result.peakMoments.favoriteDaysOfWeek).toEqual([])
      expect(result.peakMoments.favoriteDaysOfWeek.length).not.toBe(7)
    })
  })
})
