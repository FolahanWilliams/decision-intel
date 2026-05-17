/**
 * Algorithm Aversion regression suite (R²F paper-application #7,
 * Dietvorst, Simmons & Massey 2015).
 *
 * Renders as a DPR cover §4.9 strip + live-audit SignalBlock. This is
 * the detector that counter-programs the single most common buyer
 * objection to DI itself. Pure function. Locks: dismissive-phrase
 * pattern detection, compound-bias elevation, verdict bands,
 * cannot_assess, determinism.
 */

import { describe, it, expect } from 'vitest';
import {
  computeAlgorithmAversion,
  algorithmAversionVerdictLabel,
  type AlgorithmAversionVerdict,
} from './algorithm-aversion';

type Sev = 'critical' | 'high' | 'medium' | 'low';
const b = (biasType: string, severity: Sev = 'critical', excerpt?: string) => ({
  biasType,
  severity,
  excerpt,
});

describe('computeAlgorithmAversion — no signal', () => {
  it('returns no_aversion_signal for analytically-framed text', () => {
    const r = computeAlgorithmAversion({
      biases: [b('confirmation_bias', 'medium', 'The model output was validated against actuals.')],
      summary: 'We relied on the systematic forecast and stress-tested it.',
    });
    expect(r.verdict).toBe('no_aversion_signal');
    expect(r.dismissivePhraseCount).toBe(0);
  });

  it('returns cannot_assess when there is no scannable text', () => {
    const r = computeAlgorithmAversion({ biases: [], summary: null });
    expect(r.verdict).toBe('cannot_assess');
  });
});

describe('computeAlgorithmAversion — dismissive language', () => {
  it('detects multiple dismissive phrases and escalates to severe', () => {
    const r = computeAlgorithmAversion({
      biases: [
        b(
          'overconfidence_bias',
          'critical',
          "The numbers don't tell the whole story. This is more art than science, " +
            'and I trust my gut here.'
        ),
      ],
      summary: null,
    });
    expect(r.dismissivePhraseCount).toBeGreaterThanOrEqual(3);
    expect(r.aversionScore).toBeGreaterThan(0.6);
    expect(r.verdict).toBe('severe_aversion');
    expect(r.patternsDetected).toContain('art_not_science');
  });

  it('mild dismissive language without compounding stays mild', () => {
    const r = computeAlgorithmAversion({
      biases: [b('confirmation_bias', 'low', "We've seen this kind of thing before.")],
      summary: null,
    });
    expect(r.verdict).toBe('mild_aversion');
  });

  it('compound authority/illusion bias hits elevate the band', () => {
    const withCompound = computeAlgorithmAversion({
      biases: [
        b(
          'illusion_of_validity',
          'critical',
          'Despite what the data says, experience tells me otherwise.'
        ),
        b('authority_bias', 'high', 'The senior partner is certain.'),
      ],
      summary: null,
    });
    expect(withCompound.compoundBiasHits.length).toBeGreaterThanOrEqual(1);
    expect(['material_aversion', 'severe_aversion']).toContain(withCompound.verdict);
  });

  it('caps the aversion score at 1.0 and dedupes pattern classes', () => {
    const r = computeAlgorithmAversion({
      biases: [
        b(
          'overconfidence_bias',
          'critical',
          'More art than science. Trust my gut. The data does not capture this. ' +
            'Despite what the model says, soft factors dominate. Pattern recognition beats base rates.'
        ),
      ],
      summary: null,
    });
    expect(r.aversionScore).toBeLessThanOrEqual(1.0);
    expect(new Set(r.patternsDetected).size).toBe(r.patternsDetected.length);
    expect(r.flaggedSnippets.length).toBeLessThanOrEqual(3);
  });

  it('is deterministic for identical inputs', () => {
    const input = {
      biases: [b('overconfidence_bias', 'high', 'I trust my gut on this one.')],
      summary: 'art, not science',
    };
    expect(computeAlgorithmAversion(input)).toEqual(computeAlgorithmAversion(input));
  });
});

describe('algorithmAversionVerdictLabel', () => {
  it('produces a non-empty label for every verdict', () => {
    const verdicts: AlgorithmAversionVerdict[] = [
      'no_aversion_signal',
      'mild_aversion',
      'material_aversion',
      'severe_aversion',
      'cannot_assess',
    ];
    for (const v of verdicts) expect(algorithmAversionVerdictLabel(v).length).toBeGreaterThan(0);
  });
});
