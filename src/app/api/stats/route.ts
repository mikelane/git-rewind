import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { GitHubClient, processContributions } from '@/lib/github'
import type { PrivateRepoStats } from '@/lib/github/client'

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10)

  try {
    const client = new GitHubClient(session.accessToken)

    // Get the authenticated user
    const viewer = await client.getViewer()
    console.log('[Stats] Fetching stats for user:', viewer.login, 'year:', year)

    // Get contributions for the year (GraphQL - public repos only for details)
    const contributions = await client.getUserContributions(viewer.login, year)

    // Debug: Log raw contribution counts
    const collection = contributions.user?.contributionsCollection
    console.log('[Stats] GraphQL contribution data:', {
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
      console.log('[Stats] Fetching private repo stats via REST API...')
      privateRepoStats = await client.getPrivateRepoStats(viewer.login, year, graphqlRepos)
      console.log('[Stats] Private repos found:', privateRepoStats.repos.length, 'with', privateRepoStats.totalCommits, 'commits')
    }

    // Process into stats (with private repo data merged)
    const stats = processContributions(contributions, year, privateRepoStats)

    return NextResponse.json(stats)
  } catch (err) {
    console.error('Stats fetch error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch GitHub data' },
      { status: 500 }
    )
  }
}
