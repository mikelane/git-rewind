import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi } from 'vitest'
import tailwindConfig from '../../tailwind.config'

const fontLoaderCalls = vi.hoisted(() => [] as Array<{ name: string; options: Record<string, unknown> }>)

vi.mock('next/font/local', () => ({
  default: (options: Record<string, unknown>) => {
    const { variable } = options
    if (typeof variable !== 'string') {
      throw new Error('A local font was loaded without a string variable option')
    }
    fontLoaderCalls.push({ name: variable, options })
    return { variable: `${variable}-hashed` }
  },
}))
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }))
vi.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }))

import RootLayout, { viewport } from './layout'

const globalsCss = readFileSync(join(__dirname, 'globals.css'), 'utf8')

function fontOptions(name: string) {
  return fontLoaderCalls.find((call) => call.name === name)?.options
}

describe('globals.css', () => {
  it('It does not import fonts from Google via CSS', () => {
    expect(globalsCss).not.toContain('fonts.googleapis.com')
  })

  it.each(['left', 'right'])('It pads the body by the safe-area inset on the %s so landscape content clears the notch', (side) => {
    const bodyRule = /body\s*\{[^}]*\}/.exec(globalsCss)?.[0] ?? ''

    expect(bodyRule).toMatch(new RegExp(`padding-${side}:\\s*env\\(safe-area-inset-${side}\\)`))
  })
})

describe('globals.css chapter', () => {
  it('It sizes .chapter to the dynamic viewport where dvh is supported', () => {
    expect(globalsCss).toMatch(
      /@supports\s*\(height:\s*100dvh\)\s*\{\s*\.chapter\s*\{\s*min-height:\s*100dvh/
    )
  })
})

describe('RootLayout viewport', () => {
  it('It extends the layout under device cutouts so safe-area insets resolve', () => {
    expect(viewport.viewportFit).toBe('cover')
  })
})

describe('globals.css reduced motion', () => {
  it('It excludes hover and focus revealed labels from the global opacity-0 override', () => {
    expect(globalsCss).toMatch(/\.opacity-0:not\(\.reveal-on-interact\)\s*\{\s*opacity:\s*1\s*!important/)
  })

  it('It no longer forces every opacity-0 element visible', () => {
    expect(globalsCss).not.toMatch(/^\s*\.opacity-0\s*\{/m)
  })
})

type FontSource = { path: string; weight: string; style: string }

function fontSources(variable: string): FontSource[] {
  const src = fontOptions(variable)?.src
  return Array.isArray(src) ? src : []
}

describe('RootLayout fonts', () => {
  it('It loads Space Grotesk at weights 500, 600 and 700', () => {
    expect(fontOptions('--font-display')).toMatchObject({ display: 'swap', variable: '--font-display' })
    expect(fontSources('--font-display').map((source) => source.weight)).toEqual(['500', '600', '700'])
  })

  it('It loads Inter at weights 400, 500 and 600', () => {
    expect(fontOptions('--font-body')).toMatchObject({ display: 'swap', variable: '--font-body' })
    expect(fontSources('--font-body').map((source) => source.weight)).toEqual(['400', '500', '600'])
  })

  it.each(['--font-display', '--font-body'])('It points every %s source at a font file that exists', (variable) => {
    const sources = fontSources(variable)

    expect(sources.length).toBeGreaterThan(0)
    for (const { path } of sources) {
      expect(existsSync(join(__dirname, path))).toBe(true)
    }
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
