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

describe('GitHub App fetch caching', () => {
  const fetchMock = vi.fn()

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

  it('does not cache the installation access token request', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ token: 'ghs_token' }) })

    await getInstallationToken(42)

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/app/installations/42/access_tokens')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', cache: 'no-store' })
  })

  it('does not cache the user lookup or the installations lookup', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ login: 'octo' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })

    await getUserInstallation('gho_token')

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/user')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: 'no-store' })
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.github.com/app/installations')
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ cache: 'no-store' })
  })
})
