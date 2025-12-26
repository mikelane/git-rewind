import type { Metadata } from 'next'
import Script from 'next/script'
import { PAGE_METADATA, createOpenGraph, createTwitter, generateBreadcrumbSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: PAGE_METADATA.rewind.title,
  description: PAGE_METADATA.rewind.description,
  keywords: PAGE_METADATA.rewind.keywords,
  alternates: {
    canonical: '/rewind',
  },
  openGraph: createOpenGraph('rewind', '/rewind'),
  twitter: createTwitter('rewind'),
  // Rewind page should not be indexed (private user data)
  robots: {
    index: false,
    follow: false,
  },
}

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Your Rewind', url: '/rewind' },
])

export default function RewindLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
        id="rewind-breadcrumb-schema"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(breadcrumbSchema)}
      </Script>
      {children}
    </>
  )
}
