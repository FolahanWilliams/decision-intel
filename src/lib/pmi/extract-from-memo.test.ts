/**
 * PMI extraction parser regression suite.
 *
 * Locked 2026-05-13 (M-3 ship). The parser is the load-bearing
 * safety layer: the LLM call is unreliable, but the parser MUST
 * always degrade gracefully (return empty signals array) on
 * malformed input rather than throw or persist garbage data.
 *
 * Test coverage:
 *   1. Happy path — valid JSON with all 6 signal keys parses cleanly.
 *   2. Invalid signal keys — silently dropped.
 *   3. Invalid horizons — default to 180.
 *   4. Out-of-range predictedConfidence — clamped to [0, 1].
 *   5. Markdown code-fence noise — stripped.
 *   6. Malformed JSON — returns empty array (no throw).
 *   7. Missing quote / proxy — entry dropped.
 *   8. Duplicate keys — only first wins.
 *   9. Non-object input — returns empty array.
 *  10. Whitespace-only input — returns empty array.
 */

import { describe, it, expect } from 'vitest';
import { parseExtractionResponse, PMI_SIGNAL_KEYS } from './extract-from-memo';

describe('parseExtractionResponse — happy path', () => {
  it('parses a valid signal of each canonical key', () => {
    const validResponse = JSON.stringify({
      signals: [
        {
          key: 'synergy_realisation_pct',
          quote: 'We project $25M in run-rate synergies by year 1.',
          proxy: '70% of projected synergies realised by 12 months',
          horizonDays: 365,
          predictedConfidence: 0.7,
          rationale: 'Memo names specific dollar figure + horizon.',
        },
        {
          key: 'talent_retention_pct',
          quote: 'We expect 90% of key engineering talent to remain.',
          proxy: '90% key-talent retention at 12 months',
          horizonDays: 365,
          predictedConfidence: 0.9,
          rationale: 'Explicit % commitment.',
        },
      ],
    });
    const signals = parseExtractionResponse(validResponse);
    expect(signals).toHaveLength(2);
    expect(signals[0].key).toBe('synergy_realisation_pct');
    expect(signals[0].predictedConfidence).toBe(0.7);
    expect(signals[1].key).toBe('talent_retention_pct');
  });

  it('accepts all 6 canonical PMI signal keys', () => {
    const allSignals = PMI_SIGNAL_KEYS.map(key => ({
      key,
      quote: `Verbatim quote for ${key}.`,
      proxy: `Proxy for ${key}`,
      horizonDays: 180,
      predictedConfidence: 0.6,
      rationale: 'Test rationale.',
    }));
    const result = parseExtractionResponse(JSON.stringify({ signals: allSignals }));
    expect(result).toHaveLength(PMI_SIGNAL_KEYS.length);
    expect(new Set(result.map(s => s.key))).toEqual(new Set(PMI_SIGNAL_KEYS));
  });
});

