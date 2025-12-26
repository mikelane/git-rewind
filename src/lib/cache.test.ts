import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTTL, TTL_CURRENT_YEAR, TTL_PAST_YEAR } from './cache'

describe('getTTL', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns short TTL for current year', () => {
    vi.setSystemTime(new Date('2024-06-15'))
    expect(getTTL(2024)).toBe(TTL_CURRENT_YEAR)
  })

  it('returns long TTL for past year', () => {
    vi.setSystemTime(new Date('2024-06-15'))
    expect(getTTL(2023)).toBe(TTL_PAST_YEAR)
  })

  describe('New Year boundary handling', () => {
    it('returns short TTL for 2024 when current date is 2024', () => {
      vi.setSystemTime(new Date('2024-12-31T23:59:59'))
      expect(getTTL(2024)).toBe(TTL_CURRENT_YEAR)
    })

    it('returns long TTL for 2024 after crossing into 2025', () => {
      // This test will FAIL if CURRENT_YEAR is evaluated at module load time
      // because the module would have been loaded when it was still 2024
      vi.setSystemTime(new Date('2025-01-01T00:00:01'))
      expect(getTTL(2024)).toBe(TTL_PAST_YEAR)
    })

    it('returns short TTL for new year (2025) after New Year', () => {
      vi.setSystemTime(new Date('2025-01-01T00:00:01'))
      expect(getTTL(2025)).toBe(TTL_CURRENT_YEAR)
    })

    it('computes current year dynamically on each call', () => {
      // Start in 2024
      vi.setSystemTime(new Date('2024-12-31T23:59:59'))
      expect(getTTL(2024)).toBe(TTL_CURRENT_YEAR)
      expect(getTTL(2025)).toBe(TTL_PAST_YEAR) // 2025 is "future" so treated as past year

      // Cross into 2025
      vi.setSystemTime(new Date('2025-01-01T00:00:01'))
      expect(getTTL(2024)).toBe(TTL_PAST_YEAR) // Now 2024 is past
      expect(getTTL(2025)).toBe(TTL_CURRENT_YEAR) // Now 2025 is current
    })
  })
})
