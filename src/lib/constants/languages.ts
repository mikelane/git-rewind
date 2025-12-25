/**
 * Consolidated language colors for consistent theming across the app.
 * These colors are curated to work well on dark backgrounds.
 */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3776AB',
  Rust: '#DEA584',
  Go: '#00ADD8',
  Java: '#ED8B00',
  Ruby: '#CC342D',
  Swift: '#F05138',
  Kotlin: '#7F52FF',
  C: '#555555',
  'C++': '#F34B7D',
  'C#': '#239120',
  PHP: '#777BB4',
  Scala: '#DC322F',
  Haskell: '#5E5086',
  Elixir: '#6E4A7E',
  Clojure: '#DB5855',
  Dart: '#00B4AB',
  Shell: '#89E051',
  HTML: '#E34C26',
  CSS: '#1572B6',
  SCSS: '#CC6699',
  Vue: '#4FC08D',
  Svelte: '#FF3E00',
  Other: '#6B7280',
} as const

export type LanguageName = keyof typeof LANGUAGE_COLORS

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other
}
