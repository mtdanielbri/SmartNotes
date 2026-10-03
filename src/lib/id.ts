const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

/**
 * Random id. Uses `crypto.getRandomValues`, which (unlike `crypto.randomUUID`)
 * also works when the app is opened over plain http, e.g. from a LAN IP.
 */
export function createId(size = 12): string {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  let id = ''
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length]
  return id
}
