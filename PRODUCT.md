# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individual developers with a GitHub account who want a look back at their year of work that they can share. Many of them have private or work repositories, and they won't give a third-party tool the `repo` OAuth scope, which grants full read and write access, just to get a year-in-review. They usually arrive around the end of the year or when someone shares a card with them. They spend a few minutes and then decide whether to install.

## Product Purpose

Git Rewind turns a developer's GitHub activity for a year into a story in chapters: Prologue, The Rhythm, Your Craft, Peak Moments, The Collaboration and Epilogue. It shows contribution patterns, top repositories, languages, PR and issue stats, and a comparison with the previous year. The results can be shared as a stats card or downloaded as an HTML summary.

Success means, in order:
1. A visitor installs the GitHub App and sees their own rewind.
2. A visitor who isn't ready to install tries the demo (`/demo`) instead.
3. Users share their card or summary, which brings in new visitors.
4. The project stands as a public, open-source example of careful craft.

## Positioning

It reads your GitHub data without ever being able to change it. Other "GitHub Wrapped" tools use OAuth, and GitHub has no read-only OAuth scope for private repositories, so those tools ask for full read and write access. Git Rewind is a GitHub App. It asks only for read-only Contents, Metadata, Pull requests and Issues. Users can limit it to specific repositories and revoke it per installation. It is also fully open source and can be self-hosted.

## Operating Context

- **Entry points:** the landing page (`/`), the demo with sample data (`/demo`), the GitHub App install flow, then the authenticated rewind (`/rewind`).
- **Reading the rewind:** it is a vertical, chapter-by-chapter scroll with snapping, progress dots and keyboard navigation. Users switch between years and can refresh their data.
- **Sharing:** sharing happens outside the product, in social posts and links. There are no share buttons in the demo.
- **Self-hosting:** documented in `README.md`. You create your own GitHub App and deploy it, Vercel by default.

## Capabilities and Constraints

- **Stack:** Next.js App Router, Tailwind CSS, the GitHub GraphQL API, deployed on Vercel at git-rewind.dev.
- **Permissions:** read-only GitHub App permissions only. It never requests write, admin or secrets access.
- **Data:** it doesn't store access tokens beyond the session, doesn't read code content, and doesn't keep user data permanently. Stats are generated when requested.
- **Bots:** bot accounts, including hubot, are excluded from stats everywhere.
- **Errors:** a 401 response redirects to sign-in.
- **Already in place:** reduced motion, safe areas and the dynamic viewport are already handled on the chapter UI.
- **Public repo:** this file, and any design records, must not contain private, personal or local machine details.

## Brand Commitments

- **Name:** Git Rewind.
- **Current tagline:** "Your year in code, beautifully told."
- **Trust line:** "Built to respect your GitHub account."
- **Voice:** warm and story-like about the user's year, and plain and exact about permissions and privacy.
- **Assets:** `public/icon.svg`, the generated app and OG icons in `src/app/`.

## Evidence on Hand

- The live product and the `/demo` with sample data.
- The table of read-only permissions.
- The open-source repository.

There are no testimonials, user counts, star counts, press mentions or customer logos. Future work must not invent any of these.

## Product Principles

1. **Trust is the product.** State the permission model plainly and early. Never ask for more access than the feature needs.
2. **Your year, told as a story.** Present the user's data as a narrative about their work, not as a dashboard.
3. **Show before asking.** The demo lets people see the value before they grant any access.
4. **Worth sharing.** What users share should look good and be accurate. It must never overstate the data.
5. **Open by default.** Self-hosting and readable source are part of the promise, not a footnote.

## Accessibility & Inclusion

The aim is WCAG 2.2 AA:
- Keyboard navigation through the chapters.
- Respect for reduced motion.
- Visible focus that survives forced-colors mode.
- Safe areas and the dynamic viewport on mobile.
- Chart values available to screen readers.
