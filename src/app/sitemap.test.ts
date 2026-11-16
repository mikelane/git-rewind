import { describe, it, expect } from 'vitest'
import sitemap from './sitemap'
import { SITE_LAST_UPDATED } from '@/lib/seo'

describe('sitemap', () => {
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

  it('It sets SITE_LAST_UPDATED to a fixed date', () => {
    expect(SITE_LAST_UPDATED.toISOString()).toBe('2026-11-16T00:00:00.000Z')
  })
})
