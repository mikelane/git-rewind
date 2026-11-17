// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SignJWT, EncryptJWT, compactDecrypt, jwtDecrypt, decodeProtectedHeader, base64url } from 'jose'

const mockCookieStore = {
  get: vi.fn<(name: string) => { value: string } | undefined>(),
  set: vi.fn<(name: string, value: string, options: Record<string, unknown>) => void>(),
  delete: vi.fn<(name: string) => void>(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

import { sessionKey } from '@/test/session-key'
import { getSession, setSession, clearSession } from './session'

const SECRET = 'a-session-secret-that-is-at-least-32-chars-long'

const OTHER_SECRET = 'another-secret-that-is-also-32-chars-long!'

async function encryptToken(payload: Record<string, unknown>, secret = SECRET, expiresIn = '1h') {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .encrypt(await sessionKey(secret))
}

async function signOnlyToken(payload: Record<string, unknown>, secret = SECRET) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret).slice(0, 32))
}

describe('session cookie', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2024-06-01T12:00:00.999Z'))
    vi.clearAllMocks()
    mockCookieStore.get.mockReset()
    vi.stubEnv('SESSION_SECRET', SECRET)
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  describe('setSession', () => {
    it('sets the git-rewind-token cookie with secure flags and a 24 hour maxAge', async () => {
      await setSession('test-access-token')

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

      await setSession('test-access-token')

      expect(mockCookieStore.set.mock.calls[0][2]).toMatchObject({ secure: true })
    })

    it('stores a five-part compact JWE with alg dir and enc A256GCM', async () => {
      await setSession('test-access-token')

      const stored = mockCookieStore.set.mock.calls[0][1]
      expect(stored.split('.')).toHaveLength(5)
      expect(decodeProtectedHeader(stored)).toMatchObject({ alg: 'dir', enc: 'A256GCM' })
    })

    it.each([0, 1, 2, 3, 4])('does not reveal the token in base64url-decoded segment %i', async (index) => {
      await setSession('test-access-token')

      const segment = mockCookieStore.set.mock.calls[0][1].split('.')[index]
      expect(new TextDecoder().decode(base64url.decode(segment))).not.toContain('test-access-token')
    })

    it('stores a token that decrypts with a key derived from SESSION_SECRET', async () => {
      await setSession('test-access-token')

      const { plaintext } = await compactDecrypt(mockCookieStore.set.mock.calls[0][1], await sessionKey(SECRET))
      expect(JSON.parse(new TextDecoder().decode(plaintext)).token).toBe('test-access-token')
    })

    it('stores a token that does not decrypt with a key derived from a different secret', async () => {
      await setSession('test-access-token')

      await expect(
        compactDecrypt(mockCookieStore.set.mock.calls[0][1], await sessionKey(OTHER_SECRET))
      ).rejects.toThrow()
    })

    it('stores a value getSession can read back', async () => {
      await setSession('test-roundtrip-token')
      const storedValue = mockCookieStore.set.mock.calls[0][1]
      mockCookieStore.get.mockReturnValue({ value: storedValue })

      expect(await getSession()).toEqual({ accessToken: 'test-roundtrip-token' })
    })

    it('throws when SESSION_SECRET is missing', async () => {
      vi.stubEnv('SESSION_SECRET', '')

      await expect(setSession('test-access-token')).rejects.toThrow('SESSION_SECRET environment variable is required')
      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })

    it('throws when SESSION_SECRET is shorter than 32 characters', async () => {
      vi.stubEnv('SESSION_SECRET', 'too-short')

      await expect(setSession('test-access-token')).rejects.toThrow('at least 32 characters')
      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })

    it.each([31])('rejects a %i-character SESSION_SECRET without setting a cookie', async (length) => {
      vi.stubEnv('SESSION_SECRET', 'x'.repeat(length))

      await expect(setSession('test-access-token')).rejects.toThrow('at least 32 characters')
      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })

    it.each([32])('accepts a %i-character SESSION_SECRET and sets a cookie', async (length) => {
      vi.stubEnv('SESSION_SECRET', 'x'.repeat(length))

      await expect(setSession('test-access-token')).resolves.toBeUndefined()
      expect(mockCookieStore.set).toHaveBeenCalledTimes(1)
    })

    it('stores a token that expires 24 hours after it is issued', async () => {
      await setSession('test-access-token')

      const { payload } = await jwtDecrypt(mockCookieStore.set.mock.calls[0][1], await sessionKey(SECRET), {
        keyManagementAlgorithms: ['dir'],
        contentEncryptionAlgorithms: ['A256GCM'],
      })
      expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(86400)
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
      mockCookieStore.get.mockReturnValue({ value: await encryptToken({ token: 'test-valid-token' }) })

      expect(await getSession()).toEqual({ accessToken: 'test-valid-token' })
    })

    it('returns null for a cookie that is not a valid token', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'garbage' })

      expect(await getSession()).toBeNull()
    })

    it('returns null for a cookie encrypted with a different secret', async () => {
      mockCookieStore.get.mockReturnValue({ value: await encryptToken({ token: 'test-forged-token' }, OTHER_SECRET) })

      expect(await getSession()).toBeNull()
    })

    it('returns null for a truncated cookie', async () => {
      const valid = await encryptToken({ token: 'test-valid-token' })
      mockCookieStore.get.mockReturnValue({ value: valid.slice(0, valid.length - 10) })

      expect(await getSession()).toBeNull()
    })

    it('returns null for an old signed-only cookie', async () => {
      mockCookieStore.get.mockReturnValue({ value: await signOnlyToken({ token: 'test-old-token' }) })

      expect(await getSession()).toBeNull()
    })

    it('returns null for an expired token', async () => {
      mockCookieStore.get.mockReturnValue({ value: await encryptToken({ token: 'test-old-token' }, SECRET, '-1h') })

      expect(await getSession()).toBeNull()
    })

    it('returns null for a valid token that carries no access token', async () => {
      mockCookieStore.get.mockReturnValue({ value: await encryptToken({}) })

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
