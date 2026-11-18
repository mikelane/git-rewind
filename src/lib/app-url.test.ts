import { describe, it, expect, vi, afterEach } from 'vitest'
import { getAppUrl } from './app-url'

describe('getAppUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('It returns the default URL when NEXT_PUBLIC_APP_URL is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined)

    expect(getAppUrl()).toBe('https://git-rewind.dev')
  })

  it.each([
    ['empty', ''],
    ['a single slash', '/'],
    ['only slashes', '///'],
  ])('It returns the default URL when NEXT_PUBLIC_APP_URL is %s', (_label, value) => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', value)

    expect(getAppUrl()).toBe('https://git-rewind.dev')
  })

  it.each([
    ['https://git-rewind.dev', 'https://git-rewind.dev'],
    ['https://git-rewind.dev/', 'https://git-rewind.dev'],
    ['https://git-rewind.dev///', 'https://git-rewind.dev'],
    ['http://localhost:3000/', 'http://localhost:3000'],
    ['https://example.com/base/', 'https://example.com/base'],
  ])('It returns %s as %s', (input, expected) => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', input)

    expect(getAppUrl()).toBe(expected)
  })

  it('It reads the environment on every call', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://first.example.com')
    const first = getAppUrl()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://second.example.com/')

    expect([first, getAppUrl()]).toEqual(['https://first.example.com', 'https://second.example.com'])
  })
})
