/**
 * Year-over-year comparison utilities with same-period comparison for partial years
 */

import type { YearStats, ContributionDay } from './github'

// Thresholds for generating narrative insights
const ACTIVE_DAYS_DELTA_THRESHOLD = 5
const STREAK_DELTA_THRESHOLD = 3
const PR_DELTA_THRESHOLD = 3

// Minimum days before showing projections (to avoid wild swings)
const MIN_DAYS_FOR_PROJECTION = 7

// Full year threshold (if current year has fewer than this many days, use same-period comparison)
const FULL_YEAR_THRESHOLD = 350

export interface YearComparison {
  contributionsDelta: number
  contributionsPercentChange: number
  activeDaysDelta: number
  longestStreakDelta: number
  pullRequestsDelta: number
  newLanguages: string[]
  droppedLanguages: string[]
  consistencyImproved: boolean
  narrativeInsights: string[]
  // Same-period comparison fields
  comparisonType: 'full-year' | 'same-period'
  periodDays?: number
  samePeriodPreviousContributions?: number
  projectedYearTotal?: number
  previousYearTotal?: number
}

/**
 * Parse a date string to get year, month, day in UTC
 * GitHub dates are in YYYY-MM-DD format
 */
function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-')
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  }
}

/**
 * Calculate day of year (1-365/366) from a date string
 * Using direct calculation to avoid timezone issues
 */
function getDayOfYear(dateStr: string): number {
  const { year, month, day } = parseDateString(dateStr)

  // Days in each month (non-leap year)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  // Adjust for leap year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  if (isLeapYear) {
    daysInMonth[1] = 29
  }

  // Sum days from previous months + current day
  let dayOfYear = day
  for (let m = 0; m < month - 1; m++) {
    dayOfYear += daysInMonth[m]
  }

  return dayOfYear
}

/**
 * Get total contributions for a specific date range (Jan 1 to cutoff date)
 */
function getSamePeriodContributions(
  calendar: ContributionDay[],
  year: number,
  cutoffDayOfYear: number
): number {
  let total = 0
  for (const day of calendar) {
    const { year: dayYear } = parseDateString(day.date)
    if (dayYear === year && getDayOfYear(day.date) <= cutoffDayOfYear) {
      total += day.contributionCount
    }
  }
  return total
}

/**
 * Calculate projected year total based on current pace
 */
function calculateProjection(currentContributions: number, daysSoFar: number): number {
  if (daysSoFar < MIN_DAYS_FOR_PROJECTION) {
    return 0
  }
  return Math.round((currentContributions / daysSoFar) * 365)
}

/**
 * Format a number with thousands separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Get month and day from day of year (1-based)
 */
function getMonthAndDayFromDayOfYear(dayOfYear: number, year: number): { month: number; day: number } {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  // Adjust for leap year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  if (isLeapYear) {
    daysInMonth[1] = 29
  }

  let remaining = dayOfYear
  let month = 0
  while (month < 12 && remaining > daysInMonth[month]) {
    remaining -= daysInMonth[month]
    month++
  }

  return { month: month + 1, day: remaining }
}

/**
 * Get the period label based on day of year
 */
