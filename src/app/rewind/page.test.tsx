import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StrictMode } from 'react'
import { render, waitFor, screen, fireEvent, act } from '@testing-library/react'

// Track unhandled rejections
let unhandledRejection: Error | null = null
const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
  unhandledRejection = event.reason
  event.preventDefault()
}

// Mock the components to simplify testing
vi.mock('@/components/chapters', () => ({
  PrologueChapter: ({ data }: { data: { year: number } | null }) => (
    <div data-testid="prologue" data-year={data?.year}>Prologue</div>
  ),
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
  clearCacheForYear: vi.fn(),
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

import { renderToString } from 'react-dom/server'
import { getCached, setCache, clearCacheForYear } from '@/lib/cache'
import { compareYears, type YearComparison } from '@/lib/comparisons'
import type { YearStats } from '@/lib/github'
import RewindPage from './page'

const originalFetch = global.fetch

describe('RewindPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCached).mockImplementation(() => null)
    vi.mocked(setCache).mockImplementation(() => {})
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

  describe('tap targets', () => {
    const currentYear = new Date().getFullYear()

    it.each(['min-h-11', 'min-w-11'])('It renders the year selector button with %s', async (utility) => {
      render(<RewindPage />)

      const yearButton = await screen.findByRole('button', { name: new RegExp(`View ${currentYear}`) })

      expect(yearButton).toHaveClass(utility)
    })

    it.each(['min-h-11', 'min-w-11'])('It renders the refresh button with %s', async (utility) => {
      render(<RewindPage />)

      const refreshButton = await screen.findByRole('button', { name: 'Refresh stats' })

      expect(refreshButton).toHaveClass(utility)
    })
  })

  describe('mobile scrolling', () => {
    const renderLoadedStory = async () => {
      render(<RewindPage />)
      const prologue = await screen.findByTestId('prologue')
      return prologue.parentElement?.parentElement as HTMLElement
    }

    it('It renders the story with proximity snapping on phones and mandatory snapping from md', async () => {
      const main = await renderLoadedStory()

      expect(main).toHaveClass('snap-proximity', 'md:snap-mandatory')
      expect(main).not.toHaveClass('snap-mandatory')
    })

    it('It renders six chapter wrappers', async () => {
      const main = await renderLoadedStory()

      expect(main.querySelectorAll(':scope > .snap-start')).toHaveLength(6)
    })

    it.each([0, 1, 2, 3, 4, 5])(
      'It renders chapter wrapper %i so it only forces a snap stop from md',
      async index => {
        const main = await renderLoadedStory()

        const wrapper = main.querySelectorAll(':scope > .snap-start')[index]
        expect(wrapper).toHaveClass('md:snap-always')
        expect(wrapper).not.toHaveClass('snap-always')
      }
    )
  })

  describe('year pill cached styling', () => {
    const previousYear = new Date().getFullYear() - 1
    const cachedPillClass = 'text-text-secondary'
    const uncachedPillClass = 'text-text-tertiary'
    const pillFor = (year: number) =>
      screen.getByRole('button', { name: new RegExp(`View ${year}`) }).firstElementChild

    it('It renders the uncached pill styling on the server render even when the cache holds the year', () => {
      vi.mocked(getCached).mockReturnValue({ year: previousYear } as never)

      const html = renderToString(<RewindPage />)

      expect(html).not.toContain('bg-bg-surface text-text-secondary')
    })

    it('It renders the uncached pill styling when the cache is empty', async () => {
      render(<RewindPage />)
      await screen.findByRole('button', { name: 'Refresh stats' })

      expect(pillFor(previousYear)).toHaveClass(uncachedPillClass)
    })

    it('It shows cached pill styling after mount when the cache holds the year', async () => {
      vi.mocked(getCached).mockImplementation(((_: string, year: number) =>
        year === previousYear ? { year } : null) as never)

      render(<RewindPage />)
      await screen.findByRole('button', { name: 'Refresh stats' })

      await waitFor(() => expect(pillFor(previousYear)).toHaveClass(cachedPillClass))
    })

    it('It shows cached pill styling once a background fetch caches the year', async () => {
      const cachedYears = new Set<number>()
      vi.mocked(getCached).mockImplementation(((_: string, year: number) =>
        cachedYears.has(year) ? { year } : null) as never)
      vi.mocked(setCache).mockImplementation(((_: string, year: number) => {
        cachedYears.add(year)
      }) as never)

      render(<RewindPage />)

      await waitFor(() => expect(pillFor(previousYear)).toHaveClass(cachedPillClass))
    })
  })

  describe('Bug #5: Unhandled promise rejection in background fetch', () => {
    it('It handles fetch rejection gracefully without unhandled promise rejection', async () => {
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

    it('It clears loading state even when background fetch fails', async () => {
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

  describe('retrying a failed stats fetch', () => {
    const year = new Date().getFullYear()
    const okBody = {
      user: { username: 'test', name: 'Test User', avatarUrl: '' },
      year,
      totalContributions: 100,
      dataCompleteness: { restrictedContributions: 0, percentageAccessible: 100, reposAnalyzed: 5, truncation: {} },
      rhythm: { activeDays: 100, totalDays: 365, longestStreak: 10, currentStreak: 5, busiestMonth: 'March', busiestMonthCount: 50, contributionsByMonth: [] },
      craft: { primaryLanguage: 'TypeScript', primaryLanguagePercentage: 50, languages: [], topRepository: null },
      collaboration: { pullRequestsOpened: 10, pullRequestsMerged: 8, pullRequestsReviewed: 5, issuesClosed: 3, uniqueCollaborators: 2, topCollaborators: [], reviewStyle: 'balanced', isMergeRateApproximate: false },
      peakMoments: { busiestDay: null, favoriteTimeOfDay: 'evening', favoriteDaysOfWeek: [], lateNightCommits: 0, weekendCommits: 0, averageCommitsPerActiveDay: 1 },
    }
    const okResponse = () => ({ ok: true, status: 200, json: () => Promise.resolve(okBody) })
    const httpResponse = (status: number) => ({ ok: false, status, json: () => Promise.resolve({}) })
    const invalidJsonResponse = () => ({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('bad json')) })
    const networkError = () => Promise.reject(new TypeError('Failed to fetch'))

    const mainYearUrl = `/api/stats?year=${year}&clientDate=`
    const isMainYearCall = (call: unknown[]) => String(call[0]).startsWith(mainYearUrl)
    const mainYearCalls = () => vi.mocked(global.fetch).mock.calls.filter(isMainYearCall)

    // Responses for the selected year are consumed in order; other years always succeed.
    const mainYearFetch = (...responses: Array<() => unknown>) => {
      const queue = [...responses]
      return (url: string): Promise<unknown> => {
        if (!url.startsWith(mainYearUrl)) {
          return Promise.resolve(okResponse())
        }
        const next = queue.shift() ?? okResponse
        return Promise.resolve(next())
      }
    }
    const mockMainYearResponses = (...responses: Array<() => unknown>) => {
      global.fetch = vi.fn().mockImplementation(mainYearFetch(...responses))
    }

    const originalLocation = window.location
    beforeEach(() => {
      Object.defineProperty(window, 'location', { value: { href: '/rewind' }, writable: true, configurable: true })
    })
    afterEach(() => {
      Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true })
    })

    const failures: Array<[string, () => unknown]> = [
      ['a network error', networkError],
      ['an HTTP 500 response', () => httpResponse(500)],
      ['an HTTP 503 response', () => httpResponse(503)],
    ]
    const retryableFailures: Array<[string, () => unknown]> = [
      ...failures,
      ['an HTTP 403 response', () => httpResponse(403)],
      ['an HTTP 404 response', () => httpResponse(404)],
      ['an HTTP 429 response', () => httpResponse(429)],
      ['a 200 response with invalid JSON', invalidJsonResponse],
    ]

    const findTryAgain = () => screen.findByRole('button', { name: 'Try again' })

    it.each(retryableFailures)('It renders a Try again button element when the fetch fails with %s', async (_failureName, failure) => {
      mockMainYearResponses(failure)
      render(<RewindPage />)

      const button = await findTryAgain()

      expect(button.tagName).toBe('BUTTON')
    })

    it.each(retryableFailures)('It renders the shared message when the fetch fails with %s', async (_failureName, failure) => {
      mockMainYearResponses(failure)
      render(<RewindPage />)

      await findTryAgain()

      expect(screen.getByText("We couldn't load your GitHub data. This is usually temporary.")).toBeInTheDocument()
    })

    it.each(retryableFailures)('It renders a Sign in again link when the fetch fails with %s', async (_failureName, failure) => {
      mockMainYearResponses(failure)
      render(<RewindPage />)

      await findTryAgain()

      expect(screen.getByRole('link', { name: 'Sign in again' })).toHaveAttribute('href', '/api/auth/login')
    })

    it.each(failures)('It refetches the same year without navigating when retrying after %s', async (_failureName, failure) => {
      mockMainYearResponses(failure, () => httpResponse(500))
      render(<RewindPage />)

      fireEvent.click(await findTryAgain())

      await waitFor(() => expect(mainYearCalls()).toHaveLength(2))
      expect(window.location.href).toBe('/rewind')
    })

    it('It refetches the year that failed with the client date', async () => {
      mockMainYearResponses(() => httpResponse(500), () => httpResponse(500))
      render(<RewindPage />)

      fireEvent.click(await findTryAgain())

      await waitFor(() => expect(mainYearCalls()).toHaveLength(2))
      expect(String(mainYearCalls()[1][0])).toMatch(new RegExp(`^/api/stats\\?year=${year}&clientDate=\\d{4}-\\d{2}-\\d{2}$`))
    })

    it('It does not cache a failed fetch', async () => {
      mockMainYearResponses(() => httpResponse(500))
      render(<RewindPage />)

      await findTryAgain()

      expect(setCache).not.toHaveBeenCalled()
    })

    it('It clears the error and renders the story when the retry succeeds', async () => {
      mockMainYearResponses(() => httpResponse(500), okResponse)
      render(<RewindPage />)

      fireEvent.click(await findTryAgain())

      expect(await screen.findByTestId('prologue')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('It shows the error view with an enabled Try again button when the retry fails too', async () => {
      mockMainYearResponses(() => httpResponse(500), () => httpResponse(500))
      render(<RewindPage />)

      fireEvent.click(await findTryAgain())

      await waitFor(() => expect(mainYearCalls()).toHaveLength(2))
      await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toHaveAttribute('aria-disabled', 'false'))
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    describe('while a retry is in flight', () => {
      const startRetry = async () => {
        // Promise.resolve adopts the never-settling promise, so the retry stays in flight
        mockMainYearResponses(() => httpResponse(500), () => new Promise(() => {}))
        render(<RewindPage />)
        fireEvent.click(await findTryAgain())
        await waitFor(() => expect(mainYearCalls()).toHaveLength(2))
      }

      it('It marks the Try again button aria-disabled', async () => {
        await startRetry()

        expect(screen.getByRole('button', { name: 'Try again' })).toHaveAttribute('aria-disabled', 'true')
      })

      it('It keeps focus on the Try again button that was focused before the click', async () => {
        mockMainYearResponses(() => httpResponse(500), () => new Promise(() => {}))
        render(<RewindPage />)
        const button = await findTryAgain()
        button.focus()

        fireEvent.click(button)
        await waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'true'))

        expect(button).not.toHaveAttribute('disabled')
        expect(button).toHaveFocus()
      })

      it('It keeps the error view mounted instead of the loading skeleton', async () => {
        await startRetry()

        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.queryByTestId('prologue')).not.toBeInTheDocument()
      })

      it('It does not issue another fetch when the button is clicked again', async () => {
        await startRetry()

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

        expect(mainYearCalls()).toHaveLength(2)
      })
    })

    it('It redirects to sign in when the initial fetch returns 401', async () => {
      mockMainYearResponses(() => httpResponse(401))
      render(<RewindPage />)

      await waitFor(() => expect(window.location.href).toBe('/api/auth/login'))
    })

    it('It redirects to sign in when the retry returns 401', async () => {
      mockMainYearResponses(() => httpResponse(500), () => httpResponse(401))
      render(<RewindPage />)

      fireEvent.click(await findTryAgain())

      await waitFor(() => expect(window.location.href).toBe('/api/auth/login'))
    })

    it('It shows no error view when a background prefetch of another year fails', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) =>
        url.startsWith(mainYearUrl) ? Promise.resolve(okResponse()) : Promise.resolve(httpResponse(500))
      )
      render(<RewindPage />)

      expect(await screen.findByTestId('prologue')).toBeInTheDocument()
      await waitFor(() => expect(vi.mocked(global.fetch).mock.calls.filter(c => String(c[0]).startsWith(`/api/stats?year=${year - 1}&`))).toHaveLength(1))
      await act(async () => {})
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })
})

const year = new Date().getFullYear()
const okBody = (y: number) => ({
  user: { username: 'test', name: 'Test User', avatarUrl: '' },
  year: y,
  totalContributions: 100,
  dataCompleteness: { restrictedContributions: 0, percentageAccessible: 100, reposAnalyzed: 5, truncation: {} },
  rhythm: { activeDays: 100, totalDays: 365, longestStreak: 10, currentStreak: 5, busiestMonth: 'March', busiestMonthCount: 50, contributionsByMonth: [] },
  craft: { primaryLanguage: 'TypeScript', primaryLanguagePercentage: 50, languages: [], topRepository: null },
  collaboration: { pullRequestsOpened: 10, pullRequestsMerged: 8, pullRequestsReviewed: 5, issuesClosed: 3, uniqueCollaborators: 2, topCollaborators: [], reviewStyle: 'balanced', isMergeRateApproximate: false },
  peakMoments: { busiestDay: null, favoriteTimeOfDay: 'evening', favoriteDaysOfWeek: [], lateNightCommits: 0, weekendCommits: 0, averageCommitsPerActiveDay: 1 },
})
const urlFor = (y: number) => `/api/stats?year=${y}&clientDate=`
const callsFor = (y: number) => vi.mocked(global.fetch).mock.calls.filter(c => String(c[0]).startsWith(urlFor(y)))

// getCached<T> is generic over whatever the caller expects to read back, and a
// test double cannot prove an arbitrary T. The cache stands in for untrusted
// localStorage (these tests feed it corrupt entries on purpose), so this is the
// one deliberate assertion in the suite, kept here instead of at every call site.
const fakeGetCached = (lookup: (y: number) => unknown): typeof getCached =>
  ((_ns: string, y: number) => lookup(y) ?? null) as typeof getCached

const emptyComparison: YearComparison = {
  contributionsDelta: 0,
  contributionsPercentChange: 0,
  activeDaysDelta: 0,
  longestStreakDelta: 0,
  pullRequestsDelta: 0,
  newLanguages: [],
  droppedLanguages: [],
  consistencyImproved: false,
  narrativeInsights: [],
  comparisonType: 'full-year',
}

describe('RewindPage retry flow regressions', () => {
  const originalFetch = global.fetch
  const originalLocation = window.location
  beforeEach(() => {
    vi.clearAllMocks()
    // clearAllMocks keeps implementations; reset the ones these tests override so they cannot leak
    vi.mocked(getCached).mockImplementation(() => null)
    vi.mocked(setCache).mockImplementation(() => {})
    vi.mocked(clearCacheForYear).mockImplementation(() => {})
    vi.mocked(compareYears).mockImplementation(() => emptyComparison)
    Object.defineProperty(window, 'location', { value: { href: '/rewind' }, writable: true, configurable: true })
  })
  afterEach(() => {
    global.fetch = originalFetch
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true })
  })

  it('It puts the load error message in a polite live region', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })
    render(<RewindPage />)
    await screen.findByRole('button', { name: 'Try again' })

    expect(screen.getByRole('status')).toHaveTextContent("We couldn't load your GitHub data. This is usually temporary.")
  })

  it('It tells screen readers the retry also failed', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })
    render(<RewindPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent("Still couldn't load your GitHub data. Try again in a moment."))
  })

  // A valid stats body with exactly one field removed, so each row isolates one required field
  const withoutField = (field: keyof ReturnType<typeof okBody>) => {
    const body: Partial<ReturnType<typeof okBody>> = { ...okBody(year) }
    delete body[field]
    return body
  }

  it.each([
    ['null', null],
    ['a string', 'oops'],
    ['a number', 42],
    ['an array', []],
    ['an error payload without stats fields', { error: 'Internal error' }],
    ['a body with no year', withoutField('year')],
    ['a body with a non-number year', { ...okBody(year), year: String(year) }],
    ['a body with no user', withoutField('user')],
    ['a body with no rhythm', withoutField('rhythm')],
  ])('It shows the error view and caches nothing when a 200 body is %s', async (_name, body) => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) })
    render(<RewindPage />)

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(setCache).not.toHaveBeenCalled()
  })

  it('It shows the error view when computing the comparison throws after a successful fetch', async () => {
    vi.mocked(getCached).mockImplementation(fakeGetCached(y => (y === year - 1 ? okBody(year - 1) : null)))
    vi.mocked(compareYears).mockImplementation(() => {
      throw new TypeError('corrupt cached comparison data')
    })
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
    render(<RewindPage />)

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByText("We couldn't load your GitHub data. This is usually temporary.")).toBeInTheDocument()
  })

  describe('when computing the comparison throws', () => {
    // Swap the process handler in hooks so a failing waitFor cannot skip the restore
    let rejections: unknown[] = []
    let priorListeners: NodeJS.UnhandledRejectionListener[] = []
    const onRejection = (reason: unknown) => {
      rejections.push(reason)
    }
    const settle = () => new Promise(resolve => setTimeout(resolve, 50))

    beforeEach(() => {
      rejections = []
      priorListeners = process.listeners('unhandledRejection')
      process.removeAllListeners('unhandledRejection')
      process.on('unhandledRejection', onRejection)
      vi.mocked(getCached).mockImplementation(fakeGetCached(y => (y === year - 1 ? okBody(year - 1) : null)))
      vi.mocked(compareYears).mockImplementation(() => {
        throw new TypeError('corrupt cached comparison data')
      })
    })
    afterEach(() => {
      process.removeAllListeners('unhandledRejection')
      priorListeners.forEach(listener => process.on('unhandledRejection', listener))
    })

    it('It shows the error view, with no unhandled rejection, when a retry succeeds', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce(failing500())
        .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
      render(<RewindPage />)
      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
      await waitFor(() => expect(compareYears).toHaveBeenCalledTimes(1))
      await settle()

      expect(rejections).toEqual([])
      expect(screen.getByRole('status')).toHaveTextContent("Still couldn't load your GitHub data. Try again in a moment.")
    })

    it('It leaves no unhandled rejection on the first load', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
      render(<RewindPage />)
      await waitFor(() => expect(compareYears).toHaveBeenCalledTimes(1))
      await settle()

      expect(rejections).toEqual([])
    })
  })

  it('It issues one retry fetch when Try again is clicked twice before React re-renders', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) =>
      url.startsWith(urlFor(year)) && callsFor(year).length > 1
        ? new Promise(() => {})
        : Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    )
    render(<RewindPage />)
    const button = await screen.findByRole('button', { name: 'Try again' })

    act(() => {
      button.click()
      button.click()
    })

    expect(callsFor(year)).toHaveLength(2)
  })

  it('It retries the switched-to year rather than the current year', async () => {
    const prev = year - 1
    // For the previous year: background prefetch hangs, the explicit switch fails, the retry succeeds
    const prevYearResponses = [() => new Promise(() => {}), () => Promise.resolve(failing500())]
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const y = Number(new URL(url, 'http://x').searchParams.get('year'))
      const okForYear = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(okBody(y)) })
      const next = (y === prev ? prevYearResponses.shift() : undefined) ?? okForYear
      return next()
    })
    render(<RewindPage />)
    await screen.findByTestId('prologue')
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`View ${prev}`) }))
    const tryAgain = await screen.findByRole('button', { name: 'Try again' })
    const callsBeforeRetry = vi.mocked(global.fetch).mock.calls.length

    fireEvent.click(tryAgain)

    // A retry of the wrong year would also end with the previous year fetched (via prefetch),
    // so the discriminating fact is which year the click itself requested first.
    expect(String(vi.mocked(global.fetch).mock.calls[callsBeforeRetry][0])).toMatch(new RegExp(`^/api/stats\\?year=${prev}&`))
    expect(await screen.findByTestId('prologue')).toBeInTheDocument()
  })

  it('It moves focus to the story when a retry succeeds so focus is not lost with the unmounted button', async () => {
    let mainCalls = 0
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.startsWith(urlFor(year)) && ++mainCalls === 1) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
    })
    render(<RewindPage />)
    const button = await screen.findByRole('button', { name: 'Try again' })
    button.focus()

    fireEvent.click(button)
    await screen.findByTestId('prologue')

    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus())
  })

  it('It does not move focus to the story on a first load that succeeds', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
    render(<RewindPage />)

    await screen.findByTestId('prologue')

    expect(screen.getByRole('main')).not.toHaveFocus()
  })

  it('It starts the comparison prefetch after a successful retry', async () => {
    // The first request is always the selected year, so failing it once fails the initial load
    global.fetch = vi.fn()
      .mockResolvedValueOnce(failing500())
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
    render(<RewindPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await screen.findByTestId('prologue')

    await waitFor(() => expect(callsFor(year - 1)).toHaveLength(1))
  })

  const failing500 = () => ({ ok: false, status: 500, json: () => Promise.resolve({}) })
  const retryUntilSettled = async (expectedMainCalls: number) => {
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(callsFor(year)).toHaveLength(expectedMainCalls))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toHaveAttribute('aria-disabled', 'false'))
  }

  it('It announces attempt 2 when a second consecutive retry fails', async () => {
    global.fetch = vi.fn().mockResolvedValue(failing500())
    render(<RewindPage />)
    await screen.findByRole('button', { name: 'Try again' })
    await retryUntilSettled(2)

    await retryUntilSettled(3)

    expect(screen.getByRole('status').textContent).toBe("Still couldn't load your GitHub data (attempt 2). Try again in a moment.")
  })

  it('It announces attempt 3 when a third consecutive retry fails', async () => {
    global.fetch = vi.fn().mockResolvedValue(failing500())
    render(<RewindPage />)
    await screen.findByRole('button', { name: 'Try again' })
    await retryUntilSettled(2)
    await retryUntilSettled(3)

    await retryUntilSettled(4)

    expect(screen.getByRole('status').textContent).toBe("Still couldn't load your GitHub data (attempt 3). Try again in a moment.")
  })

  it('It announces attempt 4 when a fourth consecutive retry fails', async () => {
    global.fetch = vi.fn().mockResolvedValue(failing500())
    render(<RewindPage />)
    await screen.findByRole('button', { name: 'Try again' })
    await retryUntilSettled(2)
    await retryUntilSettled(3)
    await retryUntilSettled(4)

    await retryUntilSettled(5)

    expect(screen.getByRole('status').textContent).toBe("Still couldn't load your GitHub data (attempt 4). Try again in a moment.")
  })

  it('It recovers on retry after a processing error caused by a corrupt cached previous year', async () => {
    const store = new Map<number, unknown>()
    store.set(year - 1, { corrupt: true })
    vi.mocked(getCached).mockImplementation(fakeGetCached(y => store.get(y)))
    vi.mocked(setCache).mockImplementation((_ns: string, y: number, data: unknown) => {
      store.set(y, data)
    })
    vi.mocked(clearCacheForYear).mockImplementation((_ns: string, y: number) => {
      store.delete(y)
    })
    // Data-dependent on purpose: the retry only recovers if the corrupt entry was actually evicted
    vi.mocked(compareYears).mockImplementation((_current: YearStats, previous: YearStats): YearComparison => {
      // The type says rhythm is always present; the corrupt cache entry says otherwise at runtime.
      if (!('rhythm' in previous)) {
        throw new TypeError("Cannot read properties of undefined (reading 'activeDays')")
      }
      return emptyComparison
    })
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const y = Number(new URL(url, 'http://x').searchParams.get('year'))
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(okBody(y)) })
    })
    render(<RewindPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByTestId('prologue')).toBeInTheDocument()
  })

  it.each([
    ['the selected year', year],
    ['the previous year', year - 1],
  ])('It clears the cached stats for %s after a processing error', async (_name, clearedYear) => {
    vi.mocked(getCached).mockImplementation(fakeGetCached(y => (y === year - 1 ? { corrupt: true } : null)))
    vi.mocked(compareYears).mockImplementation(() => {
      throw new TypeError('poisoned cache entry')
    })
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const y = Number(new URL(url, 'http://x').searchParams.get('year'))
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(okBody(y)) })
    })
    render(<RewindPage />)
    await screen.findByRole('button', { name: 'Try again' })

    expect(clearCacheForYear).toHaveBeenCalledWith('stats', clearedYear)
  })

  it('It shows the error view instead of crashing when the cached selected-year entry is not YearStats', async () => {
    vi.mocked(getCached).mockImplementation(fakeGetCached(y => (y === year ? [] : null)))
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })

    render(<RewindPage />)

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('It clears a corrupt cached entry and shows the network result instead', async () => {
    vi.mocked(getCached).mockImplementation(fakeGetCached(y => (y === year ? { corrupt: true } : null)))
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })

    render(<RewindPage />)

    expect(await screen.findByTestId('prologue')).toBeInTheDocument()
    expect(clearCacheForYear).toHaveBeenCalledWith('stats', year)
    expect(callsFor(year)).toHaveLength(1)
  })
})

