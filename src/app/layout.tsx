import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { createRootMetadata } from '@/lib/seo'
import { getMarketingYear } from '@/lib/marketing-year'
import localFont from 'next/font/local'
import './globals.css'

const displayFont = localFont({
  src: [
    { path: './fonts/SpaceGrotesk-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/SpaceGrotesk-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/SpaceGrotesk-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-display',
})

const bodyFont = localFont({
  src: [
    { path: './fonts/Inter-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Inter-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Inter-600.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-body',
})

// Separate families listed before the latin ones in the tailwind stacks: next/font appends a
// local Arial metric fallback to each latin variable, which would otherwise claim these glyphs first.
// The unicode-range is Fontsource's latin-ext range, a literal because next/font reads options statically;
// the browser fetches these faces only for characters in it, so latin-only pages download nothing extra.
const displayLatinExtFont = localFont({
  src: [
    { path: './fonts/SpaceGrotesk-latin-ext-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/SpaceGrotesk-latin-ext-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/SpaceGrotesk-latin-ext-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-display-ext',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    },
  ],
})

const bodyLatinExtFont = localFont({
  src: [
    { path: './fonts/Inter-latin-ext-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Inter-latin-ext-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Inter-latin-ext-600.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-body-ext',
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    },
  ],
})

const fontVariableClasses = [
  displayFont.variable,
  bodyFont.variable,
  displayLatinExtFont.variable,
  bodyLatinExtFont.variable,
].join(' ')

// Computed per render: the title and description carry the marketing year
export function generateMetadata(): Metadata {
  return createRootMetadata(getMarketingYear(new Date()))
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
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
    <html lang="en" dir="ltr" className={fontVariableClasses}>
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
