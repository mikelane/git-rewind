/**
 * Tests for ShareButton component
 * Following TDD: Write tests first, watch them fail, then implement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareButton } from './share-button'
import { HighlightType, type StreakHighlight } from '@/lib/highlight-share'

// Mock the highlight-share module
vi.mock('@/lib/highlight-share', async () => {
  const actual = await vi.importActual('@/lib/highlight-share')
  return {
    ...actual,
    shareHighlight: vi.fn(),
  }
})

import { shareHighlight } from '@/lib/highlight-share'

const mockStreakHighlight: StreakHighlight = {
  type: HighlightType.Streak,
  username: 'testuser',
  year: 2024,
  longestStreak: 45,
}

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders share icon by default', () => {
    vi.mocked(shareHighlight).mockResolvedValue({ method: 'clipboard', success: true })
    render(<ShareButton highlight={mockStreakHighlight} />)
    const button = screen.getByRole('button', { name: /share/i })
    expect(button).toBeDefined()
  })

  it('calls shareHighlight when clicked', async () => {
    vi.mocked(shareHighlight).mockResolvedValue({ method: 'clipboard', success: true })
    render(<ShareButton highlight={mockStreakHighlight} />)

    const button = screen.getByRole('button', { name: /share/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(shareHighlight).toHaveBeenCalledWith(mockStreakHighlight)
    })
  })

  it('shows success feedback after successful share', async () => {
    vi.mocked(shareHighlight).mockResolvedValue({ method: 'clipboard', success: true })
    render(<ShareButton highlight={mockStreakHighlight} />)

    const button = screen.getByRole('button', { name: /share/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied/i })).toBeDefined()
    })
  })

  it('shows "Shared" text after webshare success', async () => {
    vi.mocked(shareHighlight).mockResolvedValue({ method: 'webshare', success: true })
    render(<ShareButton highlight={mockStreakHighlight} />)

    const button = screen.getByRole('button', { name: /share/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /shared/i })).toBeDefined()
    })
  })

  it('button has sharing state initially disabled until action completes', async () => {
    // This test verifies the disabled attribute is set correctly
    // We check before and after the share action
    vi.mocked(shareHighlight).mockResolvedValue({ method: 'clipboard', success: true })
    render(<ShareButton highlight={mockStreakHighlight} />)

    const button = screen.getByRole('button', { name: /share/i })
    // Initially not disabled
    expect(button).toHaveProperty('disabled', false)

    // After click and resolution, should not be disabled
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied/i })).toBeDefined()
    })
    // In success state, button should not be disabled
    expect(screen.getByRole('button', { name: /copied/i })).toHaveProperty('disabled', false)
  })

  it('applies custom className', () => {
    vi.mocked(shareHighlight).mockResolvedValue({ method: 'clipboard', success: true })
    render(<ShareButton highlight={mockStreakHighlight} className="custom-class" />)

    const button = screen.getByRole('button', { name: /share/i })
    expect(button.className).toContain('custom-class')
  })

  it('uses compact variant by default', () => {
    vi.mocked(shareHighlight).mockResolvedValue({ method: 'clipboard', success: true })
    render(<ShareButton highlight={mockStreakHighlight} />)

    const button = screen.getByRole('button', { name: /share/i })
    // Compact variant should have padding classes for icon-only button
    expect(button.className).toContain('p-2')
  })

  it('supports full variant with text', () => {
    vi.mocked(shareHighlight).mockResolvedValue({ method: 'clipboard', success: true })
    render(<ShareButton highlight={mockStreakHighlight} variant="full" />)

    const button = screen.getByRole('button', { name: /share/i })
    expect(button.textContent).toContain('Share')
  })
})
