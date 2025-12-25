import { SignJWT, importPKCS8 } from 'jose'

const GITHUB_API_URL = 'https://api.github.com'

interface InstallationToken {
  token: string
  expires_at: string
}

interface Installation {
  id: number
  account: {
    login: string
    type: string
  }
}

/**
 * Generate a JWT for GitHub App authentication
 */
async function generateAppJWT(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY

  if (!appId || !privateKey) {
    throw new Error('GitHub App credentials not configured')
  }

  // Parse the private key (handle both raw and escaped newlines)
  const formattedKey = privateKey.replace(/\\n/g, '\n')
  const key = await importPKCS8(formattedKey, 'RS256')

  const now = Math.floor(Date.now() / 1000)

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now - 60) // 60 seconds in the past to account for clock drift
    .setExpirationTime(now + 600) // 10 minutes max
    .setIssuer(appId)
    .sign(key)

  return jwt
}

/**
 * Get installation access token for a user
 */
export async function getInstallationToken(installationId: number): Promise<string> {
  const jwt = await generateAppJWT()

  const response = await fetch(
    `${GITHUB_API_URL}/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get installation token: ${response.status} ${error}`)
  }

  const data: InstallationToken = await response.json()
  return data.token
}

/**
 * Get the installation for the authenticated user
 */
export async function getUserInstallation(userAccessToken: string): Promise<Installation | null> {
  // First get the user's login
  const userResponse = await fetch(`${GITHUB_API_URL}/user`, {
    headers: {
      'Authorization': `Bearer ${userAccessToken}`,
      'Accept': 'application/vnd.github+json',
    },
  })

  if (!userResponse.ok) {
    throw new Error('Failed to get user info')
  }

  const user = await userResponse.json()
  const userLogin = user.login

  // Now get installations accessible to the user
  const jwt = await generateAppJWT()

  const installationsResponse = await fetch(`${GITHUB_API_URL}/app/installations`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!installationsResponse.ok) {
    throw new Error('Failed to get installations')
  }

  const installations: Installation[] = await installationsResponse.json()

  // Find installation for this user
  return installations.find(
    (inst) => inst.account.login.toLowerCase() === userLogin.toLowerCase()
  ) || null
}

/**
 * Get the GitHub App installation URL
 */
export function getAppInstallUrl(): string {
  const appSlug = process.env.GITHUB_APP_SLUG || 'git-rewind'
  return `https://github.com/apps/${appSlug}/installations/new`
}
