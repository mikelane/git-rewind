'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { shareHighlight, type Highlight } from '@/lib/highlight-share'

type ShareState = 'idle' | 'sharing' | 'shared' | 'copied'

interface ShareButtonProps {
  highlight: Highlight
  className?: string
  variant?: 'compact' | 'full'
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function ShareButton({
  highlight,
  className,
  variant = 'compact',
}: ShareButtonProps) {
  const [shareState, setShareState] = useState<ShareState>('idle')

  const handleShare = useCallback(async () => {
    setShareState('sharing')
    const result = await shareHighlight(highlight)
    if (result.success) {
      setShareState(result.method === 'clipboard' ? 'copied' : 'shared')
      setTimeout(() => setShareState('idle'), 2000)
    } else {
      setShareState('idle')
    }
  }, [highlight])

  const isCompact = variant === 'compact'

  const buttonText = {
    idle: 'Share',
    sharing: 'Sharing...',
    shared: 'Shared!',
    copied: 'Copied!',
  }[shareState]

  const ariaLabel = {
    idle: 'Share this highlight',
    sharing: 'Sharing...',
    shared: 'Shared!',
    copied: 'Copied to clipboard!',
  }[shareState]

  const isSuccess = shareState === 'shared' || shareState === 'copied'

  return (
    <button
      onClick={handleShare}
      disabled={shareState === 'sharing'}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-lg transition-all duration-200',
        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        isCompact ? 'p-2' : 'px-4 py-2',
        isSuccess
          ? 'bg-green-600/20 text-green-400 border border-green-600/30'
          : 'bg-bg-surface/50 text-text-secondary hover:bg-bg-elevated hover:text-text-primary border border-transparent',
        shareState === 'sharing' && 'opacity-70 cursor-wait',
        className
      )}
    >
      {isSuccess ? (
        <CheckIcon className="w-4 h-4" />
      ) : (
        <ShareIcon className="w-4 h-4" />
      )}
      {!isCompact && <span className="text-body-sm font-medium">{buttonText}</span>}
    </button>
  )
}
