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

const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [contenteditable]'
const MODAL_SELECTOR = '[aria-modal="true"]'

function shouldYieldToPage(target: EventTarget | null): boolean {
  const isInsideInteractiveControl =
    target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
  return isInsideInteractiveControl || document.querySelector(MODAL_SELECTOR) !== null
}

/**
 * Hook to enable keyboard navigation between chapters.
 * - ArrowDown / PageDown: Next chapter
 * - ArrowUp / PageUp: Previous chapter
 * - Home: First chapter
 * - End: Last chapter
 *
 * Space and Enter are never handled, so they keep activating focused controls.
 * Keys are ignored when focus is inside an interactive control or while a
 * modal dialog (`aria-modal="true"`) is open.
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
      if (shouldYieldToPage(event.target)) {
        return
      }

      switch (event.key) {
        case 'ArrowDown':
        case 'PageDown':
          event.preventDefault()
          scrollToChapter(currentChapter) // currentChapter is 1-indexed, so this goes to next
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
