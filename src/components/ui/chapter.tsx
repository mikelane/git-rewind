'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ChapterProps {
  children: ReactNode
  className?: string
  /** Optional chapter number for progress tracking */
  number?: number
  /** Whether to center content vertically */
  centered?: boolean
}

export function Chapter({
  children,
  className,
  centered = true,
}: ChapterProps) {
  return (
    <section
      className={cn(
        'min-h-screen w-full px-6 py-20',
        'md:px-12 lg:px-20 xl:px-32',
        centered && 'flex flex-col justify-center',
        className
      )}
    >
      <div className="max-w-4xl w-full mx-auto">{children}</div>
    </section>
  )
}

interface ChapterTitleProps {
  children: ReactNode
  className?: string
}

export function ChapterTitle({ children, className }: ChapterTitleProps) {
  return (
    <h2
      className={cn(
        'font-display text-display-md text-text-primary',
        'mb-6 opacity-0 animate-fade-in-up',
        className
      )}
    >
      {children}
    </h2>
  )
}

interface ChapterSubtitleProps {
  children: ReactNode
  className?: string
}

export function ChapterSubtitle({ children, className }: ChapterSubtitleProps) {
  return (
    <p
      className={cn(
        'font-body text-lead text-text-secondary text-balance',
        'max-w-xl opacity-0 animate-fade-in-up delay-100',
        className
      )}
    >
      {children}
    </p>
  )
}

interface ChapterLabelProps {
  children: ReactNode
  className?: string
}

export function ChapterLabel({ children, className }: ChapterLabelProps) {
  return (
    <span
      className={cn(
        'font-display text-caption uppercase tracking-widest text-accent',
        'mb-4 block opacity-0 animate-fade-in',
        className
      )}
    >
      {children}
    </span>
  )
}
