'use client'

import { cn } from '@/lib/utils'

export interface LanguageData {
  name: string
  percentage: number
  color: string
}

// Curated colors that work well on dark backgrounds
export const languageColors: Record<string, string> = {
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
  Shell: '#89E051',
  HTML: '#E34C26',
  CSS: '#1572B6',
  SCSS: '#CC6699',
  Vue: '#4FC08D',
  Svelte: '#FF3E00',
  Other: '#6B7280',
}

interface LanguageBarProps {
  languages: LanguageData[]
  className?: string
  /** Show labels below the bar */
  showLabels?: boolean
}

export function LanguageBar({
  languages,
  className,
  showLabels = true,
}: LanguageBarProps) {
  // Sort by percentage descending
  const sorted = [...languages].sort((a, b) => b.percentage - a.percentage)

  return (
    <div className={cn('w-full', className)}>
      {/* The bar */}
      <div
        className="h-3 rounded-full overflow-hidden flex opacity-0 animate-scale-in"
        role="img"
        aria-label={`Language breakdown: ${sorted.map((l) => `${l.name} ${l.percentage}%`).join(', ')}`}
      >
        {sorted.map((lang, index) => (
          <div
            key={lang.name}
            className="h-full transition-all duration-500 ease-out-expo first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${lang.percentage}%`,
              backgroundColor: lang.color,
              transitionDelay: `${index * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Labels - primary languages prominent, minor languages collapsed */}
      {showLabels && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6">
          {sorted.map((lang, index) => {
            // Primary languages (top 2 or >15%) get full treatment
            const isPrimary = index < 2 || lang.percentage >= 15

            return (
              <div
                key={lang.name}
                className={cn(
                  'flex items-center gap-2 opacity-0 animate-fade-in',
                  !isPrimary && 'opacity-60'
                )}
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                <span
                  className={cn('rounded-full', isPrimary ? 'w-3 h-3' : 'w-2 h-2')}
                  style={{ backgroundColor: lang.color }}
                />
                <span className={cn(
                  isPrimary ? 'text-body-sm text-text-primary' : 'text-caption text-text-secondary'
                )}>
                  {lang.name}
                </span>
                <span className={cn(
                  isPrimary ? 'text-body-sm text-text-tertiary' : 'text-caption text-text-tertiary'
                )}>
                  {lang.percentage}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
