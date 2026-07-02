import { describe, it, expect } from 'vitest';
import { isGenericFilename, isUninformativeFilename, sanitizeTitle } from './document-title';

describe('isGenericFilename (alias of isUninformativeFilename)', () => {
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

describe('isUninformativeFilename — random-string / hash / junk detection', () => {
  it('flags hash / UUID / timestamp filenames (the "random string" case)', () => {
    expect(isUninformativeFilename('d41d8cd98f00b204e9800998ecf8427e.pdf')).toBe(true); // md5
    expect(isUninformativeFilename('550e8400-e29b-41d4-a716-446655440000.pdf')).toBe(true); // uuid
    expect(isUninformativeFilename('1719800000000.txt')).toBe(true); // ms timestamp
    expect(isUninformativeFilename('a3f9b2c1.html')).toBe(true); // short hex-ish blob
    expect(isUninformativeFilename('Fq9Xz2Lp8kR3mN7w.pdf')).toBe(true); // 16+ alnum token w/ digit
  });

  it('flags generic browser / OS junk across ANY extension', () => {
    expect(isUninformativeFilename('document (3).pdf')).toBe(true);
    expect(isUninformativeFilename('scan0001.pdf')).toBe(true);
    expect(isUninformativeFilename('screenshot.png')).toBe(true);
    expect(isUninformativeFilename('draft.docx')).toBe(true);
  });

  it('KEEPS informative names (real words / single legit word) regardless of case', () => {
    expect(isUninformativeFilename('google ipo.html')).toBe(false); // 2 real words
    expect(isUninformativeFilename('WeWork S-1.pdf')).toBe(false);
    expect(isUninformativeFilename('Fermi.pdf')).toBe(false); // single real word
    expect(isUninformativeFilename('Fermi America S-11.pdf')).toBe(false);
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
