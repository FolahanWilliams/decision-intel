/**
 * AES-256-GCM Encryption Utility — with key versioning.
 *
 * Used for encrypting sensitive data at rest:
 *   - Slack bot tokens (SLACK_TOKEN_ENCRYPTION_KEY…)
 *   - Document content (DOCUMENT_ENCRYPTION_KEY…)
 *
 * Each encrypted value carries a `keyVersion` integer so the platform can
 * rotate encryption keys without bricking historical rows. The rotation
 * procedure is:
 *
 *   1. Provision a new key at N+1 (`DOCUMENT_ENCRYPTION_KEY_V2` etc.).
 *   2. Bump `DOCUMENT_ENCRYPTION_KEY_VERSION=2`. Deploy.
 *      New writes are stamped `keyVersion = 2`. Existing rows stay on v1
 *      and still decrypt cleanly because we keep the v1 key around.
 *   3. Run `npm run rotate:encryption-key -- --type document --from 1 --to 2`.
 *      The script walks every row with the old version, decrypts with v1,
 *      re-encrypts with v2, bumps the row's `keyVersion`.
 *   4. Once every row is on v2, drop the v1 env var and redeploy.
 *
 * Env-var convention:
 *   DOCUMENT_ENCRYPTION_KEY             — legacy single-key (treated as v1)
 *   DOCUMENT_ENCRYPTION_KEY_V{N}        — explicit versioned key (N >= 1)
 *   DOCUMENT_ENCRYPTION_KEY_VERSION     — version to use for new writes
 *                                         (defaults to the highest version
 *                                         we can resolve a key for)
 *
 * Same pattern for SLACK_TOKEN_ENCRYPTION_KEY.
 *
 * Generate a key with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from 'crypto';
import { createLogger } from './logger';

const log = createLogger('Encryption');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag
const LEGACY_VERSION = 1; // The version we assume for any row with null keyVersion.

export type KeyDomain = 'document' | 'slack';

const ENV_PREFIX: Record<KeyDomain, string> = {
  document: 'DOCUMENT_ENCRYPTION_KEY',
  slack: 'SLACK_TOKEN_ENCRYPTION_KEY',
};

/** Resolve the hex key for a specific (domain, version) pair. Returns
 *  null if no env var is configured for that version — callers must
 *  handle the "this version is not available in the current deployment"
 *  case themselves. */
function resolveKeyHex(domain: KeyDomain, version: number): string | null {
  const prefix = ENV_PREFIX[domain];
  // v1 has two valid env names: the legacy un-suffixed one and the
  // explicit V1 suffix. Explicit wins if both are set.
  if (version === LEGACY_VERSION) {
    const v1 = process.env[`${prefix}_V1`];
    if (v1 && v1.length === 64) return v1;
    const legacy = process.env[prefix];
    if (legacy && legacy.length === 64) return legacy;
    return null;
  }
  const versioned = process.env[`${prefix}_V${version}`];
  if (versioned && versioned.length === 64) return versioned;
  return null;
}