function getPeriodLabel(dayOfYear: number, year: number): string {
  if (dayOfYear === 1) {
    return `Day 1 of ${year}`
  }
  if (dayOfYear <= 30) {
    return `First ${dayOfYear} days of ${year}`
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const { month, day } = getMonthAndDayFromDayOfYear(dayOfYear, year)
  const monthName = monthNames[month - 1]

  if (dayOfYear <= 90) {
    return `Through ${monthName} ${day}`
  }
  if (dayOfYear <= 180) {
    return `Through ${monthName}`
  }
  if (dayOfYear <= 270) {
    return `At this point in ${year}`
  }

  const percentComplete = Math.round((dayOfYear / 365) * 100)
  return `With ${percentComplete}% of the year complete`
}

/**
 * Generate narrative insights for same-period comparison
 */
function generateSamePeriodInsights(
  currentContributions: number,
  previousSamePeriodContributions: number,
  previousYearTotal: number,
  projectedTotal: number,
  dayOfYear: number,
  currentYear: number,
  previousYear: number
): string[] {
  const insights: string[] = []
  const periodLabel = getPeriodLabel(dayOfYear, currentYear)

  // Early year (Days 1-30): Focus on impact, not just stats
  if (dayOfYear <= 30) {
    // If already exceeded last year's total, lead with that
    if (currentContributions > previousYearTotal && previousYearTotal > 0) {
      const multiplier = Math.round(currentContributions / previousYearTotal * 10) / 10
      if (multiplier >= 2) {
        insights.push(`In just ${dayOfYear} ${dayOfYear === 1 ? 'day' : 'days'}, you've already hit ${multiplier}x last year's total.`)
      } else {
        insights.push(`In just ${dayOfYear} ${dayOfYear === 1 ? 'day' : 'days'}, you've already exceeded last year's total.`)
      }
    } else if (previousSamePeriodContributions === 0 && currentContributions > 0) {
      // Last year same period was 0, celebrate the activity
      insights.push(`${formatNumber(currentContributions)} contributions in ${dayOfYear} ${dayOfYear === 1 ? 'day' : 'days'} — last year you hadn't started yet.`)
    } else {
      // Standard comparison
      const sameDayLabel = dayOfYear === 1 ? 'Same day last year' : `Same period last year`
      insights.push(
        `${periodLabel}: ${formatNumber(currentContributions)} contributions. ${sameDayLabel}: ${formatNumber(previousSamePeriodContributions)}.`
      )
    }

    // Add projection if we have enough days
    if (dayOfYear >= MIN_DAYS_FOR_PROJECTION && projectedTotal > 0) {
      const dailyAvg = Math.round(currentContributions / dayOfYear)
      insights.push(`At ${dailyAvg}/day, you're on pace for ${formatNumber(projectedTotal)} this year.`)
    }
  }
  // Q1 (Days 31-90): Show trajectory
  else if (dayOfYear <= 90) {
    insights.push(
      `${periodLabel}: ${formatNumber(currentContributions)} contributions (vs ${formatNumber(previousSamePeriodContributions)} same period last year).`
    )

    if (projectedTotal > 0) {
      if (projectedTotal > previousYearTotal * 1.5) {
        insights.push(`You're on track to exceed ${previousYear}'s total by ${Math.round((projectedTotal / previousYearTotal - 1) * 100)}%.`)
      } else if (projectedTotal > previousYearTotal) {
        insights.push(`On pace to beat last year's ${formatNumber(previousYearTotal)} contributions.`)
      }
    }
  }
  // Q2 (Days 91-180): Compare to last year's total
  else if (dayOfYear <= 180) {
    insights.push(`${periodLabel}: ${formatNumber(currentContributions)} contributions.`)

    if (currentContributions > previousYearTotal) {
      const multiplier = previousYearTotal > 0
        ? Math.round(currentContributions / previousYearTotal * 10) / 10
        : 0
      if (multiplier >= 2) {
        insights.push(`You've already exceeded last year's total (${formatNumber(previousYearTotal)}) by ${multiplier}x.`)
      } else {
        insights.push(`You've already exceeded last year's total of ${formatNumber(previousYearTotal)}.`)
      }
    } else if (projectedTotal > previousYearTotal) {
      insights.push(`On pace to beat last year's ${formatNumber(previousYearTotal)} by year end.`)
    }
  }
  // Q3 (Days 181-270): Pace comparison
  else if (dayOfYear <= 270) {
    insights.push(
      `${periodLabel}, you had ${formatNumber(previousSamePeriodContributions)} contributions. This year: ${formatNumber(currentContributions)}.`
    )

    if (currentContributions > previousSamePeriodContributions) {
      const paceIncrease = previousSamePeriodContributions > 0
        ? Math.round((currentContributions / previousSamePeriodContributions - 1) * 100)
        : 0
      if (paceIncrease > 0) {
        insights.push(`You're ${paceIncrease}% ahead of last year's pace.`)
      }
    }
  }
  // Q4 (Days 271-365): Final stretch, reliable projections
  else {
    insights.push(`${periodLabel}: ${formatNumber(currentContributions)} contributions.`)

    if (projectedTotal > 0) {
      insights.push(`On track to finish with approximately ${formatNumber(projectedTotal)} contributions.`)
    }

    if (currentContributions > previousSamePeriodContributions) {
      const delta = currentContributions - previousSamePeriodContributions
      insights.push(`${formatNumber(delta)} more than same point last year.`)
    }
  }

  return insights
}

/**
 * Compare two years of stats and generate meaningful insights
 * Automatically uses same-period comparison for partial years
 */
export function compareYears(
  current: YearStats,
  previous: YearStats
): YearComparison {
  const currentCalendar = current.rhythm.contributionCalendar || []
  const previousCalendar = previous.rhythm.contributionCalendar || []

  // Determine if we need same-period comparison
  const currentTotalDays = current.rhythm.totalDays
  const needsSamePeriodComparison = currentTotalDays < FULL_YEAR_THRESHOLD

  let contributionsDelta: number
  let contributionsPercentChange: number
  let comparisonType: 'full-year' | 'same-period'
  let periodDays: number | undefined
  let samePeriodPreviousContributions: number | undefined
  let projectedYearTotal: number | undefined
  let previousYearTotal: number | undefined

  if (needsSamePeriodComparison && currentCalendar.length > 0) {
    // Same-period comparison for partial years
    comparisonType = 'same-period'
    periodDays = currentTotalDays
    previousYearTotal = previous.totalContributions

    // Get the day of year for the latest date in current year
    const dayOfYear = currentTotalDays

    // Get same-period contributions from previous year
    samePeriodPreviousContributions = getSamePeriodContributions(
      previousCalendar,
      previous.year,
      dayOfYear
    )

    // Calculate projection if we have enough days
    if (currentTotalDays >= MIN_DAYS_FOR_PROJECTION) {
      projectedYearTotal = calculateProjection(current.totalContributions, currentTotalDays)
    }

    // Calculate delta against same period
    contributionsDelta = current.totalContributions - samePeriodPreviousContributions
    contributionsPercentChange = samePeriodPreviousContributions > 0
      ? Math.round((contributionsDelta / samePeriodPreviousContributions) * 100)
      : 0
  } else {
    // Full-year comparison
    comparisonType = 'full-year'
    contributionsDelta = current.totalContributions - previous.totalContributions
    contributionsPercentChange = previous.totalContributions > 0
      ? Math.round((contributionsDelta / previous.totalContributions) * 100)
      : 0
  }

  const activeDaysDelta = current.rhythm.activeDays - previous.rhythm.activeDays
  const longestStreakDelta = current.rhythm.longestStreak - previous.rhythm.longestStreak
  const pullRequestsDelta = current.collaboration.pullRequestsMerged - previous.collaboration.pullRequestsMerged

  // Language changes
  const currentLanguages = current.craft.languages.map(l => l.name)
  const previousLanguages = previous.craft.languages.map(l => l.name)
  const previousLangSet = new Set(previousLanguages)
  const currentLangSet = new Set(currentLanguages)

  const newLanguages = currentLanguages.filter(l => !previousLangSet.has(l))
  const droppedLanguages = previousLanguages.filter(l => !currentLangSet.has(l))

  // Consistency comparison (active days / total days)
  const currentConsistency = current.rhythm.activeDays / current.rhythm.totalDays
  const previousConsistency = previous.rhythm.activeDays / previous.rhythm.totalDays
  const consistencyImproved = currentConsistency > previousConsistency

  // Generate narrative insights
  const narrativeInsights: string[] = []

  if (comparisonType === 'same-period' && periodDays !== undefined) {
    // Same-period insights
    const samePeriodInsights = generateSamePeriodInsights(
      current.totalContributions,
      samePeriodPreviousContributions || 0,
      previousYearTotal || 0,
      projectedYearTotal || 0,
      periodDays,
      current.year,
      previous.year
    )
    narrativeInsights.push(...samePeriodInsights)
  } else {
    // Full-year comparison insights (original logic)
    if (contributionsPercentChange > 0) {
      narrativeInsights.push(`You contributed ${contributionsPercentChange}% more than last year.`)
    } else if (contributionsPercentChange < 0) {
      narrativeInsights.push(`You contributed ${Math.abs(contributionsPercentChange)}% less than last year — quality over quantity.`)
    } else {
      narrativeInsights.push(`You matched last year's contribution count exactly.`)
    }
  }

  // Consistency - show insight if consistency improved OR if active days delta exceeds threshold
  // (Only show for full-year comparison or late in the year for same-period)
  if (comparisonType === 'full-year' || (periodDays && periodDays > 180)) {
    if (consistencyImproved) {
      if (activeDaysDelta > 0) {
        narrativeInsights.push(`You were more consistent, coding ${activeDaysDelta} more days.`)
      } else {
        narrativeInsights.push(`You were more consistent this year.`)
      }
    } else if (activeDaysDelta > ACTIVE_DAYS_DELTA_THRESHOLD) {
      narrativeInsights.push(`You coded ${activeDaysDelta} more days than last year.`)
    }
  }

  // Streak - only show for full-year comparison or late in the year
  // (comparing 2-day streak to 365-day streak is meaningless)
  if (comparisonType === 'full-year' || (periodDays && periodDays > 180)) {
    if (longestStreakDelta > STREAK_DELTA_THRESHOLD) {
      narrativeInsights.push(`Your longest streak grew by ${longestStreakDelta} days.`)
    } else if (longestStreakDelta < -STREAK_DELTA_THRESHOLD) {
      narrativeInsights.push(`Your longest streak was ${Math.abs(longestStreakDelta)} days shorter — but streaks aren't everything.`)
    }
  }

  // New languages
  if (newLanguages.length > 0) {
    if (newLanguages.length === 1) {
      narrativeInsights.push(`${newLanguages[0]} entered your stack for the first time.`)
    } else {
      narrativeInsights.push(`New languages this year: ${newLanguages.join(', ')}.`)
    }
  }

  // PRs
  if (pullRequestsDelta > PR_DELTA_THRESHOLD) {
    narrativeInsights.push(`You merged ${pullRequestsDelta} more PRs than last year.`)
  }

  // Primary language change
  if (current.craft.primaryLanguage !== previous.craft.primaryLanguage) {
    narrativeInsights.push(
      `Your primary language shifted from ${previous.craft.primaryLanguage} to ${current.craft.primaryLanguage}.`
    )
  }

  return {
    contributionsDelta,
    contributionsPercentChange,
    activeDaysDelta,
    longestStreakDelta,
    pullRequestsDelta,
    newLanguages,
    droppedLanguages,
    consistencyImproved,
    narrativeInsights,
    comparisonType,
    periodDays,
    samePeriodPreviousContributions,
    projectedYearTotal,
    previousYearTotal,
  }
}
