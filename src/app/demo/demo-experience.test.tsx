import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { TheCollaborationData } from '@/components/chapters'
import { isBot } from '@/lib/bot-detection'
import { DemoExperience } from './demo-experience'

const collaborationChapterProps = vi.hoisted(() => ({
  data: null as TheCollaborationData | null,
}))

vi.mock('@/components/chapters', async importOriginal => {
  const actual = await importOriginal<typeof import('@/components/chapters')>()
  return {
    ...actual,
    TheCollaborationChapter: ({ data }: { data: TheCollaborationData | null }) => {
      collaborationChapterProps.data = data
      return null
    },
  }
})

vi.mock('@/hooks', () => ({
  useScrollProgress: () => ({ currentChapter: 0, scrollProgress: 0 }),
  useKeyboardNavigation: () => undefined,
}))

describe('DemoExperience collaboration data', () => {
  const renderCollaborationData = (): TheCollaborationData => {
    render(<DemoExperience year={2026} />)
    return collaborationChapterProps.data as TheCollaborationData
  }

  it('It lists the five human collaborators in order', () => {
    expect(renderCollaborationData().topCollaborators).toEqual([
      { username: 'mona', interactions: 47 },
      { username: 'octocat', interactions: 34 },
      { username: 'defunkt', interactions: 28 },
      { username: 'mojombo', interactions: 19 },
      { username: 'pjhyett', interactions: 15 },
    ])
  })

  it.each(['mona', 'octocat', 'defunkt', 'mojombo', 'pjhyett'])(
    'It does not treat %s as a bot',
    username => {
      expect(isBot(username)).toBe(false)
    }
  )

  it('It reports 19 unique collaborators', () => {
    expect(renderCollaborationData().uniqueCollaborators).toBe(19)
  })
})
