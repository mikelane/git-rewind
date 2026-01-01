/**
 * Activity-level-aware copy for chapter components.
 *
 * The goal is honest, factual copy that doesn't imply progress or momentum
 * without evidence. Low/zero activity should receive neutral observations,
 * not hollow encouragement.
 */

import { type ActivityLevel } from './activity-level'

/**
 * Copy variants for TheRhythm chapter subtitle.
 */
export function getRhythmSubtitle(level: ActivityLevel): string {
  switch (level) {
    case 'zero':
      return 'Your contribution activity for this period.'
    case 'sparse':
      return 'Your contribution activity for this period.'
    case 'typical':
    case 'high':
      return 'Code is a practice. These are the days you showed up.'
  }
}

/**
 * Copy variants for TheRhythm active days context.
 */
export function getRhythmActiveContext(
  level: ActivityLevel,
  consistencyPercentage: number
): string | null {
  switch (level) {
    case 'zero':
      return null
    case 'sparse':
      return `Active on ${consistencyPercentage}% of the year.`
    case 'typical':
    case 'high':
      return `Active on ${consistencyPercentage}% of the year. Consistency compounds.`
  }
}

/**
 * Copy variants for TheRhythm chapter transition.
 */
export function getRhythmTransition(level: ActivityLevel): string | null {
  switch (level) {
    case 'zero':
      return null
    case 'sparse':
      return null
    case 'typical':
    case 'high':
      return "Showing up is just the start. Let's see what you built."
  }
}

/**
 * Copy variants for YourCraft empty state description.
 */
export function getCraftEmptyDescription(_level: ActivityLevel): string {
  // Always neutral for empty state - no "keep building" encouragement
  return 'No code contributions found for this period.'
}

/**
 * Copy variants for YourCraft subtitle.
 */
export function getCraftSubtitle(level: ActivityLevel): string {
  switch (level) {
    case 'zero':
    case 'sparse':
      return 'The languages used in your contributions.'
    case 'typical':
    case 'high':
      return 'The tools you reached for. The languages that shaped your thinking this year.'
  }
}

/**
 * Copy variants for YourCraft primary language context.
 */
export function getCraftLanguageContext(
  level: ActivityLevel,
  language: string
): string {
  switch (level) {
    case 'zero':
    case 'sparse':
      return `${language} was your most used language.`
    case 'typical':
    case 'high':
      return `${language} was your primary language this year — the foundation of your work.`
  }
}

/**
 * Copy variants for YourCraft chapter transition.
 */
export function getCraftTransition(level: ActivityLevel): string | null {
  switch (level) {
    case 'zero':
    case 'sparse':
      return null
    case 'typical':
    case 'high':
      return "That's what you built. But you didn't build it alone."
  }
}

/**
 * Copy variants for TheCollaboration empty state description.
 */
export function getCollaborationEmptyDescription(_level: ActivityLevel): string {
  // Neutral observation, not "solo work is meaningful work"
  return 'No collaboration data found for this period.'
}

/**
 * Copy variants for TheCollaboration subtitle.
 */
export function getCollaborationSubtitle(level: ActivityLevel): string {
  switch (level) {
    case 'zero':
    case 'sparse':
      return 'Your pull request and collaboration activity.'
    case 'typical':
    case 'high':
      return 'Code is a conversation. These are the people and PRs that shaped your year.'
  }
}

/**
 * Copy variants for TheCollaboration merged PRs context.
 */
export function getCollaborationMergedContext(
  level: ActivityLevel,
  count: number
): string {
  switch (level) {
    case 'zero':
    case 'sparse':
      return `You shipped ${count} pull ${count === 1 ? 'request' : 'requests'} this year.`
    case 'typical':
    case 'high':
      return `You shipped ${count} pull ${count === 1 ? 'request' : 'requests'} this year. Every merge is progress.`
  }
}

/**
 * Copy variants for TheCollaboration chapter transition.
 */
export function getCollaborationTransition(level: ActivityLevel): string | null {
  switch (level) {
    case 'zero':
    case 'sparse':
      return null
    case 'typical':
    case 'high':
      return "Now let's look at when you did your best work."
  }
}

/**
 * Copy variants for PeakMoments empty state description.
 */
export function getPeakMomentsEmptyDescription(_level: ActivityLevel): string {
  // Neutral, not "your peak moments are ahead of you"
  return 'No peak activity data found for this period.'
}

/**
 * Copy variants for PeakMoments subtitle.
 */
export function getPeakMomentsSubtitle(level: ActivityLevel): string {
  switch (level) {
    case 'zero':
    case 'sparse':
      return 'Your most active periods.'
    case 'typical':
    case 'high':
      return 'The days you were in flow. When everything clicked.'
  }
}

/**
 * Copy variants for PeakMoments chapter transition.
 */
export function getPeakMomentsTransition(level: ActivityLevel): string | null {
  switch (level) {
    case 'zero':
    case 'sparse':
      return null
    case 'typical':
    case 'high':
      return "That was your year. Let's bring it all together."
  }
}

/**
 * Copy variants for Epilogue closing message.
 */
export function getEpilogueClosingMessage(level: ActivityLevel): string {
  switch (level) {
    case 'zero':
      return 'Your activity for this period.'
    case 'sparse':
      return 'Your activity for this period.'
    case 'typical':
    case 'high':
      return "This wasn't about the numbers."
  }
}

/**
 * Copy variants for Epilogue closing context.
 */
export function getEpilogueClosingContext(
  level: ActivityLevel,
  activeDays: number
): string | null {
  switch (level) {
    case 'zero':
      return null
    case 'sparse':
      return `You were active on ${activeDays} ${activeDays === 1 ? 'day' : 'days'} this year.`
    case 'typical':
    case 'high':
      return `It was about showing up — ${activeDays} times this year. Every commit moved something forward.`
  }
}
