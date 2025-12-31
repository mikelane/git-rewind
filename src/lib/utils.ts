import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercentage(value: number, total: number): number {
  return Math.round((value / total) * 100)
}

/**
 * Returns singular or plural form based on count
 * @example pluralize(1, 'day', 'days') // 'day'
 * @example pluralize(5, 'day', 'days') // 'days'
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}
