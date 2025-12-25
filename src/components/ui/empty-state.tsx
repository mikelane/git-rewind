'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: ReactNode
  className?: string
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-20',
        className
      )}
    >
      {/* Subtle decorative element */}
      <div className="w-16 h-16 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center mb-8">
        <svg
          className="w-8 h-8 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
          />
        </svg>
      </div>

      <h3 className="font-display text-heading text-text-primary mb-3">
        {title}
      </h3>
      <p className="text-body text-text-secondary max-w-sm">{description}</p>
    </div>
  )
}
