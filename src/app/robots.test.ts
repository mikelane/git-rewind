import { describe, it, expect, vi, afterEach } from 'vitest'
import robots from './robots'
import { SITE_CONFIG } from '@/lib/seo'

describe('robots', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  const rule = () => {
    const { rules } = robots()
    return Array.isArray(rules) ? rules[0] : rules
  }

  it('It disallows only /api/', () => {
    expect(rule().disallow).toEqual(['/api/'])
  })

  it('It lets crawlers reach /rewind so they can see its noindex', () => {
    expect(rule().disallow).not.toContain('/rewind')
  })

  it('It does not emit the nonstandard host field', () => {
    expect(robots()).not.toHaveProperty('host')
  })

  it('It points to the sitemap on the site URL', () => {
    expect(robots().sitemap).toBe(`${SITE_CONFIG.url}/sitemap.xml`)
  })

  it.each(['https://git-rewind.dev/', 'https://git-rewind.dev//'])(
    'It points to the sitemap without double slashes when NEXT_PUBLIC_APP_URL is %s',
    async (appUrl) => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', appUrl)
      vi.resetModules()
      const { default: freshRobots } = await import('./robots')
      expect(freshRobots().sitemap).toBe('https://git-rewind.dev/sitemap.xml')
    }
  )
})
