'use client'

import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  totalChapters: number
  currentChapter: number
  className?: string
  onChapterClick?: (index: number) => void
  chapterNames?: string[]
}

export function ProgressIndicator({
  totalChapters,
  currentChapter,
  className,
  onChapterClick,
  chapterNames,
}: ProgressIndicatorProps) {
  return (
    <nav
      className={cn(
        'fixed right-6 top-1/2 -translate-y-1/2 z-40',
        'flex flex-col gap-3',
        'hidden md:flex', // Hide on mobile
        className
      )}
      aria-label="Chapter progress"
    >
      {Array.from({ length: totalChapters }, (_, i) => {
        const chapterNum = i + 1
        const isActive = chapterNum === currentChapter
        const isPast = chapterNum < currentChapter
        const chapterName = chapterNames?.[i]

        return (
          <div key={i} className="relative group flex items-center justify-end">
            {/* Hover label */}
            {chapterName && (
              <span
                className={cn(
                  'absolute right-5 px-2 py-1 rounded text-caption whitespace-nowrap',
                  'bg-bg-elevated text-text-secondary',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                  'pointer-events-none'
                )}
              >
                {chapterName}
              </span>
            )}
            <button
              onClick={() => onChapterClick?.(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                'hover:scale-150 focus-visible:scale-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
                isActive && 'bg-accent scale-125',
                isPast && 'bg-text-tertiary hover:bg-text-secondary',
                !isActive && !isPast && 'bg-border-subtle hover:bg-border-muted'
              )}
              aria-label={`Go to ${chapterName || `chapter ${chapterNum}`}`}
              aria-current={isActive ? 'step' : undefined}
            />
          </div>
        )
      })}

      {/* Current chapter indicator */}
      <div className="mt-2 text-right">
        <span className="text-caption text-text-tertiary">
          {currentChapter} / {totalChapters}
        </span>
      </div>
    </nav>
  )
}
