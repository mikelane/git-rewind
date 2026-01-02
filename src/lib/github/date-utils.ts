/**
 * Date utilities for GitHub API queries.
 * All dates are created in UTC to avoid timezone-related bugs.
 */

export interface YearDateRange {
  from: string
  to: string
}

export interface MonthDateRange {
  since: string
  until: string
}

/**
 * Creates a UTC date range for the year.
 * For the current year, uses today as the end date to get accurate day counts.
 * For past years, uses December 31st.
 * Using Date.UTC() ensures dates are in UTC regardless of local timezone.
 */
export function createYearDateRange(year: number): YearDateRange {
  const now = new Date()
  const currentYear = now.getUTCFullYear()

  const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0)).toISOString()

  // For current year, use today's date; for past years, use Dec 31
  const to = year === currentYear
    ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)).toISOString()
    : new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString()

  return { from, to }
}

/**
 * Creates a UTC date range for a specific month.
 * Month is 0-indexed (0 = January, 11 = December).
 * Using Date.UTC() ensures dates are in UTC regardless of local timezone.
 */
export function createMonthDateRange(year: number, month: number): MonthDateRange {
  const since = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString()
  // Day 0 of next month = last day of current month, at 23:59:59
  const until = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)).toISOString()
  return { since, until }
}
