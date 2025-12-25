'use client'

import { cn } from '@/lib/utils'

interface PrologueData {
  year: number
  username: string
  totalContributions: number
  comparisonInsights?: string[]
}

interface PrologueChapterProps {
  data: PrologueData | null
  isLoading?: boolean
  onContinue?: () => void
}

export function PrologueChapter({
  data,
  isLoading,
  onContinue,
}: PrologueChapterProps) {
  if (isLoading || !data) {
    return (
      <section className="min-h-screen w-full flex flex-col items-center justify-center px-6">
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="skeleton h-24 w-64 mb-6" />
        <div className="skeleton h-6 w-80" />
      </section>
    )
  }

  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-center px-6 text-center">
      {/* Year badge */}
      <div
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full',
          'bg-accent-subtle border border-accent/20',
          'opacity-0 animate-fade-in'
        )}
      >
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="font-display text-caption uppercase tracking-widest text-accent">
          Year in Review
        </span>
      </div>

      {/* Main title */}
      <h1
        className={cn(
          'font-display text-display-xl text-text-primary mt-8',
          'opacity-0 animate-fade-in-up delay-200'
        )}
      >
        {data.year}
      </h1>

      {/* Subtitle */}
      <p
        className={cn(
          'font-display text-display-sm text-text-secondary mt-4',
          'opacity-0 animate-fade-in-up delay-300'
        )}
      >
        Your year in code, <span className="text-text-primary">@{data.username}</span>
      </p>

      {/* Primary hook stat - elevated */}
      <div
        className={cn(
          'mt-16 opacity-0 animate-fade-in delay-500'
        )}
      >
        <p className="font-display text-display-lg md:text-display-xl text-accent tabular-nums">
          {data.totalContributions.toLocaleString()}
        </p>
        <p className="text-lead text-text-secondary mt-2">
          contributions this year
        </p>
      </div>

      {/* Year-over-year insights - secondary, faded */}
      {data.comparisonInsights && data.comparisonInsights.length > 0 && (
        <div
          className={cn(
            'mt-10 max-w-md opacity-0 animate-fade-in delay-700'
          )}
        >
          <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-bg-surface/50">
            {data.comparisonInsights.slice(0, 2).map((insight, index) => (
              <p
                key={index}
                className="text-body-sm text-text-tertiary text-center"
              >
                {insight}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Continue prompt */}
      <button
        onClick={onContinue}
        className={cn(
          'mt-20 group flex flex-col items-center gap-2',
          'text-text-tertiary hover:text-text-secondary transition-colors',
          'opacity-0 animate-fade-in delay-700'
        )}
      >
        <span className="text-body-sm">Scroll to explore</span>
        <svg
          className="w-5 h-5 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
          />
        </svg>
      </button>
    </section>
  )
}
