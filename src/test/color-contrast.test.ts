import { describe, it, expect } from 'vitest'
import config from '../../tailwind.config'

const colors = config.theme?.extend?.colors as {
  bg: Record<string, string>
  text: Record<string, string>
}

function channelToLinear(channel: number): number {
  const scaled = channel / 255
  return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => channelToLinear(parseInt(hex.slice(start, start + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('text colour contrast', () => {
  it.each(['base', 'surface', 'elevated', 'accent'])(
    'It meets WCAG AA (4.5:1) for tertiary text on bg.%s',
    (surface) => {
      expect(contrastRatio(colors.text.tertiary, colors.bg[surface])).toBeGreaterThanOrEqual(4.5)
    }
  )

  it('It keeps tertiary text visibly distinct from secondary text (at least 1.4:1)', () => {
    expect(contrastRatio(colors.text.secondary, colors.text.tertiary)).toBeGreaterThanOrEqual(1.4)
  })
})
