// GraphQL queries for GitHub API

export const USER_CONTRIBUTIONS_QUERY = `
  query UserContributions($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      login
      name
      avatarUrl
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        totalRepositoryContributions
        restrictedContributionsCount

        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }

        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            nameWithOwner
            primaryLanguage {
              name
              color
            }
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
              totalSize
            }
          }
          contributions {
            totalCount
          }
        }

        pullRequestContributions(first: 100) {
          totalCount
          nodes {
            occurredAt
            pullRequest {
              title
              merged
              repository {
                nameWithOwner
              }
            }
          }
        }

        pullRequestReviewContributions(first: 100) {
          totalCount
          nodes {
            occurredAt
            pullRequest {
              title
              author {
                login
              }
            }
          }
        }

        issueContributions(first: 100) {
          totalCount
          nodes {
            occurredAt
            issue {
              title
              closedAt
            }
          }
        }
      }
    }
  }
`

export const VIEWER_QUERY = `
  query Viewer {
    viewer {
      login
      name
      avatarUrl
    }
  }
`