describe('RewindPage fetch races', () => {
  const originalFetch = global.fetch
  const originalLocation = window.location
  const selectedYear = year
  const olderYear = year - 1
  const oldestYear = year - 2

  type StagedFetch = { resolve: (response: unknown) => void }
  let staged: Map<number, StagedFetch[]>

  const stageFetches = () => {
    staged = new Map()
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const requestedYear = Number(new URL(url, 'http://x').searchParams.get('year'))
      return new Promise(resolve => {
        staged.set(requestedYear, [...(staged.get(requestedYear) ?? []), { resolve }])
      })
    })
  }
  const okFor = (y: number) => ({ ok: true, status: 200, json: () => Promise.resolve(okBody(y)) })
  const httpStatus = (status: number) => ({ ok: false, status, json: () => Promise.resolve({}) })
  const respond = async (y: number, nth: number, response: unknown) => {
    const pending = staged.get(y)?.[nth]
    // Fail loudly: resolving a request that was never made would let a test pass vacuously
    if (!pending) {
      throw new Error(`No staged fetch #${nth} for year ${y}`)
    }
    await act(async () => {
      pending.resolve(response)
    })
  }
  const respondToLatest = (y: number, response: unknown) => respond(y, (staged.get(y)?.length ?? 0) - 1, response)
  const lastRequestIndex = (y: number) => Math.max((staged.get(y)?.length ?? 0) - 1, 0)
  const switchTo = (y: number) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`View ${y}`) }))
  const shownYear = () => screen.getByTestId('prologue').getAttribute('data-year')
  const redirected = () => window.location.href === '/api/auth/login'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCached).mockImplementation(() => null)
    vi.mocked(setCache).mockImplementation(() => {})
    Object.defineProperty(window, 'location', { value: { href: '/rewind' }, writable: true, configurable: true })
    stageFetches()
  })
  afterEach(() => {
    global.fetch = originalFetch
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true })
  })

  describe('a stale selected-year request', () => {
    const staleOutcomes: Array<[string, (y: number) => unknown]> = [
      ['fails', () => httpStatus(500)],
      ['succeeds', okFor],
    ]

    it.each(staleOutcomes)('It keeps the newer year on screen when the earlier year %s late', async (_outcome, response) => {
      render(<RewindPage />)
      switchTo(olderYear)
      await respond(olderYear, 0, okFor(olderYear))

      await respond(selectedYear, 0, response(selectedYear))

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
      expect(shownYear()).toBe(String(olderYear))
    })

    it.each(staleOutcomes)('It keeps only the last of three rapid switches when the earlier years %s late', async (_outcome, response) => {
      render(<RewindPage />)
      switchTo(olderYear)
      switchTo(oldestYear)
      await respond(oldestYear, 0, okFor(oldestYear))

      await respond(selectedYear, 0, response(selectedYear))
      await respond(olderYear, 0, response(olderYear))

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
      expect(shownYear()).toBe(String(oldestYear))
    })

    it('It keeps the loading state until the newest year resolves', async () => {
      render(<RewindPage />)
      switchTo(olderYear)

      await respond(selectedYear, 0, okFor(selectedYear))

      expect(screen.getByRole('button', { name: new RegExp(`View ${olderYear}`) })).toBeDisabled()
    })
  })

  describe('the selected year failing while an earlier year is still in flight', () => {
    it('It shows the error view', async () => {
      render(<RewindPage />)
      switchTo(olderYear)

      await respond(olderYear, 0, httpStatus(500))

      expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
    })

    it('It fetches the selected year when Try again is clicked', async () => {
      render(<RewindPage />)
      switchTo(olderYear)
      await respond(olderYear, 0, httpStatus(500))

      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

      expect(staged.get(olderYear)).toHaveLength(2)
    })

    it('It keeps the error view when the earlier year then succeeds', async () => {
      render(<RewindPage />)
      switchTo(olderYear)
      await respond(olderYear, 0, httpStatus(500))

      await respond(selectedYear, 0, okFor(selectedYear))

      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    })
  })

  describe('a 401 response', () => {
    it('It redirects to sign in when the selected year returns 401', async () => {
      render(<RewindPage />)

      await respond(selectedYear, 0, httpStatus(401))

      expect(redirected()).toBe(true)
    })

    it('It does not redirect when a background prefetch of another year returns 401', async () => {
      render(<RewindPage />)
      await respond(selectedYear, 0, okFor(selectedYear))

      await respond(olderYear, 0, httpStatus(401))

      expect(redirected()).toBe(false)
    })

    it('It does not cache a year whose background prefetch returned 401', async () => {
      render(<RewindPage />)
      await respond(selectedYear, 0, okFor(selectedYear))

      await respond(olderYear, 0, httpStatus(401))

      expect(vi.mocked(setCache).mock.calls.map(call => call[1])).toEqual([selectedYear])
    })

    it('It keeps the story on screen when a background prefetch returns 401', async () => {
      render(<RewindPage />)
      await respond(selectedYear, 0, okFor(selectedYear))

      await respond(olderYear, 0, httpStatus(401))

      expect(shownYear()).toBe(String(selectedYear))
    })

    it('It does not redirect when an earlier year returns 401 after the user switched away', async () => {
      render(<RewindPage />)
      switchTo(olderYear)
      await respond(olderYear, 0, okFor(olderYear))

      await respond(selectedYear, 0, httpStatus(401))

      expect(redirected()).toBe(false)
    })

    it('It redirects to sign in when a retry of the selected year returns 401', async () => {
      render(<RewindPage />)
      await respond(selectedYear, 0, httpStatus(500))
      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

      await respond(selectedYear, 1, httpStatus(401))

      expect(redirected()).toBe(true)
    })
  })

  describe('after the page unmounts', () => {
    it('It starts no background prefetch when the initial fetch resolves', async () => {
      const { unmount } = render(<RewindPage />)
      unmount()

      await respond(selectedYear, 0, okFor(selectedYear))

      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
    })

    it('It does not redirect when the initial fetch returns 401', async () => {
      const { unmount } = render(<RewindPage />)
      unmount()

      await respond(selectedYear, 0, httpStatus(401))

      expect(redirected()).toBe(false)
    })

    it('It starts no background prefetch when an in-flight retry succeeds', async () => {
      const { unmount } = render(<RewindPage />)
      await respond(selectedYear, 0, httpStatus(500))
      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
      unmount()

      await respond(selectedYear, 1, okFor(selectedYear))

      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2)
    })

    it('It does not redirect when an in-flight retry returns 401', async () => {
      const { unmount } = render(<RewindPage />)
      await respond(selectedYear, 0, httpStatus(500))
      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
      unmount()

      await respond(selectedYear, 1, httpStatus(401))

      expect(redirected()).toBe(false)
    })
  })

  describe('under StrictMode double effects', () => {
    it('It still shows the story from the fetch that follows the remount', async () => {
      render(<StrictMode><RewindPage /></StrictMode>)

      await respond(selectedYear, lastRequestIndex(selectedYear), okFor(selectedYear))

      expect(shownYear()).toBe(String(selectedYear))
    })

    it('It still redirects when the selected year returns 401', async () => {
      render(<StrictMode><RewindPage /></StrictMode>)

      await respond(selectedYear, lastRequestIndex(selectedYear), httpStatus(401))

      expect(redirected()).toBe(true)
    })

    it('It still retries after the selected year fails', async () => {
      render(<StrictMode><RewindPage /></StrictMode>)
      await respond(selectedYear, lastRequestIndex(selectedYear), httpStatus(500))

      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
      await respond(selectedYear, lastRequestIndex(selectedYear), okFor(selectedYear))

      expect(shownYear()).toBe(String(selectedYear))
    })
  })
})
