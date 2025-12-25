import { describe, it, expect } from 'vitest'
import {
  GitHubAuthError,
  GitHubRateLimitError,
  GitHubApiError,
  classifyGitHubError,
} from './errors'

describe('GitHubAuthError', () => {
  it('is an instance of Error', () => {
    const error = new GitHubAuthError('test')
    expect(error).toBeInstanceOf(Error)
  })

  it('has name set to GitHubAuthError', () => {
    const error = new GitHubAuthError('test')
    expect(error.name).toBe('GitHubAuthError')
  })

  it('has statusCode 401', () => {
    const error = new GitHubAuthError('test')
    expect(error.statusCode).toBe(401)
  })
})

describe('GitHubRateLimitError', () => {
  it('is an instance of Error', () => {
    const error = new GitHubRateLimitError('test')
    expect(error).toBeInstanceOf(Error)
  })

  it('has name set to GitHubRateLimitError', () => {
    const error = new GitHubRateLimitError('test')
    expect(error.name).toBe('GitHubRateLimitError')
  })

  it('has statusCode 429', () => {
    const error = new GitHubRateLimitError('test')
    expect(error.statusCode).toBe(429)
  })
})

describe('GitHubApiError', () => {
  it('is an instance of Error', () => {
    const error = new GitHubApiError('test')
    expect(error).toBeInstanceOf(Error)
  })

  it('has name set to GitHubApiError', () => {
    const error = new GitHubApiError('test')
    expect(error.name).toBe('GitHubApiError')
  })

  it('has statusCode 500 by default', () => {
    const error = new GitHubApiError('test')
    expect(error.statusCode).toBe(500)
  })

  it('accepts custom status code', () => {
    const error = new GitHubApiError('test', 503)
    expect(error.statusCode).toBe(503)
  })
})

describe('classifyGitHubError', () => {
  describe('authentication errors', () => {
    it('returns GitHubAuthError for 401 status in message', () => {
      const result = classifyGitHubError(new Error('Request failed with status 401'))
      expect(result).toBeInstanceOf(GitHubAuthError)
    })

    it('returns GitHubAuthError for Unauthorized in message', () => {
      const result = classifyGitHubError(new Error('Unauthorized access'))
      expect(result).toBeInstanceOf(GitHubAuthError)
    })

    it('returns GitHubAuthError for Bad credentials message', () => {
      const result = classifyGitHubError(new Error('Bad credentials'))
      expect(result).toBeInstanceOf(GitHubAuthError)
    })
  })

  describe('rate limit errors', () => {
    it('returns GitHubRateLimitError for rate limit message', () => {
      const result = classifyGitHubError(new Error('API rate limit exceeded'))
      expect(result).toBeInstanceOf(GitHubRateLimitError)
    })

    it('returns GitHubRateLimitError for 403 with rate limit context', () => {
      const result = classifyGitHubError(new Error('403: rate limit'))
      expect(result).toBeInstanceOf(GitHubRateLimitError)
    })

    it('returns GitHubRateLimitError for secondary rate limit', () => {
      const result = classifyGitHubError(new Error('secondary rate limit'))
      expect(result).toBeInstanceOf(GitHubRateLimitError)
    })
  })

  describe('generic errors', () => {
    it('returns GitHubApiError for unknown errors', () => {
      const result = classifyGitHubError(new Error('Something went wrong'))
      expect(result).toBeInstanceOf(GitHubApiError)
    })

    it('preserves original message in wrapped error', () => {
      const result = classifyGitHubError(new Error('Original message'))
      expect(result.message).toContain('Original message')
    })
  })

  describe('non-Error inputs', () => {
    it('handles string thrown as error', () => {
      const result = classifyGitHubError('String error')
      expect(result).toBeInstanceOf(GitHubApiError)
    })

    it('handles null', () => {
      const result = classifyGitHubError(null)
      expect(result).toBeInstanceOf(GitHubApiError)
    })

    it('handles undefined', () => {
      const result = classifyGitHubError(undefined)
      expect(result).toBeInstanceOf(GitHubApiError)
    })
  })
})
