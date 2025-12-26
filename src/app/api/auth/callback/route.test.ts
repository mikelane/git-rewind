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
})
