'use client'

import { useState, useEffect, RefObject } from 'react'

interface UseScrollProgressOptions {
  /** Refs to the chapter sections */
  chapterRefs: RefObject<HTMLElement | null>[]
  /** Optional ref to the scroll container (defaults to window) */
  containerRef?: RefObject<HTMLElement | null>
  /** Offset from top of viewport to consider "active" (default: 40%) */
  offset?: number
}

export function useScrollProgress({
  chapterRefs,
  containerRef,
  offset = 0.4,
}: UseScrollProgressOptions) {
  const [currentChapter, setCurrentChapter] = useState(1)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const container = containerRef?.current

    const handleScroll = () => {
      const viewportHeight = container ? container.clientHeight : window.innerHeight
      const scrollTop = container ? container.scrollTop : window.scrollY
      const scrollHeight = container
        ? container.scrollHeight - viewportHeight
        : document.documentElement.scrollHeight - viewportHeight

      // Overall scroll progress (0-1)
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0
      setScrollProgress(progress)

      // Determine active chapter based on which section is in view
      const triggerPoint = viewportHeight * offset

      let activeChapter = 1
      for (let i = 0; i < chapterRefs.length; i++) {
        const ref = chapterRefs[i]
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect()
          // For container scrolling, check if section top is above trigger point
          if (rect.top <= triggerPoint) {
            activeChapter = i + 1
          }
        }
      }

      setCurrentChapter(activeChapter)
    }

    // Initial check
    handleScroll()

    const scrollTarget = container || window
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollTarget.removeEventListener('scroll', handleScroll)
  }, [chapterRefs, containerRef, offset])

  return { currentChapter, scrollProgress }
}
