import { cn } from '@/lib/utils'

interface YearSelectorProps {
  years: readonly number[]
  selectedYear: number
  loading: boolean
  refreshing: boolean
  loadingYears: ReadonlySet<number>
  cachedYears: ReadonlySet<number>
  onSelectYear: (year: number) => void
  onRefresh: () => void
}

export function YearSelector({
  years,
  selectedYear,
  loading,
  refreshing,
  loadingYears,
  cachedYears,
  onSelectYear,
  onRefresh,
}: YearSelectorProps) {
  return (
    <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] z-50 flex items-center gap-2">
      <span className="text-caption text-text-tertiary mr-1 hidden sm:inline">Viewing</span>
      {years.map((year) => {
        const isLoading = loadingYears.has(year)
        const isCached = cachedYears.has(year)

        return (
          <button
            key={year}
            onClick={() => onSelectYear(year)}
            disabled={loading && selectedYear === year}
            className="group/pill inline-flex min-h-11 min-w-11 items-center justify-center"
            aria-label={`View ${year}${isLoading ? ' (loading)' : ''}`}
          >
            <span
              className={cn(
                'px-3 py-1.5 text-caption font-medium rounded-full transition-all duration-200',
                selectedYear === year
                  ? 'bg-accent text-text-inverse'
                  : isCached
                    ? 'bg-bg-surface text-text-secondary group-hover/pill:bg-bg-elevated group-hover/pill:text-text-primary'
                    : 'bg-bg-surface/50 text-text-tertiary group-hover/pill:bg-bg-elevated group-hover/pill:text-text-primary',
                isLoading && 'animate-pulse',
                loading && selectedYear === year && 'opacity-70'
              )}
            >
              {year}
            </span>
          </button>
        )
      })}
      <button
        onClick={onRefresh}
        disabled={loading || refreshing}
        className={cn(
          'group/refresh -ml-2 inline-flex min-h-11 min-w-11 items-center justify-center',
          'disabled:cursor-not-allowed'
        )}
        aria-label="Refresh stats"
        title="Refresh stats (bypass cache)"
      >
        <span
          className={cn(
            'p-1.5 rounded-full transition-all duration-200',
            'bg-bg-surface/50 text-text-tertiary',
            'group-hover/refresh:bg-bg-elevated group-hover/refresh:text-text-secondary',
            'group-disabled/refresh:opacity-50'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(refreshing && 'animate-spin')}
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </span>
      </button>
    </div>
  )
}
