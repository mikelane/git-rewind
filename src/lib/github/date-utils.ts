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
 * For the current year, uses the client's local date as the end date.
 * For past years, uses December 31st.
 *
 * @param year - The year to create a range for
 * @param clientDate - Optional client's local date string (YYYY-MM-DD format)
 *                     Used to ensure day counts match user's timezone
 */
export function createYearDateRange(year: number, clientDate?: string): YearDateRange {
  const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0)).toISOString()

  // Determine "today" from client date or fall back to server date
  let todayYear: number
  let todayMonth: number
  let todayDay: number

  if (clientDate) {
    // Parse client date (YYYY-MM-DD format)
    const [y, m, d] = clientDate.split('-').map(Number)
    todayYear = y
    todayMonth = m - 1 // Convert to 0-indexed
    todayDay = d
  } else {
    // Fall back to server's local date
    const now = new Date()
    todayYear = now.getFullYear()
    todayMonth = now.getMonth()
    todayDay = now.getDate()
  }

  // For current year, use today's date; for past years, use Dec 31
  const to = year === todayYear
    ? new Date(Date.UTC(todayYear, todayMonth, todayDay, 23, 59, 59)).toISOString()
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
