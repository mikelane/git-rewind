import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { SEO_DEFAULTS, SITE_CONFIG, generateWebsiteSchema, generateSoftwareApplicationSchema, generateCombinedSchema } from '@/lib/seo'
import './globals.css'

export const metadata: Metadata = {
  ...SEO_DEFAULTS,
  keywords: SITE_CONFIG.keywords,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'dark',
}

// Combined JSON-LD structured data (static, trusted content)
const jsonLd = generateCombinedSchema([
  generateWebsiteSchema(),
  generateSoftwareApplicationSchema(),
])

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://github.com" />
        <link rel="preconnect" href="https://api.github.com" />
        <link rel="dns-prefetch" href="https://github.com" />
        <link rel="dns-prefetch" href="https://api.github.com" />
      </head>
      <body className="min-h-screen bg-bg-base">
        {/* JSON-LD Structured Data - static trusted content only */}
        <Script
          id="json-ld-schema"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify(jsonLd)}
        </Script>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
