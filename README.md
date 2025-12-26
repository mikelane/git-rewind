# Git Rewind

Your GitHub year in review — with privacy-first, read-only access.

**[Try it live at git-rewind.dev](https://git-rewind.dev)**

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
- Year-over-year comparisons
- Downloadable HTML summary

## Self-Hosting

Git Rewind is fully open source and designed to be self-hosted.

### Prerequisites

- Node.js 20+
- pnpm

### 1. Clone and Install

```bash
git clone https://github.com/mikelane/git-rewind.git
cd git-rewind
pnpm install
```

### 2. Create a GitHub App

1. Go to **[github.com/settings/apps/new](https://github.com/settings/apps/new)**

2. Fill in the basic info:
   - **GitHub App name:** `your-git-rewind` (must be unique)
   - **Homepage URL:** `http://localhost:3000` (update for production)

3. Under **Identifying and authorizing users:**
   - **Callback URL:** `http://localhost:3000/api/auth/callback`
   - ✅ **Check "Request user authorization (OAuth) during installation"**

4. Under **Post installation:**
   - **Setup URL (optional):** `http://localhost:3000/api/auth/callback`
   - ✅ Check "Redirect on update" (optional)

5. Under **Webhook:**
   - ❌ **Uncheck "Active"** (not needed)

6. Under **Permissions → Repository permissions:**
   - **Contents:** Read-only
   - **Metadata:** Read-only
   - **Pull requests:** Read-only
   - **Issues:** Read-only

7. Under **Where can this GitHub App be installed:**
   - Select "Any account" (or "Only on this account" for private use)

8. Click **Create GitHub App**

9. On the next page:
   - Note your **App ID**
   - Note your **Client ID**
   - Generate a **Client secret** and save it
   - Generate a **Private key** (downloads a `.pem` file)

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
GITHUB_APP_ID=123456
GITHUB_APP_SLUG=your-git-rewind
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
(paste entire contents of .pem file here, including BEGIN/END lines)
-----END RSA PRIVATE KEY-----"

GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxx
GITHUB_CLIENT_SECRET=your_client_secret_here

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GITHUB_APP_SLUG=your-git-rewind

# Generate with: openssl rand -base64 32
SESSION_SECRET=your_32_char_minimum_secret_here
```

### 4. Run Locally

```bash
pnpm dev
```

Visit [localhost:3000](http://localhost:3000) and click "View Your Rewind"!

### 5. Deploy to Production

Git Rewind works with any Next.js hosting platform:

**Vercel (recommended):**
1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables
4. Deploy

**Other platforms:** Railway, Render, Fly.io, or self-hosted with:
```bash
pnpm build
pnpm start
```

**Important:** Update your GitHub App settings with your production URL:
- Homepage URL → `https://your-domain.com`
- Callback URL → `https://your-domain.com/api/auth/callback`
- Setup URL → `https://your-domain.com/api/auth/callback`

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
