'use client'

import {
  Chapter,
  ChapterLabel,
  ChapterTitle,
  ChapterSubtitle,
  StatCallout,
  ChapterLoading,
  EmptyState,
} from '@/components/ui'
import { cn } from '@/lib/utils'

export interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4 // 0 = none, 4 = max
}

export interface TheRhythmData {
  activeDays: number
  totalDays: number
  longestStreak: number
  currentStreak: number
  busiestMonth: string
  busiestMonthCount: number
  contributionsByMonth: { month: string; count: number }[]
}

interface TheRhythmChapterProps {
  data: TheRhythmData | null
  isLoading?: boolean
}

export function TheRhythmChapter({ data, isLoading }: TheRhythmChapterProps) {
  if (isLoading) {
    return (
      <Chapter>
        <ChapterLoading />
      </Chapter>
    )
  }

  if (!data) {
    return (
      <Chapter>
        <EmptyState
          title="No activity data"
          description="We couldn't find contribution data for this period. Your journey awaits."
        />
      </Chapter>
    )
  }

  const consistencyPercentage = Math.round((data.activeDays / data.totalDays) * 100)

  return (
    <Chapter>
      <ChapterLabel>Chapter One</ChapterLabel>
      <ChapterTitle>The Rhythm</ChapterTitle>
      <ChapterSubtitle>
        Code is a practice. These are the days you showed up.
      </ChapterSubtitle>

      {/* Primary stat */}
      <div className="mt-16">
        <StatCallout
          value={data.activeDays}
          unit="days"
          context={
            <>
              You were active on{' '}
              <span className="text-text-primary font-medium">
                {consistencyPercentage}%
              </span>{' '}
              of the year. Consistency compounds.
            </>
          }
          delay={300}
        />
      </div>

      {/* Monthly rhythm visualization - mobile responsive */}
      <div className="mt-20">
        <p className="text-caption uppercase tracking-widest text-text-tertiary mb-8">
          Monthly Activity
        </p>
        {/* Desktop: horizontal bar chart */}
        <div className="hidden sm:flex items-end gap-2 md:gap-3 h-48">
          {data.contributionsByMonth.map((month, index) => {
            // Use Math.max with 0 as first argument to prevent -Infinity on empty array
            const maxCount = Math.max(0, ...data.contributionsByMonth.map((m) => m.count))
            const heightPercent = maxCount > 0 ? (month.count / maxCount) * 100 : 0
            const isBusiest = month.month === data.busiestMonth

            return (
              <div
                key={month.month}
                className="flex-1 flex flex-col items-center gap-3 group"
              >
                {/* Bar container */}
                <div className="w-full h-40 flex flex-col justify-end relative">
                  {/* Count tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-caption text-text-secondary tabular-nums whitespace-nowrap">
                      {month.count.toLocaleString()}
                    </span>
                  </div>
                  {/* The bar */}
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-all duration-700 ease-out',
                      isBusiest
                        ? 'bg-accent shadow-[0_0_20px_rgba(245,166,35,0.3)]'
                        : 'bg-text-tertiary/30 hover:bg-text-tertiary/50'
                    )}
                    style={{
                      height: `${Math.max(heightPercent, 2)}%`,
                      animationDelay: `${index * 80}ms`,
                    }}
                  />
                </div>
                {/* Month label */}
                <span
                  className={cn(
                    'text-caption transition-colors',
                    isBusiest ? 'text-accent font-medium' : 'text-text-tertiary'
                  )}
                >
                  {month.month.slice(0, 3)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Mobile: compact grid with numbers */}
        <div className="sm:hidden grid grid-cols-4 gap-3">
          {data.contributionsByMonth.map((month) => {
            // Use Math.max with 0 as first argument to prevent -Infinity on empty array
            const maxCount = Math.max(0, ...data.contributionsByMonth.map((m) => m.count))
            const intensity = maxCount > 0 ? month.count / maxCount : 0
            const isBusiest = month.month === data.busiestMonth

            return (
              <div
                key={month.month}
                className={cn(
                  'p-3 rounded-lg text-center',
                  isBusiest ? 'bg-accent/20 border border-accent/30' : 'bg-bg-surface'
                )}
              >
                <p className={cn(
                  'text-caption',
                  isBusiest ? 'text-accent font-medium' : 'text-text-tertiary'
                )}>
                  {month.month.slice(0, 3)}
                </p>
                <p className={cn(
                  'font-display text-body-sm tabular-nums mt-1',
                  intensity > 0.7 ? 'text-text-primary' :
                  intensity > 0.3 ? 'text-text-secondary' : 'text-text-tertiary'
                )}>
                  {month.count}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Streak callout - elevated into accent card */}
      {data.longestStreak > 7 && (
        <div className={cn(
          'mt-16 p-6 rounded-xl bg-accent/10 border border-accent/20',
          'opacity-0 animate-fade-in delay-500'
        )}>
          <div className="flex items-center gap-4">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="font-display text-display-sm text-text-primary">
                {data.longestStreak} day streak
              </p>
              <p className="text-body-sm text-text-secondary mt-1">
                {data.currentStreak > 0 ? (
                  <>Currently on a <span className="text-accent font-medium">{data.currentStreak}-day</span> streak</>
                ) : (
                  'Your longest consecutive coding streak'
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Busiest month narrative */}
      <div className="mt-8 opacity-0 animate-fade-in delay-500">
        <p className="text-body text-text-secondary">
          <span className="text-text-primary font-medium">{data.busiestMonth}</span>{' '}
          was your most active month with{' '}
          <span className="text-text-primary tabular-nums">
            {data.busiestMonthCount.toLocaleString()}
          </span>{' '}
          contributions.
        </p>
      </div>

      {/* Transition to next chapter */}
      <p className="mt-20 text-body-sm text-text-tertiary italic opacity-0 animate-fade-in delay-700">
        Showing up is just the start. Let&apos;s see what you built.
      </p>
    </Chapter>
  )
}
