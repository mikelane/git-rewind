import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID

  if (!clientId) {
    return NextResponse.json(
      { error: 'GitHub App client ID not configured' },
      { status: 500 }
    )
  }

  // Generate state for CSRF protection
  const state = randomBytes(16).toString('hex')

  // Store state in cookie for verification
  const cookieStore = await cookies()
  cookieStore.set('oauth-state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  // GitHub App OAuth URL (user-to-server token flow)
  // This grants access based on what repos the user has installed the app on
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    state,
  })

  const authUrl = `https://github.com/login/oauth/authorize?${params}`

  return NextResponse.redirect(authUrl)
}
