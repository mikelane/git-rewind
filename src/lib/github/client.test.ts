import { describe, it, expect } from 'vitest'
import { createYearDateRange, createMonthDateRange } from './date-utils'

describe('date-utils', () => {
  describe('createYearDateRange', () => {
    it('creates UTC dates that stay in the specified year', () => {
      const { from, to } = createYearDateRange(2024)

      expect(from).toBe('2024-01-01T00:00:00.000Z')
      expect(to).toBe('2024-12-31T23:59:59.000Z')
    })

    it('creates correct range for year 2023', () => {
      const { from, to } = createYearDateRange(2023)

      expect(from.startsWith('2023-01-01')).toBe(true)
      expect(to.startsWith('2023-12-31')).toBe(true)
    })

    it('end date does not cross into next year regardless of timezone', () => {
      const { to } = createYearDateRange(2024)
      const endDate = new Date(to)

      expect(endDate.getUTCFullYear()).toBe(2024)
      expect(endDate.getUTCMonth()).toBe(11) // December (0-indexed)
      expect(endDate.getUTCDate()).toBe(31)
    })
  })

  describe('createMonthDateRange', () => {
    it('creates UTC dates for January that stay in January', () => {
      const { since, until } = createMonthDateRange(2024, 0)

      expect(since).toBe('2024-01-01T00:00:00.000Z')
      expect(until).toBe('2024-01-31T23:59:59.000Z')
    })

    it('creates correct range for February in leap year', () => {
      const { since, until } = createMonthDateRange(2024, 1)
      const endDate = new Date(until)

      expect(since.startsWith('2024-02-01')).toBe(true)
      expect(endDate.getUTCDate()).toBe(29) // Leap year
    })

    it('creates correct range for December', () => {
      const { since, until } = createMonthDateRange(2024, 11)

      expect(since.startsWith('2024-12-01')).toBe(true)
      expect(until.startsWith('2024-12-31')).toBe(true)
    })

    it('end date does not cross into next month regardless of timezone', () => {
      const { until } = createMonthDateRange(2024, 5) // June
      const endDate = new Date(until)

      expect(endDate.getUTCMonth()).toBe(5) // June
      expect(endDate.getUTCDate()).toBe(30) // June has 30 days
    })
  })
})
