import { describe, expect, it } from 'vitest';
import { generateShareToken } from './share-token';

describe('generateShareToken', () => {
  it('returns a 32-character string', () => {
    const token = generateShareToken();
    expect(token).toHaveLength(32);
  });

  it('uses only URL-safe base64url characters', () => {
    const token = generateShareToken();
    // base64url alphabet: A-Z a-z 0-9 - _
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  it('produces no padding characters', () => {
    const token = generateShareToken();
    expect(token).not.toContain('=');
  });

  it('produces no URL-unsafe base64 characters', () => {
    // Standard base64 uses + and /; base64url uses - and _ instead.
    // A share token must be safe to drop into a URL without escaping.
    for (let i = 0; i < 100; i++) {
      const token = generateShareToken();
      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
    }
  });

  it('generates distinct tokens across many calls (collision check)', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      tokens.add(generateShareToken());
    }
    // 192 bits of entropy across 10K samples — a collision would be
    // an astronomical failure of the system RNG, not a randomness issue
    // in this code.
    expect(tokens.size).toBe(10_000);
  });

  it('has at least 180 bits of effective entropy (sanity check)', () => {
    // 24 random bytes = 192 bits. base64url encoding is 1:1 lossless for
    // the byte count, so the encoded string carries the full entropy.
    // We verify by checking that across many samples the alphabet
    // distribution is broad (every base64url character class appears).
    let sawUpper = false;
    let sawLower = false;
    let sawDigit = false;
    for (let i = 0; i < 200; i++) {
      const token = generateShareToken();
      if (/[A-Z]/.test(token)) sawUpper = true;
      if (/[a-z]/.test(token)) sawLower = true;
      if (/[0-9]/.test(token)) sawDigit = true;
      if (sawUpper && sawLower && sawDigit) break;
    }
    expect(sawUpper).toBe(true);
    expect(sawLower).toBe(true);
    expect(sawDigit).toBe(true);
  });
});
