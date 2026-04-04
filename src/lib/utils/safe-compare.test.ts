import { describe, it, expect } from 'vitest';
import { safeCompare, validateBearerToken } from './safe-compare';

describe('safeCompare', () => {
  it('returns true for equal strings', () => {
    expect(safeCompare('secret123', 'secret123')).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(safeCompare('secret123', 'secret456')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(safeCompare('short', 'muchlongerstring')).toBe(false);
  });

  it('returns true for empty strings', () => {
    expect(safeCompare('', '')).toBe(true);
  });

  it('returns false when one string is empty', () => {
    expect(safeCompare('', 'notempty')).toBe(false);
    expect(safeCompare('notempty', '')).toBe(false);
  });

  it('handles unicode strings', () => {
    expect(safeCompare('café', 'café')).toBe(true);
    expect(safeCompare('café', 'cafe')).toBe(false);
  });
});

describe('validateBearerToken', () => {
  it('returns true for valid Bearer token', () => {
    expect(validateBearerToken('Bearer mysecret', 'mysecret')).toBe(true);
  });

  it('returns false for wrong token', () => {
    expect(validateBearerToken('Bearer wrong', 'mysecret')).toBe(false);
  });

  it('returns false for null header', () => {
    expect(validateBearerToken(null, 'mysecret')).toBe(false);
  });

  it('returns false for empty header', () => {
    expect(validateBearerToken('', 'mysecret')).toBe(false);
  });

  it('returns false for non-Bearer header', () => {
    expect(validateBearerToken('Basic mysecret', 'mysecret')).toBe(false);
  });
});
