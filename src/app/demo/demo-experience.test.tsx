import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { DemoExperience } from './demo-experience'

vi.mock('@/hooks', async importOriginal => ({
  ...(await importOriginal<typeof import('@/hooks')>()),
  useScrollProgress: () => ({ currentChapter: 0, scrollProgress: 0 }),
  useKeyboardNavigation: () => undefined,
}))

function getMostCollaboratedSection(): HTMLElement {
  const section = screen.getByText('Most Collaborated With').parentElement
  if (section === null) {
    throw new Error('Expected the collaboration heading to have a parent element')
  }
  return section
}

describe('DemoExperience collaboration chapter', () => {
  it('It renders mona as a collaborator', () => {
    render(<DemoExperience year={2026} />)

    expect(screen.getByText('@mona')).toBeInTheDocument()
  })

  it('It renders mona as the hero collaborator with 47 interactions', () => {
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

  it('It renders exactly 4 collaborator chips besides the hero', () => {
    render(<DemoExperience year={2026} />)
    const section = getMostCollaboratedSection()

    const chips = within(section).getAllByText(/^@/, { selector: 'span' })
    expect(chips).toHaveLength(4)
  })

  it.each(['@hubot', '@dependabot', '@github-actions', '@renovate'])(
    'It does not render %s',
    bot => {
      render(<DemoExperience year={2026} />)

      expect(screen.queryByText(bot)).toBeNull()
    }
  )

  it('It renders the unique collaborator count of 19', () => {
    render(<DemoExperience year={2026} />)

    const callout = screen.getByText(/different people this year/)
    expect(callout.textContent).toBe('You worked with 19 different people this year.')
  })
})

describe('DemoExperience conversion call to action', () => {
  it('It renders a "Get your own Rewind" link to the install URL', () => {
    vi.stubEnv('NEXT_PUBLIC_GITHUB_APP_SLUG', 'my-rewind')
    render(<DemoExperience year={2026} />)

    expect(screen.getByRole('link', { name: 'Get your own Rewind' })).toHaveAttribute(
      'href',
      'https://github.com/apps/my-rewind/installations/new'
    )
    vi.unstubAllEnvs()
  })

  it('It renders no "Save Your Rewind" button', () => {
    render(<DemoExperience year={2026} />)

    expect(screen.queryByText('Save Your Rewind')).toBeNull()
  })

  it('It renders no share button anywhere in the demo', () => {
    render(<DemoExperience year={2026} />)

    expect(screen.queryAllByRole('button', { name: /share/i })).toHaveLength(0)
  })
})

describe('DemoExperience mobile scrolling', () => {
  const getMain = () => screen.getByRole('main')
  const getChapterWrappers = () => Array.from(getMain().querySelectorAll(':scope > .snap-start'))

  it('It renders the story with proximity snapping on phones and mandatory snapping from md', () => {
    render(<DemoExperience year={2026} />)

    expect(getMain()).toHaveClass('snap-proximity', 'md:snap-mandatory')
    expect(getMain()).not.toHaveClass('snap-mandatory')
  })

  it('It renders six chapter wrappers', () => {
    render(<DemoExperience year={2026} />)

    expect(getChapterWrappers()).toHaveLength(6)
  })

  it.each([0, 1, 2, 3, 4, 5])(
    'It renders chapter wrapper %i so it only forces a snap stop from md',
    index => {
      render(<DemoExperience year={2026} />)

      const wrapper = getChapterWrappers()[index]
      expect(wrapper).toHaveClass('md:snap-always')
      expect(wrapper).not.toHaveClass('snap-always')
    }
  )

  it('It renders the scroll container with scroll padding for the banner height', () => {
    render(<DemoExperience year={2026} />)

    expect(getMain().style.scrollPaddingTop).toBe('var(--demo-banner-h, 0px)')
  })

  it('It renders the prologue wrapper offset by the banner height instead of pt-10', () => {
    render(<DemoExperience year={2026} />)

    const prologue = getChapterWrappers()[0]
    expect(prologue).not.toHaveClass('pt-10')
    expect(prologue).toHaveClass('pt-[var(--demo-banner-h,0px)]')
  })

  it('It renders the mobile progress bar below the demo banner', () => {
    render(<DemoExperience year={2026} />)

    expect(screen.getByRole('progressbar').style.top).toBe('var(--demo-banner-h, 0px)')
  })
})

describe('DemoExperience banner offset wiring', () => {
  const BANNER_PROPERTY = '--demo-banner-h'

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    document.documentElement.style.removeProperty(BANNER_PROPERTY)
  })

  it('It observes the demo banner element for height changes', () => {
    const observed: Element[] = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(element: Element) {
          observed.push(element)
        }
        unobserve() {}
        disconnect() {}
      }
    )

    render(<DemoExperience year={2026} />)

    const banner = screen.getByText(/This is a demo with sample data/).parentElement
    expect(observed).toEqual([banner])
  })

  it('It publishes the measured banner height as --demo-banner-h', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(37)

    render(<DemoExperience year={2026} />)

    expect(document.documentElement.style.getPropertyValue(BANNER_PROPERTY)).toBe('37px')
  })
})
