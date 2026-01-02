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
 * Always uses Jan 1 to Dec 31 to fetch complete year data.
 * GitHub returns data only up to current date regardless of end date.
 *
 * @param year - The year to create a range for
 */
export function createYearDateRange(year: number): YearDateRange {
  const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0)).toISOString()
  const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString()
  return { from, to }
}

/**
 * Calculate the number of days elapsed in a year based on client's local date.
 * For current year: days from Jan 1 to clientDate (inclusive)
 * For past years: 365 or 366 (full year)
 *
 * @param year - The year to calculate days for
 * @param clientDate - Client's local date string (YYYY-MM-DD format)
 */
export function calculateDaysElapsed(year: number, clientDate: string): number {
  const [clientYear, clientMonth, clientDay] = clientDate.split('-').map(Number)

  if (year < clientYear) {
    // Past year - return full year
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
    return isLeapYear ? 366 : 365
  }

  if (year === clientYear) {
    // Current year - calculate days from Jan 1 to client date
    const jan1 = new Date(Date.UTC(year, 0, 1))
    const clientDateObj = new Date(Date.UTC(clientYear, clientMonth - 1, clientDay))
    const diffMs = clientDateObj.getTime() - jan1.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1 // +1 to include today
  }

  // Future year - shouldn't happen, return 0
  return 0
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
