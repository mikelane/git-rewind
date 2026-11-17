import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import type { YearStats } from '@/lib/github'
import { getCached, setCache, clearCacheForYear } from '@/lib/cache'
import { compareYears, type YearComparison } from '@/lib/comparisons'
import { comparisonLogger } from '@/lib/logger'
import {
  LOGIN_PATH,
  getLocalDate,
  isUnauthorized,
  isYearStats,
  type FetchYearResult,
  type LoadError,
} from '@/lib/year-stats-fetch'

const CURRENT_YEAR = new Date().getFullYear()
export const AVAILABLE_YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

/**
 * Loads, caches and compares the rewind stats for the selected year.
 * `storyRef` is the element that receives focus after a successful retry.
 */
export function useYearStats(storyRef: RefObject<HTMLElement>) {
  const [stats, setStats] = useState<YearStats | null>(null)
  const [comparison, setComparison] = useState<YearComparison | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<LoadError | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [failedRetries, setFailedRetries] = useState(0)
  const retryInFlightRef = useRef(false)
  // Only the most recently started selected-year request may write stats or error state
  const latestRequestRef = useRef(0)
  const mountedRef = useRef(false)

  // Set in the effect body, not only at init: StrictMode runs cleanup then setup again
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      latestRequestRef.current += 1
    }
  }, [])
  // The focused Try again button unmounts when a retry succeeds; move focus to the story
  const focusStoryAfterRetryRef = useRef(false)
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [loadingYears, setLoadingYears] = useState<Set<number>>(new Set())
  const [refreshing, setRefreshing] = useState(false)
  // Populated only after mount so the first client render matches the server render
  const [cachedYears, setCachedYears] = useState<Set<number>>(new Set())

  const syncCachedYears = useCallback(() => {
    if (!mountedRef.current) {
      return
    }
    setCachedYears(new Set(AVAILABLE_YEARS.filter(year => getCached<YearStats>('stats', year))))
  }, [])

  useEffect(() => {
    syncCachedYears()
  }, [syncCachedYears])

  // Ref to track current year for race condition prevention in background fetches
  const currentYearRef = useRef(selectedYear)

  // Keep ref in sync with selected year
  useEffect(() => {
    currentYearRef.current = selectedYear
  }, [selectedYear])

  const fetchYearStats = useCallback(async (year: number): Promise<FetchYearResult> => {
    // Check cache first
    const cached = getCached<YearStats>('stats', year)
    if (cached) {
      if (isYearStats(cached)) {
        return { ok: true, stats: cached }
      }
      // A poisoned cache entry must not be shown; evict it and fetch from the network
      clearCacheForYear('stats', year)
    }

    let response: Response
    try {
      // Include client's local date for timezone-aware date ranges
      const clientDate = getLocalDate()
      response = await fetch(`/api/stats?year=${year}&clientDate=${clientDate}`)
    } catch {
      return { ok: false, kind: 'network' }
    }

    if (!response.ok) {
      return { ok: false, kind: 'http', status: response.status }
    }

    try {
      const data: unknown = await response.json()
      if (!isYearStats(data)) {
        return { ok: false, kind: 'invalid-body' }
      }
      setCache('stats', year, data)
      syncCachedYears()
      return { ok: true, stats: data }
    } catch {
      return { ok: false, kind: 'invalid-body' }
    }
  }, [syncCachedYears])

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
  }, [])

  const showLoadedStats = useCallback((year: number, currentStats: YearStats) => {
    setStats(currentStats)

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
            setLoadingYears(prev => {
              const next = new Set(prev)
              next.delete(otherYear)
              return next
            })

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
            setLoadingYears(prev => {
              const next = new Set(prev)
              next.delete(otherYear)
              return next
            })
            // If this was the previous year, stop showing comparison loading
            if (otherYear === year - 1 && currentYearRef.current === year) {
              setComparisonLoading(false)
            }
          })
      }
    })
  }, [fetchYearStats, computeComparison])

  const applyFetchResult = useCallback((year: number, result: FetchYearResult): LoadError | null => {
    if (!result.ok) {
      return result
    }
    try {
      showLoadedStats(year, result.stats)
      return null
    } catch (processingError) {
      comparisonLogger.error(`Failed to process stats for ${year}:`, processingError)
      // A poisoned cache entry would fail again on every retry, so force a refetch
      clearCacheForYear('stats', year)
      clearCacheForYear('stats', year - 1)
      return { ok: false, kind: 'processing' }
    }
  }, [showLoadedStats])

  const startSelectedYearRequest = useCallback(() => {
    latestRequestRef.current += 1
    return latestRequestRef.current
  }, [])

  const isLatestRequest = useCallback((requestId: number) => latestRequestRef.current === requestId, [])

  // Only a selected-year result may force re-auth; background prefetches never call this
  const redirectIfUnauthorized = useCallback((result: FetchYearResult) => {
    if (isUnauthorized(result)) {
      window.location.href = LOGIN_PATH
    }
  }, [])

  const fetchStats = useCallback(async (year: number) => {
    const requestId = startSelectedYearRequest()
    setLoading(true)
    setError(null)
    setFailedRetries(0)
    setComparison(null)
    setComparisonLoading(false)

    try {
      // Fetch the selected year
      const result = await fetchYearStats(year)
      if (!isLatestRequest(requestId)) {
        return
      }
      redirectIfUnauthorized(result)
      setError(applyFetchResult(year, result))
    } finally {
      if (isLatestRequest(requestId)) {
        setLoading(false)
      }
    }
  }, [fetchYearStats, applyFetchResult, startSelectedYearRequest, isLatestRequest, redirectIfUnauthorized])

  const handleRetry = useCallback(async () => {
    if (retryInFlightRef.current) {
      return
    }
    retryInFlightRef.current = true
    setRetrying(true)
    const requestId = startSelectedYearRequest()
    try {
      const result = await fetchYearStats(selectedYear)
      if (!isLatestRequest(requestId)) {
        return
      }
      redirectIfUnauthorized(result)
      const loadError = applyFetchResult(selectedYear, result)
      setError(loadError)
      setFailedRetries(count => (loadError === null ? 0 : count + 1))
      focusStoryAfterRetryRef.current = loadError === null
    } finally {
      retryInFlightRef.current = false
      if (mountedRef.current) {
        setRetrying(false)
      }
    }
  }, [selectedYear, fetchYearStats, applyFetchResult, startSelectedYearRequest, isLatestRequest, redirectIfUnauthorized])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    clearCacheForYear('stats', selectedYear)
    syncCachedYears()
    await fetchStats(selectedYear)
    if (mountedRef.current) {
      setRefreshing(false)
    }
  }, [selectedYear, fetchStats, syncCachedYears])

  useEffect(() => {
    fetchStats(selectedYear)
  }, [selectedYear, fetchStats])

  useEffect(() => {
    if (error === null && focusStoryAfterRetryRef.current) {
      focusStoryAfterRetryRef.current = false
      storyRef.current?.focus()
    }
  }, [error, storyRef])

  return {
    stats,
    comparison,
    comparisonLoading,
    loading,
    error,
    retrying,
    failedRetries,
    selectedYear,
    setSelectedYear,
    loadingYears,
    refreshing,
    cachedYears,
    handleRetry,
    handleRefresh,
  }
}
