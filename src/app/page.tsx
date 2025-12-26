import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { ErrorMessage } from '@/components/error-message'

// GitHub App slug for installation URL
const GITHUB_APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || 'git-rewind'

export default function LandingPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Logo / Title - THE visual anchor - renders immediately for fast LCP */}
      <h1
        className={cn(
          'font-display text-text-primary',
          'text-6xl sm:text-8xl md:text-9xl',
          'tracking-tight',
          'animate-fade-in-up'
        )}
      >
        Git Rewind
      </h1>

      {/* Tagline - tight relationship with title */}
      <p
        className={cn(
          'font-display text-text-secondary',
          'text-xl sm:text-2xl',
          'mt-4 max-w-md',
          'opacity-0 animate-fade-in-up delay-100'
        )}
      >
        Your year in code, beautifully told.
      </p>

      {/* Description */}
      <p
        className={cn(
          'text-body text-text-tertiary mt-6 max-w-sm',
          'opacity-0 animate-fade-in delay-200'
        )}
      >
        See your commits, streaks, and impact in one place.
      </p>

      {/* Error message - only client component, wrapped in Suspense */}
      <Suspense fallback={null}>
        <ErrorMessage />
      </Suspense>

      {/* Dual CTAs - side by side */}
      <div
        className={cn(
          'mt-10 flex flex-col sm:flex-row gap-4',
          'opacity-0 animate-fade-in-up delay-300'
        )}
      >
        {/* Primary CTA for returning users */}
        <a
          href="/api/auth/login"
          className={cn(
            'inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl',
            'bg-accent text-text-inverse font-medium',
            'hover:bg-accent-hover transition-colors',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base'
          )}
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          View Your Rewind
        </a>

        {/* Secondary CTA for new users */}
        <a
          href={`https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`}
          className={cn(
            'inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl',
            'bg-transparent text-text-tertiary font-medium',
            'hover:bg-bg-surface hover:text-text-secondary transition-colors',
            'border border-border-subtle',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base'
          )}
        >
          Install Git Rewind
        </a>
      </div>

      {/* Helper text */}
      <div
        className={cn(
          'mt-5 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-caption text-text-tertiary',
          'opacity-0 animate-fade-in delay-400'
        )}
      >
        <span>Already installed? Just view your rewind.</span>
        <span className="hidden sm:inline text-border-subtle">•</span>
        <a href="/demo" className="text-accent hover:underline underline-offset-2">
          Or see a demo first
        </a>
      </div>

      {/* Trust indicators - below CTAs as proof */}
      <div
        className={cn(
          'mt-12 opacity-0 animate-fade-in delay-500'
        )}
      >
        <p className="text-caption text-text-tertiary mb-4">
          Built to respect your GitHub account
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-body-sm text-text-tertiary">
            <span>🔒</span>
            <span>Read-only access</span>
          </div>
          <div className="flex items-center gap-2 text-body-sm text-text-tertiary">
            <span>🚫</span>
            <span>No data stored</span>
          </div>
          <div className="flex items-center gap-2 text-body-sm text-text-tertiary">
            <span>⚡</span>
            <span>Instant results</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-caption text-text-tertiary">
          Open source. Privacy by design.{' '}
          <a
            href="https://github.com/mikelane/git-rewind"
            className="text-accent hover:underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
          </a>
        </p>
      </footer>
    </main>
  )
}
