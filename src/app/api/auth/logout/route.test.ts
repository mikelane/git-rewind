import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

import { GET, POST } from './route'

describe.each([
  ['GET', GET],
  ['POST', POST],
])('%s /api/auth/logout', (_method, handler) => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('redirects with a 307 to the landing page', async () => {
    const response = await handler()

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
  })

  it('clears the session cookie', async () => {
    await handler()

    expect(mockCookieStore.delete).toHaveBeenCalledTimes(1)
    expect(mockCookieStore.delete).toHaveBeenCalledWith('git-rewind-token')
  })

  it('does not set any cookie', async () => {
    await handler()

    expect(mockCookieStore.set).not.toHaveBeenCalled()
  })
})
