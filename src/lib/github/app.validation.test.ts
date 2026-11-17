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
import { authLogger } from '../logger'

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
    vi.restoreAllMocks()
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
  ])('rejects with a handled error when the installations lookup returns %s', async (_label, body) => {
    respondOnce({ login: 'octo' })
    respondOnce(body)

    await expect(getUserInstallation('test-access-token')).rejects.toThrow(
      'GitHub returned an unexpected installations response'
    )
  })

  it.each([
    ['a null account', { id: 1, account: null }],
    ['an enterprise account without a login', { id: 2, account: { id: 5, slug: 'acme', name: 'Acme' } }],
    ['an installation without an account', { id: 3 }],
    ['a non-string account login', { id: 4, account: { login: 7, type: 'User' } }],
    ['a string id', { id: '5', account: { login: 'octo', type: 'User' } }],
    ['an array account', { id: 6, account: ['octo'] }],
  ])('drops an installation with %s and still finds the user installation', async (_label, malformed) => {
    const installation = { id: 9, account: { login: 'octo', type: 'User' } }
    respondOnce({ login: 'octo' })
    respondOnce([malformed, installation])

    expect(await getUserInstallation('test-access-token')).toEqual(installation)
  })

  it('warns with the count of dropped installations', async () => {
    const warnSpy = vi.spyOn(authLogger, 'warn').mockImplementation(() => {})
    respondOnce({ login: 'octo' })
    respondOnce([{ id: 1, account: null }, { id: 9, account: { login: 'octo', type: 'User' } }])

    await getUserInstallation('test-access-token')

    expect(warnSpy).toHaveBeenCalledWith('Dropped 1 malformed installation(s) from GitHub response')
  })

  it('does not warn when every installation is well-formed', async () => {
    const warnSpy = vi.spyOn(authLogger, 'warn').mockImplementation(() => {})
    respondOnce({ login: 'octo' })
    respondOnce([{ id: 9, account: { login: 'octo', type: 'User' } }])

    await getUserInstallation('test-access-token')

    expect(warnSpy).not.toHaveBeenCalled()
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
    ['an empty token', { token: '' }],
  ])('rejects with a handled error when the installation token response is %s', async (_label, body) => {
    respondOnce(body)

    await expect(getInstallationToken(1)).rejects.toThrow('GitHub returned an unexpected installation token response')
  })
})
