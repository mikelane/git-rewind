import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('jose', () => {
  class FakeSignJWT {
    setProtectedHeader() { return this }
    setIssuedAt() { return this }
    setExpirationTime() { return this }
    setIssuer() { return this }
    sign() { return Promise.resolve('app-jwt') }
  }
  return { SignJWT: FakeSignJWT, importPKCS8: vi.fn(() => Promise.resolve({})) }
})

import { getInstallationToken, getUserInstallation } from './app'

describe('GitHub App response validation', () => {
  const fetchMock = vi.fn()

  function respondOnce(body: unknown) {
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(body) })
  }

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('GITHUB_APP_ID', '123')
    vi.stubEnv('GITHUB_APP_PRIVATE_KEY', 'key')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it.each([
    ['an empty object', {}],
    ['null', null],
    ['a numeric login', { login: 5 }],
    ['an empty login', { login: '' }],
  ])('rejects with a handled error when the user lookup returns %s', async (_label, body) => {
    respondOnce(body)

    await expect(getUserInstallation('test-access-token')).rejects.toThrow('GitHub returned an unexpected user response')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['an object instead of a list', { message: 'Not Found' }],
    ['null', null],
    ['an installation without an account', [{ id: 1 }]],
    ['an installation with a non-string account login', [{ id: 1, account: { login: 7, type: 'User' } }]],
  ])('rejects with a handled error when the installations lookup returns %s', async (_label, body) => {
    respondOnce({ login: 'octo' })
    respondOnce(body)

    await expect(getUserInstallation('test-access-token')).rejects.toThrow(
      'GitHub returned an unexpected installations response'
    )
  })

  it('returns the installation for the matching login regardless of case', async () => {
    const installation = { id: 9, account: { login: 'Octo', type: 'User' } }
    respondOnce({ login: 'octo' })
    respondOnce([installation])

    expect(await getUserInstallation('test-access-token')).toEqual(installation)
  })

  it('returns null when no installation matches the login', async () => {
    respondOnce({ login: 'octo' })
    respondOnce([{ id: 9, account: { login: 'someone-else', type: 'User' } }])

    expect(await getUserInstallation('test-access-token')).toBeNull()
  })

  it('returns the token from a well-formed installation token response', async () => {
    respondOnce({ token: 'test-installation-token', expires_at: '2024-01-01T00:00:00Z' })

    expect(await getInstallationToken(1)).toBe('test-installation-token')
  })

  it.each([
    ['an empty object', {}],
    ['null', null],
    ['a non-string token', { token: 5 }],
  ])('rejects with a handled error when the installation token response is %s', async (_label, body) => {
    respondOnce(body)

    await expect(getInstallationToken(1)).rejects.toThrow('GitHub returned an unexpected installation token response')
  })
})
