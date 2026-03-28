/**
 * AES-256-GCM Encryption Utility
 *
 * Used for encrypting sensitive data at rest:
 * - Slack bot tokens (SLACK_TOKEN_ENCRYPTION_KEY)
 * - Document content (DOCUMENT_ENCRYPTION_KEY)
 *
 * Each value gets a unique IV and auth tag for authenticated encryption.
 * Generate keys with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from 'crypto';
import { createLogger } from './logger';

const log = createLogger('Encryption');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getEncryptionKey(): Buffer {
  const keyHex = process.env.SLACK_TOKEN_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'SLACK_TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(keyHex, 'hex');
}

function getDocumentEncryptionKey(): Buffer {
  const keyHex = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'DOCUMENT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(keyHex, 'hex');
}

export interface EncryptedValue {
  ciphertext: string; // hex-encoded
  iv: string; // hex-encoded
  tag: string; // hex-encoded
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns ciphertext, IV, and auth tag as hex strings for DB storage.
 */
export function encrypt(plaintext: string): EncryptedValue {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypt a value encrypted with encrypt().
 * Throws on tampered data or wrong key (GCM authentication failure).
 */
export function decrypt(encrypted: EncryptedValue): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(encrypted.iv, 'hex');
  const tag = Buffer.from(encrypted.tag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Convenience: encrypt a Slack bot token for DB storage.
 * Returns the three fields needed for SlackInstallation columns.
 */
export function encryptToken(token: string): {
  botTokenEncrypted: string;
  botTokenIv: string;
  botTokenTag: string;
} {
  const result = encrypt(token);
  return {
    botTokenEncrypted: result.ciphertext,
    botTokenIv: result.iv,
    botTokenTag: result.tag,
  };
}

/**
 * Convenience: decrypt a Slack bot token from DB columns.
 */
export function decryptToken(record: {
  botTokenEncrypted: string;
  botTokenIv: string;
  botTokenTag: string;
}): string {
  try {
    return decrypt({
      ciphertext: record.botTokenEncrypted,
      iv: record.botTokenIv,
      tag: record.botTokenTag,
    });
  } catch {
    log.error('Failed to decrypt token — possible key rotation or data corruption');
    throw new Error('Token decryption failed');
  }
}

// ── Document Content Encryption ─────────────────────────────

/**
 * Check if document encryption is available (key is configured).
 */
export function isDocumentEncryptionEnabled(): boolean {
  const keyHex = process.env.DOCUMENT_ENCRYPTION_KEY;
  return !!keyHex && keyHex.length === 64;
}

/**
 * Encrypt document content using AES-256-GCM with the document encryption key.
 * Returns the three fields for DB storage.
 */
export function encryptDocumentContent(content: string): {
  contentEncrypted: string;
  contentIv: string;
  contentTag: string;
} {
  const key = getDocumentEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    contentEncrypted: encrypted,
    contentIv: iv.toString('hex'),
    contentTag: tag.toString('hex'),
  };
}

/**
 * Decrypt document content from DB columns.
 */
export function decryptDocumentContent(record: {
  contentEncrypted: string;
  contentIv: string;
  contentTag: string;
}): string {
  const key = getDocumentEncryptionKey();
  const iv = Buffer.from(record.contentIv, 'hex');
  const tag = Buffer.from(record.contentTag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(record.contentEncrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Transparently get document content from either encrypted or plaintext fields.
 * Handles backward compatibility: new docs use encrypted fields, old docs use plaintext.
 */
export function getDocumentContent(doc: {
  content: string;
  contentEncrypted?: string | null;
  contentIv?: string | null;
  contentTag?: string | null;
}): string {
  if (doc.contentEncrypted && doc.contentIv && doc.contentTag) {
    try {
      return decryptDocumentContent({
        contentEncrypted: doc.contentEncrypted,
        contentIv: doc.contentIv,
        contentTag: doc.contentTag,
      });
    } catch (err) {
      // Encrypted fields are present but decryption failed — this is a real error,
      // not a backward-compat case. Do NOT silently fall back to plaintext.
      log.error('Document decryption failed for document with encrypted fields', err);
      throw new Error('Document decryption failed — possible key rotation or data corruption');
    }
  }
  // Backward compat: old documents without encrypted fields use plaintext
  return doc.content;
}
