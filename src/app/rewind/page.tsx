'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  PrologueChapter,
  TheRhythmChapter,
  YourCraftChapter,
  TheCollaborationChapter,
  PeakMomentsChapter,
  EpilogueChapter,
} from '@/components/chapters'
import { ProgressIndicator } from '@/components/ui'
import { useScrollProgress } from '@/hooks'
import type { YearStats } from '@/lib/github'
import { cn } from '@/lib/utils'
import { getCached, setCache } from '@/lib/cache'
import { downloadRewind } from '@/lib/export'
import { compareYears, type YearComparison } from '@/lib/comparisons'
import { comparisonLogger } from '@/lib/logger'

const CURRENT_YEAR = new Date().getFullYear()
const AVAILABLE_YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

const CHAPTER_NAMES = ['Intro', 'Rhythm', 'Craft', 'Collaboration', 'Peak', 'Summary']

export default function RewindPage() {
  const [stats, setStats] = useState<YearStats | null>(null)
  const [comparison, setComparison] = useState<YearComparison | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [loadingYears, setLoadingYears] = useState<Set<number>>(new Set())

  // Ref for the scroll container
  const mainRef = useRef<HTMLElement>(null)

  // Refs for each chapter section
  const prologueRef = useRef<HTMLDivElement>(null)
  const rhythmRef = useRef<HTMLDivElement>(null)
  const craftRef = useRef<HTMLDivElement>(null)
  const collaborationRef = useRef<HTMLDivElement>(null)
  const peakRef = useRef<HTMLDivElement>(null)
  const epilogueRef = useRef<HTMLDivElement>(null)

  const chapterRefs = [
    prologueRef,
    rhythmRef,
    craftRef,
    collaborationRef,
    peakRef,
    epilogueRef,
  ]

  const { currentChapter } = useScrollProgress({ chapterRefs, containerRef: mainRef })

  const scrollToChapter = (index: number) => {
    chapterRefs[index]?.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchYearStats = useCallback(async (year: number): Promise<YearStats | null> => {
    // Check cache first
    const cached = getCached<YearStats>('stats', year)
    if (cached) {
      return cached
    }

    try {
      const response = await fetch(`/api/stats?year=${year}`)

      if (response.status === 401) {
        window.location.href = '/api/auth/login'
        return null
      }

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      setCache('stats', year, data)
      return data
    } catch {
      return null
    }
  }, [])

  // Compute comparison for current stats against previous year (if available)
  const computeComparison = useCallback((currentStats: YearStats, year: number) => {
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

  const fetchStats = useCallback(async (year: number) => {
    setLoading(true)
    setError(null)
    setComparison(null)
    setComparisonLoading(false)

    try {
      // Fetch the selected year
      const currentStats = await fetchYearStats(year)

      if (!currentStats) {
        throw new Error('Failed to fetch stats')
      }

      setStats(currentStats)

      // Check if previous year is already cached
      const previousYear = year - 1
      const cachedPrevious = getCached<YearStats>('stats', previousYear)

      if (cachedPrevious) {
        // Previous year cached - compute comparison immediately
        computeComparison(currentStats, year)
      } else {
        // Previous year not cached - show loading state while we fetch it
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
          fetchYearStats(otherYear).then(otherStats => {
            setLoadingYears(prev => {
              const next = new Set(prev)
              next.delete(otherYear)
              return next
            })
            if (otherStats) {
              comparisonLogger.debug(`Cached ${otherYear}`)
              // If the background fetch completed the previous year, update comparison
              if (otherYear === year - 1) {
                // Re-compute comparison now that previous year is available
                setComparisonLoading(false)
                computeComparison(currentStats, year)
              }
            } else if (otherYear === year - 1) {
              // Failed to fetch previous year - stop showing loading
              setComparisonLoading(false)
            }
          })
        }
      })
    } catch {
      setError('Failed to load your GitHub data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [fetchYearStats, computeComparison])

  useEffect(() => {
    fetchStats(selectedYear)
  }, [selectedYear, fetchStats])

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-display-sm text-text-primary mb-4">
          Something went wrong
        </h1>
        <p className="text-body text-text-secondary mb-8 max-w-md">{error}</p>
        <a
          href="/api/auth/login"
          className={cn(
            'px-6 py-3 rounded-xl',
            'bg-accent text-text-inverse font-medium',
            'hover:bg-accent-hover transition-colors'
          )}
        >
          Try again
        </a>
      </main>
    )
  }

  // Convert stats to chapter props format
  const prologueData = stats
    ? {
        year: stats.year,
        username: stats.user.username,
        totalContributions: stats.totalContributions,
        comparisonInsights: comparison?.narrativeInsights,
      }
    : null

  const rhythmData = stats
    ? {
        activeDays: stats.rhythm.activeDays,
        totalDays: stats.rhythm.totalDays,
        longestStreak: stats.rhythm.longestStreak,
        currentStreak: stats.rhythm.currentStreak,
        busiestMonth: stats.rhythm.busiestMonth,
        busiestMonthCount: stats.rhythm.busiestMonthCount,
        contributionsByMonth: stats.rhythm.contributionsByMonth,
      }
    : null

  const craftData = stats
    ? {
        primaryLanguage: stats.craft.primaryLanguage,
        primaryLanguagePercentage: stats.craft.primaryLanguagePercentage,
        topRepository: stats.craft.topRepository ?? undefined,
        languages: stats.craft.languages,
      }
    : null

  const collaborationData = stats
    ? {
        pullRequestsOpened: stats.collaboration.pullRequestsOpened,
        pullRequestsMerged: stats.collaboration.pullRequestsMerged,
        pullRequestsReviewed: stats.collaboration.pullRequestsReviewed,
        issuesClosed: stats.collaboration.issuesClosed,
        commentsWritten: 0, // Not available
        uniqueCollaborators: stats.collaboration.uniqueCollaborators,
        topCollaborators: stats.collaboration.topCollaborators,
        reviewStyle: stats.collaboration.reviewStyle,
      }
    : null

  const peakMomentsData = stats
    ? {
        busiestDay: stats.peakMoments.busiestDay,
        busiestWeek: { startDate: '', commits: 0 }, // Not calculated
        favoriteTimeOfDay: stats.peakMoments.favoriteTimeOfDay,
        favoriteDayOfWeek: stats.peakMoments.favoriteDaysOfWeek.length > 0
          ? stats.peakMoments.favoriteDaysOfWeek.join(' & ')
          : null,
        lateNightCommits: stats.peakMoments.lateNightCommits,
        weekendCommits: stats.peakMoments.weekendCommits,
        averageCommitsPerActiveDay: stats.peakMoments.averageCommitsPerActiveDay,
      }
    : null

  const epilogueData = stats
    ? {
        year: stats.year,
        username: stats.user.username,
        totalContributions: stats.totalContributions,
        activeDays: stats.rhythm.activeDays,
        topLanguage: stats.craft.primaryLanguage,
        pullRequestsMerged: stats.collaboration.pullRequestsMerged,
        longestStreak: stats.rhythm.longestStreak,
        dataCompleteness: stats.dataCompleteness,
      }
    : null

  return (
    <main id="main-content" ref={mainRef} className="relative h-screen overflow-y-auto snap-y snap-mandatory">
      {/* Year selector */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <span className="text-caption text-text-tertiary mr-1 hidden sm:inline">Viewing</span>
        {AVAILABLE_YEARS.map((year) => {
          const isLoading = loadingYears.has(year)
          const isCached = !!getCached<YearStats>('stats', year)

          return (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              disabled={loading && selectedYear === year}
              className={cn(
                'px-3 py-1.5 text-caption font-medium rounded-full transition-all duration-200',
                selectedYear === year
                  ? 'bg-accent text-text-inverse'
                  : isCached
                    ? 'bg-bg-surface text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    : 'bg-bg-surface/50 text-text-tertiary hover:bg-bg-elevated hover:text-text-primary',
                isLoading && 'animate-pulse',
                loading && selectedYear === year && 'opacity-70'
              )}
              aria-label={`View ${year}${isLoading ? ' (loading)' : ''}`}
            >
              {year}
            </button>
          )
        })}
      </div>

      {/* Progress indicator */}
      <ProgressIndicator
        totalChapters={6}
        currentChapter={currentChapter}
        onChapterClick={scrollToChapter}
        chapterNames={CHAPTER_NAMES}
      />

      {/* Prologue */}
      <div ref={prologueRef} className="snap-start snap-always">
        <PrologueChapter
          data={prologueData}
          isLoading={loading}
          isComparisonLoading={comparisonLoading}
          onContinue={() => scrollToChapter(1)}
        />
      </div>

      {/* Chapter 1: The Rhythm */}
      <div ref={rhythmRef} className="snap-start snap-always">
        <TheRhythmChapter data={rhythmData} isLoading={loading} />
      </div>

      {/* Chapter 2: Your Craft */}
      <div ref={craftRef} className="snap-start snap-always">
        <YourCraftChapter data={craftData} isLoading={loading} />
      </div>

      {/* Chapter 3: The Collaboration */}
      <div ref={collaborationRef} className="snap-start snap-always">
        <TheCollaborationChapter data={collaborationData} isLoading={loading} />
      </div>

      {/* Chapter 4: Peak Moments */}
      <div ref={peakRef} className="snap-start snap-always">
        <PeakMomentsChapter data={peakMomentsData} isLoading={loading} />
      </div>

      {/* Epilogue */}
      <div ref={epilogueRef} className="snap-start snap-always">
        <EpilogueChapter
          data={epilogueData}
          isLoading={loading}
          onDownload={stats ? () => downloadRewind(stats) : undefined}
        />
      </div>
    </main>
  )
}
