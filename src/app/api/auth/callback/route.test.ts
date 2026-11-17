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

const APP_URL = 'http://localhost:3000'

function createRequest(params: Record<string, string>): NextRequest {
  const url = new URL(`${APP_URL}/api/auth/callback`)
  url.search = new URLSearchParams(params).toString()
  return new NextRequest(url)
}

function withStoredState(value: string | undefined) {
  mockCookieStore.get.mockImplementation((name: string) =>
    name === 'oauth-state' && value !== undefined ? { value } : undefined
  )
}

function locationOf(response: Response): string | null {
  return response.headers.get('location')
}

function stubExchange(body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) })
}

const originalFetch = global.fetch

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', APP_URL)
    vi.stubEnv('GITHUB_CLIENT_ID', 'test-client-id')
    vi.stubEnv('GITHUB_CLIENT_SECRET', 'test-client-secret')
    vi.stubEnv('NODE_ENV', 'test')
    mockCookieStore.get.mockReturnValue(undefined)
    stubExchange({ access_token: 'test-token' })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.unstubAllEnvs()
  })

  describe('oauth-state cookie cleanup', () => {
    it('deletes the oauth-state cookie during the install flow when it exists', async () => {
      withStoredState('old-state-value')

      await GET(createRequest({ code: 'test-code', setup_action: 'install', installation_id: '12345' }))

      expect(mockCookieStore.delete).toHaveBeenCalledWith('oauth-state')
    })

    it('completes the install flow and redirects to /rewind when no oauth-state cookie exists', async () => {
      const response = await GET(
        createRequest({ code: 'test-code', setup_action: 'install', installation_id: '12345' })
      )

      expect(response.status).toBe(307)
      expect(locationOf(response)).toBe(`${APP_URL}/rewind`)
      expect(mockCookieStore.delete).not.toHaveBeenCalled()
    })

    it('deletes the oauth-state cookie after a successful standard OAuth flow', async () => {
      withStoredState('valid-state')

      await GET(createRequest({ code: 'test-code', state: 'valid-state' }))

      expect(mockCookieStore.delete).toHaveBeenCalledWith('oauth-state')
    })

    it('does not delete the oauth-state cookie on a state mismatch', async () => {
      withStoredState('stored')

      await GET(createRequest({ code: 'c', state: 'other' }))

      expect(mockCookieStore.delete).not.toHaveBeenCalled()
    })

    it('deletes the oauth-state cookie before a failed token exchange', async () => {
      withStoredState('s')
      global.fetch = vi.fn().mockRejectedValue(new Error('network down'))

      await GET(createRequest({ code: 'c', state: 's' }))

      expect(mockCookieStore.delete).toHaveBeenCalledWith('oauth-state')
    })
  })

  describe('state validation', () => {
    it('rejects a state when no oauth-state cookie exists', async () => {
      const response = await GET(createRequest({ code: 'test-code', state: 'some-state' }))

      expect(response.status).toBe(307)
      expect(locationOf(response)).toBe(`${APP_URL}/?error=invalid_state`)
    })

    it('rejects a state that differs from the oauth-state cookie', async () => {
      withStoredState('stored-state')

      const response = await GET(createRequest({ code: 'test-code', state: 'different-state' }))

      expect(response.status).toBe(307)
      expect(locationOf(response)).toBe(`${APP_URL}/?error=invalid_state`)
    })

    it('accepts a state that matches the oauth-state cookie', async () => {
      withStoredState('matching-state')

      const response = await GET(createRequest({ code: 'test-code', state: 'matching-state' }))

      expect(response.status).toBe(307)
      expect(locationOf(response)).toBe(`${APP_URL}/rewind`)
    })

    it('does not exchange a code or touch the session on a state mismatch', async () => {
      withStoredState('stored')

      await GET(createRequest({ code: 'c', state: 'other' }))

      expect(global.fetch).not.toHaveBeenCalled()
      expect(setSession).not.toHaveBeenCalled()
    })

    it('characterization: skips the state check when setup_action=install, even if the state mismatches', async () => {
      withStoredState('stored')

      const response = await GET(createRequest({ code: 'c', state: 'other', setup_action: 'install' }))

      expect(locationOf(response)).toBe(`${APP_URL}/rewind`)
      expect(setSession).toHaveBeenCalledWith('test-token')
    })

    it('still checks the state when setup_action=update has a code', async () => {
      withStoredState('stored')

      const response = await GET(createRequest({ code: 'c', state: 'other', setup_action: 'update' }))

      expect(locationOf(response)).toBe(`${APP_URL}/?error=invalid_state`)
      expect(setSession).not.toHaveBeenCalled()
    })
  })

  describe('redirect targets', () => {
    it.each([
      ['no code', { state: 'some-state' }, '/?error=missing_params'],
      ['no state outside the install flow', { code: 'test-code' }, '/?error=missing_params'],
      ['an install without a code', { setup_action: 'install', installation_id: '1' }, '/api/auth/login'],
      ['an update without a code', { setup_action: 'update' }, '/api/auth/login'],
      ['an OAuth error from GitHub', { error: 'access_denied' }, '/?error=access_denied'],
      ['an OAuth error that needs url-encoding', { error: 'a b&c' }, '/?error=a%20b%26c'],
      [
        'an OAuth error together with an install and no code (install redirect wins)',
        { error: 'access_denied', setup_action: 'install' },
        '/api/auth/login',
      ],
      [
        'an OAuth error together with an install and a code (error wins)',
        { error: 'access_denied', setup_action: 'install', code: 'c' },
        '/?error=access_denied',
      ],
    ])('redirects for %s', async (_case, params, expectedPath) => {
      const response = await GET(createRequest(params))

      expect(response.status).toBe(307)
      expect(locationOf(response)).toBe(`${APP_URL}${expectedPath}`)
    })

    it('redirects to /rewind on success', async () => {
      withStoredState('s')

      const response = await GET(createRequest({ code: 'c', state: 's' }))

      expect(locationOf(response)).toBe(`${APP_URL}/rewind`)
    })
  })

  describe('token exchange', () => {
    beforeEach(() => {
      withStoredState('s')
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

    it('asks for and sends JSON', async () => {
      await GET(createRequest({ code: 'c', state: 's' }))

      const init = vi.mocked(global.fetch).mock.calls[0][1]
      expect(init?.headers).toEqual({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      })
    })

    it('does not cache the token exchange', async () => {
      await GET(createRequest({ code: 'c', state: 's' }))

      expect(vi.mocked(global.fetch).mock.calls[0][1]).toMatchObject({ cache: 'no-store' })
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
        json: () => Promise.resolve({ access_token: 'would-succeed-without-the-ok-check' }),
      })

      const response = await GET(createRequest({ code: 'c', state: 's' }))

      expect(response.status).toBe(307)
      expect(locationOf(response)).toBe(`${APP_URL}/?error=auth_failed`)
      expect(setSession).not.toHaveBeenCalled()
    })

    it('redirects to ?error=auth_failed when the exchange response carries an error', async () => {
      stubExchange({ error: 'bad_verification_code', error_description: 'expired' })

      const response = await GET(createRequest({ code: 'c', state: 's' }))

      expect(locationOf(response)).toBe(`${APP_URL}/?error=auth_failed`)
      expect(setSession).not.toHaveBeenCalled()
    })

    it('redirects to ?error=auth_failed when the exchange request throws', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('network down'))

      const response = await GET(createRequest({ code: 'c', state: 's' }))

      expect(locationOf(response)).toBe(`${APP_URL}/?error=auth_failed`)
    })

    it('redirects to ?error=auth_failed when the exchange response is not valid JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      })

      const response = await GET(createRequest({ code: 'c', state: 's' }))

      expect(locationOf(response)).toBe(`${APP_URL}/?error=auth_failed`)
      expect(setSession).not.toHaveBeenCalled()
    })

    it('characterization: a failing setSession redirects to ?error=auth_failed and sets no installation-id cookie', async () => {
      vi.mocked(setSession).mockRejectedValueOnce(new Error('SESSION_SECRET environment variable is required'))

      const response = await GET(createRequest({ code: 'c', state: 's', installation_id: '12345' }))

      expect(locationOf(response)).toBe(`${APP_URL}/?error=auth_failed`)
      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })

    it('characterization: an ok response with neither access_token nor error stores an undefined token and redirects to /rewind', async () => {
      stubExchange({})

      const response = await GET(createRequest({ code: 'c', state: 's' }))

      expect(setSession).toHaveBeenCalledWith(undefined)
      expect(locationOf(response)).toBe(`${APP_URL}/rewind`)
    })
  })

  describe('installation-id cookie', () => {
    beforeEach(() => {
      withStoredState('s')
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

    it('marks the installation id cookie secure in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      await GET(createRequest({ code: 'c', state: 's', installation_id: '12345' }))

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'installation-id',
        '12345',
        expect.objectContaining({ secure: true })
      )
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
