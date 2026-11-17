import type {
  ContributionDay,
  ContributionsCollection,
  GitHubContributionsResponse,
  GitHubUser,
  IssueContribution,
  PullRequestContribution,
  PullRequestReviewContribution,
  Repository,
} from './types'

export type Guard<T> = (value: unknown) => value is T

export interface PrivateRepoSummary {
  full_name: string
  private: boolean
  pushed_at: string | null
}

export interface Installation {
  id: number
  account: { login: string }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isArrayOf<T>(isItem: Guard<T>): Guard<T[]> {
  return (value): value is T[] => Array.isArray(value) && value.every(isItem)
}

export function isLanguageBytes(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every(bytes => typeof bytes === 'number' && Number.isFinite(bytes))
}

export function isPrivateRepoSummary(value: unknown): value is PrivateRepoSummary {
  return (
    isRecord(value) &&
    typeof value.full_name === 'string' &&
    typeof value.private === 'boolean' &&
    (typeof value.pushed_at === 'string' || value.pushed_at === null)
  )
}

export function isCommitSummary(value: unknown): value is { sha: string } {
  return isRecord(value) && typeof value.sha === 'string'
}

export function hasLogin(value: unknown): value is { login: string } {
  return isRecord(value) && typeof value.login === 'string' && value.login !== ''
}

export function isInstallation(value: unknown): value is Installation {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    isRecord(value.account) &&
    typeof value.account.login === 'string'
  )
}

export function hasGraphQLErrors(value: unknown): value is { errors: unknown[] } {
  return isRecord(value) && Array.isArray(value.errors) && value.errors.length > 0
}

export function isGraphQLDataEnvelope(value: unknown): value is { data: Record<string, unknown> } {
  return isRecord(value) && isRecord(value.data)
}

export function hasErrorMessage(value: unknown): value is { message: string } {
  return isRecord(value) && typeof value.message === 'string'
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNullable<T>(isValue: Guard<T>): Guard<T | null> {
  return (value): value is T | null => value === null || isValue(value)
}

function isShape<T extends object>(shape: { [K in keyof T]-?: Guard<T[K]> }): Guard<T> {
  return (value): value is T =>
    isRecord(value) && Object.entries<Guard<unknown>>(shape).every(([key, isField]) => isField(value[key]))
}

const isContributionDay: Guard<ContributionDay> = isShape<ContributionDay>({
  date: isString,
  contributionCount: isCount,
  contributionLevel: isString,
})

const isNamedLanguage = isShape<{ name: string; color: string | null }>({
  name: isString,
  color: isNullable(isString),
})

const isLanguageEdge = isShape<{ size: number; node: { name: string; color: string | null } }>({
  size: isCount,
  node: isNamedLanguage,
})

type CommitContributionsByRepository = ContributionsCollection['commitContributionsByRepository'][number]

const isRepository = isShape<Omit<Repository, 'defaultBranchRef'>>({
  name: isString,
  nameWithOwner: isString,
  primaryLanguage: isNullable(isNamedLanguage),
  languages: isNullable(
    isShape<NonNullable<Repository['languages']>>({
      edges: isNullable(isArrayOf(isNullable(isLanguageEdge))),
      totalSize: isCount,
    })
  ),
})

const isCommitContributionsByRepository = isShape<CommitContributionsByRepository>({
  repository: isNullable(isRepository),
  contributions: isShape<{ totalCount: number }>({ totalCount: isCount }),
})

function isContributionConnection<T>(isNode: Guard<T>) {
  return isShape<{ totalCount: number; nodes: (T | null)[] | null }>({
    totalCount: isCount,
    nodes: isNullable(isArrayOf(isNullable(isNode))),
  })
}

const isContributionsCollection = isShape<ContributionsCollection>({
  totalCommitContributions: isCount,
  totalPullRequestContributions: isCount,
  totalPullRequestReviewContributions: isCount,
  totalIssueContributions: isCount,
  totalRepositoryContributions: isCount,
  restrictedContributionsCount: isCount,
  contributionCalendar: isShape<ContributionsCollection['contributionCalendar']>({
    totalContributions: isCount,
    weeks: isArrayOf(isShape<{ contributionDays: ContributionDay[] }>({ contributionDays: isArrayOf(isContributionDay) })),
  }),
  commitContributionsByRepository: isArrayOf(isCommitContributionsByRepository),
  pullRequestContributions: isContributionConnection(
    isShape<PullRequestContribution>({
      occurredAt: isString,
      pullRequest: isShape<{ title: string; merged: boolean; repository: { nameWithOwner: string } }>({
        title: isString,
        merged: (value): value is boolean => typeof value === 'boolean',
        repository: isShape<{ nameWithOwner: string }>({ nameWithOwner: isString }),
      }),
    })
  ),
  pullRequestReviewContributions: isContributionConnection(
    isShape<PullRequestReviewContribution>({
      occurredAt: isString,
      pullRequest: isShape<{ title: string; author: { login: string } | null }>({
        title: isString,
        author: isNullable(isShape<{ login: string }>({ login: isString })),
      }),
    })
  ),
  issueContributions: isContributionConnection(
    isShape<IssueContribution>({
      occurredAt: isString,
      issue: isShape<{ title: string; closedAt: string | null }>({
        title: isString,
        closedAt: isNullable(isString),
      }),
    })
  ),
})

const isViewer = isShape<GitHubUser>({
  login: (value): value is string => isString(value) && value !== '',
  name: isNullable(isString),
  avatarUrl: isString,
})

export function isViewerData(value: unknown): value is { viewer: GitHubUser } {
  return isRecord(value) && isViewer(value.viewer)
}

const isContributionsUser = isShape<GitHubContributionsResponse['user']>({
  login: (value): value is string => isString(value) && value !== '',
  name: isNullable(isString),
  avatarUrl: isString,
  contributionsCollection: isContributionsCollection,
})

export function isContributionsData(value: unknown): value is GitHubContributionsResponse {
  return isRecord(value) && isContributionsUser(value.user)
}

export function hasInstallationToken(value: unknown): value is { token: string } {
  return isRecord(value) && typeof value.token === 'string' && value.token !== ''
}
