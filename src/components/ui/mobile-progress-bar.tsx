'use client'

import { cn } from '@/lib/utils'

interface MobileProgressBarProps {
  currentChapter: number
  totalChapters: number
  /** CSS custom property holding the height of a fixed banner to sit below */
  offsetTopVar?: string
}

const toFillWidth = (current: number, total: number) =>
  `${Number(((current / total) * 100).toFixed(2))}%`

export function MobileProgressBar({
  currentChapter,
  totalChapters,
  offsetTopVar,
}: MobileProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-label="Chapter progress"
      aria-valuemin={1}
      aria-valuemax={totalChapters}
      aria-valuenow={currentChapter}
      className="fixed left-0 right-0 z-40 h-1 bg-border-subtle md:hidden"
      style={{ top: offsetTopVar ? `var(${offsetTopVar}, 0px)` : '0px' }}
    >
      <div
        className="h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: toFillWidth(currentChapter, totalChapters) }}
      />
    </div>
  )
}
