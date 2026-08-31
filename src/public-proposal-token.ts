const tokenAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'

export function generatePublicProposalToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength)
  globalThis.crypto.getRandomValues(bytes)
  let token = ''
  for (const byte of bytes) token += tokenAlphabet[byte & 63]
  return token
}

export async function hashPublicProposalToken(token: string) {
  const data = new TextEncoder().encode(token)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
