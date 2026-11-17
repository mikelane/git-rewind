import { cn } from '@/lib/utils'
import { LOGIN_PATH } from '@/lib/year-stats-fetch'

const LOAD_ERROR_MESSAGE = "We couldn't load your GitHub data. This is usually temporary."

function retryFailedMessage(failedRetries: number): string {
  const attemptLabel = failedRetries > 1 ? ` (attempt ${failedRetries})` : ''
  return `Still couldn't load your GitHub data${attemptLabel}. Try again in a moment.`
}

interface RewindErrorProps {
  failedRetries: number
  retrying: boolean
  onRetry: () => void
}

export function RewindError({ failedRetries, retrying, onRetry }: RewindErrorProps) {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-display-sm text-text-primary mb-4">
        Something went wrong
      </h1>
      <p role="status" className="text-body text-text-secondary mb-8 max-w-md">
        {failedRetries > 0 ? retryFailedMessage(failedRetries) : LOAD_ERROR_MESSAGE}
      </p>
      <button
        type="button"
        onClick={onRetry}
        aria-disabled={retrying}
        className={cn(
          'px-6 py-3 rounded-xl',
          'bg-accent text-text-inverse font-medium',
          'hover:bg-accent-hover transition-colors',
          'aria-disabled:cursor-not-allowed aria-disabled:opacity-70'
        )}
      >
        Try again
      </button>
      <a
        href={LOGIN_PATH}
        className="mt-4 inline-flex min-h-11 items-center text-body text-text-secondary underline hover:text-text-primary"
      >
        Sign in again
      </a>
    </main>
  )
}
