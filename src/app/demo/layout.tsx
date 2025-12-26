import type { Metadata } from 'next'
import Script from 'next/script'
import { PAGE_METADATA, createOpenGraph, createTwitter, generateBreadcrumbSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: PAGE_METADATA.demo.title,
  description: PAGE_METADATA.demo.description,
  keywords: PAGE_METADATA.demo.keywords,
  alternates: {
    canonical: '/demo',
  },
  openGraph: createOpenGraph('demo', '/demo'),
  twitter: createTwitter('demo'),
}

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Demo', url: '/demo' },
])

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
        id="demo-breadcrumb-schema"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(breadcrumbSchema)}
      </Script>
      {children}
    </>
  )
}
