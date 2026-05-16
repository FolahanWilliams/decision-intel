/**
 * Calibrated Rejection regression suite (R²F paper-application #10).
 *
 * Renders as a DPR cover strip + live-audit SignalBlock — the
 * "does this memo's confidence match its evidence?" verdict a
 * Margaret-class CSO asks. Pure function. Locks: schema-drift
 * cannot_assess short-circuit, rhetorical/earned math, gap → band
 * thresholds, trigger capture, determinism.
 */

import { describe, it, expect } from 'vitest';
import {
  computeCalibratedRejection,
  calibratedRejectionVerdictLabel,
  type CalibratedRejectionVerdict,
} from './calibrated-rejection';
import type { ValidityClass, ValidityClassification } from './validity-classifier';
import type { FeedbackAdequacy, FeedbackAdequacyVerdict } from './feedback-adequacy';

function validity(validityClass: ValidityClass): ValidityClassification {
  return {
    validityClass,
    rationale: 'test',
    signals: { documentType: 'ic_memo', industry: null, decisionHorizon: null },
  };
}

function feedback(verdict: FeedbackAdequacyVerdict): FeedbackAdequacy {
  return { verdict } as unknown as FeedbackAdequacy;
}

type Sev = 'critical' | 'high' | 'medium' | 'low';
const b = (biasType: string, severity: Sev = 'critical') => ({ biasType, severity });

describe('computeCalibratedRejection — schema-drift short-circuit', () => {
  it('returns cannot_assess (no fabricated band) when feedback is unknown', () => {
    const r = computeCalibratedRejection({
      validity: validity('high'),
      feedback: feedback('unknown'),
      biases: [b('illusion_of_validity')],
    });
    expect(r.verdict).toBe('cannot_assess');
    expect(r.rhetoricalConfidenceScore).toBe(0);
    expect(r.earnedConfidenceScore).toBe(0);
    expect(r.note).toContain('cannot be assessed');
  });
});

describe('computeCalibratedRejection — verdict bands', () => {
  it('well_calibrated: no confidence-language biases, high validity, adequate feedback', () => {
    const r = computeCalibratedRejection({
      validity: validity('high'),
      feedback: feedback('adequate'),
      biases: [b('planning_fallacy')], // not a confidence-language bias
    });
    expect(r.rhetoricalConfidenceScore).toBe(0);
    expect(r.earnedConfidenceScore).toBe(1);
    expect(r.calibrationGap).toBe(0);
    expect(r.verdict).toBe('well_calibrated');
    expect(r.triggers).toEqual([]);
  });

  it('severely_overconfident: critical confidence biases in a zero-validity, cold-start memo', () => {
    const r = computeCalibratedRejection({
      validity: validity('zero'),
      feedback: feedback('cold_start'),
      biases: [b('illusion_of_validity', 'critical'), b('overconfidence_bias', 'critical')],
    });
    // rhetorical = 0.4 + 0.35 = 0.75 ; earned = 0.1 * 0.15 = 0.015 ; gap ≈ 0.74
    expect(r.rhetoricalConfidenceScore).toBeCloseTo(0.75, 2);
    expect(r.calibrationGap).toBeGreaterThan(0.6);
    expect(r.verdict).toBe('severely_overconfident');
    expect(r.triggers).toContain('illusion_of_validity (critical)');
  });

  it('caps rhetorical confidence at 1.0 even with many critical confidence biases', () => {
    const r = computeCalibratedRejection({
      validity: validity('low'),
      feedback: feedback('sparse'),
      biases: [
        b('illusion_of_validity', 'critical'),
        b('overconfidence_bias', 'critical'),
        b('authority_bias', 'critical'),
        b('anchoring_bias', 'critical'),
      ],
    });
    expect(r.rhetoricalConfidenceScore).toBeLessThanOrEqual(1.0);
  });

  it('ignores non-confidence-language biases when scoring rhetoric', () => {
    const r = computeCalibratedRejection({
      validity: validity('high'),
      feedback: feedback('adequate'),
      biases: [b('confirmation_bias', 'critical'), b('sunk_cost_fallacy', 'critical')],
    });
    expect(r.rhetoricalConfidenceScore).toBe(0);
    expect(r.verdict).toBe('well_calibrated');
  });

  it('is deterministic for identical inputs', () => {
    const input = {
      validity: validity('low'),
      feedback: feedback('sparse'),
      biases: [b('overconfidence_bias', 'high')],
    };
    expect(computeCalibratedRejection(input)).toEqual(computeCalibratedRejection(input));
  });
});

describe('calibratedRejectionVerdictLabel', () => {
  it('produces a non-empty label for every verdict', () => {
    const verdicts: CalibratedRejectionVerdict[] = [
      'well_calibrated',
      'mildly_overconfident',
      'materially_overconfident',
      'severely_overconfident',
      'cannot_assess',
    ];
    for (const v of verdicts) expect(calibratedRejectionVerdictLabel(v).length).toBeGreaterThan(0);
  });
});
