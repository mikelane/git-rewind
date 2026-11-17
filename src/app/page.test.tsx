import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import LandingPage, { revalidate } from './page'
import { FAQ_ITEMS } from '@/lib/faq'

vi.mock('@/components/error-message', () => ({
  ErrorMessage: () => null,
}))

describe('LandingPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-16T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('It sizes the hero section to the dynamic viewport with a min-h-screen fallback', () => {
    const { container } = render(<LandingPage />)

    expect(container.querySelector('section')).toHaveClass(
      'min-h-screen',
      'supports-[height:100dvh]:min-h-dvh'
    )
  })

  it('It revalidates at least daily so the marketing year cannot freeze at build time', () => {
    expect(revalidate).toBeLessThanOrEqual(86400)
  })

  it('It links the secondary call to action to the install URL for the configured slug', () => {
    vi.stubEnv('NEXT_PUBLIC_GITHUB_APP_SLUG', 'my-rewind')
    render(<LandingPage />)

    const installLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.includes('github.com/apps/'))
    expect(installLinks.map((link) => link.getAttribute('href'))).toEqual([
      'https://github.com/apps/my-rewind/installations/new',
    ])
    vi.unstubAllEnvs()
  })

  it('It keeps Git Rewind as the single h1', () => {
    render(<LandingPage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Git Rewind')
  })

  it.each(['How it works', "What you'll see", 'Why read-only', 'FAQ'])(
    'It renders an h2 section titled "%s"',
    (title) => {
      render(<LandingPage />)
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
  )

  it('It mentions GitHub Wrapped with the marketing year in the visible copy', () => {
    render(<LandingPage />)
    expect(screen.getByText(/GitHub Wrapped 2026/)).toBeInTheDocument()
  })

  it('It uses the previous year in January', () => {
    vi.setSystemTime(new Date('2027-01-05T12:00:00'))
    render(<LandingPage />)
    expect(screen.getByText(/GitHub Wrapped 2026/)).toBeInTheDocument()
  })

  it('It renders every FAQ question as visible text', () => {
    render(<LandingPage />)
    const faq = screen.getByRole('region', { name: 'FAQ' })
    const questions = FAQ_ITEMS.map((item) => within(faq).getByText(item.question))
    expect(questions).toHaveLength(FAQ_ITEMS.length)
  })

  it('It renders every FAQ answer verbatim', () => {
    render(<LandingPage />)
    const faq = screen.getByRole('region', { name: 'FAQ' })
    const answers = FAQ_ITEMS.map((item) => within(faq).getByText(item.answer))
    expect(answers).toHaveLength(FAQ_ITEMS.length)
  })

  it('It explains the GitHub App versus OAuth repo scope trade-off', () => {
    render(<LandingPage />)
    const section = screen.getByRole('region', { name: 'Why read-only' })
    expect(section).toHaveTextContent('repo')
    expect(section).toHaveTextContent('GitHub App')
  })

  it('It renders JSON-LD as a literal script tag with WebSite, SoftwareApplication and FAQPage', () => {
    const { container } = render(<LandingPage />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const graph = JSON.parse(script?.textContent ?? '{}')['@graph']
    expect(graph.map((node: { '@type': string }) => node['@type'])).toEqual([
      'WebSite',
      'SoftwareApplication',
      'FAQPage',
    ])
  })

  it('It keeps the primary and install calls to action in the hero', () => {
    render(<LandingPage />)
    expect(screen.getByRole('link', { name: 'View Your Rewind' })).toHaveAttribute(
      'href',
      '/api/auth/login'
    )
    expect(screen.getByRole('link', { name: 'Install Git Rewind' })).toBeInTheDocument()
  })
})
