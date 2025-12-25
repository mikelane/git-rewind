import { describe, it, expect } from 'vitest'
import { getPeakDayContext } from './peak-day-context'

describe('getPeakDayContext', () => {
  describe('valid dates', () => {
    it('returns "End-of-year sprint" for late December', () => {
      expect(getPeakDayContext('2024-12-20')).toBe('End-of-year sprint')
    })

    it('returns "New year momentum" for early January', () => {
      expect(getPeakDayContext('2024-01-10')).toBe('New year momentum')
    })

    it('returns "Saturday deep work" for weekend Saturday', () => {
      // 2024-03-16 is a Saturday
      expect(getPeakDayContext('2024-03-16')).toBe('Saturday deep work')
    })

    it('returns "Sunday deep work" for weekend Sunday', () => {
      // 2024-03-17 is a Sunday
      expect(getPeakDayContext('2024-03-17')).toBe('Sunday deep work')
    })

    it('returns "Monday motivation" for Monday', () => {
      // 2024-03-18 is a Monday
      expect(getPeakDayContext('2024-03-18')).toBe('Monday motivation')
    })

    it('returns "Friday push" for Friday', () => {
      // 2024-03-22 is a Friday
      expect(getPeakDayContext('2024-03-22')).toBe('Friday push')
    })

    it('returns "Mid-week focus" for mid-week days', () => {
      // 2024-03-19 is a Tuesday
      expect(getPeakDayContext('2024-03-19')).toBe('Mid-week focus')
      // 2024-03-20 is a Wednesday
      expect(getPeakDayContext('2024-03-20')).toBe('Mid-week focus')
      // 2024-03-21 is a Thursday
      expect(getPeakDayContext('2024-03-21')).toBe('Mid-week focus')
    })
  })

  describe('invalid dates', () => {
    it('returns "Peak day" for empty string', () => {
      expect(getPeakDayContext('')).toBe('Peak day')
    })

    it('returns "Peak day" for malformed date string', () => {
      expect(getPeakDayContext('not-a-date')).toBe('Peak day')
    })

    it('returns "Peak day" for partially valid date', () => {
      expect(getPeakDayContext('2024-13-45')).toBe('Peak day')
    })

    it('returns "Peak day" for undefined-like string', () => {
      expect(getPeakDayContext('undefined')).toBe('Peak day')
    })
  })
})
