'use client'

import { useEffect, useCallback, RefObject } from 'react'

interface UseKeyboardNavigationOptions {
  /** Refs to the chapter sections */
  chapterRefs: RefObject<HTMLElement | null>[]
  /** Current active chapter (1-indexed) */
  currentChapter: number
  /** Whether keyboard navigation is enabled (default: true) */
  enabled?: boolean
}

/**
 * Hook to enable keyboard navigation between chapters.
 * - ArrowDown / Space / PageDown: Next chapter
 * - ArrowUp / PageUp: Previous chapter
 * - Home: First chapter
 * - End: Last chapter
 *
 * Automatically disabled on touch devices.
 */
export function useKeyboardNavigation({
  chapterRefs,
  currentChapter,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const scrollToChapter = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, chapterRefs.length - 1))
    chapterRefs[clampedIndex]?.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chapterRefs])

  useEffect(() => {
    // Disable on touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (!enabled || isTouchDevice) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return
      }

      switch (event.key) {
        case 'ArrowDown':
        case 'PageDown':
          event.preventDefault()
          scrollToChapter(currentChapter) // currentChapter is 1-indexed, so this goes to next
          break
        case ' ': // Space
          // Only if not holding shift (shift+space = scroll up in browsers)
          if (!event.shiftKey) {
            event.preventDefault()
            scrollToChapter(currentChapter)
          }
          break
        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault()
          scrollToChapter(currentChapter - 2) // Go to previous (currentChapter is 1-indexed)
          break
        case 'Home':
          event.preventDefault()
          scrollToChapter(0)
          break
        case 'End':
          event.preventDefault()
          scrollToChapter(chapterRefs.length - 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, currentChapter, chapterRefs.length, scrollToChapter])
}
