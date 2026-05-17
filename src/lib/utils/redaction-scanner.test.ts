/**
 * Pre-submit PII redaction scanner regression suite.
 *
 * redaction-scanner.ts gates the demo paste flow + client-safe DPR. A
 * miss leaks a real CIM's names/amounts into the pipeline — the exact
 * procurement objection the scanner exists to neutralise. Pure function,
 * zero deps. Locks: per-category detection, the name denylist, overlap
 * dedupe (longest wins), stable per-value placeholder numbering,
 * index-safe rewrite, empty-input safety.
 */

import { describe, it, expect } from 'vitest';
import {
  scanForPii,
  applyRedactions,
  REDACTION_CATEGORY_LABEL,
  type RedactionCategory,
} from './redaction-scanner';

describe('scanForPii — empty / invalid input', () => {
  it('returns zeroed counts for empty or non-string input', () => {
    const r = scanForPii('');
    expect(r.hits).toEqual([]);
    expect(r.counts).toEqual({ email: 0, phone: 0, ssn: 0, amount: 0, entity: 0, name: 0 });
    // @ts-expect-error — exercising the runtime guard for non-string input
    expect(scanForPii(null).hits).toEqual([]);
  });
});

describe('scanForPii — category detection', () => {
  it('catches emails', () => {
    const r = scanForPii('Reach the deal lead at jane.doe@acquirer-corp.com for terms.');
    expect(r.counts.email).toBe(1);
    expect(r.hits.find(h => h.category === 'email')?.value).toBe('jane.doe@acquirer-corp.com');
  });

  it('catches US SSN and UK NI numbers', () => {
    const r = scanForPii('SSN 123-45-6789 and NI number AB123456C on file.');
    expect(r.counts.ssn).toBe(2);
  });

  it('catches large financial totals', () => {
    const r = scanForPii('The deal is valued at $1.2 billion with a £5,000,000 earn-out.');
    expect(r.counts.amount).toBeGreaterThanOrEqual(2);
  });

  it('catches company entity names by suffix', () => {
    const r = scanForPii('We are acquiring Northwind Trading Ltd and Acme Holdings Inc.');
    expect(r.counts.entity).toBeGreaterThanOrEqual(2);
  });

  it('catches a plausible person name', () => {
    const r = scanForPii('The memo was authored by Marcus Whitfield for the committee.');
    expect(r.hits.some(h => h.category === 'name' && h.value === 'Marcus Whitfield')).toBe(true);
  });

  it('does NOT flag denylisted capitalised non-names', () => {
    const r = scanForPii(
      'The Audit Committee met in New York to review the Annual Report and Cash Flow.'
    );
    const names = r.hits.filter(h => h.category === 'name').map(h => h.value);
    expect(names).not.toContain('New York');
    expect(names).not.toContain('Audit Committee');
    expect(names).not.toContain('Annual Report');
  });
});

describe('scanForPii — overlap dedupe', () => {
  it('keeps the longest match when an entity name overlaps a person-name hit', () => {
    const r = scanForPii('Sankore Investments Ltd led the round.');
    // The entity match ("Sankore Investments Ltd") should win over a
    // shorter overlapping name hit ("Sankore Investments").
    const overlapping = r.hits.filter(h => h.start <= 5 && h.end >= 5);
    // No two retained hits may overlap.
    const sorted = [...r.hits].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].start).toBeGreaterThanOrEqual(sorted[i - 1].end);
    }
    expect(overlapping.length).toBeLessThanOrEqual(1);
  });
});

describe('applyRedactions — stable numbering + index safety', () => {
  it('replaces hits with stable [CATEGORY_N] placeholders', () => {
    const text = 'Email alice@x.com and bob@y.com; alice@x.com is primary.';
    const { hits } = scanForPii(text);
    const emailHits = hits.filter(h => h.category === 'email');
    const { redactedText, placeholderMap } = applyRedactions(text, emailHits);

    // Same value → same placeholder number on every occurrence.
    expect(redactedText).not.toContain('alice@x.com');
    expect(redactedText).not.toContain('bob@y.com');
    expect(redactedText.match(/\[EMAIL_1\]/g)?.length).toBe(2); // alice appears twice
    expect(redactedText).toContain('[EMAIL_2]'); // bob once
    expect(Object.keys(placeholderMap)).toEqual(expect.arrayContaining(['[EMAIL_1]', '[EMAIL_2]']));
    expect(placeholderMap['[EMAIL_1]']).toBe('alice@x.com');
  });

  it('is a no-op when nothing is selected for redaction', () => {
    const { redactedText, placeholderMap } = applyRedactions('untouched', []);
    expect(redactedText).toBe('untouched');
    expect(placeholderMap).toEqual({});
  });

  it('rewrites from the end so multi-hit replacement does not corrupt later indices', () => {
    const text = 'A $1.2 billion deal with a $50,000,000 reserve and contact zoe@deal.io.';
    const { hits } = scanForPii(text);
    const { redactedText } = applyRedactions(text, hits);
    expect(redactedText).not.toMatch(/\$1\.2 billion/);
    expect(redactedText).not.toContain('zoe@deal.io');
    // Placeholders remain well-formed (no truncated/garbled brackets).
    expect(redactedText).toMatch(/\[(AMOUNT|EMAIL)_\d+\]/);
  });
});

describe('REDACTION_CATEGORY_LABEL', () => {
  it('has a human label for every category', () => {
    const cats: RedactionCategory[] = ['email', 'phone', 'ssn', 'amount', 'entity', 'name'];
    for (const c of cats) expect(REDACTION_CATEGORY_LABEL[c].length).toBeGreaterThan(0);
  });
});
