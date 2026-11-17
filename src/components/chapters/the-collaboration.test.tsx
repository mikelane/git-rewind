import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TheCollaborationChapter, type TheCollaborationData } from './the-collaboration'

describe('TheCollaborationChapter', () => {
  const createData = (
    topCollaborators: TheCollaborationData['topCollaborators']
  ): TheCollaborationData => ({
    pullRequestsOpened: 10,
    pullRequestsMerged: 8,
    pullRequestsReviewed: 5,
    issuesClosed: 3,
    commentsWritten: 20,
    uniqueCollaborators: topCollaborators.length,
    topCollaborators,
    reviewStyle: 'balanced',
  })

  describe('bot filtering', () => {
    it('renders the first human as the hero when a bot is listed first', () => {
      const data = createData([
        { username: 'dependabot', interactions: 50 },
        { username: 'alice', interactions: 30 },
        { username: 'bob', interactions: 10 },
      ])

      render(<TheCollaborationChapter data={data} />)

      expect(screen.getByText('Your most frequent collaborator · 30 interactions')).toBeTruthy()
      expect(screen.getByText('@alice')).toBeTruthy()
    })

    it('renders only humans as chips', () => {
      const data = createData([
        { username: 'dependabot', interactions: 50 },
        { username: 'alice', interactions: 30 },
        { username: 'bob', interactions: 10 },
      ])

      render(<TheCollaborationChapter data={data} />)

      expect(screen.getByText('@bob')).toBeTruthy()
    })

    it.each(['dependabot', 'hubot', 'renovate[bot]'])('does not render %s anywhere', bot => {
      const data = createData([
        { username: bot, interactions: 50 },
        { username: 'alice', interactions: 30 },
        { username: 'bob', interactions: 10 },
      ])

      render(<TheCollaborationChapter data={data} />)

      expect(screen.queryByText(`@${bot}`)).toBeNull()
    })

    it('omits the collaborator section when every entry is a bot', () => {
      const data = createData([
        { username: 'dependabot', interactions: 50 },
        { username: 'hubot', interactions: 30 },
      ])

      render(<TheCollaborationChapter data={data} />)

      expect(screen.queryByText('Most Collaborated With')).toBeNull()
    })

    it('renders the collaborator section for human-only lists', () => {
      const data = createData([{ username: 'alice', interactions: 30 }])

      render(<TheCollaborationChapter data={data} />)

      expect(screen.getByText('Most Collaborated With')).toBeTruthy()
    })
  })
})
