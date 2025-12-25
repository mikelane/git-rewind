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
 * Creates a UTC date range for the entire year.
 * Using Date.UTC() ensures dates are in UTC regardless of local timezone.
 */
export function createYearDateRange(year: number): YearDateRange {
  const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0)).toISOString()
  const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString()
  return { from, to }
}

/**
 * Creates a UTC date range for a specific month.
 * Month is 0-indexed (0 = January, 11 = December).
 * Using Date.UTC() ensures dates are in UTC regardless of local timezone.
 */
export function createMonthDateRange(year: number, month: number): MonthDateRange {
  const since = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString()
  // Day 0 of next month gives the last day of current month
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const until = new Date(Date.UTC(year, month, lastDayOfMonth, 23, 59, 59)).toISOString()
  return { since, until }
}
