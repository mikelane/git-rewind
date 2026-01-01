import { describe, it, expect } from 'vitest'
import {
  classifyActivityLevel,
  shouldShowMotivationalCopy,
  isLowActivity,
  type ActivityMetrics,
} from './activity-level'

describe('classifyActivityLevel', () => {
  describe('zero activity', () => {
    it('returns zero when both contributions and active days are 0', () => {
      const metrics: ActivityMetrics = { totalContributions: 0, activeDays: 0 }
      expect(classifyActivityLevel(metrics)).toBe('zero')
    })
  })

  describe('sparse activity', () => {
    it('returns sparse for 1 contribution and 1 active day', () => {
      const metrics: ActivityMetrics = { totalContributions: 1, activeDays: 1 }
      expect(classifyActivityLevel(metrics)).toBe('sparse')
    })

    it('returns sparse for 9 contributions and 4 active days (just under thresholds)', () => {
      const metrics: ActivityMetrics = { totalContributions: 9, activeDays: 4 }
      expect(classifyActivityLevel(metrics)).toBe('sparse')
    })

    it('returns sparse for 5 contributions and 2 active days', () => {
      const metrics: ActivityMetrics = { totalContributions: 5, activeDays: 2 }
      expect(classifyActivityLevel(metrics)).toBe('sparse')
    })
  })

  describe('typical activity', () => {
    it('returns typical when contributions meet threshold but active days do not', () => {
      const metrics: ActivityMetrics = { totalContributions: 10, activeDays: 3 }
      expect(classifyActivityLevel(metrics)).toBe('typical')
    })

    it('returns typical when active days meet threshold but contributions do not', () => {
      const metrics: ActivityMetrics = { totalContributions: 5, activeDays: 5 }
      expect(classifyActivityLevel(metrics)).toBe('typical')
    })

    it('returns typical for moderate activity', () => {
      const metrics: ActivityMetrics = { totalContributions: 100, activeDays: 50 }
      expect(classifyActivityLevel(metrics)).toBe('typical')
    })

    it('returns typical for 499 contributions (just under high threshold)', () => {
      const metrics: ActivityMetrics = { totalContributions: 499, activeDays: 99 }
      expect(classifyActivityLevel(metrics)).toBe('typical')
    })
  })

  describe('high activity', () => {
    it('returns high for 500+ contributions', () => {
      const metrics: ActivityMetrics = { totalContributions: 500, activeDays: 50 }
      expect(classifyActivityLevel(metrics)).toBe('high')
    })

    it('returns high for 100+ active days', () => {
      const metrics: ActivityMetrics = { totalContributions: 200, activeDays: 100 }
      expect(classifyActivityLevel(metrics)).toBe('high')
    })

    it('returns high for very active users', () => {
      const metrics: ActivityMetrics = { totalContributions: 1000, activeDays: 200 }
      expect(classifyActivityLevel(metrics)).toBe('high')
    })

    it('returns high when either metric meets threshold (contributions)', () => {
      const metrics: ActivityMetrics = { totalContributions: 600, activeDays: 10 }
      expect(classifyActivityLevel(metrics)).toBe('high')
    })

    it('returns high when either metric meets threshold (active days)', () => {
      const metrics: ActivityMetrics = { totalContributions: 50, activeDays: 150 }
      expect(classifyActivityLevel(metrics)).toBe('high')
    })
  })
})

describe('shouldShowMotivationalCopy', () => {
  it('returns false for zero activity', () => {
    expect(shouldShowMotivationalCopy('zero')).toBe(false)
  })

  it('returns false for sparse activity', () => {
    expect(shouldShowMotivationalCopy('sparse')).toBe(false)
  })

  it('returns true for typical activity', () => {
    expect(shouldShowMotivationalCopy('typical')).toBe(true)
  })

  it('returns true for high activity', () => {
    expect(shouldShowMotivationalCopy('high')).toBe(true)
  })
})

describe('isLowActivity', () => {
  it('returns true for zero activity', () => {
    expect(isLowActivity('zero')).toBe(true)
  })

  it('returns true for sparse activity', () => {
    expect(isLowActivity('sparse')).toBe(true)
  })

  it('returns false for typical activity', () => {
    expect(isLowActivity('typical')).toBe(false)
  })

  it('returns false for high activity', () => {
    expect(isLowActivity('high')).toBe(false)
  })
})
