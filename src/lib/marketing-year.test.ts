import { describe, it, expect } from 'vitest'
import { getMarketingYear } from './marketing-year'

describe('getMarketingYear', () => {
  it.each([
    ['2026-01-01T12:00:00', 2025],
    ['2026-01-31T23:59:59', 2025],
  ])('It returns the previous year for %s (January)', (iso, expected) => {
    expect(getMarketingYear(new Date(iso))).toBe(expected)
  })

  it.each([
    ['2026-02-01T00:00:00', 2026],
    ['2026-06-15T12:00:00', 2026],
    ['2026-11-16T12:00:00', 2026],
    ['2026-12-31T23:59:59', 2026],
  ])('It returns the current year for %s', (iso, expected) => {
    expect(getMarketingYear(new Date(iso))).toBe(expected)
  })
})
