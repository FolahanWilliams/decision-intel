import { describe, it, expect } from 'vitest';
import { parseMarketSnapshot } from './marketContextEnricher';

describe('parseMarketSnapshot', () => {
  it('parses a well-formed grounded response', () => {
    const raw = JSON.stringify({
      summary: 'Acme is mid-integration of a $2B acquisition amid margin pressure.',
      signals: [
        {
          headline: 'Announced $2B acquisition of Beta Corp',
          detail: 'Doubles Acme headcount; integration risk is live.',
          source: 'Reuters',
          date: '2026-05',
        },
        {
          headline: 'CFO departed',
          detail: 'Third finance-lead exit in 18 months.',
          source: 'WSJ',
        },
      ],
    });
    const s = parseMarketSnapshot(raw, 'Acme');
    expect(s).not.toBeNull();
    expect(s!.company).toBe('Acme');
    expect(s!.signals).toHaveLength(2);
    expect(s!.signals[0].source).toBe('Reuters');
    expect(s!.signals[1].date).toBeUndefined();
    expect(s!.asOf).toBeTruthy();
  });

  it('tolerates ```json fences', () => {
    const raw = '```json\n{"summary":"x","signals":[]}\n```';
    expect(parseMarketSnapshot(raw, 'Acme')!.summary).toBe('x');
  });

  it('DROPS signals with no source (anti-fabrication guard)', () => {
    const raw = JSON.stringify({
      summary: 'context',
      signals: [
        { headline: 'Real cited event', detail: 'd', source: 'FT' },
        { headline: 'Uncited claim', detail: 'd' }, // no source → dropped
        { detail: 'no headline', source: 'FT' }, // no headline → dropped
      ],
    });
    const s = parseMarketSnapshot(raw, 'Acme');
    expect(s!.signals).toHaveLength(1);
    expect(s!.signals[0].headline).toBe('Real cited event');
  });

  it('a summary with an empty signals array is VALID (nothing current found)', () => {
    const s = parseMarketSnapshot('{"summary":"quiet quarter","signals":[]}', 'Acme');
    expect(s).not.toBeNull();
    expect(s!.summary).toBe('quiet quarter');
    expect(s!.signals).toHaveLength(0);
  });

  it('returns null when there is neither a summary nor any usable signal', () => {
    expect(parseMarketSnapshot('{"summary":"","signals":[]}', 'Acme')).toBeNull();
    expect(parseMarketSnapshot('{"summary":"","signals":[{"detail":"x"}]}', 'Acme')).toBeNull();
  });

  it('returns null on malformed / non-object JSON', () => {
    expect(parseMarketSnapshot('not json', 'Acme')).toBeNull();
    expect(parseMarketSnapshot('[1,2,3]', 'Acme')).toBeNull();
    expect(parseMarketSnapshot('', 'Acme')).toBeNull();
  });

  it('returns null when the company name is blank', () => {
    expect(parseMarketSnapshot('{"summary":"x"}', '  ')).toBeNull();
  });

  it('caps signals at 6', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      headline: `event ${i}`,
      detail: 'd',
      source: 'FT',
    }));
    const s = parseMarketSnapshot(JSON.stringify({ summary: 's', signals: many }), 'Acme');
    expect(s!.signals).toHaveLength(6);
  });
});
