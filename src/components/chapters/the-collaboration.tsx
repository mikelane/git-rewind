'use client'

import {
  Chapter,
  ChapterLabel,
  ChapterTitle,
  ChapterSubtitle,
  StatCallout,
  StatRow,
  ChapterLoading,
  EmptyState,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { isBot } from '@/lib/bot-detection'

export interface CollaboratorData {
  username: string
  interactions: number
  avatarUrl?: string
}

export interface TheCollaborationData {
  pullRequestsOpened: number
  pullRequestsMerged: number
  pullRequestsReviewed: number
  issuesClosed: number
  commentsWritten: number
  uniqueCollaborators: number
  topCollaborators: CollaboratorData[]
  reviewStyle: 'thorough' | 'quick' | 'balanced'
}

interface TheCollaborationChapterProps {
  data: TheCollaborationData | null
  isLoading?: boolean
}

function getReviewStyleDescription(style: TheCollaborationData['reviewStyle']) {
  switch (style) {
    case 'thorough':
      return 'Your reviews are detailed and thoughtful—the kind that elevate the whole team.'
    case 'quick':
      return 'You keep the team moving with responsive, focused feedback.'
    case 'balanced':
      return 'You strike a balance between speed and depth in your reviews.'
  }
}

export function TheCollaborationChapter({
  data,
  isLoading,
}: TheCollaborationChapterProps) {
  if (isLoading) {
    return (
      <Chapter>
        <ChapterLoading />
      </Chapter>
    )
  }

  if (!data) {
    return (
      <Chapter>
        <EmptyState
          title="No collaboration data"
          description="Solo work is still meaningful work. Every journey has its own shape."
        />
      </Chapter>
    )
  }

  const hasReviews = data.pullRequestsReviewed > 0
  const hasCollaborators = data.topCollaborators.length > 0

  return (
    <Chapter>
      <ChapterLabel>Chapter Three</ChapterLabel>
      <ChapterTitle>The Collaboration</ChapterTitle>
      <ChapterSubtitle>
        Code is a conversation. These are the people and PRs that shaped your year.
      </ChapterSubtitle>

      {/* Primary stat - Reviews or PRs depending on what's more impressive */}
      <div className="mt-16">
        {hasReviews ? (
          <StatCallout
            value={data.pullRequestsReviewed}
            unit="reviews"
            context={
              <>
                You reviewed{' '}
                <span className="text-text-primary font-medium">
                  {data.pullRequestsReviewed}
                </span>{' '}
                pull requests. {getReviewStyleDescription(data.reviewStyle)}
              </>
            }
            delay={300}
          />
        ) : (
          <StatCallout
            value={data.pullRequestsMerged}
            unit="merged"
            context={
              <>
                You shipped{' '}
                <span className="text-text-primary font-medium">
                  {data.pullRequestsMerged}
                </span>{' '}
                pull requests this year. Every merge is progress.
              </>
            }
            delay={300}
          />
        )}
      </div>

      {/* Stats grid */}
      <div
        className={cn(
          'mt-16 grid grid-cols-2 gap-x-12 gap-y-0',
          'max-w-lg opacity-0 animate-fade-in delay-400'
        )}
      >
        <StatRow label="PRs opened" value={data.pullRequestsOpened} />
        <StatRow label="PRs merged" value={data.pullRequestsMerged} />
        <StatRow label="Reviews given" value={data.pullRequestsReviewed} />
        <StatRow label="Issues closed" value={data.issuesClosed} />
      </div>

      {/* Collaborators - highlight top collaborator */}
      {hasCollaborators && (
        <div className="mt-16 opacity-0 animate-fade-in delay-500">
          <p className="text-caption uppercase tracking-widest text-text-tertiary mb-6">
            Most Collaborated With
          </p>

          {/* Top collaborator - highlighted */}
          {data.topCollaborators[0] && (
            <div
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl mb-4',
                'bg-accent/10 border border-accent/20'
              )}
            >
              <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center">
                <span className="text-lg text-accent font-medium">
                  {data.topCollaborators[0].username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-body text-text-primary font-medium">
                  @{data.topCollaborators[0].username}
                </p>
                <p className="text-body-sm text-text-secondary">
                  Your most frequent collaborator · {data.topCollaborators[0].interactions} {data.topCollaborators[0].interactions === 1 ? 'interaction' : 'interactions'}
                </p>
              </div>
            </div>
          )}

          {/* Other collaborators */}
          {data.topCollaborators.length > 1 && (
            <div className="flex flex-wrap gap-3">
              {data.topCollaborators.slice(1, 5).map((collaborator, index) => {
                const isBotAccount = isBot(collaborator.username)

                return (
                  <div
                    key={collaborator.username}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-full',
                      'bg-bg-surface hover:bg-bg-elevated transition-colors',
                      'opacity-0 animate-fade-in'
                    )}
                    style={{ animationDelay: `${600 + index * 100}ms` }}
                  >
                    {/* Avatar placeholder */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      isBotAccount ? 'bg-border-subtle' : 'bg-accent/20'
                    )}>
                      <span className={cn(
                        'text-caption font-medium',
                        isBotAccount ? 'text-text-tertiary' : 'text-accent'
                      )}>
                        {isBotAccount ? '🤖' : collaborator.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-body-sm text-text-primary font-medium">
                        @{collaborator.username}
                      </span>
                      <span className="text-body-sm text-text-tertiary ml-2">
                        {collaborator.interactions}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Unique collaborators callout */}
      {data.uniqueCollaborators > 5 && (
        <div className="mt-12 opacity-0 animate-fade-in delay-700">
          <p className="text-body text-text-secondary">
            You worked with{' '}
            <span className="font-display text-heading text-text-primary">
              {data.uniqueCollaborators}
            </span>{' '}
            different people this year.
          </p>
        </div>
      )}

      {/* Transition to next chapter */}
      <p className="mt-20 text-body-sm text-text-tertiary italic opacity-0 animate-fade-in delay-800">
        Now let&apos;s look at when you did your best work.
      </p>
    </Chapter>
  )
}
