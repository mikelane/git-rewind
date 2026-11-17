import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import type { YearStats } from '@/lib/github'
import { getCached, setCache, clearCacheForYear } from '@/lib/cache'
import type { YearComparison } from '@/lib/comparisons'
import { comparisonLogger } from '@/lib/logger'
import { AVAILABLE_YEARS, useYearPrefetch } from './use-year-prefetch'
import {
  LOGIN_PATH,
  getLocalDate,
  isUnauthorized,
  isYearStats,
  type FetchYearResult,
  type LoadError,
} from '@/lib/year-stats-fetch'

export { AVAILABLE_YEARS }

export interface UseYearStatsResult {
  stats: YearStats | null
  comparison: YearComparison | null
  comparisonLoading: boolean
  loading: boolean
  error: LoadError | null
  retrying: boolean
  failedRetries: number
  selectedYear: number
  setSelectedYear: (year: number) => void
  loadingYears: ReadonlySet<number>
  refreshing: boolean
  cachedYears: ReadonlySet<number>
  handleRetry: () => Promise<void>
  handleRefresh: () => Promise<void>
}

/**
 * Loads, caches and compares the rewind stats for the selected year.
 * `storyRef` is the element that receives focus after a successful retry.
 */
export function useYearStats(storyRef: RefObject<HTMLElement | null>): UseYearStatsResult {
  const [stats, setStats] = useState<YearStats | null>(null)
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
  const [selectedYear, setSelectedYear] = useState(AVAILABLE_YEARS[0])
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

  const { comparison, comparisonLoading, loadingYears, resetComparison, prefetchOtherYears } = useYearPrefetch({
    fetchYearStats,
    currentYearRef,
    mountedRef,
  })

  const showLoadedStats = useCallback((year: number, currentStats: YearStats) => {
    setStats(currentStats)
    prefetchOtherYears(year, currentStats)
  }, [prefetchOtherYears])

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
    resetComparison()

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
  }, [fetchYearStats, applyFetchResult, startSelectedYearRequest, isLatestRequest, redirectIfUnauthorized, resetComparison])

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
    try {
      await fetchStats(selectedYear)
    } finally {
      if (mountedRef.current) {
        setRefreshing(false)
      }
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
