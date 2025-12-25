/**
 * Year-over-year comparison utilities
 */

import type { YearStats } from './github'

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
}

/**
 * Compare two years of stats and generate meaningful insights
 */
export function compareYears(
  current: YearStats,
  previous: YearStats
): YearComparison {
  const contributionsDelta = current.totalContributions - previous.totalContributions
  const contributionsPercentChange = previous.totalContributions > 0
    ? Math.round((contributionsDelta / previous.totalContributions) * 100)
    : 0

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

  // Always show contribution comparison (the most meaningful stat)
  if (contributionsPercentChange > 0) {
    narrativeInsights.push(`You contributed ${contributionsPercentChange}% more than last year.`)
  } else if (contributionsPercentChange < 0) {
    narrativeInsights.push(`You contributed ${Math.abs(contributionsPercentChange)}% less than last year — quality over quantity.`)
  } else {
    narrativeInsights.push(`You matched last year's contribution count exactly.`)
  }

  // Consistency (lowered threshold)
  if (consistencyImproved && activeDaysDelta > 5) {
    narrativeInsights.push(`You were more consistent, coding ${activeDaysDelta} more days.`)
  }

  // Streak (lowered threshold)
  if (longestStreakDelta > 3) {
    narrativeInsights.push(`Your longest streak grew by ${longestStreakDelta} days.`)
  } else if (longestStreakDelta < -3) {
    narrativeInsights.push(`Your longest streak was ${Math.abs(longestStreakDelta)} days shorter — but streaks aren't everything.`)
  }

  // New languages
  if (newLanguages.length > 0) {
    if (newLanguages.length === 1) {
      narrativeInsights.push(`${newLanguages[0]} entered your stack for the first time.`)
    } else {
      narrativeInsights.push(`New languages this year: ${newLanguages.join(', ')}.`)
    }
  }

  // PRs (lowered threshold)
  if (pullRequestsDelta > 3) {
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
  }
}
