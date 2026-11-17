import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Chapter } from './chapter'

describe('Chapter', () => {
  it.each(['min-h-screen', 'supports-[height:100dvh]:min-h-dvh'])(
    'It sizes the section with %s so it tracks the dynamic viewport',
    (utility) => {
      const { container } = render(<Chapter>content</Chapter>)

      expect(container.querySelector('section')).toHaveClass(utility)
    }
  )
})
