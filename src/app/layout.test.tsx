import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi } from 'vitest'
import tailwindConfig from '../../tailwind.config'

const fontLoaderCalls = vi.hoisted(() => [] as Array<{ name: string; options: Record<string, unknown> }>)

vi.mock('next/font/google', () => {
  const loader = (name: string) => (options: Record<string, unknown>) => {
    fontLoaderCalls.push({ name, options })
    return { variable: `${options.variable as string}-hashed` }
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

describe('tailwind fontFamily', () => {
  const fontFamily = tailwindConfig.theme?.extend?.fontFamily as Record<string, string[]>

  it.each([
    ['display', 'var(--font-display)', 'system-ui'],
    ['body', 'var(--font-body)', 'system-ui'],
  ])('It points %s at %s with a %s fallback', (key, variable, fallback) => {
    expect(fontFamily[key]).toEqual(expect.arrayContaining([variable, fallback]))
    expect(fontFamily[key][0]).toBe(variable)
  })
})
