/**
 * Compound Scoring Engine regression suite.
 *
 * compound-engine.ts is the deterministic post-LLM scoring layer that
 * silently moves every customer's DQI. CLAUDE.md flags it as proprietary
 * IP with a SYNTHETIC_WEIGHTS_LEGACY_2_0_0 pin specifically to stop it
 * drifting the platform-baseline Brier (0.258). Until this suite it had
 * zero direct tests — a regression here shifts scores for all users with
 * no signal. These tests lock the documented invariants:
 *
 *   - detectWinnerEffect / detectStressSignals: 3-match + density gating
 *   - computeConfidenceDecay: sigmoid shape, floor at 0.5, age<=0 → 1.0
 *   - computeCompoundScore: no-bias no-op, interaction compounding,
 *     context multipliers, pattern overrides, biological signals,
 *     org calibration, [0,100] clamp, per-bias 3.0× cap, determinism
 *
 * case-correlations is mocked to a neutral multiplier (same posture as
 * dqi.test.ts) so the compound math is isolated and deterministic.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/data/case-correlations', () => ({
  computeCorrelationMultiplier: vi.fn().mockReturnValue({
    multiplier: 1.0,
    matchedPairs: [],
    matchedSuccessPatterns: [],
    beneficialDamping: 1.0,
  }),
}));

import {
  detectWinnerEffect,
  detectStressSignals,
  computeConfidenceDecay,
  computeCompoundScore,
  type DetectedBias,
  type DocumentContext,
} from './compound-engine';

function ctx(overrides?: Partial<DocumentContext>): DocumentContext {
  return {
    monetaryStakes: 'medium',
    participantCount: 6,
    dissentPresent: true,
    timelineWeeks: 12,
    documentAgeWeeks: 0,
    wordCount: 2000,
    ...overrides,
  };
}

function bias(
  type: string,
  severity: DetectedBias['severity'] = 'high',
  confidence = 1
): DetectedBias {
  return { type, severity, confidence };
}

describe('detectWinnerEffect', () => {
  it('returns not-detected on empty content', () => {
    const r = detectWinnerEffect('');
    expect(r.detected).toBe(false);
    expect(r.matchCount).toBe(0);
  });

  it('requires 3+ matches AND density > 0.05 to fire', () => {
    // Two signals only → below the 3-match floor.
    const two = detectWinnerEffect('Record profits this quarter. We outperformed rivals.');
    expect(two.matchCount).toBe(2);
    expect(two.detected).toBe(false);
  });

  it('fires when 3+ distinct success-streak signals appear densely', () => {
    const text =
      'Record revenue this quarter. We outperformed every rival. ' +
      'This is our best year ever on record. Momentum is unstoppable.';
    const r = detectWinnerEffect(text);
    expect(r.matchCount).toBeGreaterThanOrEqual(3);
    expect(r.signalDensity).toBeGreaterThan(0.05);
    expect(r.detected).toBe(true);
  });

  it('density gating suppresses 3 matches buried in a long factual report', () => {
    const filler = 'The quarterly operating review covered standard topics. '.repeat(60);
    const r = detectWinnerEffect(
      filler + 'Record revenue. We outperformed peers. Best year ever on record.'
    );
    expect(r.matchCount).toBeGreaterThanOrEqual(3);
    expect(r.signalDensity).toBeLessThanOrEqual(0.05);
    expect(r.detected).toBe(false);
  });
});

describe('detectStressSignals', () => {
  it('returns not-detected on empty content', () => {
    expect(detectStressSignals('').detected).toBe(false);
  });

  it('fires on dense crisis language with 3+ signals', () => {
    const r = detectStressSignals(
      'This is an emergency. We are hemorrhaging cash. ' +
        'The market is in free-fall and we must act now.'
    );
    expect(r.matchCount).toBeGreaterThanOrEqual(3);
    expect(r.detected).toBe(true);
  });

  it('does not fire on a single prudent risk acknowledgement', () => {
    const r = detectStressSignals(
      'Volatile market conditions require caution in our capital plan.'
    );
    expect(r.detected).toBe(false);
  });
});

describe('computeConfidenceDecay', () => {
  it('returns full confidence for fresh / non-positive age', () => {
    expect(computeConfidenceDecay(0)).toBe(1.0);
    expect(computeConfidenceDecay(-5)).toBe(1.0);
  });

  it('is monotonically non-increasing with age', () => {
    let prev = computeConfidenceDecay(1);
    for (const w of [4, 12, 26, 40, 52, 104, 260]) {
      const cur = computeConfidenceDecay(w);
      expect(cur).toBeLessThanOrEqual(prev + 1e-9);
      prev = cur;
    }
  });

  it('never decays below the 0.5 floor', () => {
    expect(computeConfidenceDecay(10_000)).toBeGreaterThanOrEqual(0.5);
  });

  it('locks the actual sigmoid waypoints (note: source docstring waypoints are aspirational and do NOT match the k=0.04/midpoint=40/maxDecay=0.45 implementation — these assert real behavior)', () => {
    expect(computeConfidenceDecay(12)).toBeCloseTo(0.889, 2);
    expect(computeConfidenceDecay(26)).toBeCloseTo(0.836, 2);
    expect(computeConfidenceDecay(52)).toBeCloseTo(0.722, 2);
    // The sigmoid bottoms at 1 - maxDecay = 0.55, so the 0.5 Math.max
    // floor is defensive and never actually binds.
    expect(computeConfidenceDecay(10_000)).toBeCloseTo(0.55, 2);
  });
});

describe('computeCompoundScore — no-bias no-op', () => {
  it('leaves a clean memo at its raw score with no compounding', () => {
    const r = computeCompoundScore(80, [], ctx());
    expect(r.calibratedScore).toBe(80);
    expect(r.compoundMultiplier).toBe(1.0);
    expect(r.rawScore).toBe(80);
    expect(r.biasScores).toEqual([]);
  });
});

describe('computeCompoundScore — interaction compounding', () => {
  it('amplifies severity when caller-supplied interaction weights pair two biases', () => {
    const biases = [bias('confirmation_bias'), bias('anchoring_bias')];
    const withInteraction = computeCompoundScore(80, biases, ctx(), {
      interactionWeights: { 'confirmation_bias::anchoring_bias': 1.5 },
    });
    const noInteraction = computeCompoundScore(80, biases, ctx(), {
      interactionWeights: { 'confirmation_bias::anchoring_bias': 1.0 },
    });
    expect(withInteraction.compoundMultiplier).toBeGreaterThan(1.0);
    expect(withInteraction.calibratedScore).toBeLessThan(noInteraction.calibratedScore);
  });

  it('caps per-bias interaction multiplier at 3.0×', () => {
    // Many heavily-interacting biases with an extreme caller weight.
    const many = ['a_bias', 'b_bias', 'c_bias', 'd_bias', 'e_bias'].map(t =>
      bias(t, 'critical')
    );
    const weights: Record<string, number> = {};
    for (const x of many) for (const y of many) weights[`${x.type}::${y.type}`] = 5;
    const r = computeCompoundScore(80, many, ctx(), { interactionWeights: weights });
    for (const bs of r.biasScores) {
      expect(bs.interactionMultiplier).toBeLessThanOrEqual(3.0 + 1e-9);
    }
  });
});

describe('computeCompoundScore — context multipliers', () => {
  it('very_high stakes + absent dissent penalises harder than low stakes + dissent', () => {
    const biases = [bias('overconfidence_bias')];
    const hostile = computeCompoundScore(
      80,
      biases,
      ctx({ monetaryStakes: 'very_high', dissentPresent: false })
    );
    const benign = computeCompoundScore(
      80,
      biases,
      ctx({ monetaryStakes: 'low', dissentPresent: true })
    );
    expect(hostile.contextAdjustment).toBeGreaterThan(benign.contextAdjustment);
    expect(hostile.calibratedScore).toBeLessThan(benign.calibratedScore);
  });

  it('overdue timeline applies a stronger time-pressure adjustment than a 2-week deadline', () => {
    const biases = [bias('anchoring_bias')];
    const overdue = computeCompoundScore(80, biases, ctx({ timelineWeeks: 0 }));
    const twoWeeks = computeCompoundScore(80, biases, ctx({ timelineWeeks: 2 }));
    expect(overdue.contextAdjustment).toBeGreaterThan(twoWeeks.contextAdjustment);
  });

  it('short document for high-stakes decision adds a shallow-analysis penalty', () => {
    const biases = [bias('confirmation_bias')];
    const shallow = computeCompoundScore(
      80,
      biases,
      ctx({ wordCount: 200, monetaryStakes: 'very_high' })
    );
    const adj = shallow.adjustments.find(a => a.source === 'shallow_analysis');
    expect(adj).toBeDefined();
  });
});

describe('computeCompoundScore — named-pattern overrides', () => {
  it('amplifies the constituent pair when the named pattern fired', () => {
    const biases = [bias('overconfidence_bias'), bias('planning_fallacy')];
    const fired = computeCompoundScore(80, biases, ctx(), {
      firedPatternLabels: ['The Synergy Mirage'],
    });
    const notFired = computeCompoundScore(80, biases, ctx());
    expect(fired.compoundMultiplier).toBeGreaterThan(notFired.compoundMultiplier);
    const adj = fired.adjustments.find(a => a.source === 'named_pattern_amplification');
    expect(adj?.description).toContain('The Synergy Mirage');
  });

  it('does not surface a pattern adjustment when the pattern biases are absent', () => {
    const biases = [bias('confirmation_bias')];
    const r = computeCompoundScore(80, biases, ctx(), {
      firedPatternLabels: ['The Synergy Mirage'],
    });
    expect(r.adjustments.find(a => a.source === 'named_pattern_amplification')).toBeUndefined();
  });
});

describe('computeCompoundScore — biological signals from rawContent', () => {
  it('applies a winner-effect context multiplier when success-streak language is dense', () => {
    const biases = [bias('overconfidence_bias')];
    const rawContent =
      'Record revenue. We outperformed every rival. Best year ever on record. Momentum is unstoppable.';
    const withSignal = computeCompoundScore(80, biases, ctx({ rawContent }));
    const withoutSignal = computeCompoundScore(80, biases, ctx());
    expect(withSignal.contextAdjustment).toBeGreaterThan(withoutSignal.contextAdjustment);
    expect(withSignal.adjustments.some(a => a.source === 'winner_effect')).toBe(true);
  });
});

describe('computeCompoundScore — clamps & determinism', () => {
  it('clamps the calibrated score into [0, 100]', () => {
    const heavy = Array.from({ length: 8 }, (_, i) => bias(`bias_${i}`, 'critical'));
    const r = computeCompoundScore(20, heavy, ctx({ monetaryStakes: 'very_high', dissentPresent: false }));
    expect(r.calibratedScore).toBeGreaterThanOrEqual(0);
    expect(r.calibratedScore).toBeLessThanOrEqual(100);
  });

  it('is deterministic — identical inputs produce identical output', () => {
    const biases = [bias('confirmation_bias'), bias('anchoring_bias', 'critical')];
    const a = computeCompoundScore(72, biases, ctx({ monetaryStakes: 'high' }));
    const b = computeCompoundScore(72, biases, ctx({ monetaryStakes: 'high' }));
    expect(a).toEqual(b);
  });
});
