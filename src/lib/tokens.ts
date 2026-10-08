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
 */
export function generateCryptoAlphanumeric(length: number = 7): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }
  return result;
}

