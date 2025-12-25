// GitHub API response types

export interface GitHubUser {
  login: string
  name: string | null
  avatarUrl: string
  createdAt: string
}

export interface ContributionDay {
  date: string
  contributionCount: number
  contributionLevel: 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE'
}

export interface ContributionWeek {
  contributionDays: ContributionDay[]
}

export interface ContributionCalendar {
  totalContributions: number
  weeks: ContributionWeek[]
}

export interface LanguageEdge {
  size: number
  node: {
    name: string
    color: string | null
  }
}

export interface Repository {
  name: string
  nameWithOwner: string
  primaryLanguage: {
    name: string
    color: string | null
  } | null
  languages: {
    edges: LanguageEdge[]
    totalSize: number
  }
  defaultBranchRef: {
    target: {
      history: {
        totalCount: number
      }
    }
  } | null
}

export interface PullRequestContribution {
  occurredAt: string
  pullRequest: {
    title: string
    merged: boolean
    repository: {
      nameWithOwner: string
    }
  }
}

export interface IssueContribution {
  occurredAt: string
  issue: {
    title: string
    closedAt: string | null
  }
}

export interface PullRequestReviewContribution {
  occurredAt: string
  pullRequest: {
    title: string
    author: {
      login: string
    } | null
  }
}

export interface ContributionsCollection {
  totalCommitContributions: number
  totalPullRequestContributions: number
  totalPullRequestReviewContributions: number
  totalIssueContributions: number
  totalRepositoryContributions: number
  restrictedContributionsCount: number
  contributionCalendar: ContributionCalendar
  commitContributionsByRepository: {
    repository: Repository
    contributions: {
      totalCount: number
    }
  }[]
  pullRequestContributions: {
    totalCount: number
    nodes: PullRequestContribution[]
  }
  pullRequestReviewContributions: {
    totalCount: number
    nodes: PullRequestReviewContribution[]
  }
  issueContributions: {
    totalCount: number
    nodes: IssueContribution[]
  }
}

export interface GitHubContributionsResponse {
  user: {
    login: string
    name: string | null
    avatarUrl: string
    contributionsCollection: ContributionsCollection
  }
}

// Processed stats types (what our UI consumes)
export interface YearStats {
  user: {
    username: string
    name: string | null
    avatarUrl: string
  }
  year: number
  totalContributions: number
  dataCompleteness: {
    restrictedContributions: number
    percentageAccessible: number
    reposAnalyzed: number
    truncation: {
      pullRequests: boolean
      pullRequestReviews: boolean
      issues: boolean
      repositories: boolean
    }
  }
  rhythm: {
    activeDays: number
    totalDays: number
    longestStreak: number
    currentStreak: number
    busiestMonth: string
    busiestMonthCount: number
    contributionsByMonth: { month: string; count: number }[]
  }
  craft: {
    primaryLanguage: string
    primaryLanguagePercentage: number
    languages: { name: string; percentage: number; color: string }[]
    topRepository: string | null
  }
  collaboration: {
    pullRequestsOpened: number
    pullRequestsMerged: number
    pullRequestsReviewed: number
    issuesClosed: number
    uniqueCollaborators: number
    topCollaborators: { username: string; interactions: number }[]
    reviewStyle: 'thorough' | 'quick' | 'balanced'
  }
  peakMoments: {
    busiestDay: {
      date: string
      formattedDate: string
      commits: number
    } | null
    favoriteTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    favoriteDaysOfWeek: string[]
    lateNightCommits: number
    weekendCommits: number
    averageCommitsPerActiveDay: number
  }
}
