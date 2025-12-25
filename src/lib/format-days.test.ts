import { describe, it, expect } from 'vitest'
import { formatFavoriteDays } from './format-days'

describe('formatFavoriteDays', () => {
  describe('single day', () => {
    it('returns day name without "s" suffix for display', () => {
      expect(formatFavoriteDays(['Monday'])).toBe('Monday')
    })
  })

  describe('two days', () => {
    it('joins with "and" and no trailing "s"', () => {
      expect(formatFavoriteDays(['Monday', 'Wednesday'])).toBe('Monday and Wednesday')
    })
  })

  describe('three or more days', () => {
    it('uses comma separation with "and" before last item', () => {
      expect(formatFavoriteDays(['Monday', 'Wednesday', 'Friday']))
        .toBe('Monday, Wednesday, and Friday')
    })

    it('handles four days', () => {
      expect(formatFavoriteDays(['Monday', 'Tuesday', 'Wednesday', 'Friday']))
        .toBe('Monday, Tuesday, Wednesday, and Friday')
    })
  })

  describe('edge cases', () => {
    it('returns empty string for empty array', () => {
      expect(formatFavoriteDays([])).toBe('')
    })

    it('handles null/undefined gracefully', () => {
      expect(formatFavoriteDays(null as unknown as string[])).toBe('')
      expect(formatFavoriteDays(undefined as unknown as string[])).toBe('')
    })
  })
})
