/**
 * Generates a collision-resistant, URL-safe short identifier.
 * Uses Base62 alphabet (0-9, a-z, A-Z) with cryptographically secure randomness.
 */
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateShortId(length = 8): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for node environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    const nodeBytes = nodeCrypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = nodeBytes[i];
    }
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
}
