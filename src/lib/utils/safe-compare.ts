/**
 * Timing-safe string comparison utility.
 *
 * Uses Node's crypto.timingSafeEqual with fixed-length padding to prevent
 * timing side-channel attacks on secret comparisons (API keys, cron tokens).
 */

import { timingSafeEqual } from 'crypto';

/**
 * Compares two strings in constant time, regardless of length differences.
 * Pads both inputs to the same length before comparison to avoid leaking
 * length information through timing.
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  const maxLen = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  return bufA.length === bufB.length && timingSafeEqual(paddedA, paddedB);
}

/**
 * Validates a Bearer token from an Authorization header against a secret.
 * Returns true if the token matches the expected secret.
 */
export function validateBearerToken(authHeader: string | null, secret: string): boolean {
  const token = authHeader?.replace('Bearer ', '') ?? '';
  return safeCompare(token, secret);
}
