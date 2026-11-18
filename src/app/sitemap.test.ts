import { describe, it, expect, vi, afterEach } from 'vitest'
import sitemap from './sitemap'
import { SITE_LAST_UPDATED } from '@/lib/seo'

describe('sitemap', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('It lists the home page and the demo', () => {
    expect(sitemap().map((entry) => new URL(entry.url).pathname)).toEqual(['/', '/demo'])
  })

  it('It does not list the private /rewind page', () => {
    expect(sitemap().some((entry) => entry.url.endsWith('/rewind'))).toBe(false)
  })

  it('It uses the stable SITE_LAST_UPDATED date for every entry', () => {
    expect(sitemap().map((entry) => entry.lastModified)).toEqual([
      SITE_LAST_UPDATED,
      SITE_LAST_UPDATED,
    ])
  })

  it.each(['https://git-rewind.dev/', 'https://git-rewind.dev//'])(
    'It lists exact URLs without double slashes when NEXT_PUBLIC_APP_URL is %s',
    async (appUrl) => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', appUrl)
      vi.resetModules()
      const { default: freshSitemap } = await import('./sitemap')
      expect(freshSitemap().map((entry) => entry.url)).toEqual([
        'https://git-rewind.dev',
        'https://git-rewind.dev/demo',
      ])
    }
  )

  it('It sets SITE_LAST_UPDATED to a fixed date', () => {
    expect(SITE_LAST_UPDATED.toISOString()).toBe('2026-11-16T00:00:00.000Z')
  })
})
