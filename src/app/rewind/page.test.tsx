import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor, screen } from '@testing-library/react'

// Track unhandled rejections
let unhandledRejection: Error | null = null
const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
  unhandledRejection = event.reason
  event.preventDefault()
}

// Mock the components to simplify testing
vi.mock('@/components/chapters', () => ({
  PrologueChapter: () => <div data-testid="prologue">Prologue</div>,
  TheRhythmChapter: () => <div data-testid="rhythm">Rhythm</div>,
  YourCraftChapter: () => <div data-testid="craft">Craft</div>,
  TheCollaborationChapter: () => <div data-testid="collaboration">Collaboration</div>,
  PeakMomentsChapter: () => <div data-testid="peak">Peak</div>,
  EpilogueChapter: () => <div data-testid="epilogue">Epilogue</div>,
}))

vi.mock('@/components/ui', () => ({
  ProgressIndicator: () => <div data-testid="progress">Progress</div>,
}))

vi.mock('@/hooks', () => ({
  useScrollProgress: () => ({ currentChapter: 0 }),
  useKeyboardNavigation: () => {},
}))

vi.mock('@/lib/cache', () => ({
  getCached: vi.fn(() => null),
  setCache: vi.fn(),
}))

vi.mock('@/lib/export', () => ({
  downloadRewind: vi.fn(),
}))

vi.mock('@/lib/comparisons', () => ({
  compareYears: vi.fn(() => ({ narrativeInsights: [] })),
}))

vi.mock('@/lib/logger', () => ({
  comparisonLogger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/format-days', () => ({
  formatFavoriteDays: vi.fn(() => 'Monday'),
}))

import RewindPage from './page'

const originalFetch = global.fetch

describe('RewindPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    unhandledRejection = null
    window.addEventListener('unhandledrejection', unhandledRejectionHandler)

    // Default successful fetch mock
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        user: { username: 'test', name: 'Test User', avatarUrl: '' },
        year: 2024,
        totalContributions: 100,
        dataCompleteness: { restrictedContributions: 0, percentageAccessible: 100, reposAnalyzed: 5, truncation: {} },
        rhythm: { activeDays: 100, totalDays: 365, longestStreak: 10, currentStreak: 5, busiestMonth: 'March', busiestMonthCount: 50, contributionsByMonth: [] },
        craft: { primaryLanguage: 'TypeScript', primaryLanguagePercentage: 50, languages: [], topRepository: null },
        collaboration: { pullRequestsOpened: 10, pullRequestsMerged: 8, pullRequestsReviewed: 5, issuesClosed: 3, uniqueCollaborators: 2, topCollaborators: [], reviewStyle: 'balanced', isMergeRateApproximate: false },
        peakMoments: { busiestDay: null, favoriteTimeOfDay: 'evening', favoriteDaysOfWeek: [], lateNightCommits: 0, weekendCommits: 0, averageCommitsPerActiveDay: 1 },
      }),
    })
  })

  afterEach(() => {
    window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
    global.fetch = originalFetch
  })

  describe('Bug #5: Unhandled promise rejection in background fetch', () => {
    it('handles fetch rejection gracefully without unhandled promise rejection', async () => {
      // First call succeeds (current year)
      // Second call rejects (background fetch of other year)
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call - current year - succeeds
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              user: { username: 'test', name: 'Test User', avatarUrl: '' },
              year: 2024,
              totalContributions: 100,
              dataCompleteness: { restrictedContributions: 0, percentageAccessible: 100, reposAnalyzed: 5, truncation: {} },
              rhythm: { activeDays: 100, totalDays: 365, longestStreak: 10, currentStreak: 5, busiestMonth: 'March', busiestMonthCount: 50, contributionsByMonth: [] },
              craft: { primaryLanguage: 'TypeScript', primaryLanguagePercentage: 50, languages: [], topRepository: null },
              collaboration: { pullRequestsOpened: 10, pullRequestsMerged: 8, pullRequestsReviewed: 5, issuesClosed: 3, uniqueCollaborators: 2, topCollaborators: [], reviewStyle: 'balanced', isMergeRateApproximate: false },
              peakMoments: { busiestDay: null, favoriteTimeOfDay: 'evening', favoriteDaysOfWeek: [], lateNightCommits: 0, weekendCommits: 0, averageCommitsPerActiveDay: 1 },
            }),
          })
        }
        // Background fetches - reject to trigger the bug
        return Promise.reject(new Error('Network error'))
      })

      render(<RewindPage />)

      // Wait for the component to render and background fetches to complete
      await waitFor(() => {
        expect(screen.getByTestId('prologue')).toBeInTheDocument()
      }, { timeout: 2000 })

      // Give time for background fetches to potentially reject
      await new Promise(resolve => setTimeout(resolve, 100))

      // The test passes if no unhandled rejection occurred
      expect(unhandledRejection).toBeNull()
    })

    it('clears loading state even when background fetch fails', async () => {
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              user: { username: 'test', name: 'Test User', avatarUrl: '' },
              year: 2024,
              totalContributions: 100,
              dataCompleteness: { restrictedContributions: 0, percentageAccessible: 100, reposAnalyzed: 5, truncation: {} },
              rhythm: { activeDays: 100, totalDays: 365, longestStreak: 10, currentStreak: 5, busiestMonth: 'March', busiestMonthCount: 50, contributionsByMonth: [] },
              craft: { primaryLanguage: 'TypeScript', primaryLanguagePercentage: 50, languages: [], topRepository: null },
              collaboration: { pullRequestsOpened: 10, pullRequestsMerged: 8, pullRequestsReviewed: 5, issuesClosed: 3, uniqueCollaborators: 2, topCollaborators: [], reviewStyle: 'balanced', isMergeRateApproximate: false },
              peakMoments: { busiestDay: null, favoriteTimeOfDay: 'evening', favoriteDaysOfWeek: [], lateNightCommits: 0, weekendCommits: 0, averageCommitsPerActiveDay: 1 },
            }),
          })
        }
        return Promise.reject(new Error('Network error'))
      })

      render(<RewindPage />)

      await waitFor(() => {
        expect(screen.getByTestId('prologue')).toBeInTheDocument()
      })

      // Background fetch failure should be handled gracefully
      // The main content should still be visible
      expect(screen.getByTestId('prologue')).toBeInTheDocument()
    })
  })
})
