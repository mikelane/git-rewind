import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Git Rewind — Your Year in Code',
  description: 'A privacy-focused year-in-review for your GitHub activity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-base">{children}</body>
    </html>
  )
}
