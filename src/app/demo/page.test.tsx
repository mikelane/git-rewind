import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DemoPage, { revalidate } from './page'

vi.mock('./demo-experience', () => ({
  DemoExperience: ({ year }: { year: number }) => <div data-testid="demo">{year}</div>,
}))

describe('DemoPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('It revalidates at least daily so the sample year cannot freeze at build time', () => {
    expect(revalidate).toBeLessThanOrEqual(86400)
  })

  it('It shows the marketing year as the sample year', () => {
    vi.setSystemTime(new Date('2026-11-16T12:00:00'))
    render(<DemoPage />)
    expect(screen.getByTestId('demo')).toHaveTextContent('2026')
  })

  it('It shows the previous year as the sample year in January', () => {
    vi.setSystemTime(new Date('2027-01-10T12:00:00'))
    render(<DemoPage />)
    expect(screen.getByTestId('demo')).toHaveTextContent('2026')
  })
})
