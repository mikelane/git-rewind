/**
 * Tests for Epilogue chapter component
 * Specifically verifying branding removal (Issue #10)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EpilogueChapter, type EpilogueData } from './epilogue'

const mockEpilogueData: EpilogueData = {
  year: 2024,
  username: 'testuser',
  totalContributions: 1234,
  activeDays: 200,
  topLanguage: 'TypeScript',
  pullRequestsMerged: 42,
  longestStreak: 30,
}

describe('EpilogueChapter', () => {
  describe('branding removal (Issue #10)', () => {
    it('does not display "Powered by" text', () => {
      render(<EpilogueChapter data={mockEpilogueData} />)

      expect(screen.queryByText(/powered by/i)).toBeNull()
    })

    it('does not display language branding badge', () => {
      render(<EpilogueChapter data={mockEpilogueData} />)

      // The badge previously showed "Powered by TypeScript"
      expect(screen.queryByText(/powered by typescript/i)).toBeNull()
    })
  })

  describe('core content still renders', () => {
    it('displays the year', () => {
      render(<EpilogueChapter data={mockEpilogueData} />)

      expect(screen.getByText('2024')).toBeDefined()
    })

    it('displays the username', () => {
      render(<EpilogueChapter data={mockEpilogueData} />)

      expect(screen.getByText('@testuser')).toBeDefined()
    })

    it('displays total contributions', () => {
      render(<EpilogueChapter data={mockEpilogueData} />)

      expect(screen.getByText('1,234')).toBeDefined()
    })

    it('displays the closing message', () => {
      render(<EpilogueChapter data={mockEpilogueData} />)

      expect(screen.getByText(/This wasn't about the numbers/)).toBeDefined()
    })
  })
})
