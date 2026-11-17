import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi } from 'vitest'
import tailwindConfig from '../../tailwind.config'

const fontLoaderCalls = vi.hoisted(() => [] as Array<{ name: string; options: Record<string, unknown> }>)

vi.mock('next/font/google', () => {
  const loader = (name: string) => (options: Record<string, unknown>) => {
    fontLoaderCalls.push({ name, options })
    const { variable } = options
    if (typeof variable !== 'string') {
      throw new Error(`${name} was loaded without a string variable option`)
    }
    return { variable: `${variable}-hashed` }
  }
  return { Space_Grotesk: loader('Space_Grotesk'), Inter: loader('Inter') }
})
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }))
vi.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }))

import RootLayout from './layout'

const globalsCss = readFileSync(join(__dirname, 'globals.css'), 'utf8')

function fontOptions(name: string) {
  return fontLoaderCalls.find((call) => call.name === name)?.options
}

describe('globals.css', () => {
  it('It does not import fonts from Google via CSS', () => {
    expect(globalsCss).not.toContain('fonts.googleapis.com')
  })
})

describe('RootLayout fonts', () => {
  it('It loads Space Grotesk at weights 500, 600 and 700', () => {
    expect(fontOptions('Space_Grotesk')).toMatchObject({
      weight: ['500', '600', '700'],
      subsets: ['latin'],
      display: 'swap',
      variable: '--font-display',
    })
  })

  it('It loads Inter at weights 400, 500 and 600', () => {
    expect(fontOptions('Inter')).toMatchObject({
      weight: ['400', '500', '600'],
      subsets: ['latin'],
      display: 'swap',
      variable: '--font-body',
    })
  })

  it('It puts both font variables on the html element', () => {
    const markup = renderToStaticMarkup(<RootLayout>content</RootLayout>)

    expect(markup).toMatch(/<html[^>]*class="[^"]*--font-display-hashed[^"]*--font-body-hashed/)
  })
})

function isFontFamilyMap(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(
      (stack) => Array.isArray(stack) && stack.every((entry) => typeof entry === 'string')
    )
  )
}

function readFontFamily(): Record<string, string[]> {
  const fontFamily: unknown = tailwindConfig.theme?.extend?.fontFamily
  if (!isFontFamilyMap(fontFamily)) {
    throw new Error('tailwind.config theme.extend.fontFamily is not a map of string stacks')
  }
  return fontFamily
}

describe('tailwind fontFamily', () => {
  const fontFamily = readFontFamily()

  it.each([
    ['display', 'var(--font-display)', 'system-ui'],
    ['body', 'var(--font-body)', 'system-ui'],
  ])('It points %s at %s with a %s fallback', (key, variable, fallback) => {
    expect(fontFamily[key]).toEqual(expect.arrayContaining([variable, fallback]))
    expect(fontFamily[key][0]).toBe(variable)
  })
})
