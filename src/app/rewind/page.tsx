'use client'

import { useRef, useMemo } from 'react'
import {
  PrologueChapter,
  TheRhythmChapter,
  YourCraftChapter,
  TheCollaborationChapter,
  PeakMomentsChapter,
  EpilogueChapter,
} from '@/components/chapters'
import { ProgressIndicator } from '@/components/ui'
import { useScrollProgress, useKeyboardNavigation } from '@/hooks'
// Imported from the file, not the @/hooks barrel: page.test.tsx mocks @/hooks with only useScrollProgress and useKeyboardNavigation
import { useYearStats, AVAILABLE_YEARS } from '@/hooks/use-year-stats'
import { downloadRewind } from '@/lib/export'
import { formatFavoriteDays } from '@/lib/format-days'
import { classifyActivityLevel } from '@/lib/activity-level'
import { chapterScrollBehavior } from '@/lib/motion'
import { RewindError } from './rewind-error'
import { YearSelector } from './year-selector'

const CHAPTER_NAMES = ['Intro', 'Rhythm', 'Craft', 'Collaboration', 'Peak', 'Summary']

export default function RewindPage() {
  // Ref for the scroll container
  const mainRef = useRef<HTMLElement>(null)

  const {
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
  } = useYearStats(mainRef)

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

  // Enable keyboard navigation (ArrowDown/Up, Space, PageDown/Up, Home/End)
  useKeyboardNavigation({ chapterRefs, currentChapter })

  const scrollToChapter = (index: number) => {
    chapterRefs[index]?.current?.scrollIntoView({ behavior: chapterScrollBehavior() })
  }

  // Compute activity level based on stats
  const activityLevel = useMemo(() => {
    if (!stats) {
      return 'typical'
    }
    return classifyActivityLevel({
      totalContributions: stats.totalContributions,
      activeDays: stats.rhythm.activeDays,
    })
  }, [stats])

  if (error) {
    return <RewindError failedRetries={failedRetries} retrying={retrying} onRetry={handleRetry} />
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
        favoriteDayOfWeek: formatFavoriteDays(stats.peakMoments.favoriteDaysOfWeek) || null,
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
    <main id="main-content" ref={mainRef} tabIndex={-1} className="relative h-dvh overflow-y-auto focus-visible:ring-0 focus-visible:ring-offset-0 snap-y snap-proximity md:snap-mandatory">
      <YearSelector
        years={AVAILABLE_YEARS}
        selectedYear={selectedYear}
        loading={loading}
        refreshing={refreshing}
        loadingYears={loadingYears}
        cachedYears={cachedYears}
        onSelectYear={setSelectedYear}
        onRefresh={handleRefresh}
      />

      {/* Progress indicator */}
      <ProgressIndicator
        totalChapters={6}
        currentChapter={currentChapter}
        onChapterClick={scrollToChapter}
        chapterNames={CHAPTER_NAMES}
      />

      {/* Prologue */}
      <div ref={prologueRef} className="snap-start md:snap-always">
        <PrologueChapter
          data={prologueData}
          isLoading={loading}
          isComparisonLoading={comparisonLoading}
          onContinue={() => scrollToChapter(1)}
        />
      </div>

      {/* Chapter 1: The Rhythm */}
      <div ref={rhythmRef} className="snap-start md:snap-always">
        <TheRhythmChapter
          data={rhythmData}
          isLoading={loading}
          username={stats?.user.username}
          year={stats?.year}
          activityLevel={activityLevel}
        />
      </div>

      {/* Chapter 2: Your Craft */}
      <div ref={craftRef} className="snap-start md:snap-always">
        <YourCraftChapter
          data={craftData}
          isLoading={loading}
          username={stats?.user.username}
          year={stats?.year}
          activityLevel={activityLevel}
        />
      </div>

      {/* Chapter 3: The Collaboration */}
      <div ref={collaborationRef} className="snap-start md:snap-always">
        <TheCollaborationChapter
          data={collaborationData}
          isLoading={loading}
          activityLevel={activityLevel}
        />
      </div>

      {/* Chapter 4: Peak Moments */}
      <div ref={peakRef} className="snap-start md:snap-always">
        <PeakMomentsChapter
          data={peakMomentsData}
          isLoading={loading}
          username={stats?.user.username}
          year={stats?.year}
          activityLevel={activityLevel}
        />
      </div>

      {/* Epilogue */}
      <div ref={epilogueRef} className="snap-start md:snap-always">
        <EpilogueChapter
          data={epilogueData}
          isLoading={loading}
          onDownload={stats ? () => downloadRewind(stats) : undefined}
          activityLevel={activityLevel}
        />
      </div>
    </main>
  )
}
