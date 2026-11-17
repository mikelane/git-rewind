import { cookies } from 'next/headers'
import { EncryptJWT, jwtDecrypt } from 'jose'

const TOKEN_COOKIE = 'git-rewind-token'

const KEY_DERIVATION_INFO = 'git-rewind session cookie'

async function getEncryptionKey(): Promise<Uint8Array> {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required')
  }
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters for secure encryption')
  }
  // WHY HKDF: A256GCM needs exactly 256 key bits; HKDF-SHA256 derives them from a secret of any
  // length (instead of truncating it) and the info label keeps the key specific to this cookie.
  const encoder = new TextEncoder()
  const material = await crypto.subtle.importKey('raw', encoder.encode(secret), 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: encoder.encode(KEY_DERIVATION_INFO) },
    material,
    256
  )
  return new Uint8Array(bits)
}

async function encryptToken(accessToken: string): Promise<string> {
  const key = await getEncryptionKey()

  return new EncryptJWT({ token: accessToken })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .encrypt(key)
}

async function decryptToken(encryptedToken: string): Promise<string | null> {
  try {
    const key = await getEncryptionKey()
    const { payload } = await jwtDecrypt(encryptedToken, key, {
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256GCM'],
      requiredClaims: ['exp'],
    })
    return typeof payload.token === 'string' && payload.token !== '' ? payload.token : null
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
