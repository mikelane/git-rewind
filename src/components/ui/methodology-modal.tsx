'use client'

import { useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface MethodologyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MethodologyModal({ isOpen, onClose }: MethodologyModalProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="methodology-title"
    >
      {/* Backdrop */}
      <div
        data-testid="methodology-backdrop"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        data-testid="methodology-content"
        className={cn(
          'relative z-10 w-full max-w-lg max-h-[85vh] mx-4',
          'bg-bg-surface rounded-2xl border border-border-subtle',
          'overflow-hidden shadow-xl',
          'animate-scale-in'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2
            id="methodology-title"
            className="font-display text-lg text-text-primary"
          >
            How we calculate your stats
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'p-2 -mr-2 rounded-lg',
              'text-text-tertiary hover:text-text-primary',
              'hover:bg-bg-elevated transition-colors',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface'
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-5rem)]">
          <div className="space-y-6">
            {/* Data Sources */}
            <section>
              <h3 className="text-body font-medium text-text-primary mb-2">
                Data Sources
              </h3>
              <p className="text-body-sm text-text-secondary">
                All statistics are fetched directly from the GitHub GraphQL API
                using your authenticated session. We query your contribution
                calendar, repository activity, and pull request data.
              </p>
            </section>

            {/* What counts */}
            <section>
              <h3 className="text-body font-medium text-text-primary mb-2">
                What counts as a contribution
              </h3>
              <ul className="text-body-sm text-text-secondary space-y-1.5 list-disc list-inside">
                <li>Commits to the default branch</li>
                <li>Opening a pull request</li>
                <li>Opening an issue</li>
                <li>Reviewing a pull request</li>
                <li>Commits to forks are only counted if merged upstream</li>
              </ul>
            </section>

            {/* Limitations */}
            <section>
              <h3 className="text-body font-medium text-text-primary mb-2">
                Known limitations
              </h3>
              <ul className="text-body-sm text-text-secondary space-y-1.5 list-disc list-inside">
                <li>
                  Private repositories require explicit access grants
                </li>
                <li>
                  Squashed commits count as one contribution
                </li>
                <li>
                  Force-pushed commits may be recounted
                </li>
                <li>
                  Language detection is based on repository primary language,
                  not per-commit analysis
                </li>
                <li>
                  Bot commits are filtered where detectable, but some may slip through
                </li>
              </ul>
            </section>

            {/* Privacy */}
            <section>
              <h3 className="text-body font-medium text-text-primary mb-2">
                Privacy
              </h3>
              <p className="text-body-sm text-text-secondary">
                We request read-only access to your data. Your access token is
                never stored beyond your session, and we do not access the
                content of your code or issues. Statistics are generated
                on-demand and not persisted.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
