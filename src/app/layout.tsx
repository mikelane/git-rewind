import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { createRootMetadata } from '@/lib/seo'
import { getMarketingYear } from '@/lib/marketing-year'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
})

const bodyFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-body',
})

// Computed per render: the title and description carry the marketing year
export function generateMetadata(): Metadata {
  return createRootMetadata(getMarketingYear(new Date()))
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://github.com" />
        <link rel="preconnect" href="https://api.github.com" />
        <link rel="dns-prefetch" href="https://github.com" />
        <link rel="dns-prefetch" href="https://api.github.com" />
      </head>
      <body className="min-h-screen bg-bg-base">
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
