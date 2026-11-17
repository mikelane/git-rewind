import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GitHubClient } from './client'

describe('GitHubClient fetch caching', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not cache REST GET requests made with a user token', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ TypeScript: 10 }) })

    await new GitHubClient('test-access-token').getRepoLanguages('octo/repo')

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/repos/octo/repo/languages')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: 'no-store' })
  })

  it('does not cache GraphQL requests made with a user token', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { viewer: { login: 'octo' } } }),
    })

    await new GitHubClient('test-access-token').getViewer()

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: 'no-store' })
  })
})
