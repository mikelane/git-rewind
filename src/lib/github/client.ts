import { USER_CONTRIBUTIONS_QUERY, VIEWER_QUERY } from './queries'
import type { GitHubContributionsResponse, GitHubUser } from './types'
import { githubLogger } from '../logger'
import { createYearDateRange, createMonthDateRange } from './date-utils'

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
const GITHUB_REST_URL = 'https://api.github.com'

interface GraphQLResponse<T> {
  data: T
  errors?: { message: string }[]
}

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

  private async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const json: GraphQLResponse<T> = await response.json()

    if (json.errors?.length) {
      throw new Error(`GraphQL error: ${json.errors[0].message}`)
    }

    return json.data
  }

  private async restGet<T>(path: string): Promise<T> {
    const response = await fetch(`${GITHUB_REST_URL}${path}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub REST API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getViewer(): Promise<GitHubUser> {
    const data = await this.query<{ viewer: GitHubUser }>(VIEWER_QUERY)
    return data.viewer
  }

  async getUserContributions(
    username: string,
    year: number,
    clientDate?: string
  ): Promise<GitHubContributionsResponse> {
    const { from, to } = createYearDateRange(year, clientDate)

    return this.query<GitHubContributionsResponse>(USER_CONTRIBUTIONS_QUERY, {
      username,
      from,
      to,
    })
  }

  /**
   * Get list of private repos the user has access to, optionally filtered by activity year
   */
  async getPrivateRepos(year?: number, clientDate?: string): Promise<{ full_name: string; private: boolean; pushed_at: string }[]> {
    const repos = await this.restGet<{ full_name: string; private: boolean; pushed_at: string }[]>(
      '/user/repos?visibility=private&per_page=100&affiliation=owner,collaborator&sort=pushed&direction=desc'
    )

    let filtered = repos.filter(r => r.private)

    // If year specified, only include repos pushed to in that year
    if (year) {
      const { from, to } = createYearDateRange(year, clientDate)
      const yearStart = new Date(from)
      const yearEnd = new Date(to)

      filtered = filtered.filter(r => {
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
            const commits = await this.restGet<{ sha: string }[]>(
              `/repos/${repoFullName}/commits?author=${username}&since=${since}&until=${until}&per_page=100`
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
      return await this.restGet<Record<string, number>>(`/repos/${repoFullName}/languages`)
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
    excludeRepos: string[],
    clientDate?: string
  ): Promise<PrivateRepoStats> {
    const privateRepos = await this.getPrivateRepos(year, clientDate)
    const reposToQuery = privateRepos.filter(r => !excludeRepos.includes(r.full_name))

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
          const languageArray = Object.entries(result.languages).map(([name, bytes]) => ({
            name,
            bytes: bytes as number,
          }))

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
