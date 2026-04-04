import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// Generate deterministic test keys (32 bytes = 64 hex chars)
const TEST_SLACK_KEY = crypto.randomBytes(32).toString('hex');
const TEST_DOC_KEY = crypto.randomBytes(32).toString('hex');

describe('encryption utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      SLACK_TOKEN_ENCRYPTION_KEY: TEST_SLACK_KEY,
      DOCUMENT_ENCRYPTION_KEY: TEST_DOC_KEY,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('encrypt/decrypt round-trips correctly', async () => {
    const { encrypt, decrypt } = await import('./encryption');
    const plaintext = 'xoxb-test-slack-token-12345';
    const encrypted = encrypt(plaintext);
    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.tag).toBeTruthy();
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it('produces unique IVs for same plaintext', async () => {
    const { encrypt } = await import('./encryption');
    const a = encrypt('same-value');
    const b = encrypt('same-value');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('decrypt throws on tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import('./encryption');
    const encrypted = encrypt('sensitive-data');
    encrypted.ciphertext = 'ff' + encrypted.ciphertext.slice(2);
    expect(() => decrypt(encrypted)).toThrow();
  });

  it('decrypt throws on tampered tag', async () => {
    const { encrypt, decrypt } = await import('./encryption');
    const encrypted = encrypt('sensitive-data');
    encrypted.tag = 'ff'.repeat(16);
    expect(() => decrypt(encrypted)).toThrow();
  });

  it('encryptToken/decryptToken round-trips', async () => {
    const { encryptToken, decryptToken } = await import('./encryption');
    const token = 'xoxb-abc-123-def';
    const enc = encryptToken(token);
    expect(enc.botTokenEncrypted).toBeTruthy();
    expect(decryptToken(enc)).toBe(token);
  });

  it('encryptDocumentContent/decryptDocumentContent round-trips', async () => {
    const { encryptDocumentContent, decryptDocumentContent } = await import('./encryption');
    const content = 'This is a confidential document about an M&A deal.';
    const enc = encryptDocumentContent(content);
    expect(enc.contentEncrypted).toBeTruthy();
    expect(decryptDocumentContent(enc)).toBe(content);
  });

  it('isDocumentEncryptionEnabled returns true when key is set', async () => {
    const { isDocumentEncryptionEnabled } = await import('./encryption');
    expect(isDocumentEncryptionEnabled()).toBe(true);
  });

  it('isDocumentEncryptionEnabled returns false when key is missing', async () => {
    delete process.env.DOCUMENT_ENCRYPTION_KEY;
    const { isDocumentEncryptionEnabled } = await import('./encryption');
    expect(isDocumentEncryptionEnabled()).toBe(false);
  });

  it('getDocumentContent decrypts encrypted docs', async () => {
    const { encryptDocumentContent, getDocumentContent } = await import('./encryption');
    const original = 'encrypted document content';
    const enc = encryptDocumentContent(original);
    const doc = {
      content: 'plaintext fallback',
      contentEncrypted: enc.contentEncrypted,
      contentIv: enc.contentIv,
      contentTag: enc.contentTag,
    };
    expect(getDocumentContent(doc)).toBe(original);
  });

  it('getDocumentContent falls back to plaintext for old docs', async () => {
    const { getDocumentContent } = await import('./encryption');
    const doc = { content: 'old plaintext content' };
    expect(getDocumentContent(doc)).toBe('old plaintext content');
  });

  it('throws when SLACK_TOKEN_ENCRYPTION_KEY is missing', async () => {
    delete process.env.SLACK_TOKEN_ENCRYPTION_KEY;
    const { encrypt } = await import('./encryption');
    expect(() => encrypt('test')).toThrow('SLACK_TOKEN_ENCRYPTION_KEY');
  });

  it('handles empty string encryption', async () => {
    const { encrypt, decrypt } = await import('./encryption');
    const encrypted = encrypt('');
    expect(decrypt(encrypted)).toBe('');
  });

  it('handles large content encryption', async () => {
    const { encrypt, decrypt } = await import('./encryption');
    const large = 'x'.repeat(100_000);
    const encrypted = encrypt(large);
    expect(decrypt(encrypted)).toBe(large);
  });
});