describe('parseExtractionResponse — defensive parsing', () => {
  it('drops entries with invalid signal keys', () => {
    const response = JSON.stringify({
      signals: [
        {
          key: 'not_a_real_key',
          quote: 'irrelevant',
          proxy: 'irrelevant',
          horizonDays: 180,
          predictedConfidence: 0.5,
          rationale: 'should be dropped',
        },
        {
          key: 'synergy_realisation_pct',
          quote: 'real quote',
          proxy: 'real proxy',
          horizonDays: 180,
          predictedConfidence: 0.5,
          rationale: 'should be kept',
        },
      ],
    });
    const signals = parseExtractionResponse(response);
    expect(signals).toHaveLength(1);
    expect(signals[0].key).toBe('synergy_realisation_pct');
  });

  it('defaults horizonDays to 180 when invalid', () => {
    const response = JSON.stringify({
      signals: [
        {
          key: 'synergy_realisation_pct',
          quote: 'q',
          proxy: 'p',
          horizonDays: 42, // Not in [90, 180, 365]
          predictedConfidence: 0.5,
          rationale: 'r',
        },
      ],
    });
    const signals = parseExtractionResponse(response);
    expect(signals).toHaveLength(1);
    expect(signals[0].horizonDays).toBe(180);
  });

  it('clamps predictedConfidence to [0, 1]', () => {
    const response = JSON.stringify({
      signals: [
        {
          key: 'synergy_realisation_pct',
          quote: 'q1',
          proxy: 'p1',
          horizonDays: 90,
          predictedConfidence: 1.5,
          rationale: 'r',
        },
        {
          key: 'talent_retention_pct',
          quote: 'q2',
          proxy: 'p2',
          horizonDays: 90,
          predictedConfidence: -0.3,
          rationale: 'r',
        },
      ],
    });
    const signals = parseExtractionResponse(response);
    expect(signals[0].predictedConfidence).toBe(1);
    expect(signals[1].predictedConfidence).toBe(0);
  });

  it('strips markdown code-fence noise', () => {
    const fenced =
      '```json\n' +
      JSON.stringify({
        signals: [
          {
            key: 'synergy_realisation_pct',
            quote: 'fenced quote',
            proxy: 'fenced proxy',
            horizonDays: 180,
            predictedConfidence: 0.7,
            rationale: 'r',
          },
        ],
      }) +
      '\n```';
    const signals = parseExtractionResponse(fenced);
    expect(signals).toHaveLength(1);
    expect(signals[0].quote).toBe('fenced quote');
  });

  it('returns empty array on malformed JSON', () => {
    expect(parseExtractionResponse('not json')).toEqual([]);
    expect(parseExtractionResponse('{broken')).toEqual([]);
    expect(parseExtractionResponse('{"signals": [{key:')).toEqual([]);
  });

  it('drops entries missing required quote or proxy', () => {
    const response = JSON.stringify({
      signals: [
        {
          key: 'synergy_realisation_pct',
          // missing quote
          proxy: 'has proxy',
          horizonDays: 180,
          predictedConfidence: 0.5,
          rationale: 'r',
        },
        {
          key: 'talent_retention_pct',
          quote: 'has quote',
          // missing proxy
          horizonDays: 180,
          predictedConfidence: 0.5,
          rationale: 'r',
        },
        {
          key: 'customer_retention_pct',
          quote: 'has quote',
          proxy: 'has proxy',
          horizonDays: 180,
          predictedConfidence: 0.5,
          rationale: 'r',
        },
      ],
    });
    const signals = parseExtractionResponse(response);
    expect(signals).toHaveLength(1);
    expect(signals[0].key).toBe('customer_retention_pct');
  });

  it('keeps only first entry when key repeats', () => {
    const response = JSON.stringify({
      signals: [
        {
          key: 'synergy_realisation_pct',
          quote: 'first',
          proxy: 'first',
          horizonDays: 90,
          predictedConfidence: 0.3,
          rationale: 'r',
        },
        {
          key: 'synergy_realisation_pct',
          quote: 'second',
          proxy: 'second',
          horizonDays: 365,
          predictedConfidence: 0.9,
          rationale: 'r',
        },
      ],
    });
    const signals = parseExtractionResponse(response);
    expect(signals).toHaveLength(1);
    expect(signals[0].quote).toBe('first');
    expect(signals[0].predictedConfidence).toBe(0.3);
  });

  it('returns empty array on non-object input', () => {
    expect(parseExtractionResponse('"just a string"')).toEqual([]);
    expect(parseExtractionResponse('42')).toEqual([]);
    expect(parseExtractionResponse('null')).toEqual([]);
    expect(parseExtractionResponse('[]')).toEqual([]);
  });

  it('returns empty array on missing signals key', () => {
    expect(parseExtractionResponse('{}')).toEqual([]);
    expect(parseExtractionResponse('{"foo": "bar"}')).toEqual([]);
    expect(parseExtractionResponse('{"signals": "not an array"}')).toEqual([]);
  });

  it('returns empty array on whitespace-only input', () => {
    expect(parseExtractionResponse('')).toEqual([]);
    expect(parseExtractionResponse('   ')).toEqual([]);
    expect(parseExtractionResponse('\n\n')).toEqual([]);
  });

  it('truncates oversized quote and proxy fields', () => {
    const longQuote = 'x'.repeat(500);
    const longProxy = 'y'.repeat(500);
    const response = JSON.stringify({
      signals: [
        {
          key: 'synergy_realisation_pct',
          quote: longQuote,
          proxy: longProxy,
          horizonDays: 180,
          predictedConfidence: 0.5,
          rationale: 'z'.repeat(400),
        },
      ],
    });
    const signals = parseExtractionResponse(response);
    expect(signals).toHaveLength(1);
    expect(signals[0].quote.length).toBeLessThanOrEqual(300);
    expect(signals[0].proxy.length).toBeLessThanOrEqual(400);
    expect(signals[0].rationale.length).toBeLessThanOrEqual(300);
  });
});
