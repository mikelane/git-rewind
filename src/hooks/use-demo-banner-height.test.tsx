import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { useDemoBannerHeight } from './use-demo-banner-height'

const PROPERTY = '--demo-banner-h'

let observedElements: Element[]
let observerCallbacks: ResizeObserverCallback[]
let disconnect: ReturnType<typeof vi.fn>

function reportHeight(height: number) {
  observedElements.forEach(element => {
    Object.defineProperty(element, 'offsetHeight', { value: height, configurable: true })
  })
  if (observedElements.length === 0) {
    return
  }
  const entries = observedElements.map(target => ({ target }) as unknown as ResizeObserverEntry)
  observerCallbacks.forEach(callback => callback(entries, {} as ResizeObserver))
}

class StubResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    observerCallbacks.push(callback)
  }
  observe(element: Element) {
    observedElements.push(element)
  }
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
  observedElements = []
  observerCallbacks = []
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.style.removeProperty(PROPERTY)
})

describe('useDemoBannerHeight', () => {
  it('It observes the banner element', () => {
    render(<Banner />)

    expect(observedElements).toEqual([screen.getByText('banner')])
  })

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

describe('useDemoBannerHeight without ResizeObserver', () => {
  const BANNER_HEIGHT = 42

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', undefined)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(BANNER_HEIGHT)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('It renders the banner when the browser has no ResizeObserver', () => {
    expect(() => render(<Banner />)).not.toThrow()
  })

  it('It measures the banner once and publishes --demo-banner-h', () => {
    render(<Banner />)

    expect(document.documentElement.style.getPropertyValue(PROPERTY)).toBe('42px')
  })

  it('It removes the property on unmount', () => {
    const { unmount } = render(<Banner />)

    unmount()

    expect(document.documentElement.style.getPropertyValue(PROPERTY)).toBe('')
  })
})
