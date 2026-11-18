const DEFAULT_APP_URL = 'https://git-rewind.dev'

export function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return configuredUrl.replace(/\/+$/, '') || DEFAULT_APP_URL
}
