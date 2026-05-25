/**
 * Cryptographically-secure share-link token generator.
 *
 * Locked 2026-05-25 (security audit) — replaces Prisma's `@default(cuid())`
 * on share-link tokens (TeamInvite.token / ShareLink.token /
 * GraphShareLink.token). cuid v1 uses Math.random() for its entropy segment,
 * which is collision-resistant but NOT cryptographically secure: an attacker
 * with an oracle to observe other cuids generated nearby in time can
 * narrow the brute-force search space materially.
 *
 * Token shape: 24 random bytes (192 bits of entropy) encoded as base64url —
 * 32 URL-safe characters. 192-bit entropy makes brute-force enumeration
 * structurally impossible (2^192 ≈ 6.3e57 candidate tokens).
 *
 * Forward-looking rule: every new public-share token / invitation link /
 * password-reset-style token MUST use this helper. Never reach for `cuid()`
 * / `nanoid()` / `Math.random()` / string concatenation. The cuid taxonomy
 * for non-secret IDs (model.id) stays — only TOKENS gated on
 * unguessability migrate here.
 */

import { randomBytes } from 'node:crypto';

/**
 * Generate a 32-character URL-safe random token with 192 bits of entropy.
 *
 * Returns a string of exactly 32 characters from the base64url alphabet
 * (A-Z, a-z, 0-9, -, _). No padding characters. Safe to embed in URLs,
 * headers, and JSON without escaping.
 */
export function generateShareToken(): string {
  return randomBytes(24).toString('base64url');
}
