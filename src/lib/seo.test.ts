import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  SITE_CONFIG,
  createRootMetadata,
  createOpenGraph,
  createTwitter,
  generateWebsiteSchema,
  generateSoftwareApplicationSchema,
  generateFaqSchema,
  generateHomeSchema,
  serializeJsonLd,
} from './seo'
import { FAQ_ITEMS } from './faq'

describe('SITE_CONFIG', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('It falls back to https://git-rewind.dev when NEXT_PUBLIC_APP_URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    vi.resetModules()
    const { SITE_CONFIG: freshConfig } = await import('./seo')
    expect(freshConfig.url).toBe('https://git-rewind.dev')
  })

  it('It uses NEXT_PUBLIC_APP_URL when it is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://preview.example.com')
    vi.resetModules()
    const { SITE_CONFIG: freshConfig } = await import('./seo')
    expect(freshConfig.url).toBe('https://preview.example.com')
  })

  it.each([
    ['https://git-rewind.dev/', 'https://git-rewind.dev'],
    ['https://git-rewind.dev//', 'https://git-rewind.dev'],
    ['https://git-rewind.dev', 'https://git-rewind.dev'],
    ['https://preview.example.com/app/', 'https://preview.example.com/app'],
  ])('It normalizes NEXT_PUBLIC_APP_URL %s to %s', async (input, expected) => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', input)
    vi.resetModules()
    const { SITE_CONFIG: freshConfig } = await import('./seo')
    expect(freshConfig.url).toBe(expected)
  })

  it('It falls back to https://git-rewind.dev when NEXT_PUBLIC_APP_URL is only slashes', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '/')
    vi.resetModules()
    const { SITE_CONFIG: freshConfig } = await import('./seo')
    expect(freshConfig.url).toBe('https://git-rewind.dev')
  })

  it('It builds an Open Graph url without a double slash when the env URL has a trailing slash', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://git-rewind.dev/')
    vi.resetModules()
    const { createOpenGraph: freshOpenGraph } = await import('./seo')
    expect(freshOpenGraph('demo', '/demo').url).toBe('https://git-rewind.dev/demo')
  })

  it('It builds a breadcrumb item without a double slash when the env URL has a trailing slash', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://git-rewind.dev/')
    vi.resetModules()
    const { generateBreadcrumbSchema: freshBreadcrumb } = await import('./seo')
    const [crumb] = freshBreadcrumb([{ name: 'Demo', url: '/demo' }]).itemListElement
    expect(crumb.item).toBe('https://git-rewind.dev/demo')
  })

  it('It uses @mikelane as the twitter handle', () => {
    expect(SITE_CONFIG.twitterHandle).toBe('@mikelane')
  })
})

describe('createRootMetadata', () => {
  it('It puts the brand and "GitHub Wrapped <year>" in the default title', () => {
    const metadata = createRootMetadata(2026)
    expect(metadata.title).toMatchObject({
      default: 'Git Rewind — Your GitHub Wrapped 2026 | Year in Code',
    })
  })

  it('It uses the given year in the title', () => {
    const metadata = createRootMetadata(2031)
    expect(metadata.title).toMatchObject({
      default: expect.stringContaining('GitHub Wrapped 2031'),
    })
  })

  it('It keeps the default title within 60 characters', () => {
    const metadata = createRootMetadata(2026)
    const title = (metadata.title as { default: string }).default
    expect(title.length).toBeLessThanOrEqual(60)
  })

  it('It mentions GitHub Wrapped, the year and read-only access in the description', () => {
    const description = createRootMetadata(2026).description
    expect(description).toContain('GitHub Wrapped 2026')
    expect(description).toContain('read-only')
  })

  it('It keeps the description within 160 characters', () => {
    expect(createRootMetadata(2026).description?.length).toBeLessThanOrEqual(160)
  })

  it('It uses the same title and description for Open Graph and Twitter', () => {
    const metadata = createRootMetadata(2026)
    const title = (metadata.title as { default: string }).default
    expect(metadata.openGraph).toMatchObject({ title, description: metadata.description })
    expect(metadata.twitter).toMatchObject({ title, description: metadata.description })
  })

  it('It sets the twitter creator to @mikelane', () => {
    expect(createRootMetadata(2026).twitter).toMatchObject({ creator: '@mikelane' })
  })

  it('It declares the canonical and og:url on the site root', () => {
    const metadata = createRootMetadata(2026)
    expect(metadata.alternates?.canonical).toBe('/')
    expect(metadata.openGraph).toMatchObject({ url: SITE_CONFIG.url })
  })

  it.each(['icons', 'manifest'] as const)(
    'It leaves %s to the Next.js file conventions',
    (key) => {
      expect(createRootMetadata(2026)).not.toHaveProperty(key)
    }
  )

  it('It leaves Open Graph images to the opengraph-image file convention', () => {
    expect(createRootMetadata(2026).openGraph).not.toHaveProperty('images')
  })

  it('It leaves Twitter images to the twitter-image file convention', () => {
    expect(createRootMetadata(2026).twitter).not.toHaveProperty('images')
  })
})

describe('createOpenGraph', () => {
  it('It builds the page url from the site url and path', () => {
    expect(createOpenGraph('demo', '/demo').url).toBe(`${SITE_CONFIG.url}/demo`)
  })

  it('It leaves images to the file convention', () => {
    expect(createOpenGraph('demo', '/demo')).not.toHaveProperty('images')
  })
})

describe('createTwitter', () => {
  it('It sets the creator to @mikelane', () => {
    expect(createTwitter('demo').creator).toBe('@mikelane')
  })

  it('It leaves images to the file convention', () => {
    expect(createTwitter('demo')).not.toHaveProperty('images')
  })
})

describe('structured data', () => {
  it('It does not claim a search action on the WebSite', () => {
    expect(generateWebsiteSchema()).not.toHaveProperty('potentialAction')
  })

  it('It does not include an aggregateRating on the SoftwareApplication', () => {
    expect(generateSoftwareApplicationSchema()).not.toHaveProperty('aggregateRating')
  })

  it('It builds a FAQPage with one Question per FAQ item, in order', () => {
    const schema = generateFaqSchema()
    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity.map((entry) => entry.name)).toEqual(
      FAQ_ITEMS.map((item) => item.question)
    )
  })

  it('It uses each FAQ answer text verbatim in the FAQPage', () => {
    const answers = generateFaqSchema().mainEntity.map((entry) => entry.acceptedAnswer.text)
    expect(answers).toEqual(FAQ_ITEMS.map((item) => item.answer))
  })

  it('It combines WebSite, SoftwareApplication and FAQPage in one graph', () => {
    const graph = generateHomeSchema()['@graph']
    expect(graph.map((node) => node['@type'])).toEqual([
      'WebSite',
      'SoftwareApplication',
      'FAQPage',
    ])
  })

  it('It declares the schema.org context once at the graph root', () => {
    const schema = generateHomeSchema()
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@graph'].every((node) => !('@context' in node))).toBe(true)
  })
})

describe('serializeJsonLd', () => {
  it('It escapes "<" so the payload cannot close the script tag', () => {
    const json = serializeJsonLd({ text: '</script><script>alert(1)</script>' })
    expect(json).not.toContain('<')
    expect(json).toContain('\\u003c/script>')
  })

  it('It round-trips through JSON.parse', () => {
    const data = { a: '<b>', n: 1 }
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data)
  })
})
