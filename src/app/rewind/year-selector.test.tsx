import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { YearSelector } from './year-selector'

function renderSelector() {
  return render(
    <YearSelector
      years={[2024, 2025]}
      selectedYear={2025}
      loading={false}
      refreshing={false}
      loadingYears={new Set()}
      cachedYears={new Set()}
      onSelectYear={vi.fn()}
      onRefresh={vi.fn()}
    />
  )
}

describe('YearSelector', () => {
  it.each([
    'top-[max(0.5rem,env(safe-area-inset-top))]',
    'left-[max(1rem,env(safe-area-inset-left))]',
  ])('It clears the notch and status bar with %s', (utility) => {
    renderSelector()

    expect(screen.getByRole('button', { name: 'View 2025' }).parentElement).toHaveClass(utility)
  })
})
