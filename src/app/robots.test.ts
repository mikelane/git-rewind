import { describe, it, expect } from 'vitest'
import robots from './robots'
import { SITE_CONFIG } from '@/lib/seo'

describe('robots', () => {
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
})
