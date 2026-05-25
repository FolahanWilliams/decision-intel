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

  // ──────────────────────────────────────────────────────────────────
  // getCurrentKeyVersion fail-closed lock (2026-05-25 audit response).
  //
  // Tests that the function THROWS rather than silently downgrades when:
  //   (a) `*_VERSION` is set to a version with no resolvable key
  //       (misconfigured rotation: version bumped before key provisioned)
  //   (b) no encryption key is configured at all for the domain
  //
  // Previously case (a) returned the version regardless + let downstream
  // throw; case (b) returned LEGACY_VERSION + let downstream throw.
  // Both paths were silent-downgrade windows for any caller that used
  // the version for purposes beyond an immediate getKeyForVersion lookup.
  // ──────────────────────────────────────────────────────────────────

  it('getCurrentKeyVersion happy path: returns explicit version when key resolves', async () => {
    const v2Key = crypto.randomBytes(32).toString('hex');
    process.env.DOCUMENT_ENCRYPTION_KEY_V2 = v2Key;
    process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = '2';
    const { getCurrentKeyVersion } = await import('./encryption');
    expect(getCurrentKeyVersion('document')).toBe(2);
  });

  it('getCurrentKeyVersion throws when explicit VERSION points at unresolved key (misconfigured rotation)', async () => {
    // Operator bumped DOCUMENT_ENCRYPTION_KEY_VERSION=2 BEFORE setting
    // DOCUMENT_ENCRYPTION_KEY_V2. Previously the function returned 2
    // and the next getKeyForVersion(2) threw a generic error. Now it
    // throws here with a clear rotation-misconfiguration diagnostic.
    process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = '2';
    delete process.env.DOCUMENT_ENCRYPTION_KEY_V2;
    const { getCurrentKeyVersion } = await import('./encryption');
    expect(() => getCurrentKeyVersion('document')).toThrow(/Misconfigured rotation/i);
    expect(() => getCurrentKeyVersion('document')).toThrow(
      /set the V2 key BEFORE bumping DOCUMENT_ENCRYPTION_KEY_VERSION/i
    );
  });

  it('getCurrentKeyVersion throws when explicit slack VERSION points at unresolved key', async () => {
    process.env.SLACK_TOKEN_ENCRYPTION_KEY_VERSION = '3';
    delete process.env.SLACK_TOKEN_ENCRYPTION_KEY_V3;
    const { getCurrentKeyVersion } = await import('./encryption');
    expect(() => getCurrentKeyVersion('slack')).toThrow(/Misconfigured rotation/i);
  });

  it('getCurrentKeyVersion throws when no key configured at all for the domain', async () => {
    // Both the legacy alias AND every versioned suffix are absent.
    // Previously returned LEGACY_VERSION; now throws.
    delete process.env.DOCUMENT_ENCRYPTION_KEY;
    delete process.env.DOCUMENT_ENCRYPTION_KEY_V1;
    delete process.env.DOCUMENT_ENCRYPTION_KEY_V2;
    delete process.env.DOCUMENT_ENCRYPTION_KEY_VERSION;
    const { getCurrentKeyVersion } = await import('./encryption');
    expect(() => getCurrentKeyVersion('document')).toThrow(/No encryption key configured/i);
    expect(() => getCurrentKeyVersion('document')).toThrow(/DOCUMENT_ENCRYPTION_KEY/);
  });

  it('getCurrentKeyVersion falls through to probe when VERSION env is unparseable (robust to typos)', async () => {
    // `_VERSION=2foo` parses as 2 (parseInt's lenient behavior). That
    // case is covered by the misconfigured-rotation throw. But a
    // genuinely unparseable value like `_VERSION=abc` should warn and
    // fall through to the probe — robust against operator typos that
    // don't change substance. Validates the warn-and-fall-through path
    // still works.
    process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = 'not-a-number';
    process.env.DOCUMENT_ENCRYPTION_KEY = TEST_DOC_KEY; // legacy → v1
    const { getCurrentKeyVersion } = await import('./encryption');
    expect(getCurrentKeyVersion('document')).toBe(1);
  });

  it('getCurrentKeyVersion probes highest resolvable when VERSION env is unset', async () => {
    const v2Key = crypto.randomBytes(32).toString('hex');
    process.env.DOCUMENT_ENCRYPTION_KEY_V2 = v2Key;
    delete process.env.DOCUMENT_ENCRYPTION_KEY_VERSION;
    const { getCurrentKeyVersion } = await import('./encryption');
    expect(getCurrentKeyVersion('document')).toBe(2);
  });

  it('getCurrentKeyVersion treats explicit VERSION=1 as legacy-alias-resolvable', async () => {
    // The legacy un-suffixed env counts as v1 even when no _V1 suffix is
    // set. The rotation entry point: set _VERSION=1 + the legacy key,
    // and it should resolve cleanly.
    process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = '1';
    delete process.env.DOCUMENT_ENCRYPTION_KEY_V1;
    // DOCUMENT_ENCRYPTION_KEY (legacy) is already set in beforeEach.
    const { getCurrentKeyVersion } = await import('./encryption');
    expect(getCurrentKeyVersion('document')).toBe(1);
  });

  it('encryptDocumentContent surfaces the misconfigured-rotation diagnostic before encrypt fails', async () => {
    // End-to-end: the fail-closed change means encryptDocumentContent
    // throws with the rotation diagnostic at getCurrentKeyVersion,
    // BEFORE getKeyForVersion would have thrown with a generic one.
    process.env.DOCUMENT_ENCRYPTION_KEY_VERSION = '2';
    delete process.env.DOCUMENT_ENCRYPTION_KEY_V2;
    process.env.DOCUMENT_ENCRYPTION_KEY = TEST_DOC_KEY; // legacy still set
    const { encryptDocumentContent } = await import('./encryption');
    expect(() => encryptDocumentContent('confidential')).toThrow(/Misconfigured rotation/i);
  });
});
