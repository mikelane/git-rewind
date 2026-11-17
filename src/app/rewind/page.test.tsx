import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor, screen, fireEvent, act } from '@testing-library/react'

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
import { compareYears } from '@/lib/comparisons'
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
    const mockMainYearResponses = (...responses: Array<() => unknown>) => {
      const queue = [...responses]
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (!url.startsWith(mainYearUrl)) {
          return Promise.resolve(okResponse())
        }
        const next = queue.shift() ?? okResponse
        return Promise.resolve(next())
      })
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
      mockMainYearResponses(failure as () => unknown)
      render(<RewindPage />)

      const button = await findTryAgain()

      expect(button.tagName).toBe('BUTTON')
    })

    it.each(retryableFailures)('It renders the shared message when the fetch fails with %s', async (_failureName, failure) => {
      mockMainYearResponses(failure as () => unknown)
      render(<RewindPage />)

      await findTryAgain()

      expect(screen.getByText("We couldn't load your GitHub data. This is usually temporary.")).toBeInTheDocument()
    })

    it.each(retryableFailures)('It renders a Sign in again link when the fetch fails with %s', async (_failureName, failure) => {
      mockMainYearResponses(failure as () => unknown)
      render(<RewindPage />)

      await findTryAgain()

      expect(screen.getByRole('link', { name: 'Sign in again' })).toHaveAttribute('href', '/api/auth/login')
    })

    it.each(failures)('It refetches the same year without navigating when retrying after %s', async (_failureName, failure) => {
      mockMainYearResponses(failure as () => unknown, () => httpResponse(500))
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
        mockMainYearResponses(() => httpResponse(500))
        const baseFetch = vi.mocked(global.fetch).getMockImplementation() as (url: string) => Promise<unknown>
        const pendingRetry = new Promise(() => {})
        let mainCalls = 0
        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.startsWith(mainYearUrl)) {
            mainCalls++
            if (mainCalls === 2) {
              return pendingRetry
            }
          }
          return baseFetch(url)
        })
        render(<RewindPage />)
        fireEvent.click(await findTryAgain())
        await waitFor(() => expect(mainYearCalls()).toHaveLength(2))
      }

      it('It marks the Try again button aria-disabled', async () => {
        await startRetry()

        expect(screen.getByRole('button', { name: 'Try again' })).toHaveAttribute('aria-disabled', 'true')
      })

      it('It keeps focus on the Try again button', async () => {
        await startRetry()

        const button = screen.getByRole('button', { name: 'Try again' })
        button.focus()

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
      await waitFor(() => expect(vi.mocked(global.fetch).mock.calls.length).toBeGreaterThan(1))
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

describe('RewindPage retry flow regressions', () => {
  const originalFetch = global.fetch
  const originalLocation = window.location
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCached).mockImplementation(() => null)
    Object.defineProperty(window, 'location', { value: { href: '/rewind' }, writable: true, configurable: true })
  })
  afterEach(() => {
    global.fetch = originalFetch
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true })
  })

  it('It shows the error view when the selected year returns a 200 with a null JSON body', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) =>
      Promise.resolve(url.startsWith(urlFor(year))
        ? { ok: true, status: 200, json: () => Promise.resolve(null) }
        : { ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
    )
    render(<RewindPage />)

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('It changes live-region content when a retry fails so screen readers hear the outcome', async () => {
    const liveText = () =>
      Array.from(document.querySelectorAll('[aria-live],[role="status"],[role="alert"]'))
        .map(el => el.textContent ?? '')
        .join('|')
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })
    render(<RewindPage />)
    const button = await screen.findByRole('button', { name: 'Try again' })
    const before = liveText()

    fireEvent.click(button)
    await waitFor(() => expect(callsFor(year)).toHaveLength(2))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toHaveAttribute('aria-disabled', 'false'))

    expect(liveText()).not.toBe(before)
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

  it.each([
    ['null', null],
    ['a string', 'oops'],
    ['a number', 42],
  ])('It shows the error view and caches nothing when a 200 body is %s', async (_name, body) => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) })
    render(<RewindPage />)

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(setCache).not.toHaveBeenCalled()
  })

  it('It shows the error view when computing the comparison throws after a successful fetch', async () => {
    vi.mocked(getCached).mockImplementation(((_ns: string, y: number) => (y === year - 1 ? okBody(year - 1) : null)) as typeof getCached)
    vi.mocked(compareYears).mockImplementation(() => {
      throw new TypeError('corrupt cached comparison data')
    })
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
    render(<RewindPage />)

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByText("We couldn't load your GitHub data. This is usually temporary.")).toBeInTheDocument()
  })

  it('It shows the error view, with no unhandled rejection, when a retry succeeds but computing the comparison throws', async () => {
    const rejections: unknown[] = []
    const onRejection = (reason: unknown) => {
      rejections.push(reason)
    }
    const priorListeners = process.listeners('unhandledRejection')
    process.removeAllListeners('unhandledRejection')
    process.on('unhandledRejection', onRejection)
    vi.mocked(getCached).mockImplementation(((_ns: string, y: number) => (y === year - 1 ? okBody(year - 1) : null)) as typeof getCached)
    vi.mocked(compareYears).mockImplementation(() => {
      throw new TypeError('corrupt cached comparison data')
    })
    let mainCalls = 0
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.startsWith(urlFor(year)) && ++mainCalls === 1) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
    })
    render(<RewindPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(compareYears).toHaveBeenCalled())
    await new Promise(resolve => setTimeout(resolve, 50))
    process.removeAllListeners('unhandledRejection')
    priorListeners.forEach(listener => process.on('unhandledRejection', listener))

    expect(rejections).toEqual([])
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('It leaves no unhandled rejection when computing the comparison throws', async () => {
    const rejections: unknown[] = []
    const onRejection = (reason: unknown) => {
      rejections.push(reason)
    }
    const priorListeners = process.listeners('unhandledRejection')
    process.removeAllListeners('unhandledRejection')
    process.on('unhandledRejection', onRejection)
    vi.mocked(getCached).mockImplementation(((_ns: string, y: number) => (y === year - 1 ? okBody(year - 1) : null)) as typeof getCached)
    vi.mocked(compareYears).mockImplementation(() => {
      throw new TypeError('corrupt cached comparison data')
    })
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
    )
    render(<RewindPage />)
    await waitFor(() => expect(compareYears).toHaveBeenCalled())
    await new Promise(resolve => setTimeout(resolve, 50))
    process.removeAllListeners('unhandledRejection')
    priorListeners.forEach(listener => process.on('unhandledRejection', listener))

    expect(rejections).toEqual([])
  })

  // Test-gap probes (expected to PASS on correct code; they kill surviving mutants)
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
    let prevCalls = 0
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.startsWith(urlFor(prev))) {
        prevCalls++
        // prefetch (1) hangs, explicit fetch (2) fails, retry (3) succeeds
        if (prevCalls === 1) {
          return new Promise(() => {})
        }
        if (prevCalls === 2) {
          return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
        }
      }
      const y = Number(new URL(url, 'http://x').searchParams.get('year'))
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(okBody(y)) })
    })
    render(<RewindPage />)
    await screen.findByTestId('prologue')
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`View ${prev}`) }))
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(prevCalls).toBe(3))
    expect(await screen.findByTestId('prologue')).toBeInTheDocument()
  })

  it('It starts the comparison prefetch after a successful retry', async () => {
    let mainCalls = 0
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.startsWith(urlFor(year))) {
        mainCalls++
        if (mainCalls === 1) {
          return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
        }
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(okBody(year)) })
    })
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

  it('It changes the live region text when a second consecutive retry fails', async () => {
    global.fetch = vi.fn().mockResolvedValue(failing500())
    render(<RewindPage />)
    await screen.findByRole('button', { name: 'Try again' })
    await retryUntilSettled(2)
    const afterFirstFailedRetry = screen.getByRole('status').textContent

    await retryUntilSettled(3)

    expect(screen.getByRole('status').textContent).not.toBe(afterFirstFailedRetry)
  })

  it('It changes the live region text again when a third consecutive retry fails', async () => {
    global.fetch = vi.fn().mockResolvedValue(failing500())
    render(<RewindPage />)
    await screen.findByRole('button', { name: 'Try again' })
    await retryUntilSettled(2)
    await retryUntilSettled(3)
    const afterSecondFailedRetry = screen.getByRole('status').textContent

    await retryUntilSettled(4)

    expect(screen.getByRole('status').textContent).not.toBe(afterSecondFailedRetry)
  })

  it('It recovers on retry after a processing error caused by a corrupt cached previous year', async () => {
    const store = new Map<number, unknown>()
    store.set(year - 1, { corrupt: true })
    vi.mocked(getCached).mockImplementation(((_ns: string, y: number) => store.get(y) ?? null) as typeof getCached)
    vi.mocked(setCache).mockImplementation(((_ns: string, y: number, data: unknown) => {
      store.set(y, data)
    }) as typeof setCache)
    vi.mocked(clearCacheForYear).mockImplementation(((_ns: string, y: number) => {
      store.delete(y)
    }) as typeof clearCacheForYear)
    vi.mocked(compareYears).mockImplementation(((_current: unknown, previous: { rhythm?: unknown }) => {
      if (!previous.rhythm) {
        throw new TypeError("Cannot read properties of undefined (reading 'activeDays')")
      }
      return { narrativeInsights: [] }
    }) as unknown as typeof compareYears)
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const y = Number(new URL(url, 'http://x').searchParams.get('year'))
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(okBody(y)) })
    })
    render(<RewindPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByTestId('prologue', {}, { timeout: 1000 })).toBeInTheDocument()
  })

  it.each([
    ['the selected year', year],
    ['the previous year', year - 1],
  ])('It clears the cached stats for %s after a processing error', async (_name, clearedYear) => {
    vi.mocked(getCached).mockImplementation(((_ns: string, y: number) => (y === year - 1 ? { corrupt: true } : null)) as typeof getCached)
    vi.mocked(compareYears).mockImplementation((() => {
      throw new TypeError('poisoned cache entry')
    }) as unknown as typeof compareYears)
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const y = Number(new URL(url, 'http://x').searchParams.get('year'))
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(okBody(y)) })
    })
    render(<RewindPage />)
    await screen.findByRole('button', { name: 'Try again' })

    expect(clearCacheForYear).toHaveBeenCalledWith('stats', clearedYear)
  })
})
