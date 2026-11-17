import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PrologueChapter } from './prologue'

const DYNAMIC_VIEWPORT = 'supports-[height:100dvh]:min-h-dvh'

describe('PrologueChapter', () => {
  it('It sizes the loaded section to the dynamic viewport with a min-h-screen fallback', () => {
    const data = { year: 2024, username: 'octocat', totalContributions: 10 }
    const { container } = render(<PrologueChapter data={data} />)

    expect(container.querySelector('section')).toHaveClass('min-h-screen', DYNAMIC_VIEWPORT)
  })

  it('It sizes the loading section to the dynamic viewport with a min-h-screen fallback', () => {
    const { container } = render(<PrologueChapter data={null} isLoading />)

    expect(container.querySelector('section')).toHaveClass('min-h-screen', DYNAMIC_VIEWPORT)
  })
})
