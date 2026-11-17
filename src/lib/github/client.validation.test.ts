import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GitHubClient } from './client'

describe('GitHubClient REST response validation', () => {
  const fetchMock = vi.fn()

  function respondWith(body: unknown) {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(body) })
  }

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getPrivateRepos', () => {
    it.each([
      ['an object instead of a list', { message: 'Not Found' }],
      ['null', null],
      ['a list containing null', [null]],
      ['a repo without full_name', [{ private: true, pushed_at: '2024-01-01T00:00:00Z' }]],
      ['a repo with a non-boolean private flag', [{ full_name: 'o/r', private: 'yes', pushed_at: '2024-01-01T00:00:00Z' }]],
      ['a repo with a non-string pushed_at', [{ full_name: 'o/r', private: true, pushed_at: 5 }]],
    ])('rejects with a handled error for %s', async (_label, body) => {
      respondWith(body)

      await expect(new GitHubClient('test-access-token').getPrivateRepos()).rejects.toThrow(
        'GitHub REST API returned an unexpected response'
      )
    })

    it('returns private repos from a well-formed response', async () => {
      respondWith([
        { full_name: 'o/private', private: true, pushed_at: '2024-01-01T00:00:00Z' },
        { full_name: 'o/public', private: false, pushed_at: '2024-01-01T00:00:00Z' },
      ])

      const repos = await new GitHubClient('test-access-token').getPrivateRepos()

      expect(repos.map(r => r.full_name)).toEqual(['o/private'])
    })
  })

  describe('getRepoLanguages', () => {
    it.each([
      ['a list', ['TypeScript']],
      ['null', null],
      ['a non-numeric byte count', { TypeScript: '10' }],
      ['a null byte count', { TypeScript: null }],
    ])('returns no languages for %s', async (_label, body) => {
      respondWith(body)

      expect(await new GitHubClient('test-access-token').getRepoLanguages('o/r')).toEqual({})
    })

    it('returns the byte counts from a well-formed response', async () => {
      respondWith({ TypeScript: 10, CSS: 2 })

      expect(await new GitHubClient('test-access-token').getRepoLanguages('o/r')).toEqual({ TypeScript: 10, CSS: 2 })
    })
  })

  describe('getRepoCommitCount', () => {
    it.each([
      ['an object instead of a list', { message: 'Server Error' }],
      ['null', null],
    ])('counts zero commits for %s', async (_label, body) => {
      respondWith(body)

      expect(await new GitHubClient('test-access-token').getRepoCommitCount('o/r', 'octo', 2024)).toBe(0)
    })

    it('counts commits across the monthly requests for a well-formed response', async () => {
      respondWith([{ sha: 'a' }, { sha: 'b' }])

      expect(await new GitHubClient('test-access-token').getRepoCommitCount('o/r', 'octo', 2024)).toBe(24)
    })
  })
})
