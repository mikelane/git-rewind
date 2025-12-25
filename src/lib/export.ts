/**
 * Generate and download a static HTML artifact of the Git Rewind summary
 */

import type { YearStats } from './github'
import { getLanguageColor } from './constants'
import { formatFavoriteDays } from './format-days'

function generateHTML(stats: YearStats): string {
  const langColor = getLanguageColor(stats.craft.primaryLanguage)

  const dataCompletenessNote = stats.dataCompleteness.restrictedContributions > 0
    ? `<p class="data-note">${100 - stats.dataCompleteness.percentageAccessible}% of activity is in repos not accessible to Git Rewind.</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Git Rewind ${stats.year} - @${stats.user.username}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
      color: #e6edf3;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }

    .card {
      background: linear-gradient(180deg, #21262d 0%, #161b22 100%);
      border: 1px solid #30363d;
      border-radius: 16px;
      padding: 40px;
      max-width: 400px;
      width: 100%;
      position: relative;
      overflow: hidden;
    }

    .accent-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${langColor};
    }

    .header {
      text-align: center;
      margin-bottom: 24px;
    }

    .brand {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #8b949e;
      margin-bottom: 8px;
    }

    .year {
      font-size: 64px;
      font-weight: 700;
      line-height: 1;
      background: linear-gradient(180deg, #e6edf3 0%, #8b949e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .username {
      color: #8b949e;
      margin-top: 8px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin: 32px 0;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #e6edf3;
      font-variant-numeric: tabular-nums;
    }

    .stat-label {
      font-size: 12px;
      color: #8b949e;
      margin-top: 4px;
    }

    .language-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #30363d;
      border-radius: 100px;
      padding: 10px 20px;
      margin: 24px auto 0;
      width: fit-content;
    }

    .language-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${langColor};
    }

    .language-name {
      font-size: 14px;
      color: #8b949e;
    }

    .data-note {
      text-align: center;
      font-size: 11px;
      color: #6e7681;
      margin-top: 16px;
    }

    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #30363d;
    }

    .footer p {
      font-size: 11px;
      color: #6e7681;
      margin-bottom: 4px;
    }

    .highlights {
      margin: 24px 0;
      padding: 16px;
      background: rgba(48, 54, 61, 0.5);
      border-radius: 8px;
    }

    .highlight {
      font-size: 13px;
      color: #8b949e;
      margin-bottom: 8px;
    }

    .highlight:last-child {
      margin-bottom: 0;
    }

    .highlight strong {
      color: #e6edf3;
    }

    @media print {
      body {
        background: white;
        color: #1f2328;
      }
      .card {
        background: white;
        border: 2px solid #d0d7de;
        box-shadow: none;
      }
      .year {
        background: none;
        -webkit-text-fill-color: #1f2328;
        color: #1f2328;
      }
      .stat-value {
        color: #1f2328;
      }
      .language-badge {
        background: #f6f8fa;
      }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="accent-line"></div>

    <div class="header">
      <div class="brand">Git Rewind</div>
      <div class="year">${stats.year}</div>
      <div class="username">@${stats.user.username}</div>
    </div>

    <div class="stats-grid">
      <div class="stat">
        <div class="stat-value">${stats.totalContributions.toLocaleString()}</div>
        <div class="stat-label">contributions</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.rhythm.activeDays}</div>
        <div class="stat-label">active days</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.collaboration.pullRequestsMerged}</div>
        <div class="stat-label">PRs merged</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.rhythm.longestStreak}</div>
        <div class="stat-label">day streak</div>
      </div>
    </div>

    <div class="highlights">
      <div class="highlight">
        Busiest month: <strong>${stats.rhythm.busiestMonth}</strong> with ${stats.rhythm.busiestMonthCount.toLocaleString()} contributions
      </div>
      <div class="highlight">
        Peak coding time: <strong>${stats.peakMoments.favoriteTimeOfDay}</strong>${stats.peakMoments.favoriteDaysOfWeek?.length > 0 ? ` on <strong>${formatFavoriteDays(stats.peakMoments.favoriteDaysOfWeek)}</strong>` : ''}
      </div>
      ${stats.craft.topRepository ? `<div class="highlight">Top repo: <strong>${stats.craft.topRepository}</strong></div>` : ''}
    </div>

    <div class="language-badge">
      <div class="language-dot"></div>
      <span class="language-name">Powered by ${stats.craft.primaryLanguage}</span>
    </div>

    ${dataCompletenessNote}

    <div class="footer">
      <p>Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <p>gitrewind.dev</p>
    </div>
  </div>
</body>
</html>`
}

export function downloadRewind(stats: YearStats): void {
  const html = generateHTML(stats)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `git-rewind-${stats.year}-${stats.user.username}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
