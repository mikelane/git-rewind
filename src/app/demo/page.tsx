'use client'

import { useRef } from 'react'
import {
  PrologueChapter,
  TheRhythmChapter,
  YourCraftChapter,
  TheCollaborationChapter,
  PeakMomentsChapter,
  EpilogueChapter,
  type TheRhythmData,
  type YourCraftData,
  type TheCollaborationData,
  type PeakMomentsData,
  type EpilogueData,
} from '@/components/chapters'
import { ProgressIndicator } from '@/components/ui'
import { getLanguageColor } from '@/lib/constants'
import { useScrollProgress } from '@/hooks'
import { cn } from '@/lib/utils'

const CHAPTER_NAMES = ['Intro', 'Rhythm', 'Craft', 'Collaboration', 'Peak', 'Summary']

// Demo data representing a realistic year of coding
const prologueData = {
  year: 2024,
  username: 'octocat',
  totalContributions: 2847,
}

const rhythmData: TheRhythmData = {
  activeDays: 247,
  totalDays: 366,
  longestStreak: 34,
  currentStreak: 12,
  busiestMonth: 'October',
  busiestMonthCount: 412,
  contributionsByMonth: [
    { month: 'January', count: 198 },
    { month: 'February', count: 234 },
    { month: 'March', count: 287 },
    { month: 'April', count: 256 },
    { month: 'May', count: 189 },
    { month: 'June', count: 167 },
    { month: 'July', count: 203 },
    { month: 'August', count: 245 },
    { month: 'September', count: 298 },
    { month: 'October', count: 412 },
    { month: 'November', count: 234 },
    { month: 'December', count: 124 },
  ],
}

const craftData: YourCraftData = {
  primaryLanguage: 'TypeScript',
  primaryLanguagePercentage: 73,
  topRepository: 'octocat/hello-world',
  languages: [
    { name: 'TypeScript', percentage: 73, color: getLanguageColor('TypeScript') },
    { name: 'Python', percentage: 12, color: getLanguageColor('Python') },
    { name: 'Rust', percentage: 8, color: getLanguageColor('Rust') },
    { name: 'Go', percentage: 4, color: getLanguageColor('Go') },
    { name: 'Shell', percentage: 3, color: getLanguageColor('Shell') },
  ],
}

const collaborationData: TheCollaborationData = {
  pullRequestsOpened: 156,
  pullRequestsMerged: 142,
  pullRequestsReviewed: 89,
  issuesClosed: 67,
  commentsWritten: 423,
  uniqueCollaborators: 23,
  reviewStyle: 'thorough',
  topCollaborators: [
    { username: 'hubot', interactions: 47 },
    { username: 'dependabot', interactions: 34 },
    { username: 'github-actions', interactions: 28 },
    { username: 'renovate', interactions: 19 },
    { username: 'mona', interactions: 15 },
  ],
}

const peakMomentsData: PeakMomentsData = {
  busiestDay: {
    date: '2024-10-14',
    formattedDate: 'October 14th',
    commits: 23,
  },
  busiestWeek: {
    startDate: '2024-10-07',
    commits: 67,
  },
  favoriteTimeOfDay: 'evening',
  favoriteDayOfWeek: 'Tuesday',
  lateNightCommits: 47,
  weekendCommits: 89,
  averageCommitsPerActiveDay: 4.2,
}

const epilogueData: EpilogueData = {
  year: 2024,
  username: 'octocat',
  totalContributions: 2847,
  activeDays: 247,
  topLanguage: 'TypeScript',
  pullRequestsMerged: 142,
  longestStreak: 34,
}

export default function DemoPage() {
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

  return (
    <main ref={mainRef} className="relative h-screen overflow-y-auto snap-y snap-mandatory">
      {/* Demo banner */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'bg-accent/90 backdrop-blur-sm',
          'py-2 px-4 text-center'
        )}
      >
        <p className="text-body-sm text-text-inverse font-medium">
          This is a demo with sample data.{' '}
          <a
            href="/api/auth/login"
            className="underline underline-offset-2 hover:no-underline"
          >
            Connect your GitHub
          </a>{' '}
          to see your real stats.
        </p>
      </div>

      {/* Progress indicator */}
      <ProgressIndicator
        totalChapters={6}
        currentChapter={currentChapter}
        onChapterClick={scrollToChapter}
        chapterNames={CHAPTER_NAMES}
      />

      {/* Prologue */}
      <div ref={prologueRef} className="snap-start snap-always pt-10">
        <PrologueChapter
          data={prologueData}
          onContinue={() => scrollToChapter(1)}
        />
      </div>

      {/* Chapter 1: The Rhythm */}
      <div ref={rhythmRef} className="snap-start snap-always">
        <TheRhythmChapter data={rhythmData} />
      </div>

      {/* Chapter 2: Your Craft */}
      <div ref={craftRef} className="snap-start snap-always">
        <YourCraftChapter data={craftData} />
      </div>

      {/* Chapter 3: The Collaboration */}
      <div ref={collaborationRef} className="snap-start snap-always">
        <TheCollaborationChapter data={collaborationData} />
      </div>

      {/* Chapter 4: Peak Moments */}
      <div ref={peakRef} className="snap-start snap-always">
        <PeakMomentsChapter data={peakMomentsData} />
      </div>

      {/* Epilogue */}
      <div ref={epilogueRef} className="snap-start snap-always">
        <EpilogueChapter data={epilogueData} />
      </div>
    </main>
  )
}
