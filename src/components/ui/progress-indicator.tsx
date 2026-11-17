'use client'

import { cn } from '@/lib/utils'
import { MobileProgressBar } from './mobile-progress-bar'

interface ProgressIndicatorProps {
  totalChapters: number
  currentChapter: number
  className?: string
  onChapterClick?: (index: number) => void
  chapterNames?: string[]
  /** CSS custom property of a fixed banner the mobile bar sits below */
  offsetTopVar?: string
}

export function ProgressIndicator({
  totalChapters,
  currentChapter,
  className,
  onChapterClick,
  chapterNames,
  offsetTopVar,
}: ProgressIndicatorProps) {
  return (
    <>
      <MobileProgressBar
        currentChapter={currentChapter}
        totalChapters={totalChapters}
        offsetTopVar={offsetTopVar}
      />
      <nav
        className={cn(
          // right-1.5: the 44px step buttons keep the 8px dots where right-6 placed them
          'fixed right-1.5 top-1/2 -translate-y-1/2 z-40',
          'flex flex-col',
          'hidden md:flex', // Hide on mobile
          className
        )}
        aria-label="Chapter navigation"
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
                    'absolute right-[38px] px-2 py-1 rounded text-caption whitespace-nowrap',
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
                className="group/step inline-flex min-h-11 min-w-11 items-center justify-center focus:outline-none"
                aria-label={`Go to ${chapterName || `chapter ${chapterNum}`}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'block w-2 h-2 rounded-full transition-all duration-300',
                    'group-hover/step:scale-150 group-focus-visible/step:scale-150',
                    'group-focus-visible/step:ring-2 group-focus-visible/step:ring-accent group-focus-visible/step:ring-offset-2 group-focus-visible/step:ring-offset-bg-base',
                    isActive && 'bg-accent scale-125',
                    isPast && 'bg-text-tertiary group-hover/step:bg-text-secondary',
                    !isActive && !isPast && 'bg-border-subtle group-hover/step:bg-border-muted'
                  )}
                />
              </button>
            </div>
          )
        })}

        {/* Current chapter indicator */}
        <div className="mt-2 pr-[18px] text-right">
          <span className="text-caption text-text-tertiary">
            {currentChapter} / {totalChapters}
          </span>
        </div>
      </nav>
    </>
  )
}
