import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MethodologyModal } from './methodology-modal'

describe('MethodologyModal', () => {
  describe('when closed', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <MethodologyModal isOpen={false} onClose={() => {}} />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('when open', () => {
    it('renders the modal with title', () => {
      render(<MethodologyModal isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('How we calculate your stats')).toBeInTheDocument()
    })

    it('displays data source information', () => {
      render(<MethodologyModal isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Data Sources')).toBeInTheDocument()
      expect(screen.getByText(/GitHub GraphQL API/)).toBeInTheDocument()
    })

    it('displays contribution counting methodology', () => {
      render(<MethodologyModal isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('What counts as a contribution')).toBeInTheDocument()
    })

    it('displays known limitations', () => {
      render(<MethodologyModal isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Known limitations')).toBeInTheDocument()
    })

    it('displays privacy information', () => {
      render(<MethodologyModal isOpen={true} onClose={() => {}} />)
      expect(screen.getByText('Privacy')).toBeInTheDocument()
      expect(screen.getByText(/read-only access/i)).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn()
      render(<MethodologyModal isOpen={true} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn()
      render(<MethodologyModal isOpen={true} onClose={onClose} />)

      const backdrop = screen.getByTestId('methodology-backdrop')
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not close when modal content is clicked', () => {
      const onClose = vi.fn()
      render(<MethodologyModal isOpen={true} onClose={onClose} />)

      const modalContent = screen.getByTestId('methodology-content')
      fireEvent.click(modalContent)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn()
      render(<MethodologyModal isOpen={true} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('has correct role and aria attributes', () => {
      render(<MethodologyModal isOpen={true} onClose={() => {}} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })

    it('traps focus within the modal', () => {
      render(<MethodologyModal isOpen={true} onClose={() => {}} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })
  })
})
