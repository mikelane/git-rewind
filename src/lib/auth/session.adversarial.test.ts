// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SignJWT, EncryptJWT, CompactEncrypt, UnsecuredJWT, base64url } from 'jose'

const mockCookieStore = {
  get: vi.fn<(name: string) => { value: string } | undefined>(),
  set: vi.fn<(name: string, value: string, options: Record<string, unknown>) => void>(),
  delete: vi.fn<(name: string) => void>(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

import { sessionKey } from '@/test/session-key'
import { getSession, setSession } from './session'

const SECRET = 'a-session-secret-that-is-at-least-32-chars-long'

async function encryptPayload(payload: Record<string, unknown>) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .encrypt(await sessionKey(SECRET))
}

function flipFirstChar(segment: string): string {
  const bytes = base64url.decode(segment)
  bytes[0] = bytes[0] ^ 0x01
  return base64url.encode(bytes)
}

async function cookieWithTamperedSegment(index: number): Promise<string> {
  const parts = (await encryptPayload({ token: 'test-valid-token' })).split('.')
  parts[index] = flipFirstChar(parts[index])
  return parts.join('.')
}

async function readCookie(value: string) {
  mockCookieStore.get.mockReturnValue({ value })
  return getSession()
}

describe('session cookie (adversarial)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookieStore.get.mockReset()
    vi.stubEnv('SESSION_SECRET', SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('algorithm confusion', () => {
    it('returns null for an unsecured alg none JWT', async () => {
      const unsecured = new UnsecuredJWT({ token: 'test-forged-token' }).setIssuedAt().setExpirationTime('1h').encode()

      expect(await readCookie(unsecured)).toBeNull()
    })

    it('returns null for an HS256 JWS signed with the derived key', async () => {
      const signed = await new SignJWT({ token: 'test-forged-token' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(await sessionKey(SECRET))

      expect(await readCookie(signed)).toBeNull()
    })

    it('returns null for a dir JWE using A128GCM with a 128-bit derived key', async () => {
      const jwe = await new EncryptJWT({ token: 'test-forged-token' })
        .setProtectedHeader({ alg: 'dir', enc: 'A128GCM' })
        .setExpirationTime('1h')
        .encrypt(await sessionKey(SECRET, 128))

      expect(await readCookie(jwe)).toBeNull()
    })

    it('returns null for a dir JWE using A256CBC-HS512', async () => {
      const jwe = await new EncryptJWT({ token: 'test-forged-token' })
        .setProtectedHeader({ alg: 'dir', enc: 'A256CBC-HS512' })
        .setExpirationTime('1h')
        .encrypt(await sessionKey(SECRET, 512))

      expect(await readCookie(jwe)).toBeNull()
    })

    it('returns null for an A256KW JWE wrapped with the derived key', async () => {
      const jwe = await new EncryptJWT({ token: 'test-forged-token' })
        .setProtectedHeader({ alg: 'A256KW', enc: 'A256GCM' })
        .setExpirationTime('1h')
        .encrypt(await sessionKey(SECRET))

      expect(await readCookie(jwe)).toBeNull()
    })

    it('returns null for a JWE with an unknown crit header', async () => {
      const jwe = await new EncryptJWT({ token: 'test-forged-token' })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM', crit: ['x-evil'], 'x-evil': true })
        .setExpirationTime('1h')
        .encrypt(await sessionKey(SECRET), { crit: { 'x-evil': true } })

      expect(await readCookie(jwe)).toBeNull()
    })
  })

  describe('tampering', () => {
    it.each([
      [0, 'protected header'],
      [2, 'IV'],
      [3, 'ciphertext'],
      [4, 'tag'],
    ])('returns null when segment %i (%s) has a flipped bit', async (index) => {
      expect(await readCookie(await cookieWithTamperedSegment(index))).toBeNull()
    })

    it('returns null when the encrypted-key segment is non-empty for alg dir', async () => {
      const parts = (await encryptPayload({ token: 'test-valid-token' })).split('.')
      parts[1] = base64url.encode(new Uint8Array(32))

      expect(await readCookie(parts.join('.'))).toBeNull()
    })

    it('returns null for a six-part value', async () => {
      expect(await readCookie(`${await encryptPayload({ token: 'test-valid-token' })}.AAAA`)).toBeNull()
    })

    it('returns null for a JWE whose plaintext is not JSON', async () => {
      const jwe = await new CompactEncrypt(new TextEncoder().encode('test-not-json'))
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .encrypt(await sessionKey(SECRET))

      expect(await readCookie(jwe)).toBeNull()
    })
  })

  describe('payload shape', () => {
    it('returns null when the token claim is an empty string', async () => {
      expect(await readCookie(await encryptPayload({ token: '' }))).toBeNull()
    })

    it.each([
      ['a number', 12345],
      ['an object', { nested: 'test-value' }],
      ['an array', ['test-value']],
      ['true', true],
    ])('returns null when the token claim is %s', async (_label, token) => {
      expect(await readCookie(await encryptPayload({ token }))).toBeNull()
    })
  })

  describe('expiry claim', () => {
    it('returns null when the JWE has no exp claim', async () => {
      const jwe = await new EncryptJWT({ token: 'test-valid-token' })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .encrypt(await sessionKey(SECRET))

      expect(await readCookie(jwe)).toBeNull()
    })
  })

  describe('SESSION_SECRET handling on read', () => {
    it('returns null without throwing when SESSION_SECRET is missing', async () => {
      const cookie = await encryptPayload({ token: 'test-valid-token' })
      vi.stubEnv('SESSION_SECRET', '')

      expect(await readCookie(cookie)).toBeNull()
    })

    it('returns null without throwing when SESSION_SECRET is too short', async () => {
      const cookie = await encryptPayload({ token: 'test-valid-token' })
      vi.stubEnv('SESSION_SECRET', 'too-short')

      expect(await readCookie(cookie)).toBeNull()
    })
  })

  describe('repeat calls', () => {
    it('produces a different ciphertext for the same token on each call', async () => {
      await setSession('test-access-token')
      await setSession('test-access-token')

      expect(mockCookieStore.set.mock.calls[0][1]).not.toBe(mockCookieStore.set.mock.calls[1][1])
    })

    it('round-trips a token containing non-ASCII and JSON-significant characters', async () => {
      await setSession('test-"tok\\en"-✓')

      expect(await readCookie(mockCookieStore.set.mock.calls[0][1])).toEqual({ accessToken: 'test-"tok\\en"-✓' })
    })
  })
})
