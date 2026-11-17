import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GitHubClient } from './client'

// Issue #65 AC2: "grep the files in item 2 for ' as ' and untyped json() property access.
// None remain, and a malformed GitHub response produces a handled error, not a crash."
// client.ts graphql query() still reads .errors / .data off an unvalidated json() body,
// so a malformed GraphQL body surfaces as a raw TypeError instead of a handled error.
describe('GitHubClient GraphQL response validation', () => {
  const fetchMock = vi.fn()

  function respondWith(body: unknown) {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(body) })
  }

  function isHandledError(error: unknown) {
    return error instanceof Error && !(error instanceof TypeError)
  }

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['null', null],
    ['an empty object', {}],
    ['a null data field', { data: null }],
    ['a data object without a viewer', { data: {} }],
    ['a viewer without a login', { data: { viewer: {} } }],
    ['a viewer with an empty login', { data: { viewer: { login: '' } } }],
  ])('getViewer rejects with a handled error when the GraphQL body is %s', async (_label, body) => {
    respondWith(body)

    await expect(new GitHubClient('test-access-token').getViewer()).rejects.toSatisfy(isHandledError)
  })

  it('getUserContributions rejects with a handled error when the GraphQL body is null', async () => {
    respondWith(null)

    await expect(new GitHubClient('test-access-token').getUserContributions('octo', 2024)).rejects.toSatisfy(
      isHandledError
    )
  })
})
