/**
 * Custom error classes for GitHub API errors.
 * These provide specific error types that can be caught and handled appropriately.
 */

export class GitHubAuthError extends Error {
  readonly statusCode = 401

  constructor(message: string) {
    super(message)
    this.name = 'GitHubAuthError'
  }
}

export class GitHubRateLimitError extends Error {
  readonly statusCode = 429

  constructor(message: string) {
    super(message)
    this.name = 'GitHubRateLimitError'
  }
}

export class GitHubApiError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'GitHubApiError'
    this.statusCode = statusCode
  }
}

/**
 * Classifies an unknown error into a specific GitHub error type.
 * Analyzes error message patterns to determine the appropriate error class.
 */
export function classifyGitHubError(error: unknown): GitHubAuthError | GitHubRateLimitError | GitHubApiError {
  const message = error instanceof Error ? error.message : String(error || 'Unknown error')
  const lowerMessage = message.toLowerCase()

  // Authentication errors
  if (
    lowerMessage.includes('401') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('bad credentials')
  ) {
    return new GitHubAuthError(message)
  }

  // Rate limit errors
  if (
    lowerMessage.includes('rate limit') ||
    (lowerMessage.includes('403') && lowerMessage.includes('rate'))
  ) {
    return new GitHubRateLimitError(message)
  }

  // Generic API error
  return new GitHubApiError(message)
}
