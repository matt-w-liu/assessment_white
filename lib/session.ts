import crypto from 'node:crypto';

/**
 * Stateless signed session tokens: `<userId>.<expiresAtSeconds>.<hmac>`.
 * Pure (no framework imports) so it can be unit tested.
 */

export const SESSION_COOKIE = 'ajaia_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const DEV_FALLBACK_SECRET = 'dev-only-insecure-session-secret';

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set in production');
  }
  return DEV_FALLBACK_SECRET;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createSessionToken(userId: string, nowMs: number = Date.now()): string {
  const expiresAt = Math.floor(nowMs / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the userId if the token is authentic and unexpired, otherwise null. */
export function verifySessionToken(token: string | null | undefined, nowMs: number = Date.now()): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiresAtRaw, signature] = parts;
  if (!userId || !expiresAtRaw || !signature) return null;

  const expected = Buffer.from(sign(`${userId}.${expiresAtRaw}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 <= nowMs) return null;
  return userId;
}
