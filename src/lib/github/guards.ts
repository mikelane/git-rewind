import type { GitHubContributionsResponse, GitHubUser } from './types'

export type Guard<T> = (value: unknown) => value is T

export interface PrivateRepoSummary {
  full_name: string
  private: boolean
  pushed_at: string | null
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
  return isRecord(value) && Object.values(value).every(bytes => typeof bytes === 'number')
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

export function isInstallation(value: unknown): value is {
  id: number
  account: { login: string }
} {
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

// Validates only what the app reads (viewer.login). Other GitHubUser fields are not checked at runtime.
export function isViewerData(value: unknown): value is { viewer: GitHubUser } {
  return isRecord(value) && hasLogin(value.viewer)
}

// Validates only the user login. The contributions tree is not checked at runtime.
export function isContributionsData(value: unknown): value is GitHubContributionsResponse {
  return isRecord(value) && hasLogin(value.user)
}

export function hasInstallationToken(value: unknown): value is { token: string } {
  return isRecord(value) && typeof value.token === 'string' && value.token !== ''
}
