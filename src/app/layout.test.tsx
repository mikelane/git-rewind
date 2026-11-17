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

const FONTSOURCE_LATIN_EXT_RANGE =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'

describe('RootLayout latin-extended fonts', () => {
  it.each([
    ['--font-display-ext', ['500', '600', '700']],
    ['--font-body-ext', ['400', '500', '600']],
  ])('It loads %s at weights %j', (variable, weights) => {
    expect(fontSources(variable).map((source) => source.weight)).toEqual(weights)
  })

  it.each(['--font-display-ext', '--font-body-ext'])('It points every %s source at a font file that exists', (variable) => {
    const sources = fontSources(variable)

    expect(sources.length).toBeGreaterThan(0)
    for (const { path } of sources) {
      expect(existsSync(join(__dirname, path))).toBe(true)
    }
  })

  it.each(['--font-display-ext', '--font-body-ext'])('It restricts %s to the Fontsource latin-ext unicode-range', (variable) => {
    expect(fontOptions(variable)?.declarations).toEqual([
      { prop: 'unicode-range', value: FONTSOURCE_LATIN_EXT_RANGE },
    ])
  })

  it.each(['--font-display-ext', '--font-body-ext'])('It neither preloads nor adds a metric fallback for %s', (variable) => {
    expect(fontOptions(variable)).toMatchObject({ preload: false, adjustFontFallback: false, display: 'swap' })
  })

  it('It puts all four font variables on the html element', () => {
    const markup = renderToStaticMarkup(<RootLayout>content</RootLayout>)

    for (const variable of ['--font-display-ext', '--font-body-ext']) {
      expect(markup).toContain(`${variable}-hashed`)
    }
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
    ['display', 'var(--font-display-ext)', 'var(--font-display)', 'system-ui'],
    ['body', 'var(--font-body-ext)', 'var(--font-body)', 'system-ui'],
  ])('It stacks %s as the latin-ext face, then the latin face, then %s', (key, extVariable, variable, fallback) => {
    expect(fontFamily[key]).toEqual(expect.arrayContaining([extVariable, variable, fallback]))
    expect(fontFamily[key].slice(0, 2)).toEqual([extVariable, variable])
  })
})
