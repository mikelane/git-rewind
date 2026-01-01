'use client'

import {
  Chapter,
  ChapterLabel,
  ChapterTitle,
  ChapterSubtitle,
  StatCallout,
  ChapterLoading,
  EmptyState,
  ShareButton,
} from '@/components/ui'
import { cn, pluralize } from '@/lib/utils'
import { getPeakDayContext } from '@/lib/peak-day-context'
import { HighlightType, type PeakDayHighlight } from '@/lib/highlight-share'

export interface PeakMomentsData {
  busiestDay: {
    date: string
    formattedDate: string
    commits: number
  } | null
  busiestWeek: {
    startDate: string
    commits: number
  }
  favoriteTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  favoriteDayOfWeek: string | null
  lateNightCommits: number
  weekendCommits: number
  averageCommitsPerActiveDay: number
}

interface PeakMomentsChapterProps {
  data: PeakMomentsData | null
  isLoading?: boolean
  username?: string
  year?: number
}

function getTimeOfDayDescription(time: PeakMomentsData['favoriteTimeOfDay']) {
  switch (time) {
    case 'morning':
      return { label: 'Morning person', desc: 'You do your best work before noon.' }
    case 'afternoon':
      return { label: 'Afternoon focus', desc: 'You hit your stride after lunch.' }
    case 'evening':
      return { label: 'Evening coder', desc: 'You find your flow as the day winds down.' }
    case 'night':
      return { label: 'Night owl', desc: 'The quiet hours are when you do your best work.' }
  }
}

function getTimeOfDayIcon(time: PeakMomentsData['favoriteTimeOfDay']) {
  switch (time) {
    case 'morning':
      return '🌅'
    case 'afternoon':
      return '☀️'
    case 'evening':
      return '🌆'
    case 'night':
      return '🌙'
  }
}

export function PeakMomentsChapter({
  data,
  isLoading,
  username,
  year,
}: PeakMomentsChapterProps) {
  const peakDayHighlight: PeakDayHighlight | null = data?.busiestDay && username && year ? {
    type: HighlightType.PeakDay,
    username,
    year,
    date: data.busiestDay.formattedDate,
    commits: data.busiestDay.commits,
  } : null

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
          title="No peak moments found"
          description="Every day is an opportunity. Your peak moments are ahead of you."
        />
      </Chapter>
    )
  }

  const timeStyle = getTimeOfDayDescription(data.favoriteTimeOfDay)

  return (
    <Chapter>
      <ChapterLabel>Chapter Four</ChapterLabel>
      <ChapterTitle>Peak Moments</ChapterTitle>
      <ChapterSubtitle>
        The days you were in flow. When everything clicked.
      </ChapterSubtitle>

      {/* Busiest day - the hero moment with context */}
      {data.busiestDay && (
        <div className="mt-16">
          <StatCallout
            value={data.busiestDay.commits}
            unit={pluralize(data.busiestDay.commits, 'commit', 'commits')}
            context={
              <>
                <span className="text-text-primary font-medium">
                  {data.busiestDay.formattedDate}
                </span>{' '}
                was your most prolific day.{' '}
                <span className="text-text-tertiary">
                  {getPeakDayContext(data.busiestDay.date)}.
                </span>
              </>
            }
            delay={300}
          />
          {peakDayHighlight && (
            <div className="mt-4 opacity-0 animate-fade-in delay-400">
              <ShareButton highlight={peakDayHighlight} />
            </div>
          )}
        </div>
      )}

      {/* Time pattern card */}
      <div
        className={cn(
          'mt-16 p-8 rounded-2xl bg-bg-surface',
          'opacity-0 animate-fade-in delay-400'
        )}
      >
        <div className="flex items-start gap-6">
          <span className="text-4xl" role="img" aria-label={data.favoriteTimeOfDay}>
            {getTimeOfDayIcon(data.favoriteTimeOfDay)}
          </span>
          <div>
            <h3 className="font-display text-heading text-text-primary">
              {timeStyle.label}
            </h3>
            <p className="text-body text-text-secondary mt-1">
              {timeStyle.desc}
            </p>
            {data.favoriteDayOfWeek && (
              <p className="text-body-sm text-text-tertiary mt-4">
                Most active on <span className="text-text-secondary">{data.favoriteDayOfWeek}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Secondary insights */}
      <div
        className={cn(
          'mt-12 grid gap-8 md:grid-cols-2',
          'opacity-0 animate-fade-in delay-500'
        )}
      >
        {data.lateNightCommits > 10 && (
          <div className="p-6 rounded-xl bg-bg-surface/50">
            <p className="font-display text-display-sm text-text-primary tabular-nums">
              {data.lateNightCommits}
            </p>
            <p className="text-body-sm text-text-secondary mt-1">
              late night {pluralize(data.lateNightCommits, 'commit', 'commits')}
            </p>
            <p className="text-caption text-text-tertiary mt-2">
              After midnight, before 5am
            </p>
          </div>
        )}

        {data.weekendCommits > 20 && (
          <div className="p-6 rounded-xl bg-bg-surface/50">
            <p className="font-display text-display-sm text-text-primary tabular-nums">
              {data.weekendCommits}
            </p>
            <p className="text-body-sm text-text-secondary mt-1">
              weekend {pluralize(data.weekendCommits, 'commit', 'commits')}
            </p>
            <p className="text-caption text-text-tertiary mt-2">
              Saturdays and Sundays
            </p>
          </div>
        )}
      </div>

      {/* Average pace */}
      <div className="mt-12 opacity-0 animate-fade-in delay-500">
        <p className="text-body text-text-secondary">
          On days you coded, you averaged{' '}
          <span className="font-display text-heading text-text-primary">
            {data.averageCommitsPerActiveDay.toFixed(1)}
          </span>{' '}
          commits per day.
        </p>
      </div>

      {/* Transition to epilogue */}
      <p className="mt-20 text-body-sm text-text-tertiary italic opacity-0 animate-fade-in delay-700">
        That was your year. Let&apos;s bring it all together.
      </p>
    </Chapter>
  )
}
