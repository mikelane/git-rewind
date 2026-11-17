// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { YearStats } from '@/lib/github/types'

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() }
const mockGetViewer = vi.fn()
const mockGetUserContributions = vi.fn()
const mockProcessContributions = vi.fn()

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}))

vi.mock('@/lib/github', () => ({
  GitHubClient: class {
    getViewer = mockGetViewer
    getUserContributions = mockGetUserContributions
    getPrivateRepoStats = vi.fn()
  },
  processContributions: (...args: unknown[]) => mockProcessContributions(...args),
}))

vi.mock('@/lib/logger', () => ({
  statsLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { setSession } from '@/lib/auth'
import { GET } from './route'

const SESSION_SECRET = 'a-session-secret-that-is-at-least-32-chars-long'

const STATS = { year: 2024, totalCommits: 42 } as unknown as YearStats

function statsRequest(query = '?year=2024&clientDate=2024-12-31') {
  return new NextRequest(`http://localhost/api/stats${query}`)
}

async function signInWithValidSession() {
  await setSession('test-access-token')
  mockCookieStore.get.mockReturnValue({ value: mockCookieStore.set.mock.calls[0][1] })
}

describe('GET /api/stats', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    mockCookieStore.get.mockReset()
    mockCookieStore.set.mockReset()
    vi.stubEnv('SESSION_SECRET', SESSION_SECRET)
    mockGetViewer.mockReset()
    mockGetUserContributions.mockReset()
    mockProcessContributions.mockReset()
  })

  it('returns 401 when there is no session', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    const response = await GET(statsRequest())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Not authenticated' })
    expect(mockGetViewer).not.toHaveBeenCalled()
  })

  it('returns 401 when the session cookie is invalid', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'garbage' })

    const response = await GET(statsRequest('?year=2024'))

    expect(response.status).toBe(401)
    expect(mockGetUserContributions).not.toHaveBeenCalled()
  })

  it('returns a 401 JSON error when GitHub rejects the access token', async () => {
    await signInWithValidSession()
    mockGetViewer.mockRejectedValue(new Error('GitHub API error: 401 Unauthorized'))

    const response = await GET(statsRequest())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Authentication failed. Please re-authenticate.' })
  })

  it('returns the processed stats when GitHub responds', async () => {
    await signInWithValidSession()
    mockGetViewer.mockResolvedValue({ login: 'octo' })
    mockGetUserContributions.mockResolvedValue({ user: { contributionsCollection: {} } })
    mockProcessContributions.mockReturnValue(STATS)

    const response = await GET(statsRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(STATS)
    expect(mockGetUserContributions).toHaveBeenCalledWith('octo', 2024)
  })

  it('returns 400 for a year before GitHub existed', async () => {
    await signInWithValidSession()

    const response = await GET(statsRequest('?year=1999&clientDate=2024-12-31'))

    expect(response.status).toBe(400)
  })
})
