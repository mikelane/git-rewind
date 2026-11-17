/**
 * Demo mode hides share buttons on purpose via the explicit isDemo prop (Issue #39),
 * not because username/year happen to be missing.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { TheRhythmChapter } from './the-rhythm'
import { YourCraftChapter } from './your-craft'
import { PeakMomentsChapter } from './peak-moments'
import { EpilogueChapter } from './epilogue'
import { PrologueChapter } from './prologue'

vi.mock('@/lib/share', () => ({
  shareHighlight: vi.fn().mockResolvedValue({ success: true, method: 'clipboard' }),
}))

const rhythmData = {
  activeDays: 200,
  totalDays: 365,
  longestStreak: 14,
  currentStreak: 3,
  busiestMonth: 'March',
  busiestMonthCount: 150,
  contributionsByMonth: [{ month: 'March', count: 150 }],
}

const craftData = {
  primaryLanguage: 'TypeScript',
  primaryLanguagePercentage: 70,
  languages: [{ name: 'TypeScript', percentage: 70, color: '#3178c6' }],
}

const peakData = {
  busiestDay: { date: '2024-10-14', formattedDate: 'October 14th', commits: 23 },
  busiestWeek: { startDate: '2024-10-07', commits: 67 },
  favoriteTimeOfDay: 'evening' as const,
  favoriteDayOfWeek: 'Tuesday',
  lateNightCommits: 47,
  weekendCommits: 89,
  averageCommitsPerActiveDay: 4.2,
}

const epilogueData = {
  year: 2024,
  username: 'octocat',
  totalContributions: 1000,
  activeDays: 200,
  topLanguage: 'TypeScript',
  pullRequestsMerged: 50,
  longestStreak: 14,
}

const prologueData = {
  year: 2024,
  username: 'octocat',
  totalContributions: 1000,
}

const identity = { username: 'octocat', year: 2024 }

const chapters: Array<[string, (isDemo: boolean) => ReactElement]> = [
  [
    'TheRhythmChapter',
    (isDemo) => <TheRhythmChapter data={rhythmData} {...identity} isDemo={isDemo} />,
  ],
  [
    'YourCraftChapter',
    (isDemo) => <YourCraftChapter data={craftData} {...identity} isDemo={isDemo} />,
  ],
  [
    'PeakMomentsChapter',
    (isDemo) => <PeakMomentsChapter data={peakData} {...identity} isDemo={isDemo} />,
  ],
  ['EpilogueChapter', (isDemo) => <EpilogueChapter data={epilogueData} isDemo={isDemo} />],
  [
    'PrologueChapter',
    (isDemo) => <PrologueChapter data={prologueData} isDemo={isDemo} />,
  ],
]

describe('share buttons and demo mode', () => {
  it.each(chapters)('%s renders share buttons when not in demo mode', (_name, renderChapter) => {
    render(renderChapter(false))

    expect(screen.getAllByRole('button', { name: /share/i }).length).toBeGreaterThan(0)
  })

  it.each(chapters)('%s renders no share button in demo mode', (_name, renderChapter) => {
    render(renderChapter(true))

    expect(screen.queryAllByRole('button', { name: /share/i })).toHaveLength(0)
  })
})
