/**
 * Single Highlight Sharing
 * Allows users to share individual stats/cards rather than the full rewind
 * Text is neutral and factual to avoid being braggy
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gitrewind.dev'

export const HighlightType = {
  Streak: 'streak',
  PeakDay: 'peak-day',
  Language: 'language',
  ActiveDays: 'active-days',
  Contributions: 'contributions',
} as const

export type HighlightTypeValue = (typeof HighlightType)[keyof typeof HighlightType]

interface BaseHighlight {
  username: string
  year: number
}

export interface StreakHighlight extends BaseHighlight {
  type: typeof HighlightType.Streak
  longestStreak: number
}

export interface PeakDayHighlight extends BaseHighlight {
  type: typeof HighlightType.PeakDay
  date: string
  commits: number
}

export interface LanguageHighlight extends BaseHighlight {
  type: typeof HighlightType.Language
  language: string
  percentage: number
}

export interface ActiveDaysHighlight extends BaseHighlight {
  type: typeof HighlightType.ActiveDays
  activeDays: number
  totalDays: number
}

export interface ContributionsHighlight extends BaseHighlight {
  type: typeof HighlightType.Contributions
  totalContributions: number
}

export type Highlight =
  | StreakHighlight
  | PeakDayHighlight
  | LanguageHighlight
  | ActiveDaysHighlight
  | ContributionsHighlight

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

export interface ShareResult {
  method: 'webshare' | 'clipboard'
  success: boolean
}

export function canUseWebShare(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }
  return typeof navigator.share === 'function' && typeof navigator.canShare === 'function'
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function shareHighlight(highlight: Highlight): Promise<ShareResult> {
  const shareText = generateHighlightShareText(highlight)

  if (canUseWebShare()) {
    try {
      await navigator.share({
        title: `Git Rewind ${highlight.year}`,
        text: shareText,
        url: APP_URL,
      })
      return { method: 'webshare', success: true }
    } catch {
      const copied = await copyToClipboard(shareText)
      return { method: 'clipboard', success: copied }
    }
  }

  const copied = await copyToClipboard(shareText)
  return { method: 'clipboard', success: copied }
}

export function generateHighlightShareText(highlight: Highlight): string {
  const { username, year } = highlight

  switch (highlight.type) {
    case HighlightType.Streak: {
      const days = pluralize(highlight.longestStreak, 'day', 'days')
      return `${highlight.longestStreak} ${days} streak

@${username}'s ${year} Git Rewind

${APP_URL}`
    }

    case HighlightType.PeakDay: {
      const commits = pluralize(highlight.commits, 'commit', 'commits')
      return `${highlight.commits} ${commits} on ${highlight.date}

@${username}'s ${year} Git Rewind

${APP_URL}`
    }

    case HighlightType.Language: {
      return `${highlight.percentage}% ${highlight.language}

@${username}'s ${year} Git Rewind

${APP_URL}`
    }

    case HighlightType.ActiveDays: {
      const days = pluralize(highlight.activeDays, 'day', 'days')
      return `${highlight.activeDays} active ${days}

@${username}'s ${year} Git Rewind

${APP_URL}`
    }

    case HighlightType.Contributions: {
      const formatted = highlight.totalContributions.toLocaleString()
      const contrib = pluralize(highlight.totalContributions, 'contribution', 'contributions')
      return `${formatted} ${contrib}

@${username}'s ${year} Git Rewind

${APP_URL}`
    }
  }
}
