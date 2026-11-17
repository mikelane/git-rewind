import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DemoExperience } from './demo-experience'

vi.mock('@/hooks', () => ({
  useScrollProgress: () => ({ currentChapter: 0, scrollProgress: 0 }),
  useKeyboardNavigation: () => undefined,
}))

describe('DemoExperience collaboration chapter', () => {
  it('renders mona as a collaborator', () => {
    render(<DemoExperience year={2026} />)

    expect(screen.getByText('@mona')).toBeTruthy()
  })

  it.each(['@hubot', '@dependabot', '@github-actions', '@renovate'])(
    'does not render %s',
    bot => {
      render(<DemoExperience year={2026} />)

      expect(screen.queryByText(bot)).toBeNull()
    }
  )

  it('renders the unique collaborator count of 19', () => {
    render(<DemoExperience year={2026} />)

    const callout = screen.getByText(/different people this year/)
    expect(callout.textContent).toBe('You worked with 19 different people this year.')
  })
})
