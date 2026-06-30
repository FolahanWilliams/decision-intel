import { describe, it, expect } from 'vitest';
import { isGenericFilename, sanitizeTitle } from './document-title';

describe('isGenericFilename', () => {
  it('flags the paste-<timestamp> default as generic', () => {
    expect(isGenericFilename('paste-2026-06-30T00-07-44-574Z.txt')).toBe(true);
  });

  it('flags other placeholder names', () => {
    expect(isGenericFilename('upload-123.pdf')).toBe(true);
    expect(isGenericFilename('untitled.txt')).toBe(true);
    expect(isGenericFilename('document.docx')).toBe(true);
    expect(isGenericFilename('new-document.md')).toBe(true);
    expect(isGenericFilename('memo.txt')).toBe(true);
  });

  it('does NOT touch an intentionally-named upload', () => {
    expect(isGenericFilename('Q3_Strategy_Memo.docx')).toBe(false);
    expect(isGenericFilename('SpaceX_S1_RiskFactors.pdf')).toBe(false);
    expect(isGenericFilename('Project Atlas board deck.pdf')).toBe(false);
    expect(isGenericFilename('2026-acquisition-thesis.txt')).toBe(false);
  });

  it('handles empty / whitespace input safely', () => {
    expect(isGenericFilename('')).toBe(false);
    expect(isGenericFilename('   ')).toBe(false);
  });
});

describe('sanitizeTitle', () => {
  it('cleans a plain title and keeps the extension', () => {
    expect(sanitizeTitle('SpaceX S-1 Registration', '.txt')).toBe('SpaceX S-1 Registration.txt');
  });

  it('strips surrounding quotes, markdown, and a Title: prefix', () => {
    expect(sanitizeTitle('"SpaceX S-1 Registration"', '.txt')).toBe('SpaceX S-1 Registration.txt');
    expect(sanitizeTitle('**SpaceX S-1**', '.pdf')).toBe('SpaceX S-1.pdf');
    expect(sanitizeTitle('Title: Acme Q3 Board Deck', '.pdf')).toBe('Acme Q3 Board Deck.pdf');
  });

  it('collapses whitespace and strips path separators / control chars', () => {
    expect(sanitizeTitle('Acme   Q3\n\tBoard / Deck', '.pdf')).toBe('Acme Q3 Board Deck.pdf');
  });

  it('returns null for unusable output (too short / empty)', () => {
    expect(sanitizeTitle('', '.txt')).toBeNull();
    expect(sanitizeTitle('  ', '.txt')).toBeNull();
    expect(sanitizeTitle('a', '.txt')).toBeNull();
  });

  it('truncates an over-long title', () => {
    const long = 'A'.repeat(200);
    const out = sanitizeTitle(long, '.txt');
    expect(out).not.toBeNull();
    expect(out!.length).toBeLessThanOrEqual(90 + '.txt'.length);
  });

  it('falls back to .txt when given a bad extension', () => {
    expect(sanitizeTitle('Acme Memo', 'not-an-ext')).toBe('Acme Memo.txt');
  });
});
