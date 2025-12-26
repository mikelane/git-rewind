/**
 * SEO Constants and Utilities
 * Centralized configuration for all SEO-related metadata
 */

import type { Metadata } from 'next'

export const SITE_CONFIG = {
  name: 'Git Rewind',
  shortName: 'Git Rewind',
  description: 'Your year in code, beautifully told. A privacy-focused GitHub year-in-review that respects your data.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://gitrewind.com',
  locale: 'en_US',
  twitterHandle: '@gitrewind',
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

export const SEO_DEFAULTS: Metadata = {
  title: {
    default: 'Git Rewind — Your Year in Code',
    template: '%s | Git Rewind',
  },
  description: SITE_CONFIG.description,
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
    title: 'Git Rewind — Your Year in Code',
    description: SITE_CONFIG.description,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Git Rewind - Your Year in Code',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Git Rewind — Your Year in Code',
    description: SITE_CONFIG.description,
    creator: SITE_CONFIG.twitterHandle,
    images: ['/og-image.png'],
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_CONFIG.name,
  },
  verification: {
    // Add these when you have them:
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  category: 'technology',
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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Git Rewind - Your Year in Code',
        type: 'image/png',
      },
    ],
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
    images: ['/og-image.png'],
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
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/demo`,
      },
      'query-input': 'required name=search_term_string',
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
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1',
      bestRating: '5',
      worstRating: '1',
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
    '@graph': schemas.map(schema => {
      // Remove @context from individual schemas when combining
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { '@context': _context, ...rest } = schema as { '@context'?: string }
      return rest
    }),
  }
}
