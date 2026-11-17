import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Must list every key of theme.extend.fontSize in tailwind.config.ts;
// utils.test.ts fails if a token is missing.
const CUSTOM_FONT_SIZE_TOKENS = [
  'display-2xl',
  'display-xl',
  'display-lg',
  'display-md',
  'display-sm',
  'heading',
  'lead',
  'body',
  'body-sm',
  'caption',
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: CUSTOM_FONT_SIZE_TOKENS }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const numberFormatter = new Intl.NumberFormat('en-US')

export function formatNumber(num: number): string {
  return numberFormatter.format(num)
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
