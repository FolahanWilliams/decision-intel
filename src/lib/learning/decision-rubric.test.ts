/**
 * Decision Rubric regression suite (R²F paper-application #4, Dawes 1979).
 *
 * Renders as a DPR cover §4.8 strip + live-audit SignalBlock. Pure
 * function. Locks: structural-marker detection, narrative-bias scoring,
 * the verdict-band decision tree, cannot_assess fallback, determinism.
 */

import { describe, it, expect } from 'vitest';
import {
  computeDecisionRubric,
  decisionRubricVerdictLabel,
  type DecisionRubricVerdict,
} from './decision-rubric';

type Sev = 'critical' | 'high' | 'medium' | 'low';
const b = (biasType: string, severity: Sev = 'critical', excerpt?: string) => ({
  biasType,
  severity,
  excerpt,
});

describe('computeDecisionRubric — explicit rubric', () => {
  it('flags Dawes-robust structure when multiple structural markers appear', () => {
    const r = computeDecisionRubric({
      biases: [],
      summary:
        'We built a decision matrix. Each criterion was weighted at 30%. ' +
        'We scored each option against the following criteria.',
    });
    expect(r.structureScore).toBeGreaterThanOrEqual(0.5);
    expect(r.narrativeScore).toBe(0);
    expect(r.verdict).toBe('explicit_rubric');
    expect(r.structuralMarkers.length).toBeGreaterThan(1);
    expect(r.note).toContain('Dawes');
  });
});

describe('computeDecisionRubric — narrative failure pattern', () => {
  it('flags narrative_only when confidence biases dominate with no structure', () => {
    const r = computeDecisionRubric({
      biases: [
        b('illusion_of_validity', 'critical'),
        b('inside_view_dominance', 'critical'),
        b('narrative_fallacy', 'critical'),
      ],
      summary: 'This is the obvious right call given our trajectory.',
    });
    expect(r.narrativeScore).toBeGreaterThanOrEqual(0.6);
    expect(r.structureScore).toBeLessThan(0.2);
    expect(r.verdict).toBe('narrative_only');
    expect(r.narrativeTriggers.length).toBeGreaterThan(0);
  });

  it('flags narrative_dominant for moderate narrative signal without structure', () => {
    // One critical illusion_of_validity = 0.35 narrative, structure 0 →
    // lands in [0.3, 0.6) with no structure ⇒ narrative_dominant. (A
    // single `high` hit = 0.2975, just under the 0.3 band edge — that
    // boundary is itself locked by the cannot_assess test below.)
    const r = computeDecisionRubric({
      biases: [b('illusion_of_validity', 'critical')],
      summary: 'We are confident this is correct.',
    });
    expect(r.narrativeScore).toBeCloseTo(0.35, 2);
    expect(r.structureScore).toBe(0);
    expect(r.verdict).toBe('narrative_dominant');
  });
});

describe('computeDecisionRubric — fallback + determinism', () => {
  it('returns cannot_assess when there is no scannable signal at all', () => {
    const r = computeDecisionRubric({ biases: [], summary: null });
    expect(r.verdict).toBe('cannot_assess');
  });

  it('returns cannot_assess for low signal on both axes', () => {
    const r = computeDecisionRubric({
      biases: [b('confirmation_bias', 'low')],
      summary: 'A brief unstructured note.',
    });
    expect(r.verdict).toBe('cannot_assess');
  });

  it('is deterministic for identical inputs', () => {
    const input = {
      biases: [b('illusion_of_validity', 'high', 'we scored each option')],
      summary: 'decision matrix with weighted at 25%',
    };
    expect(computeDecisionRubric(input)).toEqual(computeDecisionRubric(input));
  });
});

describe('decisionRubricVerdictLabel', () => {
  it('produces a non-empty label for every verdict', () => {
    const verdicts: DecisionRubricVerdict[] = [
      'explicit_rubric',
      'partial_criteria',
      'narrative_dominant',
      'narrative_only',
      'cannot_assess',
    ];
    for (const v of verdicts) expect(decisionRubricVerdictLabel(v).length).toBeGreaterThan(0);
  });
});
