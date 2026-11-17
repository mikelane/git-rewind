export type Guard<T> = (value: unknown) => value is T

export interface PrivateRepoSummary {
  full_name: string
  private: boolean
  pushed_at: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
    typeof value.pushed_at === 'string'
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
  account: { login: string; type: string }
} {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    isRecord(value.account) &&
    typeof value.account.login === 'string' &&
    typeof value.account.type === 'string'
  )
}

export function hasInstallationToken(value: unknown): value is { token: string } {
  return isRecord(value) && typeof value.token === 'string' && value.token !== ''
}
