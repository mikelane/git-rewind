'use client'

import {
  Chapter,
  ChapterLabel,
  ChapterTitle,
  ChapterSubtitle,
  StatCallout,
  LanguageBar,
  type LanguageData,
  ChapterLoading,
  EmptyState,
  ShareButton,
} from '@/components/ui'
import { HighlightType, type LanguageHighlight } from '@/lib/highlight-share'

export interface YourCraftData {
  primaryLanguage: string
  primaryLanguagePercentage: number
  languages: LanguageData[]
  topRepository?: string
}

interface YourCraftChapterProps {
  data: YourCraftData | null
  isLoading?: boolean
  username?: string
  year?: number
}

export function YourCraftChapter({ data, isLoading, username, year }: YourCraftChapterProps) {
  const languageHighlight: LanguageHighlight | null = data && username && year ? {
    type: HighlightType.Language,
    username,
    year,
    language: data.primaryLanguage,
    percentage: data.primaryLanguagePercentage,
  } : null

  if (isLoading) {
    return (
      <Chapter>
        <ChapterLoading />
      </Chapter>
    )
  }

  if (!data || data.languages.length === 0) {
    return (
      <Chapter>
        <EmptyState
          title="No language data yet"
          description="We couldn't find any code contributions for this period. Keep building — your story is just beginning."
        />
      </Chapter>
    )
  }

  return (
    <Chapter>
      {/* Chapter identifier */}
      <ChapterLabel>Chapter Two</ChapterLabel>

      {/* Main title */}
      <ChapterTitle>Your Craft</ChapterTitle>

      {/* Contextual subtitle */}
      <ChapterSubtitle>
        The tools you reached for. The languages that shaped your thinking this
        year.
      </ChapterSubtitle>

      {/* Primary stat callout */}
      <div className="mt-16">
        <StatCallout
          value={data.primaryLanguagePercentage}
          unit="%"
          context={
            <>
              <span className="text-text-primary font-medium">
                {data.primaryLanguage}
              </span>{' '}
              was your primary language this year — the foundation of your work.
            </>
          }
          delay={300}
        />
        {languageHighlight && (
          <div className="mt-4 opacity-0 animate-fade-in delay-400">
            <ShareButton highlight={languageHighlight} />
          </div>
        )}
      </div>

      {/* Language breakdown bar */}
      <div className="mt-20">
        <p className="text-caption uppercase tracking-widest text-text-tertiary mb-6 opacity-0 animate-fade-in delay-400">
          Language Distribution
        </p>
        <LanguageBar languages={data.languages} />
      </div>

      {/* Secondary narrative */}
      {data.topRepository && (
        <div className="mt-16 opacity-0 animate-fade-in delay-500">
          <p className="text-body text-text-secondary">
            Most of your {data.primaryLanguage} work happened in{' '}
            <span className="text-text-primary font-medium font-mono text-body-sm">
              {data.topRepository}
            </span>
            .
          </p>
        </div>
      )}

      {/* Transition to next chapter */}
      <p className="mt-20 text-body-sm text-text-tertiary italic opacity-0 animate-fade-in delay-700">
        That&apos;s what you built. But you didn&apos;t build it alone.
      </p>
    </Chapter>
  )
}
