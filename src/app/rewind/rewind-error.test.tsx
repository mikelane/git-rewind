import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RewindError } from './rewind-error'

describe('RewindError', () => {
  it('It fills at least the dynamic viewport height', () => {
    render(<RewindError failedRetries={0} retrying={false} onRetry={() => {}} />)

    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-dvh')
    expect(main).not.toHaveClass('min-h-screen')
  })
})
