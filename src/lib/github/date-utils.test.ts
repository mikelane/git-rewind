import { describe, it, expect } from 'vitest'
import { createMonthDateRange, createYearDateRange } from './date-utils'

describe('createYearDateRange', () => {
  it('returns the first moment of January 1st as the start date', () => {
    const result = createYearDateRange(2024)
    expect(result.from).toBe('2024-01-01T00:00:00.000Z')
  })

  it('returns the last moment of December 31st as the end date', () => {
    const result = createYearDateRange(2024)
    expect(result.to).toBe('2024-12-31T23:59:59.000Z')
  })
})

describe('createMonthDateRange', () => {
  it('returns the first moment of the month as the start date', () => {
    const result = createMonthDateRange(2024, 0) // January
    expect(result.since).toBe('2024-01-01T00:00:00.000Z')
  })

  it('returns the last moment of January 31st for January (31-day month)', () => {
    const result = createMonthDateRange(2024, 0) // January
    expect(result.until).toBe('2024-01-31T23:59:59.000Z')
  })

  it('returns the last moment of February 29th for February in a leap year', () => {
    const result = createMonthDateRange(2024, 1) // February 2024 (leap year)
    expect(result.until).toBe('2024-02-29T23:59:59.000Z')
  })

  it('returns the last moment of February 28th for February in a non-leap year', () => {
    const result = createMonthDateRange(2023, 1) // February 2023 (non-leap year)
    expect(result.until).toBe('2023-02-28T23:59:59.000Z')
  })

  it('returns the last moment of April 30th for April (30-day month)', () => {
    const result = createMonthDateRange(2024, 3) // April
    expect(result.until).toBe('2024-04-30T23:59:59.000Z')
  })

  it('returns the last moment of December 31st for December', () => {
    const result = createMonthDateRange(2024, 11) // December
    expect(result.until).toBe('2024-12-31T23:59:59.000Z')
  })
})
