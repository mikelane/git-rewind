import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { useRef } from 'react'
import { useDemoBannerHeight } from './use-demo-banner-height'

const PROPERTY = '--demo-banner-h'

let reportHeight: (height: number) => void
let disconnect: ReturnType<typeof vi.fn>

class StubResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    reportHeight = (height) =>
      callback([{ target: { offsetHeight: height }, borderBoxSize: [{ blockSize: height }] } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
  observe() {}
  unobserve() {}
  disconnect = disconnect
}

function Banner() {
  const ref = useRef<HTMLDivElement>(null)
  useDemoBannerHeight(ref)
  return <div ref={ref}>banner</div>
}

beforeEach(() => {
  disconnect = vi.fn()
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.style.removeProperty(PROPERTY)
})

describe('useDemoBannerHeight', () => {
  it('It publishes the observed banner height as --demo-banner-h', () => {
    render(<Banner />)

    reportHeight(58)

    expect(document.documentElement.style.getPropertyValue(PROPERTY)).toBe('58px')
  })

  it('It updates the property when the banner height changes', () => {
    render(<Banner />)

    reportHeight(58)
    reportHeight(36)

    expect(document.documentElement.style.getPropertyValue(PROPERTY)).toBe('36px')
  })

  it('It removes the property and disconnects the observer on unmount', () => {
    const { unmount } = render(<Banner />)
    reportHeight(58)

    unmount()

    expect(document.documentElement.style.getPropertyValue(PROPERTY)).toBe('')
    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
