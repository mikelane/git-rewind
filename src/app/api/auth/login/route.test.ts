import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

import { GET } from './route'

describe('GET /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GITHUB_CLIENT_ID', 'test-client-id')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  function storedState(): string {
    return mockCookieStore.set.mock.calls[0][1]
  }

  it('redirects with a 307 to the GitHub authorize endpoint', async () => {
    const response = await GET()

    expect(response.status).toBe(307)
    const location = new URL(response.headers.get('location') as string)
    expect(location.origin + location.pathname).toBe('https://github.com/login/oauth/authorize')
  })

  it('sends the client id and callback redirect_uri to GitHub', async () => {
    const response = await GET()

    const location = new URL(response.headers.get('location') as string)
    expect(location.searchParams.get('client_id')).toBe('test-client-id')
    expect(location.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/callback')
  })

  it('It sends https://git-rewind.dev/api/auth/callback as redirect_uri when the app URL ends in a slash', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://git-rewind.dev/')

    const response = await GET()

    const location = new URL(response.headers.get('location') as string)
    expect(location.searchParams.get('redirect_uri')).toBe('https://git-rewind.dev/api/auth/callback')
  })

  it('It sends https://git-rewind.dev/api/auth/callback as redirect_uri when the app URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')

    const response = await GET()

    const location = new URL(response.headers.get('location') as string)
    expect(location.searchParams.get('redirect_uri')).toBe('https://git-rewind.dev/api/auth/callback')
  })

  it('sends the same state to GitHub that it stores in the oauth-state cookie', async () => {
    const response = await GET()

    const location = new URL(response.headers.get('location') as string)
    expect(location.searchParams.get('state')).toBe(storedState())
  })

  it('generates a 32 character hex state', async () => {
    await GET()

    expect(storedState()).toMatch(/^[0-9a-f]{32}$/)
  })

  it('generates a different state on every request', async () => {
    await GET()
    await GET()

    expect(mockCookieStore.set.mock.calls[0][1]).not.toBe(mockCookieStore.set.mock.calls[1][1])
  })

  it('sets only the oauth-state cookie', async () => {
    await GET()

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1)
    expect(mockCookieStore.set.mock.calls[0][0]).toBe('oauth-state')
    expect(mockCookieStore.delete).not.toHaveBeenCalled()
  })

  it('sets the oauth-state cookie as httpOnly, lax, path / and ten minutes, not secure outside production', async () => {
    await GET()

    expect(mockCookieStore.set.mock.calls[0][2]).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })
  })

  it('marks the oauth-state cookie secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    await GET()

    expect(mockCookieStore.set.mock.calls[0][2]).toMatchObject({ secure: true })
  })

  describe('when GITHUB_CLIENT_ID is not configured', () => {
    beforeEach(() => {
      vi.stubEnv('GITHUB_CLIENT_ID', '')
    })

    it('responds 500 with a JSON error', async () => {
      const response = await GET()

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'GitHub App client ID not configured' })
    })

    it('does not set any cookie', async () => {
      await GET()

      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })
  })
})
