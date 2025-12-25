/**
 * Formats an array of day names into grammatically correct English.
 *
 * Examples:
 * - ["Monday"] -> "Monday"
 * - ["Monday", "Wednesday"] -> "Monday and Wednesday"
 * - ["Monday", "Wednesday", "Friday"] -> "Monday, Wednesday, and Friday"
 */
export function formatFavoriteDays(days: string[] | null | undefined): string {
  if (!days || days.length === 0) {
    return ''
  }

  if (days.length === 1) {
    return days[0]
  }

  if (days.length === 2) {
    return `${days[0]} and ${days[1]}`
  }

  // Oxford comma style for 3+ items
  const allButLast = days.slice(0, -1)
  const last = days[days.length - 1]
  return `${allButLast.join(', ')}, and ${last}`
}
