import type {
  GitHubContributionsResponse,
  YearStats,
  ContributionDay,
} from './types'
import type { PrivateRepoStats } from './client'
import { getLanguageColor } from '../constants'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getColor(name: string, githubColor: string | null): string {
  return githubColor || getLanguageColor(name)
}

function getAllDays(data: GitHubContributionsResponse): ContributionDay[] {
  const weeks = data.user?.contributionsCollection?.contributionCalendar?.weeks || []
  return weeks.flatMap(week => week?.contributionDays || []).filter(Boolean)
}

export function calculateStreak(days: ContributionDay[], current: boolean): number {
  if (days.length === 0) {
    return 0
  }

  const sorted = [...days].sort((a, b) =>
    current ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
  )

  // For current streak, if the most recent day has no contributions, streak is 0
  if (current && sorted[0].contributionCount === 0) {
    return 0
  }

  let streak = 0
  let maxStreak = 0
  let prevDate: Date | null = null

  for (const day of sorted) {
    const date = new Date(day.date)

    if (day.contributionCount > 0) {
      if (prevDate === null) {
        streak = 1
      } else {
        const diff = Math.abs(date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        if (diff === 1) {
          streak++
        } else {
          if (current) {
            break // For current streak, stop at first gap
          }
          streak = 1
        }
      }
      maxStreak = Math.max(maxStreak, streak)
      prevDate = date
    } else if (current && prevDate !== null) {
      break // For current streak, stop at first zero after starting
    }
  }

  return current ? streak : maxStreak
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const suffix =
    day === 1 || day === 21 || day === 31 ? 'st' :
    day === 2 || day === 22 ? 'nd' :
    day === 3 || day === 23 ? 'rd' : 'th'

  return `${MONTHS[date.getMonth()]} ${day}${suffix}`
}

export function processContributions(
  data: GitHubContributionsResponse,
  year: number,
  privateRepoStats?: PrivateRepoStats
): YearStats {
  const { user } = data
  const contributions = user.contributionsCollection
  const calendar = contributions.contributionCalendar
  const allDays = getAllDays(data)

  // Rhythm stats
  const activeDays = allDays.filter(d => d.contributionCount > 0).length
  const totalDays = allDays.length

  const contributionsByMonth: { month: string; count: number }[] = MONTHS.map(month => ({
    month,
    count: 0,
  }))

  for (const day of allDays) {
    const monthIndex = new Date(day.date).getMonth()
    contributionsByMonth[monthIndex].count += day.contributionCount
  }

  const busiestMonthData = contributionsByMonth.reduce((max, m) =>
    m.count > max.count ? m : max
  )

  // Craft stats - aggregate languages across repositories
  const languageBytes: Record<string, { size: number; color: string }> = {}
  let topRepo: string | null = null
  let topRepoCommits = 0

  // Process GraphQL repos (public repos)
  for (const repo of contributions.commitContributionsByRepository || []) {
    if (!repo?.repository || !repo?.contributions) {
      continue
    }

    if (repo.contributions.totalCount > topRepoCommits) {
      topRepoCommits = repo.contributions.totalCount
      topRepo = repo.repository.nameWithOwner
    }

    for (const edge of repo.repository.languages?.edges || []) {
      if (!edge?.node?.name) {
        continue
      }
      const name = edge.node.name
      if (!languageBytes[name]) {
        languageBytes[name] = { size: 0, color: getColor(name, edge.node.color) }
      }
      languageBytes[name].size += edge.size
    }
  }

  // Merge private repo stats (REST API data)
  if (privateRepoStats) {
    for (const repo of privateRepoStats.repos) {
      // Check if this is the top repo by commits
      if (repo.commits > topRepoCommits) {
        topRepoCommits = repo.commits
        topRepo = repo.repo
      }

      // Add language bytes from private repos
      for (const lang of repo.languages) {
        if (!languageBytes[lang.name]) {
          languageBytes[lang.name] = { size: 0, color: getColor(lang.name, null) }
        }
        languageBytes[lang.name].size += lang.bytes
      }
    }
  }

  const totalBytes = Object.values(languageBytes).reduce((sum, l) => sum + l.size, 0)
  const languages = Object.entries(languageBytes)
    .map(([name, { size, color }]) => ({
      name,
      percentage: totalBytes > 0 ? Math.round((size / totalBytes) * 100) : 0,
      color,
    }))
    .filter(l => l.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6)

  const primaryLanguage = languages[0]?.name || 'Unknown'
  const primaryLanguagePercentage = languages[0]?.percentage || 0

  // Collaboration stats
  const pullRequestsOpened = contributions.totalPullRequestContributions
  const pullRequestsMerged = (contributions.pullRequestContributions.nodes || [])
    .filter(pr => pr?.pullRequest?.merged).length
  const pullRequestsReviewed = contributions.totalPullRequestReviewContributions
  const issuesClosed = (contributions.issueContributions.nodes || [])
    .filter(i => i?.issue?.closedAt !== null).length

  // Count unique collaborators from PR reviews
  const collaboratorCounts: Record<string, number> = {}
  for (const review of contributions.pullRequestReviewContributions.nodes || []) {
    if (!review?.pullRequest) {
      continue
    }
    const author = review.pullRequest.author?.login
    if (author && author !== user.login) {
      collaboratorCounts[author] = (collaboratorCounts[author] || 0) + 1
    }
  }

  const topCollaborators = Object.entries(collaboratorCounts)
    .map(([username, interactions]) => ({ username, interactions }))
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 5)

  const uniqueCollaborators = Object.keys(collaboratorCounts).length

  // Determine review style based on review-to-PR ratio
  const reviewRatio = pullRequestsOpened > 0
    ? pullRequestsReviewed / pullRequestsOpened
    : 0
  const reviewStyle = reviewRatio > 1.5 ? 'thorough' : reviewRatio < 0.5 ? 'quick' : 'balanced'

  // Peak moments
  const busiestDay = allDays.reduce((max, d) =>
    d.contributionCount > max.contributionCount ? d : max
  )

  // Time of day analysis (we don't have exact times, so we'll skip this for now)
  // In a real implementation, you'd need commit timestamps from the REST API
  const favoriteTimeOfDay = 'evening' as const // Placeholder

  // Day of week analysis
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]
  for (const day of allDays) {
    const dow = new Date(day.date).getDay()
    dayOfWeekCounts[dow] += day.contributionCount
  }
  const favoriteDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))
  const favoriteDayOfWeek = DAYS[favoriteDayIndex]

  // Weekend commits (Saturday = 6, Sunday = 0)
  const weekendCommits = dayOfWeekCounts[0] + dayOfWeekCounts[6]

  // Late night would require timestamp data, using 0 as placeholder
  const lateNightCommits = 0

  const averageCommitsPerActiveDay = activeDays > 0
    ? calendar.totalContributions / activeDays
    : 0

  // Calculate data completeness
  const restrictedContributions = contributions.restrictedContributionsCount || 0
  const privateReposFound = privateRepoStats?.repos.length || 0
  const privateCommitsFound = privateRepoStats?.totalCommits || 0
  const totalContributions = calendar.totalContributions

  // We found some of the "restricted" contributions via REST API
  const stillRestrictedContributions = Math.max(0, restrictedContributions - privateCommitsFound)
  const accessibleContributions = totalContributions - stillRestrictedContributions
  const percentageAccessible = totalContributions > 0
    ? Math.round((accessibleContributions / totalContributions) * 100)
    : 100
  const reposAnalyzed = (contributions.commitContributionsByRepository || []).length + privateReposFound

  return {
    user: {
      username: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    year,
    totalContributions: calendar.totalContributions,
    dataCompleteness: {
      restrictedContributions: stillRestrictedContributions,
      percentageAccessible,
      reposAnalyzed,
    },
    rhythm: {
      activeDays,
      totalDays,
      longestStreak: calculateStreak(allDays, false),
      currentStreak: calculateStreak(allDays, true),
      busiestMonth: busiestMonthData.month,
      busiestMonthCount: busiestMonthData.count,
      contributionsByMonth,
    },
    craft: {
      primaryLanguage,
      primaryLanguagePercentage,
      languages,
      topRepository: topRepo,
    },
    collaboration: {
      pullRequestsOpened,
      pullRequestsMerged,
      pullRequestsReviewed,
      issuesClosed,
      uniqueCollaborators,
      topCollaborators,
      reviewStyle,
    },
    peakMoments: {
      busiestDay: {
        date: busiestDay.date,
        formattedDate: formatDate(busiestDay.date),
        commits: busiestDay.contributionCount,
      },
      favoriteTimeOfDay,
      favoriteDayOfWeek,
      lateNightCommits,
      weekendCommits,
      averageCommitsPerActiveDay,
    },
  }
}
