import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GitHubClient } from './client'
import type { GitHubContributionsResponse } from './types'

const UNEXPECTED_RESPONSE = 'GitHub GraphQL API returned an unexpected response'

function validContributionsData(): GitHubContributionsResponse {
  return {
    user: {
      login: 'octo',
      name: 'Octo Cat',
      avatarUrl: 'https://example.com/octo.png',
      contributionsCollection: {
        totalCommitContributions: 10,
        totalPullRequestContributions: 2,
        totalPullRequestReviewContributions: 3,
        totalIssueContributions: 1,
        totalRepositoryContributions: 1,
        restrictedContributionsCount: 4,
        contributionCalendar: {
          totalContributions: 20,
          weeks: [
            {
              contributionDays: [
                { date: '2024-01-01', contributionCount: 5, contributionLevel: 'FOURTH_QUARTILE' },
                { date: '2024-01-02', contributionCount: 0, contributionLevel: 'NONE' },
              ],
            },
          ],
        },
        commitContributionsByRepository: [
          {
            repository: {
              name: 'widgets',
              nameWithOwner: 'octo/widgets',
              primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
              languages: {
                edges: [{ size: 1000, node: { name: 'TypeScript', color: '#3178c6' } }],
                totalSize: 1000,
              },
            },
            contributions: { totalCount: 10 },
          },
        ],
        pullRequestContributions: {
          totalCount: 1,
          nodes: [
            {
              occurredAt: '2024-02-01T00:00:00Z',
              pullRequest: { title: 'Add widget', merged: true, repository: { nameWithOwner: 'octo/widgets' } },
            },
          ],
        },
        pullRequestReviewContributions: {
          totalCount: 1,
          nodes: [
            {
              occurredAt: '2024-02-02T00:00:00Z',
              pullRequest: { title: 'Fix widget', author: { login: 'someone' } },
            },
          ],
        },
        issueContributions: {
          totalCount: 1,
          nodes: [{ occurredAt: '2024-02-03T00:00:00Z', issue: { title: 'Widget broke', closedAt: '2024-02-04T00:00:00Z' } }],
        },
      },
    },
  }
}

const COLLECTION = ['user', 'contributionsCollection']
const CALENDAR = [...COLLECTION, 'contributionCalendar']
const FIRST_DAY = [...CALENDAR, 'weeks', '0', 'contributionDays', '0']
const FIRST_REPO_ENTRY = [...COLLECTION, 'commitContributionsByRepository', '0']
const FIRST_REPO = [...FIRST_REPO_ENTRY, 'repository']
const FIRST_PR = [...COLLECTION, 'pullRequestContributions', 'nodes', '0']
const FIRST_REVIEW = [...COLLECTION, 'pullRequestReviewContributions', 'nodes', '0']
const FIRST_ISSUE = [...COLLECTION, 'issueContributions', 'nodes', '0']

function withValueAt(path: string[], value: unknown): GitHubContributionsResponse {
  const data = validContributionsData()
  const parentPath = path.slice(0, -1)
  const lastKey = path[path.length - 1]
  const parent = parentPath.reduce<unknown>((node, key) => Reflect.get(Object(node), key), data)
  Reflect.set(Object(parent), lastKey, value)
  return data
}

const TOTAL_FIELDS = [
  'totalCommitContributions',
  'totalPullRequestContributions',
  'totalPullRequestReviewContributions',
  'totalIssueContributions',
  'totalRepositoryContributions',
  'restrictedContributionsCount',
]

