import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { YearStats } from '@/lib/github'
import { compareYears } from '@/lib/comparisons'
import { useYearStats, AVAILABLE_YEARS } from './use-year-stats'

vi.mock('@/lib/comparisons', () => ({
  compareYears: vi.fn(() => ({ narrativeInsights: [] })),
}))

vi.mock('@/lib/logger', () => ({
  comparisonLogger: { debug: vi.fn(), error: vi.fn() },
  cacheLogger: { debug: vi.fn(), error: vi.fn() },
}))

const [CURRENT, PREVIOUS] = AVAILABLE_YEARS

interface PendingFetch {
  year: number
  resolve: (stats: YearStats) => void
}

let pendingFetches: PendingFetch[] = []

function statsFor(year: number): YearStats {
  return { year, user: {}, rhythm: {} } as unknown as YearStats
}

function fetchedYear(url: string): number {
  return Number(new URL(url, 'http://localhost').searchParams.get('year'))
}

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (url: string) =>
        new Promise<Response>(resolve => {
          const year = fetchedYear(url)
          pendingFetches.push({
            year,
            resolve: stats => resolve({ ok: true, json: async () => stats } as Response),
          })
        }),
    ),
  )
}

async function settleFetchFor(year: number, which: 'oldest' | 'newest') {
  const matching = pendingFetches.filter(pending => pending.year === year)
  const pending = which === 'oldest' ? matching[0] : matching[matching.length - 1]
  pendingFetches.splice(pendingFetches.indexOf(pending), 1)
  await act(async () => {
    pending.resolve(statsFor(year))
  })
}

const settleOldestFetchFor = (year: number) => settleFetchFor(year, 'oldest')
const settleNewestFetchFor = (year: number) => settleFetchFor(year, 'newest')

function stubLocalStorage() {
  const entries = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
  })
}

function renderYearStats() {
  return renderHook(() => useYearStats({ current: null }))
}

describe('useYearStats background prefetch guards', () => {
  beforeEach(() => {
    stubLocalStorage()
    pendingFetches = []
    vi.mocked(compareYears).mockClear()
    stubFetch()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('It does not build a comparison when a prefetch resolves after unmount', async () => {
    const { result, unmount } = renderYearStats()
    await settleOldestFetchFor(CURRENT)
    await waitFor(() => expect(result.current.comparisonLoading).toBe(true))

    unmount()
    await settleOldestFetchFor(PREVIOUS)

    expect(compareYears).not.toHaveBeenCalled()
  })

  it('It keeps the new year loading when a stale prefetch for the year left behind resolves', async () => {
    const { result } = renderYearStats()
    await settleOldestFetchFor(CURRENT)
    await waitFor(() => expect(result.current.comparisonLoading).toBe(true))

    act(() => result.current.setSelectedYear(PREVIOUS))
    await settleNewestFetchFor(PREVIOUS)
    await waitFor(() => expect(result.current.comparisonLoading).toBe(true))

    await settleOldestFetchFor(PREVIOUS)

    expect(result.current.comparisonLoading).toBe(true)
    expect(result.current.comparison).toBeNull()
    expect(compareYears).not.toHaveBeenCalled()
  })
})
