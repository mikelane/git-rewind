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
      <body className="min-h-screen bg-bg-base">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
