import { USER_CONTRIBUTIONS_QUERY, VIEWER_QUERY } from './queries'
import type { GitHubContributionsResponse, GitHubUser } from './types'
import { githubLogger } from '../logger'
import {
  hasErrorMessage,
  hasGraphQLErrors,
  isArray,
  isArrayOf,
  isCommitSummary,
  isContributionsData,
  isGraphQLDataEnvelope,
  isLanguageBytes,
  isPrivateRepoSummary,
  isViewerData,
  type Guard,
  type PrivateRepoSummary,
} from './guards'
import { createYearDateRange, createMonthDateRange } from './date-utils'

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
const GITHUB_REST_URL = 'https://api.github.com'

export interface RepoCommitStats {
  repo: string
  commits: number
  languages: { name: string; bytes: number }[]
}

export interface PrivateRepoStats {
  repos: RepoCommitStats[]
  totalCommits: number
}

export class GitHubClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async query<T>(
    query: string,
    variables: Record<string, unknown> | undefined,
    isExpectedData: Guard<T>
  ): Promise<T> {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const body: unknown = await response.json()

    if (hasGraphQLErrors(body)) {
      const [firstError] = body.errors
      const message = hasErrorMessage(firstError) ? firstError.message : 'unknown error'
      throw new Error(`GraphQL error: ${message}`)
    }

    if (!isGraphQLDataEnvelope(body) || !isExpectedData(body.data)) {
      throw new Error('GitHub GraphQL API returned an unexpected response')
    }

    return body.data
  }

  private async restGet<T>(path: string, isExpectedShape: Guard<T>): Promise<T> {
    const response = await fetch(`${GITHUB_REST_URL}${path}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub REST API error: ${response.status} ${response.statusText}`)
    }

    const body: unknown = await response.json()
    if (!isExpectedShape(body)) {
      throw new Error(`GitHub REST API returned an unexpected response for ${path}`)
    }
    return body
  }

  async getViewer(): Promise<GitHubUser> {
    const data = await this.query(VIEWER_QUERY, undefined, isViewerData)
    return data.viewer
  }

  async getUserContributions(
    username: string,
    year: number
  ): Promise<GitHubContributionsResponse> {
    const { from, to } = createYearDateRange(year)

    return this.query(
      USER_CONTRIBUTIONS_QUERY,
      { username, from, to },
      isContributionsData
    )
  }

  /**
   * Get list of private repos the user has access to, optionally filtered by activity year
   */
  async getPrivateRepos(year?: number): Promise<PrivateRepoSummary[]> {
    const repos = await this.restGet(
      '/user/repos?visibility=private&per_page=100&affiliation=owner,collaborator&sort=pushed&direction=desc',
      isArray
    )

    const validRepos = repos.filter(isPrivateRepoSummary)
    const droppedCount = repos.length - validRepos.length
    if (droppedCount > 0) {
      githubLogger.warn(`Dropped ${droppedCount} malformed private repo(s) from GitHub response`)
    }

    let filtered = validRepos.filter(r => r.private)

    // If year specified, only include repos pushed to in that year
    if (year) {
      const { from, to } = createYearDateRange(year)
      const yearStart = new Date(from)
      const yearEnd = new Date(to)

      filtered = filtered.filter(r => {
        if (r.pushed_at === null) {
          return false
        }
        const pushedAt = new Date(r.pushed_at)
        return pushedAt >= yearStart && pushedAt <= yearEnd
      })
    }

    return filtered
  }

  /**
   * Count commits by the authenticated user in a specific repo for a year.
   * Uses parallel time slicing (12 monthly requests) to avoid timeouts
   * and overcome the 100-per-page limit.
   */
  async getRepoCommitCount(
    repoFullName: string,
    username: string,
    year: number
  ): Promise<number> {
    try {
      // Create 12 monthly date ranges using UTC dates
      const monthlyRanges = Array.from({ length: 12 }, (_, month) =>
        createMonthDateRange(year, month)
      )

      // Fire all 12 requests in parallel
      const monthlyResults = await Promise.all(
        monthlyRanges.map(async ({ since, until }) => {
          try {
            const commits = await this.restGet(
              `/repos/${repoFullName}/commits?author=${username}&since=${since}&until=${until}&per_page=100`,
              isArrayOf(isCommitSummary)
            )
            return commits.length
          } catch (error) {
            githubLogger.warn(`Failed to fetch commits for ${repoFullName} (${since} to ${until})`, error)
            return 0
          }
        })
      )

      // Sum all monthly commit counts
      return monthlyResults.reduce((sum, count) => sum + count, 0)
    } catch (error) {
      githubLogger.warn(`Failed to get commit count for ${repoFullName}`, error)
      return 0
    }
  }

  /**
   * Get language breakdown for a repo
   */
  async getRepoLanguages(repoFullName: string): Promise<Record<string, number>> {
    try {
      return await this.restGet(`/repos/${repoFullName}/languages`, isLanguageBytes)
    } catch (error) {
      githubLogger.warn(`Failed to get languages for ${repoFullName}`, error)
      return {}
    }
  }

  /**
   * Get stats for private repos not captured by GraphQL
   */
  async getPrivateRepoStats(
    username: string,
    year: number,
    excludeRepos: string[]
  ): Promise<PrivateRepoStats> {
    const privateRepos = await this.getPrivateRepos(year)
    const excluded = new Set(excludeRepos)
    const reposToQuery = privateRepos.filter(r => !excluded.has(r.full_name))

    githubLogger.debug(`Found ${privateRepos.length} private repos with activity in ${year}, querying ${reposToQuery.length} not in GraphQL results`)
    githubLogger.debug('Active private repos:', privateRepos.map(r => r.full_name))

    const repoStats: RepoCommitStats[] = []
    let totalCommits = 0

    // Query repos in batches of 10 in parallel for speed
    const batchSize = 10
    for (let i = 0; i < reposToQuery.length; i += batchSize) {
      const batch = reposToQuery.slice(i, i + batchSize)

      const results = await Promise.all(
        batch.map(async (repo) => {
          const [commits, languages] = await Promise.all([
            this.getRepoCommitCount(repo.full_name, username, year),
            this.getRepoLanguages(repo.full_name),
          ])
          return { repo: repo.full_name, commits, languages }
        })
      )

      for (const result of results) {
        if (result.commits > 0) {
          const languageArray = Object.entries(result.languages).map(([name, bytes]) => ({ name, bytes }))

          repoStats.push({
            repo: result.repo,
            commits: result.commits,
            languages: languageArray,
          })
          totalCommits += result.commits
          githubLogger.debug(`${result.repo}: ${result.commits} commits, languages: ${Object.keys(result.languages).join(', ')}`)
        }
      }
    }

    return { repos: repoStats, totalCommits }
  }
}
