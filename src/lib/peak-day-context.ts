/**
 * Returns a contextual description of a peak contribution day.
 * Handles invalid dates gracefully by returning a generic fallback.
 */
export function getPeakDayContext(dateStr: string): string {
  // Parse YYYY-MM-DD format dates as local time by appending T00:00:00
  // This prevents timezone shifts that occur with Date.parse('YYYY-MM-DD')
  const date = new Date(dateStr + 'T00:00:00')

  // Validate the date - isNaN check catches invalid dates
  if (isNaN(date.getTime())) {
    return 'Peak day'
  }

  const dayOfWeek = date.getDay()
  const month = date.getMonth()
  const dayOfMonth = date.getDate()

  // Weekend check
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]

  // Time of year context
  if (month === 11 && dayOfMonth >= 15) {
    return 'End-of-year sprint'
  }
  if (month === 0 && dayOfMonth <= 15) {
    return 'New year momentum'
  }
  if (isWeekend) {
    return `${dayName} deep work`
  }
  if (dayOfWeek === 1) {
    return 'Monday motivation'
  }
  if (dayOfWeek === 5) {
    return 'Friday push'
  }

  return 'Mid-week focus'
}
