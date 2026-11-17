import { describe, it, expect, vi, afterEach } from 'vitest'
import { prefersReducedMotion, chapterScrollBehavior } from './motion'

const stubMatchMedia = (matches: boolean) => {
  const matchMedia = vi.fn().mockReturnValue({ matches })
  vi.stubGlobal('matchMedia', matchMedia)
  return matchMedia
}

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('It returns true when the reduce preference matches', () => {
    stubMatchMedia(true)

    expect(prefersReducedMotion()).toBe(true)
  })

  it('It returns false when the reduce preference does not match', () => {
    stubMatchMedia(false)

    expect(prefersReducedMotion()).toBe(false)
  })

  it('It queries the prefers-reduced-motion media feature', () => {
    const matchMedia = stubMatchMedia(false)

    prefersReducedMotion()

    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('It returns false when matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('chapterScrollBehavior', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    [true, 'auto'],
    [false, 'smooth'],
  ])('It maps reduced motion %s to behavior %s', (reduced, behavior) => {
    stubMatchMedia(reduced)

    expect(chapterScrollBehavior()).toBe(behavior)
  })

  it('It defaults to smooth when matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(chapterScrollBehavior()).toBe('smooth')
  })
})
