import { useCallback, useState } from 'react'
import type { YearStats } from '@/lib/github'
import { getCached } from '@/lib/cache'
import { compareYears, type YearComparison } from '@/lib/comparisons'
import { comparisonLogger } from '@/lib/logger'
import type { FetchYearResult } from '@/lib/year-stats-fetch'

const CURRENT_YEAR = new Date().getFullYear()
export const AVAILABLE_YEARS: readonly number[] = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

interface UseYearPrefetchOptions {
  readonly fetchYearStats: (year: number) => Promise<FetchYearResult>
  readonly currentYearRef: { readonly current: number }
  readonly mountedRef: { readonly current: boolean }
}

export interface UseYearPrefetchResult {
  comparison: YearComparison | null
  comparisonLoading: boolean
  loadingYears: ReadonlySet<number>
  resetComparison: () => void
  prefetchOtherYears: (year: number, currentStats: YearStats) => void
}

/**
 * Compares the shown year with the one before it and warms the cache for the other
 * years in the background. Results for a year the user has left are ignored.
 */
export function useYearPrefetch({
  fetchYearStats,
  currentYearRef,
  mountedRef,
}: UseYearPrefetchOptions): UseYearPrefetchResult {
  const [comparison, setComparison] = useState<YearComparison | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [loadingYears, setLoadingYears] = useState<Set<number>>(new Set())

  const resetComparison = useCallback(() => {
    setComparison(null)
    setComparisonLoading(false)
  }, [])

  // Compute comparison for current stats against previous year (if available)
  const computeComparison = useCallback((currentStats: YearStats, year: number) => {
    // Race condition prevention: Don't update comparison if user has switched years
    if (currentYearRef.current !== year) {
      comparisonLogger.debug(`Skipping comparison for ${year} - user switched to ${currentYearRef.current}`)
      return
    }

    const previousYear = year - 1
    const cachedPrevious = getCached<YearStats>('stats', previousYear)

    if (cachedPrevious) {
      comparisonLogger.debug(`Computing ${year} vs ${previousYear}`)
      const yearComparison = compareYears(currentStats, cachedPrevious)
      comparisonLogger.debug('Insights:', yearComparison.narrativeInsights)
      setComparison(yearComparison)
    } else {
      comparisonLogger.debug(`Previous year ${previousYear} not cached yet`)
      setComparison(null)
    }
  }, [currentYearRef])

  const stopLoadingYear = useCallback((otherYear: number) => {
    setLoadingYears(prev => {
      const next = new Set(prev)
      next.delete(otherYear)
      return next
    })
  }, [])

  const prefetchOtherYears = useCallback((year: number, currentStats: YearStats) => {
    // Check if previous year is already cached
    const previousYear = year - 1
    const cachedPrevious = getCached<YearStats>('stats', previousYear)

    if (cachedPrevious) {
      // Previous year cached - compute comparison immediately
      computeComparison(currentStats, year)
    } else if (AVAILABLE_YEARS.includes(previousYear)) {
      // Previous year not cached but fetchable - show loading state while the prefetch loads it
      setComparisonLoading(true)
    }

    // Background fetch: load other years for future comparisons
    // This populates the cache so switching years is instant
    const otherYears = AVAILABLE_YEARS.filter(y => y !== year)
    otherYears.forEach(otherYear => {
      // Check if already cached before fetching
      if (!getCached<YearStats>('stats', otherYear)) {
        comparisonLogger.debug(`Background fetching ${otherYear}`)
        setLoadingYears(prev => new Set([...Array.from(prev), otherYear]))
        fetchYearStats(otherYear)
          .then(otherResult => {
            if (!mountedRef.current) {
              return
            }
            stopLoadingYear(otherYear)

            // RACE CONDITION FIX: Check if user is still viewing the same year
            // before updating comparison. If user switched years while background
            // fetch was in progress, skip the comparison update.
            const stillOnSameYear = currentYearRef.current === year

            if (otherResult.ok) {
              comparisonLogger.debug(`Cached ${otherYear}`)
              // If the background fetch completed the previous year, update comparison
              // Only if user is still on the same year (race condition prevention)
              if (otherYear === year - 1 && stillOnSameYear) {
                // Re-compute comparison now that previous year is available
                setComparisonLoading(false)
                computeComparison(currentStats, year)
              }
            } else if (otherYear === year - 1 && stillOnSameYear) {
              // Failed to fetch previous year - stop showing loading
              setComparisonLoading(false)
            }
          })
          .catch((error: unknown) => {
            // Handle promise rejection to prevent unhandled rejection errors
            comparisonLogger.error(`Failed to fetch ${otherYear}:`, error)
            if (!mountedRef.current) {
              return
            }
            stopLoadingYear(otherYear)
            // If this was the previous year, stop showing comparison loading
            if (otherYear === year - 1 && currentYearRef.current === year) {
              setComparisonLoading(false)
            }
          })
      }
    })
  }, [fetchYearStats, computeComparison, stopLoadingYear, currentYearRef, mountedRef])

  return { comparison, comparisonLoading, loadingYears, resetComparison, prefetchOtherYears }
}
