import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TheRhythmChapter, type TheRhythmData } from './the-rhythm'

describe('TheRhythmChapter', () => {
  const createData = (overrides: Partial<TheRhythmData> = {}): TheRhythmData => ({
    activeDays: 200,
    totalDays: 365,
    longestStreak: 14,
    currentStreak: 3,
    busiestMonth: 'March',
    busiestMonthCount: 150,
    contributionsByMonth: [
      { month: 'January', count: 50 },
      { month: 'February', count: 75 },
      { month: 'March', count: 150 },
    ],
    ...overrides,
  })

  describe('Bug #4: Math.max empty array edge case', () => {
    it('renders without error when contributionsByMonth is empty', () => {
      const data = createData({ contributionsByMonth: [] })

      // This should not throw an error from Math.max(...[]) returning -Infinity
      expect(() => render(<TheRhythmChapter data={data} />)).not.toThrow()
    })

    it('displays the component correctly with empty contributions', () => {
      const data = createData({ contributionsByMonth: [] })

      render(<TheRhythmChapter data={data} />)

      // Should still render the chapter title
      expect(screen.getByText('The Rhythm')).toBeInTheDocument()
    })

    it('calculates maxCount correctly with valid data', () => {
      const data = createData({
        contributionsByMonth: [
          { month: 'January', count: 100 },
          { month: 'February', count: 50 },
          { month: 'March', count: 200 },
        ],
      })

      render(<TheRhythmChapter data={data} />)

      // Component should render without issues
      expect(screen.getByText('The Rhythm')).toBeInTheDocument()
      // Month labels should be rendered (multiple elements exist for mobile/desktop)
      expect(screen.getAllByText('Mar').length).toBeGreaterThan(0)
    })
  })

  it('shows loading state when isLoading is true', () => {
    render(<TheRhythmChapter data={null} isLoading />)

    // Should not show the chapter title when loading
    expect(screen.queryByText('The Rhythm')).not.toBeInTheDocument()
  })

  it('shows empty state when data is null', () => {
    render(<TheRhythmChapter data={null} />)

    expect(screen.getByText('No activity data')).toBeInTheDocument()
  })

  it('displays activity days correctly', () => {
    const data = createData({ activeDays: 200, totalDays: 365 })

    render(<TheRhythmChapter data={data} />)

    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('days')).toBeInTheDocument()
  })

  describe('monthly chart labels (issue #56)', () => {
    const renderChart = () => render(<TheRhythmChapter data={createData()} />)
    const chart = () => screen.getByRole('group', { name: /Monthly activity/ })
    const nonBusiestLabel = () => screen.getAllByText('50').find((el) => el.hasAttribute('aria-hidden'))

    it('It puts every month value in the chart accessible name', () => {
      renderChart()

      expect(chart()).toHaveAccessibleName('Monthly activity: January 50, February 75, March 150')
    })

    it('It makes the chart a single tab stop reachable by keyboard', () => {
      renderChart()

      expect(chart()).toHaveAttribute('tabindex', '0')
    })

    it('It hides the per-bar value labels from assistive tech because the chart name carries them', () => {
      renderChart()

      expect(nonBusiestLabel()).toHaveAttribute('aria-hidden', 'true')
    })

    it('It keeps the hidden labels out of the reduced-motion override via the shared marker class', () => {
      renderChart()

      expect(nonBusiestLabel()).toHaveClass('reveal-on-interact', 'opacity-0')
    })

    it.each(['group-hover:opacity-100', 'group-focus-visible/chart:opacity-100'])(
      'It reveals the labels with %s',
      (utility) => {
        renderChart()

        expect(nonBusiestLabel()).toHaveClass(utility)
      }
    )
  })
})
