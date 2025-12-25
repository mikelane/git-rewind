import { cookies } from 'next/headers'

const SESSION_COOKIE = 'git-rewind-session'
const TOKEN_COOKIE = 'git-rewind-token'

export async function getSession(): Promise<{ accessToken: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value

  if (!token) return null

  return { accessToken: token }
}

export async function setSession(accessToken: string): Promise<void> {
  const cookieStore = await cookies()

  // Set cookie with secure flags
  cookieStore.set(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_COOKIE)
  cookieStore.delete(SESSION_COOKIE)
}
