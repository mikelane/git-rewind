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

function getPeakDayContext(dateStr: string): string {
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay()
  const month = date.getMonth()
  const dayOfMonth = date.getDate()

  // Weekend check
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]

  // Time of year context
  if (month === 11 && dayOfMonth >= 15) {
    return 'End-of-year sprint'
  }
  if (month === 0 && dayOfMonth <= 15) {
    return 'New year momentum'
  }
  if (isWeekend) {
    return `${dayName} deep work`
  }
  if (dayOfWeek === 1) {
    return 'Monday motivation'
  }
  if (dayOfWeek === 5) {
    return 'Friday push'
  }

  return 'Mid-week focus'
}

export function PeakMomentsChapter({
  data,
  isLoading,
}: PeakMomentsChapterProps) {
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
            unit="commits"
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
                Most commits on <span className="text-text-secondary">{data.favoriteDayOfWeek}s</span>
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
              late night commits
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
              weekend commits
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
