/**
 * Simple localStorage cache with TTL support
 */

import { cacheLogger } from './logger'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// TTLs in milliseconds
export const TTL_CURRENT_YEAR = 24 * 60 * 60 * 1000 // 24 hours
export const TTL_PAST_YEAR = 365 * 24 * 60 * 60 * 1000 // 1 year (effectively forever)

function getCacheKey(prefix: string, year: number): string {
  return `git-rewind:${prefix}:${year}`
}

export function getTTL(year: number): number {
  const currentYear = new Date().getFullYear()
  return year === currentYear ? TTL_CURRENT_YEAR : TTL_PAST_YEAR
}

export function getCached<T>(prefix: string, year: number): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const key = getCacheKey(prefix, year)
    const raw = localStorage.getItem(key)

    if (!raw) {
      return null
    }

    const entry: CacheEntry<T> = JSON.parse(raw)
    const now = Date.now()

    // Check if cache is still valid
    if (now - entry.timestamp < entry.ttl) {
      cacheLogger.debug(`HIT for ${key}, age: ${Math.round((now - entry.timestamp) / 1000)}s`)
      return entry.data
    }

    // Cache expired, remove it
    cacheLogger.debug(`EXPIRED for ${key}`)
    localStorage.removeItem(key)
    return null
  } catch (e) {
    cacheLogger.error('Error reading cache:', e)
    return null
  }
}

export function setCache<T>(prefix: string, year: number, data: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const key = getCacheKey(prefix, year)
    const ttl = getTTL(year)

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }

    localStorage.setItem(key, JSON.stringify(entry))
    cacheLogger.debug(`SET for ${key}, TTL: ${Math.round(ttl / 1000 / 60 / 60)}h`)
  } catch (e) {
    cacheLogger.error('Error writing cache:', e)
  }
}

export function clearCache(prefix?: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('git-rewind:')) {
        if (!prefix || key.includes(`:${prefix}:`)) {
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key))
    cacheLogger.debug(`CLEARED ${keysToRemove.length} entries`)
  } catch (e) {
    cacheLogger.error('Error clearing cache:', e)
  }
}

export function clearCacheForYear(prefix: string, year: number): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const key = getCacheKey(prefix, year)
    localStorage.removeItem(key)
    cacheLogger.debug(`CLEARED cache for ${key}`)
  } catch (e) {
    cacheLogger.error('Error clearing cache for year:', e)
  }
}
