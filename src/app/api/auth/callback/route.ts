import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { setSession } from '@/lib/auth'
import { authLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle when user comes from GitHub App installation
  const installationId = searchParams.get('installation_id')
  const setupAction = searchParams.get('setup_action')

  // If this is a post-installation/update redirect without code, redirect to login
  // setup_action can be 'install' (new install) or 'update' (repos added/removed)
  if ((setupAction === 'install' || setupAction === 'update') && !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login`)
  }

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=missing_params`
    )
  }

  const cookieStore = await cookies()

  // For direct GitHub App installation flow, skip state validation
  // When setup_action=install, user came directly from GitHub's installation flow
  // and didn't go through our /api/auth/login route (which sets the state cookie)
  if (setupAction !== 'install') {
    if (!state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=missing_params`
      )
    }

    // Verify state for standard OAuth flow
    const storedState = cookieStore.get('oauth-state')?.value

    // Explicitly check for undefined/missing cookie to prevent CSRF attacks
    if (!storedState || state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid_state`
      )
    }
  }

  // Always clean up oauth-state cookie if it exists (prevents reuse/CSRF)
  // This is done outside the if block to ensure cleanup even during install flow
  const existingState = cookieStore.get('oauth-state')
  if (existingState) {
    cookieStore.delete('oauth-state')
  }

  try {
    authLogger.debug('Exchanging code for token...')
    authLogger.debug(`Setup action: ${setupAction}, Installation ID: ${installationId}`)

    // Exchange code for access token (GitHub App user-to-server token)
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    )

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text()
      authLogger.error(`Token exchange failed: ${tokenResponse.status}`, text)
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    authLogger.debug('Token response received', {
      hasAccessToken: !!tokenData.access_token,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      error: tokenData.error,
    })

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error)
    }

    // Store access token in session
    await setSession(tokenData.access_token)
    authLogger.debug('Session set successfully')

    // Store installation ID if provided
    if (installationId) {
      cookieStore.set('installation-id', installationId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
      authLogger.debug(`Installation ID stored: ${installationId}`)
    }

    // Redirect to rewind page
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/rewind`
    authLogger.debug(`Redirecting to: ${redirectUrl}`)
    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    authLogger.error('Authentication error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=auth_failed`
    )
  }
}