describe('GitHubClient GraphQL response validation', () => {
  const fetchMock = vi.fn()

  function respondWith(body: unknown) {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(body) })
  }

  function getContributions() {
    return new GitHubClient('test-access-token').getUserContributions('octo', 2024)
  }

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getViewer', () => {
    it.each([
      ['null', null],
      ['an empty object', {}],
      ['a null data field', { data: null }],
      ['a data object without a viewer', { data: {} }],
      ['a viewer without a login', { data: { viewer: {} } }],
      ['a viewer with an empty login', { data: { viewer: { login: '', name: null, avatarUrl: 'https://example.com/a.png' } } }],
      ['a viewer with a numeric name', { data: { viewer: { login: 'octo', name: 5, avatarUrl: 'https://example.com/a.png' } } }],
      ['a viewer without an avatarUrl', { data: { viewer: { login: 'octo', name: null } } }],
    ])('rejects with the unexpected-response error when the GraphQL body is %s', async (_label, body) => {
      respondWith(body)

      await expect(new GitHubClient('test-access-token').getViewer()).rejects.toThrow(UNEXPECTED_RESPONSE)
    })

    it('returns a viewer whose name is null', async () => {
      const viewer = { login: 'octo', name: null, avatarUrl: 'https://example.com/a.png' }
      respondWith({ data: { viewer } })

      expect(await new GitHubClient('test-access-token').getViewer()).toEqual(viewer)
    })
  })

  describe('getUserContributions', () => {
    it.each([
      ['null', null],
      ['an empty object', {}],
      ['an empty data object', { data: {} }],
      ['a user without fields', { data: { user: {} } }],
      ['a null user', { data: { user: null } }],
      ['an empty login', { data: withValueAt(['user', 'login'], '') }],
    ])('rejects with the unexpected-response error when the GraphQL body is %s', async (_label, body) => {
      respondWith(body)

      await expect(getContributions()).rejects.toThrow(UNEXPECTED_RESPONSE)
    })

    const malformedFields: [string, string[], unknown][] = [
      ['a non-string name', ['user', 'name'], 5],
      ['a missing avatarUrl', ['user', 'avatarUrl'], undefined],
      ['a null contributionsCollection', COLLECTION, null],
      ...TOTAL_FIELDS.map((field): [string, string[], unknown] => [`a non-numeric ${field}`, [...COLLECTION, field], '5']),
      ['a null contributionCalendar', CALENDAR, null],
      ['a non-numeric calendar total', [...CALENDAR, 'totalContributions'], '20'],
      ['non-list calendar weeks', [...CALENDAR, 'weeks'], 'none'],
      ['a null calendar week', [...CALENDAR, 'weeks', '0'], null],
      ['null contribution days', [...CALENDAR, 'weeks', '0', 'contributionDays'], null],
      ['a null contribution day', FIRST_DAY, null],
      ['a non-string day date', [...FIRST_DAY, 'date'], 20240101],
      ['a non-numeric day count', [...FIRST_DAY, 'contributionCount'], '5'],
      ['an unknown contribution level', [...FIRST_DAY, 'contributionLevel'], 'LOTS'],
      ['null commit contributions by repository', [...COLLECTION, 'commitContributionsByRepository'], null],
      ['a null repository entry', FIRST_REPO_ENTRY, null],
      ['null repository contributions', [...FIRST_REPO_ENTRY, 'contributions'], null],
      ['a non-numeric repository commit count', [...FIRST_REPO_ENTRY, 'contributions', 'totalCount'], '10'],
      ['a non-string repository name', [...FIRST_REPO, 'name'], 5],
      ['a non-string repository nameWithOwner', [...FIRST_REPO, 'nameWithOwner'], 5],
      ['a primary language without a name', [...FIRST_REPO, 'primaryLanguage'], {}],
      ['a non-string primary language color', [...FIRST_REPO, 'primaryLanguage', 'color'], 5],
      ['non-list language edges', [...FIRST_REPO, 'languages', 'edges'], 'none'],
      ['a non-numeric language edge size', [...FIRST_REPO, 'languages', 'edges', '0', 'size'], '1000'],
      ['a null language edge node', [...FIRST_REPO, 'languages', 'edges', '0', 'node'], null],
      ['a non-string language edge node name', [...FIRST_REPO, 'languages', 'edges', '0', 'node', 'name'], 5],
      ['a non-numeric language total size', [...FIRST_REPO, 'languages', 'totalSize'], '1000'],
      ['null pull request contributions', [...COLLECTION, 'pullRequestContributions'], null],
      ['a non-numeric pull request total count', [...COLLECTION, 'pullRequestContributions', 'totalCount'], '1'],
      ['non-list pull request nodes', [...COLLECTION, 'pullRequestContributions', 'nodes'], 'none'],
      ['a pull request contribution without a pull request', [...FIRST_PR, 'pullRequest'], null],
      ['a non-boolean pull request merged flag', [...FIRST_PR, 'pullRequest', 'merged'], 'yes'],
      ['a non-string pull request occurredAt', [...FIRST_PR, 'occurredAt'], 5],
      ['null review contributions', [...COLLECTION, 'pullRequestReviewContributions'], null],
      ['a review contribution without a pull request', [...FIRST_REVIEW, 'pullRequest'], null],
      ['a numeric review pull request author', [...FIRST_REVIEW, 'pullRequest', 'author'], 5],
      ['a review author without a login', [...FIRST_REVIEW, 'pullRequest', 'author', 'login'], 5],
      ['null issue contributions', [...COLLECTION, 'issueContributions'], null],
      ['an issue contribution without an issue', [...FIRST_ISSUE, 'issue'], null],
      ['a non-string issue closedAt', [...FIRST_ISSUE, 'issue', 'closedAt'], 5],
    ]

    it.each(malformedFields)('rejects with the unexpected-response error for %s', async (_label, path, value) => {
      respondWith({ data: withValueAt(path, value) })

      await expect(getContributions()).rejects.toThrow(UNEXPECTED_RESPONSE)
    })

    it('returns a well-formed contributions response', async () => {
      const data = validContributionsData()
      respondWith({ data })

      expect(await getContributions()).toEqual(data)
    })

    it.each([
      ['a null name', ['user', 'name']],
      ['a null primary language', [...FIRST_REPO, 'primaryLanguage']],
      ['a null primary language color', [...FIRST_REPO, 'primaryLanguage', 'color']],
      ['a null language edge node color', [...FIRST_REPO, 'languages', 'edges', '0', 'node', 'color']],
      ['null languages', [...FIRST_REPO, 'languages']],
      ['null language edges', [...FIRST_REPO, 'languages', 'edges']],
      ['a null language edge', [...FIRST_REPO, 'languages', 'edges', '0']],
      ['a null repository from a deleted repo', FIRST_REPO],
      ['null pull request nodes', [...COLLECTION, 'pullRequestContributions', 'nodes']],
      ['a null pull request node', FIRST_PR],
      ['null review nodes', [...COLLECTION, 'pullRequestReviewContributions', 'nodes']],
      ['a null review node', FIRST_REVIEW],
      ['a null review author', [...FIRST_REVIEW, 'pullRequest', 'author']],
      ['null issue nodes', [...COLLECTION, 'issueContributions', 'nodes']],
      ['a null issue node', FIRST_ISSUE],
      ['a null issue closedAt', [...FIRST_ISSUE, 'issue', 'closedAt']],
    ])('returns the data when GitHub legitimately sends %s', async (_label, path) => {
      const data = withValueAt(path, null)
      respondWith({ data })

      expect(await getContributions()).toEqual(data)
    })

    it('returns the data when the calendar and repository lists are empty', async () => {
      const data = withValueAt([...CALENDAR, 'weeks'], [])
      Reflect.set(Object(Reflect.get(Object(data.user), 'contributionsCollection')), 'commitContributionsByRepository', [])
      respondWith({ data })

      expect(await getContributions()).toEqual(data)
    })
  })

  describe('GraphQL errors', () => {
    it('returns the data when the errors list is empty', async () => {
      const data = validContributionsData()
      respondWith({ data, errors: [] })

      expect(await getContributions()).toEqual(data)
    })

    it('throws the first error message when errors are present', async () => {
      respondWith({ data: validContributionsData(), errors: [{ message: 'Resource limit exceeded' }] })

      await expect(getContributions()).rejects.toThrow('GraphQL error: Resource limit exceeded')
    })

    it('throws an unknown error when the first error has no message', async () => {
      respondWith({ errors: [{ type: 'RATE_LIMITED' }] })

      await expect(getContributions()).rejects.toThrow('GraphQL error: unknown error')
    })
  })
})
