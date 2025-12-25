'use client'

import { cn, formatNumber } from '@/lib/utils'
import { ReactNode } from 'react'

interface StatCalloutProps {
  value: number | string
  unit?: string
  context: ReactNode
  className?: string
  /** Animation delay in ms */
  delay?: number
}

export function StatCallout({
  value,
  unit,
  context,
  className,
  delay = 0,
}: StatCalloutProps) {
  const formattedValue = typeof value === 'number' ? formatNumber(value) : value

  return (
    <div
      className={cn('opacity-0 animate-scale-in', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-baseline">
        <span className="font-display text-display-xl text-text-primary tabular-nums tracking-tight">
          {formattedValue}
        </span>
        {unit && (
          <span className="font-display text-display-sm text-text-secondary ml-3">
            {unit}
          </span>
        )}
      </div>
      <p className="text-lead text-text-secondary mt-4 max-w-md">{context}</p>
    </div>
  )
}

interface StatRowProps {
  label: string
  value: number | string
  className?: string
}

export function StatRow({ label, value, className }: StatRowProps) {
  const formattedValue = typeof value === 'number' ? formatNumber(value) : value

  return (
    <div
      className={cn(
        'flex items-center justify-between py-4',
        'border-b border-border-subtle/50 last:border-0',
        className
      )}
    >
      <span className="text-body text-text-secondary">{label}</span>
      <span className="font-display text-heading text-text-primary tabular-nums">
        {formattedValue}
      </span>
    </div>
  )
}
