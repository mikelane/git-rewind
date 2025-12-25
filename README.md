# Git Rewind

Your GitHub year in review — with privacy-first, read-only access.

## Why Git Rewind?

Existing "GitHub Wrapped" tools require the `repo` OAuth scope, which grants **full read/write access** to all your repositories, including private ones. GitHub doesn't offer a read-only OAuth scope for private repos.

**Git Rewind is different.** We use a GitHub App with fine-grained permissions:

| Permission | Access | Why |
|------------|--------|-----|
| Contents | Read-only | View commit history |
| Metadata | Read-only | Basic repo info |
| Pull Requests | Read-only | PR contribution stats |
| Issues | Read-only | Issue contribution stats |

No write access. Ever.

## Features

- Contribution calendar visualization
- Top repositories by activity
- Language breakdown
- Commit patterns (time of day, day of week)
- PR and issue statistics
- Shareable stats card

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
git clone https://github.com/yourusername/git-rewind.git
cd git-rewind
pnpm install
cp .env.example .env.local
# Fill in your GitHub App credentials
pnpm dev
```

### Creating a GitHub App

1. Go to [GitHub Developer Settings](https://github.com/settings/apps/new)
2. Create a new GitHub App with these settings:
   - **Homepage URL:** Your app URL
   - **Callback URL:** `http://localhost:3000/api/auth/callback`
   - **Webhook:** Disable (not needed)
   - **Permissions:**
     - Repository: Contents (Read-only)
     - Repository: Metadata (Read-only)
     - Repository: Pull requests (Read-only)
     - Repository: Issues (Read-only)
3. Generate a private key and download it
4. Copy credentials to `.env.local`

## Self-Hosting

Git Rewind is designed to be self-hostable. Deploy to Vercel, Railway, or any platform that supports Next.js.

```bash
pnpm build
pnpm start
```

## Privacy

- Access tokens are not stored beyond your session
- Stats are generated on-demand, not cached
- No analytics or tracking
- Fully open source — audit the code yourself

## Tech Stack

- [Next.js](https://nextjs.org/) 14+ (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- TypeScript

## Contributing

Contributions welcome! Please read the contributing guidelines and follow TDD practices.

## License

MIT
