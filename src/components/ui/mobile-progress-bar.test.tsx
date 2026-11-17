import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileProgressBar } from './mobile-progress-bar'
import { ProgressIndicator } from './progress-indicator'

const getFill = () => screen.getByRole('progressbar').firstElementChild as HTMLElement

describe('MobileProgressBar', () => {
  it.each([
    [1, '16.67%'],
    [3, '50%'],
    [6, '100%'],
  ])('It exposes chapter %i of 6 as a progressbar filled to %s', (current, width) => {
    render(<MobileProgressBar currentChapter={current} totalChapters={6} />)

    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '1')
    expect(bar).toHaveAttribute('aria-valuemax', '6')
    expect(bar).toHaveAttribute('aria-valuenow', String(current))
    expect(getFill().style.width).toBe(width)
  })

  it('It is hidden from md up and never hidden below md', () => {
    render(<MobileProgressBar currentChapter={1} totalChapters={6} />)

    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveClass('md:hidden')
    expect(bar).not.toHaveClass('hidden')
  })

  it('It tracks chapter changes on re-render', () => {
    const { rerender } = render(<MobileProgressBar currentChapter={2} totalChapters={6} />)

    rerender(<MobileProgressBar currentChapter={5} totalChapters={6} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5')
    expect(getFill().style.width).toBe('83.33%')
  })

  it('It sits below the demo banner when given an offset variable', () => {
    render(
      <MobileProgressBar currentChapter={1} totalChapters={6} offsetTopVar="--demo-banner-h" />
    )

    expect(screen.getByRole('progressbar').style.top).toBe('var(--demo-banner-h, 0px)')
  })

  it('It sits at the top when given no offset variable', () => {
    render(<MobileProgressBar currentChapter={1} totalChapters={6} />)

    expect(screen.getByRole('progressbar').style.top).toBe('0px')
  })

  it('It does not animate the fill under reduced motion', () => {
    render(<MobileProgressBar currentChapter={1} totalChapters={6} />)

    expect(getFill()).toHaveClass('motion-reduce:transition-none')
  })

  it('It is a 4px accent fill on a subtle track layered below the demo banner', () => {
    render(<MobileProgressBar currentChapter={1} totalChapters={6} />)

    expect(screen.getByRole('progressbar')).toHaveClass('h-1', 'bg-border-subtle', 'z-40')
    expect(getFill()).toHaveClass('bg-accent')
  })
})

describe('ProgressIndicator mobile bar', () => {
  it('It renders the mobile progress bar alongside the desktop rail', () => {
    render(<ProgressIndicator totalChapters={6} currentChapter={3} offsetTopVar="--demo-banner-h" />)

    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar.style.top).toBe('var(--demo-banner-h, 0px)')
  })
})
