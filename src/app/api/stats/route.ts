import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { GitHubClient, processContributions } from '@/lib/github'
import { statsLogger } from '@/lib/logger'
import type { PrivateRepoStats } from '@/lib/github/client'

const GITHUB_FOUNDING_YEAR = 2008
const CURRENT_YEAR = new Date().getFullYear()

function validateYear(yearParam: string | null): number | null {
  if (!yearParam) {
    return CURRENT_YEAR
  }

  const year = parseInt(yearParam, 10)

  if (isNaN(year)) {
    return null
  }

  if (year < GITHUB_FOUNDING_YEAR || year > CURRENT_YEAR) {
    return null
  }

  return year
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
  const year = validateYear(searchParams.get('year'))

  if (year === null) {
    return NextResponse.json(
      { error: `Invalid year. Must be between ${GITHUB_FOUNDING_YEAR} and ${CURRENT_YEAR}.` },
      { status: 400 }
    )
  }

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
    return NextResponse.json(
      { error: 'Failed to fetch GitHub data' },
      { status: 500 }
    )
  }
}
