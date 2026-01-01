/**
 * Tests for Epilogue chapter component
 * Includes branding removal tests (Issue #10) and methodology modal tests (Issue #11)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EpilogueChapter, type EpilogueData } from './epilogue'

vi.mock('@/lib/share', () => ({
  shareHighlight: vi.fn().mockResolvedValue({ success: true, method: 'clipboard' }),
}))

describe('EpilogueChapter', () => {
  const createData = (overrides: Partial<EpilogueData> = {}): EpilogueData => ({
    year: 2024,
    username: 'testuser',
    totalContributions: 1000,
    activeDays: 200,
    topLanguage: 'TypeScript',
    pullRequestsMerged: 50,
    longestStreak: 14,
    ...overrides,
  })

  describe('branding removal (Issue #10)', () => {
    it('does not display "Powered by" text', () => {
      render(<EpilogueChapter data={createData()} />)

      expect(screen.queryByText(/powered by/i)).toBeNull()
    })

    it('does not display language branding badge', () => {
      render(<EpilogueChapter data={createData()} />)

      // The badge previously showed "Powered by TypeScript"
      expect(screen.queryByText(/powered by typescript/i)).toBeNull()
    })
  })

  describe('loading state', () => {
    it('renders skeleton when isLoading is true', () => {
      render(<EpilogueChapter data={null} isLoading />)
      expect(screen.getByTestId('epilogue-skeleton')).toBeInTheDocument()
    })

    it('renders skeleton when data is null', () => {
      render(<EpilogueChapter data={null} />)
      expect(screen.getByTestId('epilogue-skeleton')).toBeInTheDocument()
    })
  })

  describe('content rendering', () => {
    it('displays the closing message', () => {
      render(<EpilogueChapter data={createData()} />)
      expect(screen.getByText("This wasn't about the numbers.")).toBeInTheDocument()
    })

    it('displays active days in the message', () => {
      render(<EpilogueChapter data={createData({ activeDays: 200 })} />)
      expect(screen.getByText(/200 times this year/)).toBeInTheDocument()
    })

    it('displays the year', () => {
      render(<EpilogueChapter data={createData({ year: 2024 })} />)
      expect(screen.getByText('2024')).toBeInTheDocument()
    })

    it('displays the username', () => {
      render(<EpilogueChapter data={createData({ username: 'testuser' })} />)
      expect(screen.getByText('@testuser')).toBeInTheDocument()
    })

    it('displays stats grid with correct values', () => {
      render(<EpilogueChapter data={createData({
        totalContributions: 1000,
        activeDays: 200,
        pullRequestsMerged: 50,
        longestStreak: 14,
      })} />)
      expect(screen.getByText('1,000')).toBeInTheDocument()
      expect(screen.getByText('200')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('14')).toBeInTheDocument()
    })
  })

  describe('methodology link in footer', () => {
    it('displays "How this is calculated" link in footer', () => {
      render(<EpilogueChapter data={createData()} />)
      expect(screen.getByText('How this is calculated')).toBeInTheDocument()
    })

    it('opens methodology modal when link is clicked', () => {
      render(<EpilogueChapter data={createData()} />)

      const link = screen.getByText('How this is calculated')
      fireEvent.click(link)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('How we calculate your stats')).toBeInTheDocument()
    })

    it('closes methodology modal when close button is clicked', () => {
      render(<EpilogueChapter data={createData()} />)

      const link = screen.getByText('How this is calculated')
      fireEvent.click(link)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('positions methodology link with other footer links', () => {
      render(<EpilogueChapter data={createData()} />)

      const methodologyButton = screen.getByText('How this is calculated')

      // Verify source and sponsor links exist alongside methodology button
      expect(screen.getByText('View source')).toBeInTheDocument()
      expect(screen.getByText('Sponsor')).toBeInTheDocument()

      // Methodology is a button, not a link (opens modal, not external)
      expect(methodologyButton.tagName.toLowerCase()).toBe('button')
    })
  })

  describe('data completeness section', () => {
    it('displays data completeness warning when restricted contributions exist', () => {
      render(<EpilogueChapter data={createData({
        dataCompleteness: {
          percentageAccessible: 80,
          restrictedContributions: 100,
        },
      })} />)

      expect(screen.getByText(/20% of your activity/)).toBeInTheDocument()
      expect(screen.getByText(/Grant access to see the full picture/)).toBeInTheDocument()
    })

    it('does not display warning when all contributions are accessible', () => {
      render(<EpilogueChapter data={createData({
        dataCompleteness: {
          percentageAccessible: 100,
          restrictedContributions: 0,
        },
      })} />)

      expect(screen.queryByText(/of your activity/)).not.toBeInTheDocument()
    })
  })
})