function getKeyForVersion(domain: KeyDomain, version: number): Buffer {
  const hex = resolveKeyHex(domain, version);
  if (!hex) {
    throw new Error(
      `${ENV_PREFIX[domain]}_V${version} is not configured or is not a 64-char hex string. ` +
        `Either set it, or point the row at a version whose key is available. ` +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, 'hex');
}

/** The version new writes should use. If DOCUMENT_ENCRYPTION_KEY_VERSION
 *  is set we trust it; otherwise we pick the highest resolvable version
 *  (so a deployment with only the legacy key writes v1, and a deployment
 *  that has added V2 silently starts writing v2). */
export function getCurrentKeyVersion(domain: KeyDomain): number {
  const prefix = ENV_PREFIX[domain];
  const explicit = process.env[`${prefix}_VERSION`];
  if (explicit) {
    const parsed = parseInt(explicit, 10);
    if (Number.isFinite(parsed) && parsed >= 1) return parsed;
    log.warn(`${prefix}_VERSION is not a positive integer — falling back to highest resolvable`);
  }
  // Probe descending from a reasonable ceiling.
  for (let v = 16; v >= 1; v--) {
    if (resolveKeyHex(domain, v)) return v;
  }
  // No key at all — let the downstream call fail with a clearer error.
  return LEGACY_VERSION;
}

export interface EncryptedValue {
  ciphertext: string; // hex
  iv: string; // hex
  tag: string; // hex
  keyVersion: number;
}

/** Shape used internally by decrypt functions. `keyVersion` is optional
 *  so callers reading rows that predate the migration (null column) get
 *  transparent fallback to the legacy version. */
export interface DecryptableValue {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion?: number | null;
}

// ── Generic encrypt/decrypt (Slack domain) ──────────────────────

/** Encrypt a plaintext string using AES-256-GCM with the current Slack
 *  token key version. Returns ciphertext, IV, tag, and the version stamp
 *  so the caller can persist it. */
export function encrypt(plaintext: string): EncryptedValue {
  return encryptFor('slack', plaintext);
}

/** Decrypt a value encrypted with `encrypt()`. Uses the version stamped
 *  on the row; falls back to LEGACY_VERSION for pre-migration rows. */
export function decrypt(encrypted: DecryptableValue): string {
  return decryptFor('slack', encrypted);
}

function encryptFor(domain: KeyDomain, plaintext: string): EncryptedValue {
  const version = getCurrentKeyVersion(domain);
  const key = getKeyForVersion(domain, version);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  let out = cipher.update(plaintext, 'utf8', 'hex');
  out += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return {
    ciphertext: out,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    keyVersion: version,
  };
}

function decryptFor(domain: KeyDomain, encrypted: DecryptableValue): string {
  const version = encrypted.keyVersion ?? LEGACY_VERSION;
  const key = getKeyForVersion(domain, version);
  const iv = Buffer.from(encrypted.iv, 'hex');
  const tag = Buffer.from(encrypted.tag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  let out = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  out += decipher.final('utf8');
  return out;
}

// ── Slack tokens ────────────────────────────────────────────────

/** Encrypt a Slack bot token for SlackInstallation storage. Returns the
 *  four columns the model needs (cipher / IV / tag / version). */
export function encryptToken(token: string): {
  botTokenEncrypted: string;
  botTokenIv: string;
  botTokenTag: string;
  botTokenKeyVersion: number;
} {
  const r = encryptFor('slack', token);
  return {
    botTokenEncrypted: r.ciphertext,
    botTokenIv: r.iv,
    botTokenTag: r.tag,
    botTokenKeyVersion: r.keyVersion,
  };
}

/** Decrypt a Slack bot token from SlackInstallation columns. Accepts
 *  rows missing `botTokenKeyVersion` (pre-migration) and falls back to
 *  LEGACY_VERSION. */
export function decryptToken(record: {
  botTokenEncrypted: string;
  botTokenIv: string;
  botTokenTag: string;
  botTokenKeyVersion?: number | null;
}): string {
  try {
    return decryptFor('slack', {
      ciphertext: record.botTokenEncrypted,
      iv: record.botTokenIv,
      tag: record.botTokenTag,
      keyVersion: record.botTokenKeyVersion,
    });
  } catch {
    log.error(
      'Failed to decrypt Slack token — possible key rotation without a backfill, ' +
        'or the row points at a key version this deployment has dropped.'
    );
    throw new Error('Token decryption failed');
  }
}

// ── Document content ────────────────────────────────────────────

/** True iff a document-domain key is configured for at least version 1.
 *  Used by upload routes to decide whether to write encrypted fields. */
export function isDocumentEncryptionEnabled(): boolean {
  return resolveKeyHex('document', LEGACY_VERSION) !== null;
}

export function encryptDocumentContent(content: string): {
  contentEncrypted: string;
  contentIv: string;
  contentTag: string;
  contentKeyVersion: number;
} {
  const r = encryptFor('document', content);
  return {
    contentEncrypted: r.ciphertext,
    contentIv: r.iv,
    contentTag: r.tag,
    contentKeyVersion: r.keyVersion,
  };
}

export function decryptDocumentContent(record: {
  contentEncrypted: string;
  contentIv: string;
  contentTag: string;
  contentKeyVersion?: number | null;
}): string {
  return decryptFor('document', {
    ciphertext: record.contentEncrypted,
    iv: record.contentIv,
    tag: record.contentTag,
    keyVersion: record.contentKeyVersion,
  });
}

/** Transparently retrieve document content from either the encrypted
 *  columns (modern path) or the `content` plaintext column (legacy). */
export function getDocumentContent(doc: {
  content: string;
  contentEncrypted?: string | null;
  contentIv?: string | null;
  contentTag?: string | null;
  contentKeyVersion?: number | null;
}): string {
  if (doc.contentEncrypted && doc.contentIv && doc.contentTag) {
    try {
      return decryptDocumentContent({
        contentEncrypted: doc.contentEncrypted,
        contentIv: doc.contentIv,
        contentTag: doc.contentTag,
        contentKeyVersion: doc.contentKeyVersion,
      });
    } catch (err) {
      log.error('Document decryption failed for a row with encrypted fields', err);
      throw new Error(
        'Document decryption failed — possible key rotation or data corruption'
      );
    }
  }
  return doc.content;
}

// ── Introspection ───────────────────────────────────────────────

/** Used by the /security page + admin dashboard to report which key
 *  versions are currently resolvable in this deployment. */
export function getResolvableKeyVersions(domain: KeyDomain): number[] {
  const out: number[] = [];
  for (let v = 1; v <= 16; v++) {
    if (resolveKeyHex(domain, v)) out.push(v);
  }
  return out;
}
