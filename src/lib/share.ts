/**
 * Share a Highlight functionality
 * Uses Web Share API when available, falls back to clipboard copy
 */

import type { EpilogueData } from '@/components/chapters/epilogue'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gitrewind.dev'

export interface ShareResult {
  method: 'webshare' | 'clipboard'
  success: boolean
}

/**
 * Generate shareable text content from epilogue data
 */
export function generateShareText(data: EpilogueData): string {
  return `My ${data.year} Git Rewind:

@${data.username}
${data.totalContributions.toLocaleString()} contributions
${data.activeDays} active days
${data.longestStreak} day streak
Powered by ${data.topLanguage}

Create yours at ${APP_URL}`
}

/**
 * Check if Web Share API is available and usable
 */
export function canUseWebShare(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }
  return typeof navigator.share === 'function' && typeof navigator.canShare === 'function'
}

/**
 * Copy text to clipboard
 * Returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Share highlight using Web Share API if available, otherwise copy to clipboard
 */
export async function shareHighlight(data: EpilogueData): Promise<ShareResult> {
  const shareText = generateShareText(data)

  if (canUseWebShare()) {
    try {
      await navigator.share({
        title: `Git Rewind ${data.year}`,
        text: shareText,
        url: APP_URL,
      })
      return { method: 'webshare', success: true }
    } catch {
      // User cancelled or share failed, fall back to clipboard
      const copied = await copyToClipboard(shareText)
      return { method: 'clipboard', success: copied }
    }
  }

  // Web Share not available, use clipboard
  const copied = await copyToClipboard(shareText)
  return { method: 'clipboard', success: copied }
}
