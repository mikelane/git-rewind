'use client'

import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Session expired. Please try again.',
  auth_failed: 'Authentication failed. Please try again.',
}

export function ErrorMessage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  if (!error) {
    return null
  }

  return (
    <div
      className={cn(
        'mt-8 px-4 py-3 rounded-xl',
        'bg-red-500/10 border border-red-500/20',
        'text-body-sm text-red-400'
      )}
      role="alert"
    >
      {ERROR_MESSAGES[error] || 'Something went wrong. Please try again.'}
    </div>
  )
}
