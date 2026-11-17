import type { YearStats } from '@/lib/github'

export const LOGIN_PATH = '/api/auth/login'

type FetchError =
  | { ok: false; kind: 'http'; status: number }
  | { ok: false; kind: 'network' | 'invalid-body' }

export type FetchYearResult = { ok: true; stats: YearStats } | FetchError

export type LoadError = FetchError | { ok: false; kind: 'processing' }

/**
 * Get the client's local date in YYYY-MM-DD format.
 * Sent to the API so date ranges respect the user's timezone.
 */
export function getLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isUnauthorized(result: FetchYearResult): boolean {
  return !result.ok && result.kind === 'http' && result.status === 401
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Shallow structural check on the /api/stats body. It rejects bodies that are
 * not stats at all (null, primitives, arrays, error payloads) before they are
 * cached; deeper corruption surfaces as a 'processing' error.
 */
export function isYearStats(value: unknown): value is YearStats {
  return (
    isRecord(value) &&
    typeof value.year === 'number' &&
    isRecord(value.user) &&
    isRecord(value.rhythm)
  )
}
