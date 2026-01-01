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
import { type ActivityLevel } from '@/lib/activity-level'
import {
  getCraftSubtitle,
  getCraftLanguageContext,
  getCraftTransition,
  getCraftEmptyDescription,
} from '@/lib/chapter-copy'

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
  activityLevel?: ActivityLevel
}

export function YourCraftChapter({
  data,
  isLoading,
  username,
  year,
  activityLevel = 'typical',
}: YourCraftChapterProps) {
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
          description={getCraftEmptyDescription(activityLevel)}
        />
      </Chapter>
    )
  }

  const transition = getCraftTransition(activityLevel)

  return (
    <Chapter>
      {/* Chapter identifier */}
      <ChapterLabel>Chapter Two</ChapterLabel>

      {/* Main title */}
      <ChapterTitle>Your Craft</ChapterTitle>

      {/* Contextual subtitle */}
      <ChapterSubtitle>
        {getCraftSubtitle(activityLevel)}
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
              {getCraftLanguageContext(activityLevel, data.primaryLanguage).replace(`${data.primaryLanguage} `, '')}
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

      {/* Transition to next chapter - only show for typical/high activity */}
      {transition && (
        <p className="mt-20 text-body-sm text-text-tertiary italic opacity-0 animate-fade-in delay-700">
          {transition}
        </p>
      )}
    </Chapter>
  )
}
