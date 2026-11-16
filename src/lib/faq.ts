export interface FaqItem {
  question: string
  answer: string
}

/** Single source for the visible FAQ section and the FAQPage JSON-LD. */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: 'What is Git Rewind?',
    answer:
      'Git Rewind is a free, open-source GitHub year-in-review. It turns your commits, streaks, languages, pull requests and coding rhythms into a scrollable story of your year in code.',
  },
  {
    question: 'Is Git Rewind a GitHub Wrapped alternative?',
    answer:
      'Yes. It gives you the same kind of GitHub Wrapped year-in-review, but it uses a GitHub App with read-only permissions instead of the broad OAuth repo scope, which can read and write all of your repositories.',
  },
  {
    question: 'What permissions does Git Rewind need?',
    answer:
      'Read-only access to repository contents and metadata, plus optional read-only access to pull requests and issues for contribution counts. It never asks for write access, admin access, secrets or environment variables.',
  },
  {
    question: 'Do you store my data?',
    answer:
      'Git Rewind has no database of user data. Your access token lives in a signed, HTTP-only session cookie that expires after 24 hours, and your stats are calculated on demand and cached in your own browser, not on our servers.',
  },
  {
    question: 'Does it include my private repositories?',
    answer:
      'Only if you allow it. When you install the GitHub App you choose which repositories it can read, and you can limit it to specific ones. Private repositories you grant access to are included in your rewind.',
  },
  {
    question: 'Is Git Rewind free?',
    answer:
      'Yes. Git Rewind is free to use, and the source code is open on GitHub.',
  },
  {
    question: 'How do I revoke access?',
    answer:
      'Open your GitHub settings, go to Applications, then Installed GitHub Apps, and configure or uninstall Git Rewind. You can also remove individual repositories from its access at any time.',
  },
]
