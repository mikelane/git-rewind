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

      const heroCard = screen.getByText(/Your most frequent collaborator/).parentElement
      expect(heroCard?.textContent).toContain('@alice')
      expect(heroCard?.textContent).toContain('30 interactions')
    })

    it('renders humans as chips when a bot sits between them', () => {
      const data = createData([
        { username: 'alice', interactions: 30 },
        { username: 'dependabot', interactions: 20 },
        { username: 'bob', interactions: 10 },
      ])

      render(<TheCollaborationChapter data={data} />)

      const heroCard = screen.getByText(/Your most frequent collaborator/).parentElement
      expect(heroCard?.textContent).toContain('@alice')
      expect(screen.getByText('@bob')).toBeTruthy()
      expect(screen.queryByText('@dependabot')).toBeNull()
    })

    it('renders the hero plus four chips after filtering a leading bot', () => {
      const data = createData([
        { username: 'dependabot', interactions: 90 },
        { username: 'h1', interactions: 60 },
        { username: 'h2', interactions: 50 },
        { username: 'h3', interactions: 40 },
        { username: 'h4', interactions: 30 },
        { username: 'h5', interactions: 20 },
        { username: 'h6', interactions: 10 },
      ])

      render(<TheCollaborationChapter data={data} />)

      const heroCard = screen.getByText(/Your most frequent collaborator/).parentElement
      expect(heroCard?.textContent).toContain('@h1')
      expect(screen.getByText('@h2')).toBeTruthy()
      expect(screen.getByText('@h3')).toBeTruthy()
      expect(screen.getByText('@h4')).toBeTruthy()
      expect(screen.getByText('@h5')).toBeTruthy()
      expect(screen.queryByText('@h6')).toBeNull()
      expect(screen.queryByText('@dependabot')).toBeNull()
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
