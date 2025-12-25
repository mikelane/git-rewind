'use client'

import { cn } from '@/lib/utils'

interface LoadingStateProps {
  className?: string
}

export function ChapterLoading({ className }: LoadingStateProps) {
  return (
    <div className={cn('w-full max-w-2xl', className)}>
      {/* Label skeleton */}
      <div className="skeleton h-4 w-24 mb-4" />

      {/* Title skeleton */}
      <div className="skeleton h-12 w-80 mb-6" />

      {/* Subtitle skeleton */}
      <div className="space-y-3 mb-16">
        <div className="skeleton h-6 w-full max-w-md" />
        <div className="skeleton h-6 w-3/4 max-w-sm" />
      </div>

      {/* Stat skeleton */}
      <div className="skeleton h-20 w-48 mb-4" />
      <div className="skeleton h-6 w-64" />

      {/* Bar skeleton */}
      <div className="mt-16">
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="flex gap-6 mt-6">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-5 w-20" />
          <div className="skeleton h-5 w-16" />
        </div>
      </div>
    </div>
  )
}

export function StatLoading({ className }: LoadingStateProps) {
  return (
    <div className={cn('', className)}>
      <div className="skeleton h-16 w-32 mb-4" />
      <div className="skeleton h-5 w-48" />
    </div>
  )
}
