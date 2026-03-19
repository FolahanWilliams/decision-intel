/**
 * AES-256-GCM Encryption Utility
 *
 * Used for encrypting sensitive credentials at rest (e.g. Slack bot tokens).
 * Each value gets a unique IV and auth tag for authenticated encryption.
 *
 * Requires SLACK_TOKEN_ENCRYPTION_KEY env var (64-char hex = 32 bytes).
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
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
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
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
  } catch (_error) {
    log.error('Failed to decrypt token — possible key rotation or data corruption');
    throw new Error('Token decryption failed');
  }
}
