import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const TOKEN_COOKIE = 'git-rewind-token'

function getEncryptionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required')
  }
  // jose requires a key of at least 256 bits (32 bytes) for HS256
  // We pad/truncate to exactly 32 bytes
  const encoder = new TextEncoder()
  const keyBytes = encoder.encode(secret)
  const key = new Uint8Array(32)
  key.set(keyBytes.slice(0, 32))
  return key
}

async function encryptToken(accessToken: string): Promise<string> {
  const key = getEncryptionKey()

  const jwt = await new SignJWT({ token: accessToken })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)

  return jwt
}

async function decryptToken(encryptedToken: string): Promise<string | null> {
  try {
    const key = getEncryptionKey()
    const { payload } = await jwtVerify(encryptedToken, key)
    return (payload.token as string) || null
  } catch {
    return null
  }
}

export async function getSession(): Promise<{ accessToken: string } | null> {
  const cookieStore = await cookies()
  const encryptedToken = cookieStore.get(TOKEN_COOKIE)?.value

  if (!encryptedToken) {
    return null
  }

  const accessToken = await decryptToken(encryptedToken)
  if (!accessToken) {
    return null
  }

  return { accessToken }
}

export async function setSession(accessToken: string): Promise<void> {
  const cookieStore = await cookies()
  const encryptedToken = await encryptToken(accessToken)

  // Set cookie with secure flags
  cookieStore.set(TOKEN_COOKIE, encryptedToken, {
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
}
