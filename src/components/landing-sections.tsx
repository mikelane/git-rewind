import { FAQ_ITEMS } from '@/lib/faq'

const SECTION = 'border-t border-border-subtle py-20 sm:py-28'
const HEADING = 'font-display text-display-sm text-text-primary text-balance'
const LEAD = 'text-lead text-text-secondary mt-4 max-w-prose'

const STEPS = [
  {
    title: 'Install the GitHub App',
    body: 'Choose which repositories Git Rewind can read. The app only asks for read-only permissions.',
  },
  {
    title: 'Authorize with GitHub',
    body: 'Sign in so Git Rewind can read your activity for the year. It never gets write access.',
  },
  {
    title: 'See your rewind',
    body: 'Scroll through your year, chapter by chapter, from your busiest month to your longest streak.',
  },
]

const HIGHLIGHTS = [
  {
    title: 'Commits, streaks and your contribution calendar',
    body: 'How many days you showed up, your longest and current streaks, and your busiest month.',
  },
  {
    title: 'Top repositories',
    body: 'The projects that took most of your year.',
  },
  {
    title: 'Languages',
    body: 'The languages you wrote the most, ranked in a breakdown.',
  },
  {
    title: 'Pull requests and issues',
    body: 'Pull requests you merged and issues you took part in.',
  },
  {
    title: 'Time-of-day and day-of-week patterns',
    body: 'Late-night commits, weekend work and your favorite day to code.',
  },
]

export function HowItWorksSection({ year }: { year: number }) {
  return (
    <section aria-labelledby="how-it-works" className={SECTION}>
      <h2 id="how-it-works" className={HEADING}>
        How it works
      </h2>
      <p className={LEAD}>Get your GitHub Wrapped {year} in three steps.</p>
      <ol className="mt-12 space-y-8">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-6">
            <span
              aria-hidden="true"
              className="font-display text-display-sm text-accent tabular-nums w-8 shrink-0"
            >
              {index + 1}
            </span>
            <div>
              <h3 className="font-display text-heading text-text-primary">{step.title}</h3>
              <p className="text-body text-text-secondary mt-1 max-w-prose">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function WhatYoullSeeSection({ year }: { year: number }) {
  return (
    <section aria-labelledby="what-youll-see" className={SECTION}>
      <h2 id="what-youll-see" className={HEADING}>
        What you&apos;ll see
      </h2>
      <p className={LEAD}>
        Your {year} in code, told as a story instead of a table of numbers.
      </p>
      <dl className="mt-12 grid gap-x-12 gap-y-8 sm:grid-cols-2">
        {HIGHLIGHTS.map((item) => (
          <div key={item.title}>
            <dt className="font-display text-heading text-text-primary">{item.title}</dt>
            <dd className="text-body text-text-secondary mt-1">{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function WhyReadOnlySection() {
  return (
    <section aria-labelledby="why-read-only" className={SECTION}>
      <h2 id="why-read-only" className={HEADING}>
        Why read-only
      </h2>
      <p className={LEAD}>
        Most GitHub year-in-review tools sign you in with OAuth. To see private repositories, OAuth
        needs the <code className="font-mono text-body-sm text-text-primary">repo</code> scope, and
        GitHub has no read-only version of it.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border-subtle p-6">
          <h3 className="font-display text-heading text-text-primary">OAuth repo scope</h3>
          <p className="text-body text-text-secondary mt-2">
            Grants read and write access to every repository you can reach, public and private.
          </p>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent-subtle p-6">
          <h3 className="font-display text-heading text-text-primary">Git Rewind&apos;s GitHub App</h3>
          <p className="text-body text-text-secondary mt-2">
            Fine-grained, read-only permissions. You pick which repositories it can see, it never
            gets write access, and you can revoke it from GitHub at any time.
          </p>
        </div>
      </div>
    </section>
  )
}

export function FaqSection() {
  return (
    <section aria-labelledby="faq" className={SECTION}>
      <h2 id="faq" className={HEADING}>
        FAQ
      </h2>
      <dl className="mt-12 space-y-10">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question}>
            <dt className="font-display text-heading text-text-primary">{item.question}</dt>
            <dd className="text-body text-text-secondary mt-2 max-w-prose">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle py-8 text-center">
      <p className="text-caption text-text-tertiary">
        Open source. Privacy by design.{' '}
        <a
          href="https://github.com/mikelane/git-rewind"
          className="text-accent hover:underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source
        </a>
      </p>
    </footer>
  )
}
