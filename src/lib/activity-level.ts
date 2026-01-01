/**
 * Activity level classification for conditional copy rendering.
 *
 * The goal is to avoid hollow encouragement when data is low.
 * Copy should feel honest regardless of the numbers.
 */

export type ActivityLevel = 'zero' | 'sparse' | 'typical' | 'high'

export interface ActivityMetrics {
  totalContributions: number
  activeDays: number
}

/**
 * Activity level thresholds.
 *
 * - Zero: No activity at all
 * - Sparse: Minimal activity that doesn't warrant celebration
 * - Typical: Normal activity levels
 * - High: Above average activity (roughly top 25%)
 */
const THRESHOLDS = {
  // Sparse if below BOTH of these
  sparseMaxContributions: 10,
  sparseMaxActiveDays: 5,
  // High if above EITHER of these
  highMinContributions: 500,
  highMinActiveDays: 100,
} as const

/**
 * Classifies activity level based on contribution metrics.
 *
 * @param metrics - The user's contribution metrics
 * @returns The activity level classification
 *
 * @example
 * classifyActivityLevel({ totalContributions: 0, activeDays: 0 }) // 'zero'
 * classifyActivityLevel({ totalContributions: 5, activeDays: 3 }) // 'sparse'
 * classifyActivityLevel({ totalContributions: 100, activeDays: 50 }) // 'typical'
 * classifyActivityLevel({ totalContributions: 600, activeDays: 150 }) // 'high'
 */
export function classifyActivityLevel(metrics: ActivityMetrics): ActivityLevel {
  const { totalContributions, activeDays } = metrics

  // Zero: No activity at all
  if (totalContributions === 0 && activeDays === 0) {
    return 'zero'
  }

  // Sparse: Below thresholds for both metrics
  if (
    totalContributions < THRESHOLDS.sparseMaxContributions &&
    activeDays < THRESHOLDS.sparseMaxActiveDays
  ) {
    return 'sparse'
  }

  // High: Above thresholds for either metric
  if (
    totalContributions >= THRESHOLDS.highMinContributions ||
    activeDays >= THRESHOLDS.highMinActiveDays
  ) {
    return 'high'
  }

  // Typical: Everything else
  return 'typical'
}

/**
 * Checks if the activity level warrants motivational copy.
 * Only typical and high levels should get motivational language.
 */
export function shouldShowMotivationalCopy(level: ActivityLevel): boolean {
  return level === 'typical' || level === 'high'
}

/**
 * Checks if the activity level is low enough to require neutral copy only.
 */
export function isLowActivity(level: ActivityLevel): boolean {
  return level === 'zero' || level === 'sparse'
}
