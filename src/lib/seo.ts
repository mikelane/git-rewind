/**
 * SEO Constants and Utilities
 * Centralized configuration for all SEO-related metadata
 */

import type { Metadata } from 'next'
import { FAQ_ITEMS } from './faq'

export const SITE_CONFIG = {
  name: 'Git Rewind',
  shortName: 'Git Rewind',
  description: 'Your year in code, beautifully told. A privacy-focused GitHub year-in-review that respects your data.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://git-rewind.dev',
  locale: 'en_US',
  twitterHandle: '@mikelane',
  githubUrl: 'https://github.com/mikelane/git-rewind',
  author: {
    name: 'Mike Lane',
    url: 'https://github.com/mikelane',
  },
  keywords: [
    'GitHub',
    'year in review',
    'GitHub Wrapped',
    'developer stats',
    'coding statistics',
    'contribution graph',
    'GitHub activity',
    'commit history',
    'programming stats',
    'developer year review',
    'GitHub year recap',
    'code contributions',
    'git statistics',
    'open source contributions',
  ] as string[],
}

/** Bump when page content meaningfully changes; the sitemap reports it as lastModified. */
export const SITE_LAST_UPDATED = new Date('2026-11-16T00:00:00.000Z')

export function createSiteTitle(year: number): string {
  return `Git Rewind — Your GitHub Wrapped ${year} | Year in Code`
}

export function createSiteDescription(year: number): string {
  return `Get your GitHub Wrapped ${year}: your commits, streaks and languages in one year-in-review, with read-only GitHub App access and no stored data.`
}

/**
 * Root metadata. Title and description depend on the marketing year, so this is
 * called per render. Icons, manifest and social images come from the Next.js
 * file conventions (icon, apple-icon, opengraph-image, twitter-image, manifest).
 */
export function createRootMetadata(year: number): Metadata {
  const title = createSiteTitle(year)
  const description = createSiteDescription(year)
  return {
    title: {
      default: title,
      template: '%s | Git Rewind',
    },
    description,
    keywords: SITE_CONFIG.keywords,
    applicationName: SITE_CONFIG.name,
    referrer: 'origin-when-cross-origin',
    creator: SITE_CONFIG.author.name,
    publisher: SITE_CONFIG.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      url: SITE_CONFIG.url,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: SITE_CONFIG.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: SITE_CONFIG.name,
    },
    category: 'technology',
  }
}

// Page-specific metadata configurations
export const PAGE_METADATA = {
  home: {
    title: 'Git Rewind — Your Year in Code',
    description: 'See your GitHub commits, streaks, and coding impact beautifully visualized. Privacy-focused with read-only access. No data stored.',
    keywords: [...SITE_CONFIG.keywords, 'homepage', 'get started'],
  },
  demo: {
    title: 'Demo',
    description: 'Preview Git Rewind with sample data. See how your GitHub year-in-review will look before connecting your account.',
    keywords: [...SITE_CONFIG.keywords, 'demo', 'preview', 'example'],
  },
  rewind: {
    title: 'Your Rewind',
    description: 'Your personalized GitHub year-in-review. Discover your coding patterns, top languages, collaboration stats, and peak moments.',
    keywords: [...SITE_CONFIG.keywords, 'personal stats', 'my year'],
  },
}

// Helper to create page-specific OpenGraph config
export function createOpenGraph(page: keyof typeof PAGE_METADATA, path: string) {
  const pageData = PAGE_METADATA[page]
  return {
    type: 'website' as const,
    siteName: SITE_CONFIG.name,
    locale: SITE_CONFIG.locale,
    url: `${SITE_CONFIG.url}${path}`,
    title: `${pageData.title} | Git Rewind`,
    description: pageData.description,
  }
}

// Helper to create page-specific Twitter config
export function createTwitter(page: keyof typeof PAGE_METADATA) {
  const pageData = PAGE_METADATA[page]
  return {
    card: 'summary_large_image' as const,
    title: `${pageData.title} | Git Rewind`,
    description: pageData.description,
    creator: SITE_CONFIG.twitterHandle,
  }
}

// JSON-LD Structured Data generators
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    author: {
      '@type': 'Person',
      name: SITE_CONFIG.author.name,
      url: SITE_CONFIG.author.url,
    },
  }
}

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Person',
      name: SITE_CONFIG.author.name,
      url: SITE_CONFIG.author.url,
    },
    featureList: [
      'Privacy-focused GitHub analysis',
      'Read-only access to repositories',
      'No data storage',
      'Beautiful year-in-review visualization',
      'Contribution patterns analysis',
      'Language statistics',
      'Collaboration insights',
    ],
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.url}`,
    })),
  }
}

// Helper to combine multiple schemas
export function generateCombinedSchema(schemas: object[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas.map((schema): Record<string, unknown> => {
      // Remove @context from individual schemas when combining
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { '@context': _context, ...rest } = schema as Record<string, unknown>
      return rest
    }),
  }
}

export function generateFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage' as const,
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question' as const,
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: item.answer,
      },
    })),
  }
}

/** JSON-LD graph for the home page: WebSite, SoftwareApplication and FAQPage. */
export function generateHomeSchema() {
  return generateCombinedSchema([
    generateWebsiteSchema(),
    generateSoftwareApplicationSchema(),
    generateFaqSchema(),
  ])
}

/** Serializes JSON-LD for inline <script> use; "<" is escaped so content cannot close the tag. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
