const JANUARY = 0

/**
 * The year Git Rewind markets as "this year's" rewind: the current year,
 * except in January, when people are still looking for the year just ended.
 */
export function getMarketingYear(now: Date): number {
  const year = now.getFullYear()
  return now.getMonth() === JANUARY ? year - 1 : year
}
