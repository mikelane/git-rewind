// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SignJWT } from 'jose'

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

import { getSession, setSession, clearSession } from './session'

const SECRET = 'a-session-secret-that-is-at-least-32-chars-long'

async function signToken(payload: Record<string, unknown>, secret = SECRET, expiresIn = '1h') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret).slice(0, 32))
}

describe('session cookie', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('SESSION_SECRET', SECRET)
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('setSession', () => {
    it('sets the git-rewind-token cookie with secure flags and a 24 hour maxAge', async () => {
      await setSession('gho_token')

      expect(mockCookieStore.set).toHaveBeenCalledTimes(1)
      const [name, , options] = mockCookieStore.set.mock.calls[0]
      expect(name).toBe('git-rewind-token')
      expect(options).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 86400,
        path: '/',
      })
    })

    it('marks the cookie secure in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      await setSession('gho_token')

      expect(mockCookieStore.set.mock.calls[0][2]).toMatchObject({ secure: true })
    })

    it('does not store the access token in plain text', async () => {
      await setSession('gho_token')

      expect(mockCookieStore.set.mock.calls[0][1]).not.toContain('gho_token')
    })

    it('stores a value getSession can read back', async () => {
      await setSession('gho_roundtrip')
      const storedValue = mockCookieStore.set.mock.calls[0][1]
      mockCookieStore.get.mockReturnValue({ value: storedValue })

      expect(await getSession()).toEqual({ accessToken: 'gho_roundtrip' })
    })

    it('throws when SESSION_SECRET is missing', async () => {
      vi.stubEnv('SESSION_SECRET', '')

      await expect(setSession('gho_token')).rejects.toThrow('SESSION_SECRET environment variable is required')
    })

    it('throws when SESSION_SECRET is shorter than 32 characters', async () => {
      vi.stubEnv('SESSION_SECRET', 'too-short')

      await expect(setSession('gho_token')).rejects.toThrow('at least 32 characters')
    })
  })

  describe('getSession', () => {
    it('reads the git-rewind-token cookie', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      await getSession()

      expect(mockCookieStore.get).toHaveBeenCalledWith('git-rewind-token')
    })

    it('returns null when there is no cookie', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      expect(await getSession()).toBeNull()
    })

    it('returns the access token from a valid cookie', async () => {
      mockCookieStore.get.mockReturnValue({ value: await signToken({ token: 'gho_valid' }) })

      expect(await getSession()).toEqual({ accessToken: 'gho_valid' })
    })

    it('returns null for a cookie that is not a valid token', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'garbage' })

      expect(await getSession()).toBeNull()
    })

    it('returns null for a token signed with a different secret', async () => {
      const forged = await signToken({ token: 'gho_forged' }, 'another-secret-that-is-also-32-chars-long!')
      mockCookieStore.get.mockReturnValue({ value: forged })

      expect(await getSession()).toBeNull()
    })

    it('returns null for an expired token', async () => {
      mockCookieStore.get.mockReturnValue({ value: await signToken({ token: 'gho_old' }, SECRET, '-1h') })

      expect(await getSession()).toBeNull()
    })

    it('returns null for a valid token that carries no access token', async () => {
      mockCookieStore.get.mockReturnValue({ value: await signToken({}) })

      expect(await getSession()).toBeNull()
    })
  })

  describe('clearSession', () => {
    it('deletes the git-rewind-token cookie', async () => {
      await clearSession()

      expect(mockCookieStore.delete).toHaveBeenCalledWith('git-rewind-token')
    })
  })
})
