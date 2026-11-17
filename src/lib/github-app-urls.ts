const DEFAULT_APP_SLUG = 'git-rewind'

function getAppBaseUrl(): string {
  const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || DEFAULT_APP_SLUG
  return `https://github.com/apps/${slug}`
}

export function getAppInstallUrl(): string {
  return `${getAppBaseUrl()}/installations/new`
}

export function getAppSelectTargetUrl(): string {
  return `${getAppBaseUrl()}/installations/select_target`
}
