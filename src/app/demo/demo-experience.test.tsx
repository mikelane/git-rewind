import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { DemoExperience } from './demo-experience'

vi.mock('@/hooks', () => ({
  useScrollProgress: () => ({ currentChapter: 0, scrollProgress: 0 }),
  useKeyboardNavigation: () => undefined,
}))

function getMostCollaboratedSection(): HTMLElement {
  return screen.getByText('Most Collaborated With').parentElement as HTMLElement
}

describe('DemoExperience collaboration chapter', () => {
  it('renders mona as a collaborator', () => {
    render(<DemoExperience year={2026} />)

    expect(screen.getByText('@mona')).toBeTruthy()
  })

  it('renders mona as the hero collaborator with 47 interactions', () => {
    render(<DemoExperience year={2026} />)
    const section = getMostCollaboratedSection()

    const caption = within(section).getByText(/Your most frequent collaborator/)
    expect(caption.parentElement?.textContent).toContain('@mona')
    expect(caption.textContent).toContain('47 interactions')
  })

  it.each([
    ['@octocat', '34'],
    ['@defunkt', '28'],
    ['@mojombo', '19'],
    ['@pjhyett', '15'],
  ])('renders %s with the interaction count %s', (handle, count) => {
    render(<DemoExperience year={2026} />)
    const section = getMostCollaboratedSection()

    const handleSpan = within(section).getByText(handle)
    expect(handleSpan.nextElementSibling?.textContent).toBe(count)
  })

  it('renders exactly 4 collaborator chips besides the hero', () => {
    render(<DemoExperience year={2026} />)
    const section = getMostCollaboratedSection()

    const chips = within(section).getAllByText(/^@/, { selector: 'span' })
    expect(chips).toHaveLength(4)
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

describe('DemoExperience conversion call to action', () => {
  it('renders a "Get your own Rewind" link to the install URL', () => {
    vi.stubEnv('NEXT_PUBLIC_GITHUB_APP_SLUG', 'my-rewind')
    render(<DemoExperience year={2026} />)

    expect(screen.getByRole('link', { name: 'Get your own Rewind' })).toHaveAttribute(
      'href',
      'https://github.com/apps/my-rewind/installations/new'
    )
    vi.unstubAllEnvs()
  })

  it('renders no "Save Your Rewind" button', () => {
    render(<DemoExperience year={2026} />)

    expect(screen.queryByText('Save Your Rewind')).toBeNull()
  })

  it('renders no chapter or epilogue share button besides the prologue share button', () => {
    render(<DemoExperience year={2026} />)

    expect(screen.getAllByRole('button', { name: /share/i })).toHaveLength(1)
  })
})
