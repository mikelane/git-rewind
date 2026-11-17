const KEY_DERIVATION_INFO = 'git-rewind session cookie'

/** Derives the session cookie key the same way session.ts does, for building and decrypting test cookies. */
export async function sessionKey(secret: string, bits = 256): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'HKDF', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: new TextEncoder().encode(KEY_DERIVATION_INFO) },
    material,
    bits
  )
  return new Uint8Array(derived)
}
