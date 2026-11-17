'use client'

import { useEffect, RefObject } from 'react'

const BANNER_HEIGHT_PROPERTY = '--demo-banner-h'

/**
 * Publishes the height of the fixed demo banner as the `--demo-banner-h` CSS
 * custom property on the document root, so other fixed or scrolling elements
 * can sit below it. Browsers without ResizeObserver get a single measurement.
 * The property is removed on unmount.
 */
export function useDemoBannerHeight(bannerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const banner = bannerRef.current
    if (!banner) {
      return
    }

    const root = document.documentElement
    const publishHeight = (height: number) =>
      root.style.setProperty(BANNER_HEIGHT_PROPERTY, `${height}px`)

    if (typeof ResizeObserver === 'undefined') {
      publishHeight(banner.offsetHeight)
      return () => root.style.removeProperty(BANNER_HEIGHT_PROPERTY)
    }

    const observer = new ResizeObserver(([entry]) => {
      publishHeight((entry.target as HTMLElement).offsetHeight)
    })
    observer.observe(banner)

    return () => {
      observer.disconnect()
      root.style.removeProperty(BANNER_HEIGHT_PROPERTY)
    }
  }, [bannerRef])
}
