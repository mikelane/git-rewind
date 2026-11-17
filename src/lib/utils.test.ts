import { describe, it, expect } from 'vitest'
import tailwindConfig from '../../tailwind.config'
import { cn } from './utils'

const customFontSizeTokens = Object.keys(tailwindConfig.theme?.extend?.fontSize ?? {})

describe('cn', () => {
  it('It reads the custom font size tokens from tailwind.config', () => {
    expect(customFontSizeTokens.length).toBeGreaterThan(0)
  })

  it.each(customFontSizeTokens)(
    'It keeps text-%s when a colour class follows',
    (token) => {
      expect(cn(`text-${token}`, 'text-text-primary')).toBe(`text-${token} text-text-primary`)
    }
  )

  it.each(customFontSizeTokens)(
    'It keeps text-%s when a colour class precedes',
    (token) => {
      expect(cn('text-accent', `text-${token}`)).toBe(`text-accent text-${token}`)
    }
  )

  it('It resolves conflicting custom font sizes to the last one', () => {
    expect(cn('text-display-xl', 'text-caption')).toBe('text-caption')
  })

  it('It resolves conflicting colours to the last one', () => {
    expect(cn('text-text-primary', 'text-accent')).toBe('text-accent')
  })

  it('It lets a custom font size override a built-in font size', () => {
    expect(cn('text-lg', 'text-display-md')).toBe('text-display-md')
  })

  it('It preserves responsive variants of custom font sizes alongside colours', () => {
    expect(cn('text-display-md', 'md:text-display-xl', 'text-accent')).toBe(
      'text-display-md md:text-display-xl text-accent'
    )
  })

  it('It resolves conflicts within the same responsive variant', () => {
    expect(cn('md:text-display-xl', 'md:text-display-lg')).toBe('md:text-display-lg')
  })
})
