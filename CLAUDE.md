# CLAUDE.md

## Project Overview

Git Rewind is a privacy-focused GitHub year-in-review tool that uses **GitHub Apps** with fine-grained, read-only permissions instead of OAuth's overly-broad `repo` scope.

## Why This Exists

Existing GitHub Wrapped tools require the `repo` OAuth scope, which grants full read/write access to all repositories (including private ones). GitHub's OAuth system has no read-only scope for private repos. GitHub Apps solve this by supporting granular, read-only permissions.

## Architecture Decisions

### GitHub App vs OAuth App

We use a **GitHub App** because:
- Fine-grained permissions (read-only access to specific data)
- Users can limit access to specific repositories
- No write access ever granted
- Installation-based auth (can be revoked per-repo)

### Permissions Required

The GitHub App requests only:
- `contents: read` - Read commit history and contribution data
- `metadata: read` - Basic repository information
- `pull_requests: read` - PR contribution stats (optional)
- `issues: read` - Issue contribution stats (optional)

**Never requested:**
- Any write permissions
- Admin access
- Secrets or environment variables

## Tech Stack

- **Frontend:** Next.js 14+ with App Router
- **Styling:** Tailwind CSS
- **Auth:** GitHub App installation flow
- **API:** GitHub GraphQL API (for efficient data fetching)
- **Deployment:** Vercel (or self-hostable)

## Development Standards

### TDD is Mandatory

Follow Uncle Bob's Three Rules:
1. No production code without a failing test
2. Write only enough test to fail
3. Write only enough code to pass

### Code Quality

- TypeScript strict mode
- ESLint + Prettier
- No `any` types
- Explicit error handling

## Key Files

```
src/
  app/              # Next.js App Router pages
  components/       # React components
  lib/
    github/         # GitHub API client & types
    auth/           # GitHub App authentication
    stats/          # Stats calculation logic
  types/            # Shared TypeScript types
```

## Environment Variables

```bash
GITHUB_APP_ID=           # GitHub App ID
GITHUB_APP_PRIVATE_KEY=  # GitHub App private key (PEM format)
GITHUB_CLIENT_ID=        # GitHub App OAuth client ID
GITHUB_CLIENT_SECRET=    # GitHub App OAuth client secret
NEXT_PUBLIC_APP_URL=     # Public URL for callbacks
```

## Useful Commands

```bash
pnpm dev          # Start development server
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
pnpm lint         # Lint code
pnpm typecheck    # Type check
pnpm build        # Production build
```

## GitHub App Setup

1. Create a GitHub App at https://github.com/settings/apps/new
2. Set permissions (read-only for contents, metadata, PRs, issues)
3. Enable "Request user authorization (OAuth) during installation"
4. Set callback URL to `{APP_URL}/api/auth/callback`
5. Generate and download private key
6. Copy App ID, Client ID, Client Secret to `.env.local`

## Data We Collect

For the year-in-review, we fetch:
- Contribution calendar (commits per day)
- Top repositories by commits
- Language breakdown
- PR/Issue counts
- Commit patterns (time of day, day of week)

**We do NOT:**
- Store access tokens beyond the session
- Access code content
- Write to any repositories
- Store user data permanently (stats are generated on-demand)
