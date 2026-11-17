import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GitHubClient } from './client'
import { githubLogger } from '../logger'

const MONTHS_PER_YEAR = 12

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
    vi.restoreAllMocks()
  })

  describe('getPrivateRepos', () => {
    it.each([
      ['an object instead of a list', { message: 'Not Found' }],
      ['null', null],
    ])('rejects with a handled error for %s', async (_label, body) => {
      respondWith(body)

      await expect(new GitHubClient('test-access-token').getPrivateRepos()).rejects.toThrow(
        'GitHub REST API returned an unexpected response'
      )
    })

    it.each([
      ['null', null],
      ['a repo without full_name', { private: true, pushed_at: '2024-06-01T00:00:00Z' }],
      ['a repo with a non-boolean private flag', { full_name: 'o/bad', private: 'yes', pushed_at: '2024-06-01T00:00:00Z' }],
      ['a repo with a non-string pushed_at', { full_name: 'o/bad', private: true, pushed_at: 5 }],
    ])('drops a malformed item that is %s and returns the valid repos', async (_label, malformed) => {
      respondWith([malformed, { full_name: 'o/active', private: true, pushed_at: '2024-06-01T00:00:00Z' }])

      const repos = await new GitHubClient('test-access-token').getPrivateRepos(2024)

      expect(repos.map(r => r.full_name)).toEqual(['o/active'])
    })

    it('returns only the active repos when one repo has a null pushed_at', async () => {
      respondWith([
        { full_name: 'o/never-pushed', private: true, pushed_at: null },
        { full_name: 'o/active', private: true, pushed_at: '2024-06-01T00:00:00Z' },
      ])

      const repos = await new GitHubClient('test-access-token').getPrivateRepos(2024)

      expect(repos.map(r => r.full_name)).toEqual(['o/active'])
    })

    it('warns with the count of dropped repos', async () => {
      const warnSpy = vi.spyOn(githubLogger, 'warn').mockImplementation(() => {})
      respondWith([null, { full_name: 'o/active', private: true, pushed_at: '2024-06-01T00:00:00Z' }])

      await new GitHubClient('test-access-token').getPrivateRepos(2024)

      expect(warnSpy).toHaveBeenCalledWith('Dropped 1 malformed private repo(s) from GitHub response')
    })

    it('does not warn when every repo is well-formed', async () => {
      const warnSpy = vi.spyOn(githubLogger, 'warn').mockImplementation(() => {})
      respondWith([{ full_name: 'o/active', private: true, pushed_at: '2024-06-01T00:00:00Z' }])

      await new GitHubClient('test-access-token').getPrivateRepos(2024)

      expect(warnSpy).not.toHaveBeenCalled()
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
      ['a list of strings', ['TypeScript']],
      ['a list of numbers', [1, 2]],
      ['a NaN byte count', { TypeScript: NaN }],
      ['an infinite byte count', { TypeScript: Infinity }],
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
      ['a commit with a numeric sha', [{ sha: 5 }]],
      ['a null commit', [null]],
    ])('counts zero commits for %s', async (_label, body) => {
      respondWith(body)

      expect(await new GitHubClient('test-access-token').getRepoCommitCount('o/r', 'octo', 2024)).toBe(0)
    })

    it('counts commits across the monthly requests for a well-formed response', async () => {
      const commitsPerMonth = [{ sha: 'a' }, { sha: 'b' }]
      respondWith(commitsPerMonth)

      const count = await new GitHubClient('test-access-token').getRepoCommitCount('o/r', 'octo', 2024)

      expect(fetchMock).toHaveBeenCalledTimes(MONTHS_PER_YEAR)
      expect(count).toBe(commitsPerMonth.length * MONTHS_PER_YEAR)
    })
  })
})
