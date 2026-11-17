// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { YearStats } from '@/lib/github/types'

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() }
const mockGetViewer = vi.fn()
const mockGetUserContributions = vi.fn()
const mockProcessContributions = vi.fn()
const mockGetPrivateRepoStats = vi.fn()

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}))

vi.mock('@/lib/github', () => ({
  GitHubClient: class {
    getViewer = mockGetViewer
    getUserContributions = mockGetUserContributions
    getPrivateRepoStats = mockGetPrivateRepoStats
  },
  processContributions: (...args: unknown[]) => mockProcessContributions(...args),
}))

vi.mock('@/lib/logger', () => ({
  statsLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { setSession } from '@/lib/auth'
import { GET } from './route'

const SESSION_SECRET = 'a-session-secret-that-is-at-least-32-chars-long'

const STATS = {
  user: { username: 'octo', name: null, avatarUrl: 'https://example.com/octo.png' },
  year: 2024,
  totalContributions: 42,
  dataCompleteness: {
    restrictedContributions: 0,
    percentageAccessible: 100,
    reposAnalyzed: 1,
    truncation: { pullRequests: false, pullRequestReviews: false, issues: false, repositories: false },
  },
  rhythm: {
    activeDays: 3,
    totalDays: 366,
    longestStreak: 2,
    currentStreak: 1,
    busiestMonth: 'March',
    busiestMonthCount: 20,
    contributionsByMonth: [{ month: 'March', count: 20 }],
    contributionCalendar: [],
  },
  craft: { primaryLanguage: 'TypeScript', primaryLanguagePercentage: 100, languages: [], topRepository: null },
  collaboration: {
    pullRequestsOpened: 1,
    pullRequestsMerged: 1,
    pullRequestsReviewed: 1,
    issuesClosed: 1,
    uniqueCollaborators: 0,
    topCollaborators: [],
    reviewStyle: 'balanced',
    isMergeRateApproximate: false,
  },
  peakMoments: {
    busiestDay: null,
    favoriteTimeOfDay: 'evening',
    favoriteDaysOfWeek: [],
    lateNightCommits: 0,
    weekendCommits: 0,
    averageCommitsPerActiveDay: 0,
  },
} satisfies YearStats

const SERVER_NOW = new Date(2031, 2, 4, 12, 0, 0)

function contributionsWith(restrictedContributionsCount: number) {
  return {
    user: {
      contributionsCollection: {
        restrictedContributionsCount,
        commitContributionsByRepository: [
          { repository: { nameWithOwner: 'octo/widgets' } },
          { repository: null },
          { repository: { nameWithOwner: 'octo/gadgets' } },
        ],
      },
    },
  }
}

function statsRequest(query = '?year=2024&clientDate=2024-12-31') {
  return new NextRequest(`http://localhost/api/stats${query}`)
}

async function signInWithValidSession() {
  await setSession('test-access-token')
  mockCookieStore.get.mockReturnValue({ value: mockCookieStore.set.mock.calls[0][1] })
}

describe('GET /api/stats', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  beforeEach(() => {
    mockCookieStore.get.mockReset()
    mockCookieStore.set.mockReset()
    vi.stubEnv('SESSION_SECRET', SESSION_SECRET)
    mockGetViewer.mockReset()
    mockGetUserContributions.mockReset()
    mockProcessContributions.mockReset()
    mockGetPrivateRepoStats.mockReset()
  })

  it('returns 401 when there is no session', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    const response = await GET(statsRequest())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Not authenticated' })
    expect(mockGetViewer).not.toHaveBeenCalled()
  })

  it('returns 401 when the session cookie is invalid', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'garbage' })

    const response = await GET(statsRequest('?year=2024'))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Not authenticated' })
    expect(mockGetUserContributions).not.toHaveBeenCalled()
  })

  it('returns a 401 JSON error when GitHub rejects the access token', async () => {
    await signInWithValidSession()
    mockGetViewer.mockRejectedValue(new Error('GitHub API error: 401 Unauthorized'))

    const response = await GET(statsRequest())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Authentication failed. Please re-authenticate.' })
  })

  it('returns the processed stats when GitHub responds', async () => {
    await signInWithValidSession()
    mockGetViewer.mockResolvedValue({ login: 'octo' })
    mockGetUserContributions.mockResolvedValue({ user: { contributionsCollection: {} } })
    mockProcessContributions.mockReturnValue(STATS)

    const response = await GET(statsRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(STATS)
    expect(mockGetUserContributions).toHaveBeenCalledWith('octo', 2024)
  })

  it('returns 400 with the valid range for a year before GitHub existed', async () => {
    await signInWithValidSession()

    const response = await GET(statsRequest('?year=1999&clientDate=2024-12-31'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid year. Must be between 2008 and 2024.' })
  })

  it('returns the stats for the earliest supported year', async () => {
    await signInWithValidSession()
    mockGetViewer.mockResolvedValue({ login: 'octo' })
    mockGetUserContributions.mockResolvedValue(contributionsWith(0))
    mockProcessContributions.mockReturnValue(STATS)

    const response = await GET(statsRequest('?year=2008&clientDate=2024-12-31'))

    expect(response.status).toBe(200)
    expect(mockGetUserContributions).toHaveBeenCalledWith('octo', 2008)
  })

  it.each([
    ['the year before GitHub existed', '?year=2007&clientDate=2024-12-31'],
    ['a year after the client year', '?year=2025&clientDate=2024-12-31'],
    ['a non-numeric year', '?year=abc&clientDate=2024-12-31'],
  ])('returns 400 for %s', async (_label, query) => {
    await signInWithValidSession()

    const response = await GET(statsRequest(query))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid year. Must be between 2008 and 2024.' })
    expect(mockGetViewer).not.toHaveBeenCalled()
  })

  it('uses the client year when the year is missing', async () => {
    await signInWithValidSession()
    mockGetViewer.mockResolvedValue({ login: 'octo' })
    mockGetUserContributions.mockResolvedValue(contributionsWith(0))
    mockProcessContributions.mockReturnValue(STATS)

    await GET(statsRequest('?clientDate=2023-06-15'))

    expect(mockGetUserContributions).toHaveBeenCalledWith('octo', 2023)
  })

  describe('with an unusable clientDate', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(SERVER_NOW)
    })

    it.each([
      ['a malformed date', '?clientDate=garbage'],
      ['a date before GitHub existed', '?clientDate=1999-05-05'],
    ])('falls back to the server year for %s', async (_label, query) => {
      await signInWithValidSession()
      mockGetViewer.mockResolvedValue({ login: 'octo' })
      mockGetUserContributions.mockResolvedValue(contributionsWith(0))
      mockProcessContributions.mockReturnValue(STATS)

      await GET(statsRequest(query))

      expect(mockGetUserContributions).toHaveBeenCalledWith('octo', 2031)
      expect(mockProcessContributions).toHaveBeenCalledWith(expect.anything(), 2031, expect.anything(), '2031-03-04')
    })
  })

  it('fetches private repo stats for repos missing from GraphQL when contributions are restricted', async () => {
    await signInWithValidSession()
    const privateRepoStats = { repos: [{ repo: 'octo/secret', commits: 7, languages: [] }], totalCommits: 7 }
    const contributions = contributionsWith(3)
    mockGetViewer.mockResolvedValue({ login: 'octo' })
    mockGetUserContributions.mockResolvedValue(contributions)
    mockGetPrivateRepoStats.mockResolvedValue(privateRepoStats)
    mockProcessContributions.mockReturnValue(STATS)

    await GET(statsRequest())

    expect(mockGetPrivateRepoStats).toHaveBeenCalledWith('octo', 2024, ['octo/widgets', 'octo/gadgets'])
    expect(mockProcessContributions).toHaveBeenCalledWith(contributions, 2024, privateRepoStats, '2024-12-31')
  })

  it('skips private repo stats when no contributions are restricted', async () => {
    await signInWithValidSession()
    const contributions = contributionsWith(0)
    mockGetViewer.mockResolvedValue({ login: 'octo' })
    mockGetUserContributions.mockResolvedValue(contributions)
    mockProcessContributions.mockReturnValue(STATS)

    await GET(statsRequest())

    expect(mockGetPrivateRepoStats).not.toHaveBeenCalled()
    expect(mockProcessContributions).toHaveBeenCalledWith(contributions, 2024, { repos: [], totalCommits: 0 }, '2024-12-31')
  })

  it('returns 429 when GitHub rate limits the request', async () => {
    await signInWithValidSession()
    mockGetViewer.mockRejectedValue(new Error('API rate limit exceeded'))

    const response = await GET(statsRequest())

    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: 'GitHub API rate limit exceeded. Please try again later.' })
  })

  it('returns 500 when fetching GitHub data fails unexpectedly', async () => {
    await signInWithValidSession()
    mockGetViewer.mockRejectedValue(new Error('GitHub GraphQL API returned an unexpected response'))

    const response = await GET(statsRequest())

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Failed to fetch GitHub data' })
  })
})
