import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { setSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle when user comes from GitHub App installation
  const installationId = searchParams.get('installation_id')
  const setupAction = searchParams.get('setup_action')

  // If this is a post-installation redirect without code, redirect to login
  if (setupAction === 'install' && !code) {
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

    if (state !== storedState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid_state`
      )
    }

    // Clear state cookie
    cookieStore.delete('oauth-state')
  }

  try {
    console.log('[Auth Callback] Exchanging code for token...')
    console.log('[Auth Callback] Setup action:', setupAction, 'Installation ID:', installationId)

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
      console.error('[Auth Callback] Token exchange failed:', tokenResponse.status, text)
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    console.log('[Auth Callback] Token response:', {
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
    console.log('[Auth Callback] Session set successfully')

    // Store installation ID if provided
    if (installationId) {
      cookieStore.set('installation-id', installationId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
      console.log('[Auth Callback] Installation ID stored:', installationId)
    }

    // Redirect to rewind page
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/rewind`
    console.log('[Auth Callback] Redirecting to:', redirectUrl)
    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('[Auth Callback] Error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=auth_failed`
    )
  }
}
