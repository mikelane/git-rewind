'use client'

import { useState, useCallback } from 'react'
import { cn, pluralize } from '@/lib/utils'
import { getLanguageColor } from '@/lib/constants'
import { shareHighlight } from '@/lib/share'

export interface EpilogueData {
  year: number
  username: string
  totalContributions: number
  activeDays: number
  topLanguage: string
  pullRequestsMerged: number
  longestStreak: number
  dataCompleteness?: {
    percentageAccessible: number
    restrictedContributions: number
  }
}

interface EpilogueChapterProps {
  data: EpilogueData | null
  isLoading?: boolean
  onDownload?: () => void
}

type ShareState = 'idle' | 'sharing' | 'shared' | 'copied'

export function EpilogueChapter({ data, isLoading, onDownload }: EpilogueChapterProps) {
  const [shareState, setShareState] = useState<ShareState>('idle')

  const handleShare = useCallback(async () => {
    if (!data) {
      return
    }
    setShareState('sharing')
    const result = await shareHighlight(data)
    if (result.success) {
      setShareState(result.method === 'clipboard' ? 'copied' : 'shared')
      setTimeout(() => setShareState('idle'), 2000)
    } else {
      setShareState('idle')
    }
  }, [data])

  if (isLoading || !data) {
    return (
      <section className="min-h-screen w-full flex flex-col items-center justify-center px-6">
        <div className="skeleton h-80 w-80 rounded-2xl" />
      </section>
    )
  }

  const languageColor = getLanguageColor(data.topLanguage)

  const shareButtonText = {
    idle: 'Share a Highlight',
    sharing: 'Sharing...',
    shared: 'Shared!',
    copied: 'Copied to clipboard!',
  }[shareState]

  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-20">
      {/* Closing message - more breathing room, larger text */}
      <p
        className={cn(
          'font-display text-display-md md:text-display-lg text-text-primary text-center max-w-xl',
          'opacity-0 animate-fade-in'
        )}
      >
        This wasn&apos;t about the numbers.
      </p>
      <p
        className={cn(
          'text-lead md:text-xl text-text-secondary text-center mt-6 max-w-lg',
          'opacity-0 animate-fade-in delay-100'
        )}
      >
        It was about showing up — {data.activeDays} times this year. Every commit moved something forward.
      </p>

      {/* Share card */}
      <div
        className={cn(
          'mt-16 w-full max-w-sm opacity-0 animate-scale-in delay-300'
        )}
      >
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl',
            'bg-gradient-to-br from-bg-surface to-bg-base',
            'border border-border-subtle',
            'p-8'
          )}
        >
          {/* Decorative accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: languageColor }}
          />

          {/* Year */}
          <div className="text-center">
            <span className="font-display text-caption uppercase tracking-widest text-text-tertiary">
              Git Rewind
            </span>
            <h2 className="font-display text-display-lg text-text-primary mt-2">
              {data.year}
            </h2>
          </div>

          {/* Username */}
          <p className="text-center text-body text-text-secondary mt-4">
            @{data.username}
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="text-center">
              <p className="font-display text-display-sm text-text-primary tabular-nums">
                {data.totalContributions.toLocaleString()}
              </p>
              <p className="text-caption text-text-tertiary mt-1">
                {pluralize(data.totalContributions, 'contribution', 'contributions')}
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-display-sm text-text-primary tabular-nums">
                {data.activeDays}
              </p>
              <p className="text-caption text-text-tertiary mt-1">
                active {pluralize(data.activeDays, 'day', 'days')}
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-display-sm text-text-primary tabular-nums">
                {data.pullRequestsMerged}
              </p>
              <p className="text-caption text-text-tertiary mt-1">
                {pluralize(data.pullRequestsMerged, 'PR merged', 'PRs merged')}
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-display-sm text-text-primary tabular-nums">
                {data.longestStreak}
              </p>
              <p className="text-caption text-text-tertiary mt-1">
                {pluralize(data.longestStreak, 'day', 'day')} streak
              </p>
            </div>
          </div>

          {/* Top language badge */}
          <div className="flex justify-center mt-8">
            <div
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-bg-elevated'
              )}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: languageColor }}
              />
              <span className="text-body-sm text-text-secondary">
                Powered by {data.topLanguage}
              </span>
            </div>
          </div>

          {/* Data completeness note - more prominent as trust moment */}
          {data.dataCompleteness && data.dataCompleteness.restrictedContributions > 0 && (
            <div className="mt-6 px-4 py-3 rounded-lg bg-bg-elevated/50 border border-border-subtle">
              <p className="text-center text-body-sm text-text-secondary">
                <span className="text-text-tertiary">
                  {100 - data.dataCompleteness.percentageAccessible}% of your activity
                </span>{' '}
                is in repos we can&apos;t access.{' '}
                <a
                  href="https://github.com/apps/git-rewind/installations/select_target"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline underline-offset-2"
                >
                  Grant access to see the full picture
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Action buttons - better intent framing */}
        <div className="flex gap-3 mt-6 opacity-0 animate-fade-in delay-500">
          <button
            onClick={handleShare}
            disabled={shareState === 'sharing'}
            className={cn(
              'flex-1 py-3 px-6 rounded-xl',
              'bg-accent text-text-inverse font-medium',
              'hover:bg-accent-hover transition-colors',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
              shareState === 'sharing' && 'opacity-70 cursor-wait',
              (shareState === 'shared' || shareState === 'copied') && 'bg-green-600 hover:bg-green-600'
            )}
          >
            {shareButtonText}
          </button>
          <button
            onClick={onDownload}
            disabled={!onDownload}
            className={cn(
              'py-3 px-6 rounded-xl',
              'bg-bg-surface text-text-secondary',
              'hover:bg-bg-elevated hover:text-text-primary transition-colors',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
              !onDownload && 'opacity-50 cursor-not-allowed'
            )}
          >
            Save Your Rewind
          </button>
        </div>
      </div>

      {/* Footer message */}
      <div
        className={cn(
          'text-body-sm text-text-tertiary text-center mt-16 max-w-sm',
          'opacity-0 animate-fade-in delay-700'
        )}
      >
        <p>
          Open source. Privacy by design. Free forever.
        </p>
        <p className="mt-3 flex items-center justify-center gap-3">
          <a
            href="https://github.com/mikelane/git-rewind"
            className="hover:text-text-secondary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
          </a>
          <span className="text-border-subtle">·</span>
          <a
            href="https://github.com/sponsors/mikelane"
            className="hover:text-text-secondary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sponsor
          </a>
        </p>
      </div>
    </section>
  )
}
