import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProgressIndicator } from './progress-indicator'

const renderIndicator = () =>
  render(
    <ProgressIndicator
      totalChapters={3}
      currentChapter={1}
      chapterNames={['Intro', 'Rhythm', 'Craft']}
    />
  )

describe('ProgressIndicator', () => {
  it.each(['min-h-11', 'min-w-11'])('It renders the step button with %s for a 44px tap target', (utility) => {
    renderIndicator()

    expect(screen.getByRole('button', { name: 'Go to Intro' })).toHaveClass(utility)
  })

  it('It renders the visible 8px dot as an inner element of the step button', () => {
    renderIndicator()

    const dot = screen.getByRole('button', { name: 'Go to Rhythm' }).firstElementChild

    expect(dot).toHaveClass('w-2', 'h-2', 'rounded-full')
  })

  it('It offsets the chapter counter so its right edge stays 24px from the viewport', () => {
    renderIndicator()

    expect(screen.getByText('1 / 3').parentElement).toHaveClass('pr-[18px]')
  })

  it('It places the hover label 12px from the dot', () => {
    renderIndicator()

    expect(screen.getByText('Rhythm')).toHaveClass('right-[38px]')
  })

  it('It keeps the rail at least the safe-area inset from the right edge', () => {
    renderIndicator()

    expect(screen.getByRole('navigation')).toHaveClass(
      'right-[max(0.375rem,env(safe-area-inset-right))]'
    )
  })

  it('It marks the hover labels with the reveal-on-interact class that reduced motion leaves hidden', () => {
    renderIndicator()

    expect(screen.getByText('Rhythm')).toHaveClass('reveal-on-interact', 'opacity-0')
  })

  it('It reveals the chapter name on hover and on keyboard focus of the step button', () => {
    renderIndicator()

    expect(screen.getByText('Rhythm')).toHaveClass(
      'group-hover:opacity-100',
      'group-has-[:focus-visible]:opacity-100'
    )
  })

  it.each(['focus-visible:outline', 'focus-visible:outline-2', 'focus-visible:outline-transparent'])(
    'It gives the step button %s so focus survives forced-colors mode',
    (utility) => {
      renderIndicator()

      expect(screen.getByRole('button', { name: 'Go to Intro' })).toHaveClass(utility)
    }
  )

  it('It does not suppress the focus outline on the step button', () => {
    renderIndicator()

    expect(screen.getByRole('button', { name: 'Go to Intro' })).not.toHaveClass('focus:outline-none')
  })

  describe('dismissing the revealed label with Escape', () => {
    const REVEAL_CLASSES = ['group-hover:opacity-100', 'group-has-[:focus-visible]:opacity-100']

    it('It hides the label when Escape is pressed on the focused step button', () => {
      renderIndicator()
      const button = screen.getByRole('button', { name: 'Go to Rhythm' })
      button.focus()

      fireEvent.keyDown(button, { key: 'Escape' })

      expect(screen.getByText('Rhythm')).not.toHaveClass(...REVEAL_CLASSES)
    })

    it('It keeps focus on the step button after Escape', () => {
      renderIndicator()
      const button = screen.getByRole('button', { name: 'Go to Rhythm' })
      button.focus()

      fireEvent.keyDown(button, { key: 'Escape' })

      expect(button).toHaveFocus()
    })

    it('It only hides the label of the button that received Escape', () => {
      renderIndicator()
      const button = screen.getByRole('button', { name: 'Go to Rhythm' })

      fireEvent.keyDown(button, { key: 'Escape' })

      expect(screen.getByText('Craft')).toHaveClass(...REVEAL_CLASSES)
    })

    it('It shows the label again the next time the button receives focus', () => {
      renderIndicator()
      const button = screen.getByRole('button', { name: 'Go to Rhythm' })
      fireEvent.keyDown(button, { key: 'Escape' })

      fireEvent.blur(button)
      fireEvent.focus(button)

      expect(screen.getByText('Rhythm')).toHaveClass(...REVEAL_CLASSES)
    })

    it('It leaves the label revealable when another key is pressed', () => {
      renderIndicator()
      const button = screen.getByRole('button', { name: 'Go to Rhythm' })

      fireEvent.keyDown(button, { key: 'Tab' })

      expect(screen.getByText('Rhythm')).toHaveClass(...REVEAL_CLASSES)
    })
  })
})
