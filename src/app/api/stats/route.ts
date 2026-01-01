import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { GitHubClient, processContributions } from '@/lib/github'
import { statsLogger } from '@/lib/logger'
import type { PrivateRepoStats } from '@/lib/github/client'
import {
  GitHubAuthError,
  GitHubRateLimitError,
  classifyGitHubError,
} from '@/lib/errors'

const GITHUB_FOUNDING_YEAR = 2008

function validateYear(yearParam: string | null): { year: number; currentYear: number } | null {
  const currentYear = new Date().getFullYear()

  if (!yearParam) {
    return { year: currentYear, currentYear }
  }

  const year = parseInt(yearParam, 10)

  if (isNaN(year)) {
    return null
  }

  if (year < GITHUB_FOUNDING_YEAR || year > currentYear) {
    return null
  }

  return { year, currentYear }
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const validated = validateYear(searchParams.get('year'))

  if (validated === null) {
    const currentYear = new Date().getFullYear()
    return NextResponse.json(
      { error: `Invalid year. Must be between ${GITHUB_FOUNDING_YEAR} and ${currentYear}.` },
      { status: 400 }
    )
  }

  const { year } = validated

  try {
    const client = new GitHubClient(session.accessToken)

    // Get the authenticated user
    const viewer = await client.getViewer()
    statsLogger.debug(`Fetching stats for user: ${viewer.login}, year: ${year}`)

    // Get contributions for the year (GraphQL - public repos only for details)
    const contributions = await client.getUserContributions(viewer.login, year)

    // Debug: Log raw contribution counts
    const collection = contributions.user?.contributionsCollection
    statsLogger.debug('GraphQL contribution data:', {
      totalCommitContributions: collection?.totalCommitContributions,
      restrictedContributionsCount: collection?.restrictedContributionsCount,
      calendarTotal: collection?.contributionCalendar?.totalContributions,
      reposWithCommits: collection?.commitContributionsByRepository?.length,
    })

    // Get repos already in GraphQL results
    const graphqlRepos = (collection?.commitContributionsByRepository || [])
      .map(r => r.repository?.nameWithOwner)
      .filter(Boolean) as string[]

    // Fetch private repo stats via REST API (workaround for GraphQL limitation)
    let privateRepoStats: PrivateRepoStats = { repos: [], totalCommits: 0 }
    if (collection?.restrictedContributionsCount && collection.restrictedContributionsCount > 0) {
      statsLogger.debug('Fetching private repo stats via REST API...')
      privateRepoStats = await client.getPrivateRepoStats(viewer.login, year, graphqlRepos)
      statsLogger.debug(`Private repos found: ${privateRepoStats.repos.length} with ${privateRepoStats.totalCommits} commits`)
    }

    // Process into stats (with private repo data merged)
    const stats = processContributions(contributions, year, privateRepoStats)

    return NextResponse.json(stats)
  } catch (err) {
    statsLogger.error('Stats fetch error:', err)

    const classifiedError = classifyGitHubError(err)

    if (classifiedError instanceof GitHubAuthError) {
      return NextResponse.json(
        { error: 'Authentication failed. Please re-authenticate.' },
        { status: 401 }
      )
    }

    if (classifiedError instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: 'GitHub API rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch GitHub data' },
      { status: 500 }
    )
  }
}
