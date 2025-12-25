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
        pullRequestContributions: { nodes: [] },
        pullRequestReviewContributions: { nodes: [] },
        issueContributions: { nodes: [] },
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
            pullRequestContributions: { nodes: [] },
            pullRequestReviewContributions: {
              nodes: [
                { occurredAt: '2024-01-01', pullRequest: { title: 'PR 1', author: { login: 'realuser1' } } },
                { occurredAt: '2024-01-02', pullRequest: { title: 'PR 2', author: { login: 'dependabot[bot]' } } },
                { occurredAt: '2024-01-03', pullRequest: { title: 'PR 3', author: { login: 'renovate[bot]' } } },
                { occurredAt: '2024-01-04', pullRequest: { title: 'PR 4', author: { login: 'github-actions[bot]' } } },
                { occurredAt: '2024-01-05', pullRequest: { title: 'PR 5', author: { login: 'realuser2' } } },
                { occurredAt: '2024-01-06', pullRequest: { title: 'PR 6', author: { login: 'codecov[bot]' } } },
              ],
            },
            issueContributions: { nodes: [] },
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
            pullRequestContributions: { nodes: [] },
            pullRequestReviewContributions: {
              nodes: [
                { occurredAt: '2024-01-01', pullRequest: { title: 'PR 1', author: { login: 'dependabot[bot]' } } },
                { occurredAt: '2024-01-02', pullRequest: { title: 'PR 2', author: { login: 'dependabot[bot]' } } },
                { occurredAt: '2024-01-03', pullRequest: { title: 'PR 3', author: { login: 'dependabot[bot]' } } },
                { occurredAt: '2024-01-04', pullRequest: { title: 'PR 4', author: { login: 'realuser' } } },
              ],
            },
            issueContributions: { nodes: [] },
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

      expect(result.peakMoments.favoriteDayOfWeek).toBeNull()
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

      expect(result.peakMoments.favoriteDayOfWeek).toBeNull()
    })
  })
})
