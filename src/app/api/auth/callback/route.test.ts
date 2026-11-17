import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies before importing route
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

vi.mock('@/lib/auth', () => ({
  setSession: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/logger', () => ({
  authLogger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

// Import route after mocks are set up
import { GET } from './route'
import { setSession } from '@/lib/auth'

// Store the original fetch
const originalFetch = global.fetch

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.GITHUB_CLIENT_ID = 'test-client-id'
    process.env.GITHUB_CLIENT_SECRET = 'test-client-secret'

    // Mock fetch for token exchange
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'test-token' }),
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  function createRequest(params: Record<string, string>): NextRequest {
    const url = new URL('http://localhost:3000/api/auth/callback')
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    return new NextRequest(url)
  }

  describe('Bug #2: Cookie deletion in install flow', () => {
    it('deletes oauth-state cookie during install flow when cookie exists', async () => {
      // Setup: oauth-state cookie exists from a previous OAuth attempt
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'oauth-state') {
          return { value: 'old-state-value' }
        }
        return undefined
      })

      const request = createRequest({
        code: 'test-code',
        setup_action: 'install',
        installation_id: '12345',
      })

      await GET(request)

      // The oauth-state cookie should be deleted to prevent reuse
      expect(mockCookieStore.delete).toHaveBeenCalledWith('oauth-state')
    })

    it('handles install flow gracefully when no oauth-state cookie exists', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const request = createRequest({
        code: 'test-code',
        setup_action: 'install',
        installation_id: '12345',
      })

      const response = await GET(request)

      // Should succeed and redirect to rewind page
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/rewind')
    })
  })

  describe('Bug #3: Undefined state comparison', () => {
    it('returns invalid_state error when storedState cookie is undefined', async () => {
      mockCookieStore.get.mockReturnValue(undefined) // No cookie exists

      const request = createRequest({
        code: 'test-code',
        state: 'some-state',
      })

      const response = await GET(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('error=invalid_state')
    })

    it('returns invalid_state error when state values do not match', async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'oauth-state') {
          return { value: 'stored-state' }
        }
        return undefined
      })

      const request = createRequest({
        code: 'test-code',
        state: 'different-state',
      })

      const response = await GET(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('error=invalid_state')
    })

    it('proceeds when state values match', async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'oauth-state') {
          return { value: 'matching-state' }
        }
        return undefined
      })

      const request = createRequest({
        code: 'test-code',
        state: 'matching-state',
      })

      const response = await GET(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/rewind')
    })
  })

  describe('state cookie cleanup', () => {
    it('deletes oauth-state cookie after successful standard OAuth flow', async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'oauth-state') {
          return { value: 'valid-state' }
        }
        return undefined
      })

      const request = createRequest({
        code: 'test-code',
        state: 'valid-state',
      })

      await GET(request)

      expect(mockCookieStore.delete).toHaveBeenCalledWith('oauth-state')
    })
  })

  describe('redirect targets', () => {
    function withStoredState(value: string) {
      mockCookieStore.get.mockImplementation((name: string) =>
        name === 'oauth-state' ? { value } : undefined
      )
    }

    function locationOf(response: Response): string {
      return response.headers.get('location') as string
    }

    it('redirects to the landing page with missing_params when there is no code', async () => {
      const response = await GET(createRequest({ state: 'some-state' }))

      expect(response.status).toBe(307)
      expect(locationOf(response)).toBe('http://localhost:3000/?error=missing_params')
    })

    it('redirects to the landing page with missing_params when state is absent outside the install flow', async () => {
      const response = await GET(createRequest({ code: 'test-code' }))

      expect(response.status).toBe(307)
      expect(locationOf(response)).toBe('http://localhost:3000/?error=missing_params')
    })

    it('redirects to login after an install without a code', async () => {
      const response = await GET(createRequest({ setup_action: 'install', installation_id: '1' }))

      expect(locationOf(response)).toBe('http://localhost:3000/api/auth/login')
    })

    it('redirects to login after an update without a code', async () => {
      const response = await GET(createRequest({ setup_action: 'update' }))

      expect(locationOf(response)).toBe('http://localhost:3000/api/auth/login')
    })

    it('forwards an OAuth error from GitHub to the landing page', async () => {
      const response = await GET(createRequest({ error: 'access_denied' }))

      expect(locationOf(response)).toBe('http://localhost:3000/?error=access_denied')
    })

    it('url-encodes an OAuth error from GitHub', async () => {
      const response = await GET(createRequest({ error: 'a b&c' }))

      expect(locationOf(response)).toBe('http://localhost:3000/?error=a%20b%26c')
    })

    it('redirects to /rewind on success', async () => {
      withStoredState('s')

      const response = await GET(createRequest({ code: 'c', state: 's' }))

      expect(locationOf(response)).toBe('http://localhost:3000/rewind')
    })

    it('does not exchange a code or touch the session on a state mismatch', async () => {
      withStoredState('stored')

      await GET(createRequest({ code: 'c', state: 'other' }))

      expect(global.fetch).not.toHaveBeenCalled()
      expect(setSession).not.toHaveBeenCalled()
    })
  })

  describe('token exchange', () => {
    beforeEach(() => {
      mockCookieStore.get.mockImplementation((name: string) =>
        name === 'oauth-state' ? { value: 's' } : undefined
      )
    })

    it('posts the code and app credentials to GitHub', async () => {
      await GET(createRequest({ code: 'the-code', state: 's' }))

      const [url, init] = vi.mocked(global.fetch).mock.calls[0]
      expect(url).toBe('https://github.com/login/oauth/access_token')
      expect(init?.method).toBe('POST')
      expect(JSON.parse(init?.body as string)).toEqual({
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        code: 'the-code',
      })
    })

    it('stores the returned access token in the session', async () => {
      await GET(createRequest({ code: 'c', state: 's' }))

      expect(setSession).toHaveBeenCalledWith('test-token')
    })

    it('redirects to ?error=auth_failed when GitHub answers 401', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Bad credentials'),
      })

      const response = await GET(createRequest({ code: 'c', state: 's' }))

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/?error=auth_failed')
      expect(setSession).not.toHaveBeenCalled()
    })

    it('redirects to ?error=auth_failed when the exchange response carries an error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: 'bad_verification_code', error_description: 'expired' }),
      })

      const response = await GET(createRequest({ code: 'c', state: 's' }))

      expect(response.headers.get('location')).toBe('http://localhost:3000/?error=auth_failed')
      expect(setSession).not.toHaveBeenCalled()
    })

    it('redirects to ?error=auth_failed when the exchange request throws', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('network down'))

      const response = await GET(createRequest({ code: 'c', state: 's' }))

      expect(response.headers.get('location')).toBe('http://localhost:3000/?error=auth_failed')
    })
  })

  describe('installation-id cookie', () => {
    beforeEach(() => {
      mockCookieStore.get.mockImplementation((name: string) =>
        name === 'oauth-state' ? { value: 's' } : undefined
      )
    })

    it('stores the installation id with secure flags for 30 days', async () => {
      await GET(createRequest({ code: 'c', state: 's', installation_id: '12345' }))

      expect(mockCookieStore.set).toHaveBeenCalledWith('installation-id', '12345', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    })

    it('does not set the cookie when no installation id is given', async () => {
      await GET(createRequest({ code: 'c', state: 's' }))

      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })

    it('does not set the cookie when the token exchange fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('') })

      await GET(createRequest({ code: 'c', state: 's', installation_id: '12345' }))

      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })
  })
})
