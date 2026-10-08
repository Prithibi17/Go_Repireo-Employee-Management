import crypto from 'crypto';

/**
 * Generates an unpredictable cryptographic verification token.
 * Example format: id_v_8K2mN9PqX... or crt_v_4L1zR8...
 */
export function generateVerificationToken(prefix: 'id_v_' | 'crt_v_'): string {
  const randomBytes = crypto.randomBytes(18).toString('base64url');
  return `${prefix}${randomBytes}`;
}

/**
 * Computes SHA-256 hex hash of a string.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates cryptographically secure uppercase alphanumeric string.
 * Uses A-Z and 0-9 (36 characters).
 * Guarantees a genuine mixture of both letters and digits (at least 2 of each).
 */
export function generateCryptoAlphanumeric(length: number = 7): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  while (true) {
    let result = '';
    let letterCount = 0;
    let digitCount = 0;
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      const char = chars[randomIndex];
      result += char;
      if (char >= '0' && char <= '9') {
        digitCount++;
      } else {
        letterCount++;
      }
    }
    // Guarantee that the generated sequence is a genuine mixture of letters and digits
    if (letterCount >= 2 && digitCount >= 2) {
      return result;
    }
  }
}

