import { describe, it, expect } from 'vitest'
import { isContributionsData } from './guards'
import { processContributions } from './stats'
import type { GitHubContributionsResponse } from './types'

// GitHub's schema-change policy classes "enum value added" as a dangerous,
// non-breaking change, so ContributionLevel can grow without notice. Nothing in
// the app reads contributionLevel, so an unknown level must not reject the
// whole response (which would fail every user's rewind).
function contributionsWithLevel(contributionLevel: string): unknown {
  return {
    user: {
      login: 'octo',
      name: null,
      avatarUrl: 'https://example.com/octo.png',
      contributionsCollection: {
        totalCommitContributions: 1,
        totalPullRequestContributions: 0,
        totalPullRequestReviewContributions: 0,
        totalIssueContributions: 0,
        totalRepositoryContributions: 0,
        restrictedContributionsCount: 0,
        contributionCalendar: {
          totalContributions: 1,
          weeks: [{ contributionDays: [{ date: '2024-01-01', contributionCount: 1, contributionLevel }] }],
        },
        commitContributionsByRepository: [],
        pullRequestContributions: { totalCount: 0, nodes: [] },
        pullRequestReviewContributions: { totalCount: 0, nodes: [] },
        issueContributions: { totalCount: 0, nodes: [] },
      },
    },
  }
}

describe('contributionLevel forward compatibility', () => {
  it('accepts a contribution level GitHub adds after this release', () => {
    expect(isContributionsData(contributionsWithLevel('FIFTH_QUARTILE'))).toBe(true)
  })

  it('still computes stats when a day carries an unknown contribution level', () => {
    const data = contributionsWithLevel('FIFTH_QUARTILE') as GitHubContributionsResponse
    expect(processContributions(data, 2024).rhythm.contributionCalendar).toHaveLength(1)
  })
})
