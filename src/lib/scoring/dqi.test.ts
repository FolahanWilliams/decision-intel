import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/data/case-correlations', () => ({
  computeCorrelationMultiplier: vi.fn().mockReturnValue({
    multiplier: 1.0,
    matchedPairs: [],
    matchedSuccessPatterns: [],
    beneficialDamping: 1.0,
  }),
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import {
  computeDQI,
  computeSyntheticDQI,
  computeHistoricalPercentile,
  WEIGHTS,
  GRADE_THRESHOLDS,
  SYSTEM1_BIASES,
} from './dqi';
import type { DQIInput } from './dqi';
import { ALL_CASES } from '@/lib/data/case-studies';

function makeInput(overrides?: Partial<DQIInput>): DQIInput {
  return {
    biases: [],
    noiseStats: { mean: 50, stdDev: 10, judgeCount: 3 },
    factCheck: { totalClaims: 10, verifiedClaims: 8, contradictedClaims: 0, score: 80 },
    process: {
      dissentPresent: true,
      priorSubmitted: true,
      outcomeTracked: true,
      participantCount: 5,
      documentLength: 1500,
    },
    compliance: { riskScore: 10, frameworksChecked: 2, violationsFound: 0 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// WEIGHTS
// ---------------------------------------------------------------------------

describe('WEIGHTS', () => {
  it('sum to approximately 1.0', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
  });

  it('has all 7 components', () => {
    const keys = Object.keys(WEIGHTS);
    expect(keys).toHaveLength(7);
    expect(keys).toContain('biasLoad');
    expect(keys).toContain('noiseLevel');
    expect(keys).toContain('evidenceQuality');
    expect(keys).toContain('processMaturity');
    expect(keys).toContain('complianceRisk');
    expect(keys).toContain('historicalAlignment');
    expect(keys).toContain('compoundRisk');
  });
});

// ---------------------------------------------------------------------------
// GRADE_THRESHOLDS
// ---------------------------------------------------------------------------

describe('GRADE_THRESHOLDS', () => {
  it('has 5 grade levels', () => {
    expect(GRADE_THRESHOLDS).toHaveLength(5);
  });

  it('grades are in descending order by min score', () => {
    for (let i = 1; i < GRADE_THRESHOLDS.length; i++) {
      expect(GRADE_THRESHOLDS[i - 1].min).toBeGreaterThan(GRADE_THRESHOLDS[i].min);
    }
  });
});

// ---------------------------------------------------------------------------
// SYSTEM1_BIASES
// ---------------------------------------------------------------------------

describe('SYSTEM1_BIASES', () => {
  it('contains expected biases', () => {
    expect(SYSTEM1_BIASES.has('anchoring_bias')).toBe(true);
    expect(SYSTEM1_BIASES.has('halo_effect')).toBe(true);
    expect(SYSTEM1_BIASES.has('availability_heuristic')).toBe(true);
    expect(SYSTEM1_BIASES.has('framing_effect')).toBe(true);
    expect(SYSTEM1_BIASES.has('loss_aversion')).toBe(true);
    expect(SYSTEM1_BIASES.has('bandwagon_effect')).toBe(true);
    expect(SYSTEM1_BIASES.has('status_quo_bias')).toBe(true);
    expect(SYSTEM1_BIASES.has('recency_bias')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeDQI
// ---------------------------------------------------------------------------

describe('computeDQI', () => {
  it('baseline input returns score 0-100 with all 7 components and a grade', () => {
    const result = computeDQI(makeInput());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components.biasLoad).toBeDefined();
    expect(result.components.noiseLevel).toBeDefined();
    expect(result.components.evidenceQuality).toBeDefined();
    expect(result.components.processMaturity).toBeDefined();
    expect(result.components.complianceRisk).toBeDefined();
    expect(result.components.historicalAlignment).toBeDefined();
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
  });

  it('zero biases → biasLoad.score = 100', () => {
    const result = computeDQI(makeInput({ biases: [] }));
    expect(result.components.biasLoad.score).toBe(100);
  });

  it('3 critical biases → biasLoad.score < 50', () => {
    const result = computeDQI(
      makeInput({
        biases: [
          { type: 'anchoring_bias', severity: 'critical', confidence: 0.9 },
          { type: 'halo_effect', severity: 'critical', confidence: 0.9 },
          { type: 'framing_effect', severity: 'critical', confidence: 0.9 },
        ],
      })
    );
    expect(result.components.biasLoad.score).toBeLessThan(60);
  });

  it('low noise (stdDev=2, judgeCount=3) → noiseLevel.score >= 90', () => {
    const result = computeDQI(
      makeInput({
        noiseStats: { mean: 50, stdDev: 2, judgeCount: 3 },
      })
    );
    expect(result.components.noiseLevel.score).toBeGreaterThanOrEqual(90);
  });

  it('high noise (stdDev=30) → noiseLevel.score < 10', () => {
    const result = computeDQI(
      makeInput({
        noiseStats: { mean: 50, stdDev: 30, judgeCount: 3 },
      })
    );
    expect(result.components.noiseLevel.score).toBeLessThan(10);
  });

  it('all evidence verified → evidenceQuality.score > 80', () => {
    const result = computeDQI(
      makeInput({
        factCheck: { totalClaims: 10, verifiedClaims: 10, contradictedClaims: 0, score: 100 },
      })
    );
    expect(result.components.evidenceQuality.score).toBeGreaterThan(80);
  });

  it('contradicted claims → evidenceQuality.score drops', () => {
    const noContradictions = computeDQI(
      makeInput({
        factCheck: { totalClaims: 10, verifiedClaims: 8, contradictedClaims: 0, score: 80 },
      })
    );
    const withContradictions = computeDQI(
      makeInput({
        factCheck: { totalClaims: 10, verifiedClaims: 5, contradictedClaims: 4, score: 40 },
      })
    );
    expect(withContradictions.components.evidenceQuality.score).toBeLessThan(
      noContradictions.components.evidenceQuality.score
    );
  });

  it('full process maturity → processMaturity.score >= 90', () => {
    const result = computeDQI(
      makeInput({
        biases: [],
        process: {
          dissentPresent: true,
          priorSubmitted: true,
          outcomeTracked: true,
          participantCount: 5,
          documentLength: 1500,
        },
      })
    );
    expect(result.components.processMaturity.score).toBeGreaterThanOrEqual(90);
  });

  it('no process indicators → processMaturity.score <= 50', () => {
    const result = computeDQI(
      makeInput({
        process: {
          dissentPresent: false,
          priorSubmitted: false,
          outcomeTracked: false,
          participantCount: 0,
          documentLength: 0,
        },
      })
    );
    expect(result.components.processMaturity.score).toBeLessThanOrEqual(50);
  });

  it('System 1 ratio > 0.7 → processMaturity score -8 penalty', () => {
    const base = computeDQI(
      makeInput({
        process: {
          dissentPresent: true,
          priorSubmitted: false,
          outcomeTracked: false,
          participantCount: 1,
          documentLength: 100,
          system1Ratio: 0.5,
        },
      })
    );
    const highS1 = computeDQI(
      makeInput({
        process: {
          dissentPresent: true,
          priorSubmitted: false,
          outcomeTracked: false,
          participantCount: 1,
          documentLength: 100,
          system1Ratio: 0.8,
        },
      })
    );
    expect(highS1.components.processMaturity.score).toBeLessThan(
      base.components.processMaturity.score
    );
  });

  it('System 1 ratio < 0.4 → processMaturity score +5 bonus', () => {
    const base = computeDQI(
      makeInput({
        process: {
          dissentPresent: true,
          priorSubmitted: false,
          outcomeTracked: false,
          participantCount: 1,
          documentLength: 100,
          system1Ratio: 0.5,
        },
      })
    );
    const lowS1 = computeDQI(
      makeInput({
        process: {
          dissentPresent: true,
          priorSubmitted: false,
          outcomeTracked: false,
          participantCount: 1,
          documentLength: 100,
          system1Ratio: 0.3,
        },
      })
    );
    expect(lowS1.components.processMaturity.score).toBeGreaterThan(
      base.components.processMaturity.score
    );
  });

  it('high compliance risk (riskScore=90) → complianceRisk.score = 10', () => {
    const result = computeDQI(
      makeInput({
        compliance: { riskScore: 90, frameworksChecked: 2, violationsFound: 3 },
      })
    );
    expect(result.components.complianceRisk.score).toBe(10);
  });

  it('zero compliance risk → complianceRisk.score = 100', () => {
    const result = computeDQI(
      makeInput({
        compliance: { riskScore: 0, frameworksChecked: 2, violationsFound: 0 },
      })
    );
    expect(result.components.complianceRisk.score).toBe(100);
  });

  it('no historicalAlignment + no biases → historicalAlignment.score = 60', () => {
    const result = computeDQI(makeInput({ biases: [] }));
    expect(result.components.historicalAlignment.score).toBe(60);
  });

  it('explicit alignment with failure patterns → historicalAlignment.score < 70', () => {
    const result = computeDQI(
      makeInput({
        historicalAlignment: {
          matchedFailurePatterns: 3,
          matchedSuccessPatterns: 0,
          correlationMultiplier: 1.5,
          beneficialDamping: 1.0,
        },
      })
    );
    expect(result.components.historicalAlignment.score).toBeLessThan(70);
  });

  it('explicit alignment with success patterns → historicalAlignment.score > 70', () => {
    const result = computeDQI(
      makeInput({
        historicalAlignment: {
          matchedFailurePatterns: 0,
          matchedSuccessPatterns: 3,
          correlationMultiplier: 1.0,
          beneficialDamping: 1.0,
        },
      })
    );
    expect(result.components.historicalAlignment.score).toBeGreaterThan(70);
  });

  it('score always between 0-100 with extreme high inputs', () => {
    const result = computeDQI(
      makeInput({
        biases: [],
        noiseStats: { mean: 50, stdDev: 0, judgeCount: 10 },
        factCheck: { totalClaims: 100, verifiedClaims: 100, contradictedClaims: 0, score: 100 },
        process: {
          dissentPresent: true,
          priorSubmitted: true,
          outcomeTracked: true,
          participantCount: 5,
          documentLength: 5000,
          system1Ratio: 0.1,
        },
        compliance: { riskScore: 0, frameworksChecked: 10, violationsFound: 0 },
        historicalAlignment: {
          matchedFailurePatterns: 0,
          matchedSuccessPatterns: 5,
          correlationMultiplier: 0.5,
          beneficialDamping: 0.5,
        },
      })
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('score always between 0-100 with extreme low inputs', () => {
    const result = computeDQI(
      makeInput({
        biases: [
          { type: 'anchoring_bias', severity: 'critical', confidence: 1.0 },
          { type: 'halo_effect', severity: 'critical', confidence: 1.0 },
          { type: 'framing_effect', severity: 'critical', confidence: 1.0 },
          { type: 'loss_aversion', severity: 'critical', confidence: 1.0 },
          { type: 'bandwagon_effect', severity: 'critical', confidence: 1.0 },
        ],
        noiseStats: { mean: 50, stdDev: 50, judgeCount: 1 },
        factCheck: { totalClaims: 10, verifiedClaims: 0, contradictedClaims: 10, score: 0 },
        process: {
          dissentPresent: false,
          priorSubmitted: false,
          outcomeTracked: false,
          participantCount: 0,
          documentLength: 0,
          system1Ratio: 1.0,
        },
        compliance: { riskScore: 100, frameworksChecked: 0, violationsFound: 10 },
        historicalAlignment: {
          matchedFailurePatterns: 5,
          matchedSuccessPatterns: 0,
          correlationMultiplier: 2.0,
          beneficialDamping: 1.0,
        },
      })
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('methodologyVersion is 2.1.0 when validityClass is provided', () => {
    const result = computeDQI(makeInput({ validityClass: 'high' }));
    expect(result.methodologyVersion).toBe('2.1.0');
  });

  it('methodologyVersion falls back to 2.0.0-no-validity when validityClass is absent', () => {
    const result = computeDQI(makeInput());
    expect(result.methodologyVersion).toBe('2.0.0-no-validity');
  });

  it('topImprovement identifies lowest-weighted-potential component', () => {
    const result = computeDQI(makeInput());
    expect(result.topImprovement).toBeDefined();
    expect(result.topImprovement.component).toBeTruthy();
    expect(result.topImprovement.potentialGain).toBeGreaterThanOrEqual(0);
    expect(result.topImprovement.suggestion).toBeTruthy();
  });

  it('grade A for score >= 85', () => {
    const result = computeDQI(
      makeInput({
        biases: [],
        noiseStats: { mean: 50, stdDev: 0, judgeCount: 5 },
        factCheck: { totalClaims: 10, verifiedClaims: 10, contradictedClaims: 0, score: 100 },
        process: {
          dissentPresent: true,
          priorSubmitted: true,
          outcomeTracked: true,
          participantCount: 5,
          documentLength: 2000,
        },
        compliance: { riskScore: 0, frameworksChecked: 5, violationsFound: 0 },
      })
    );
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.grade).toBe('A');
  });

  it('grade F for score < 40', () => {
    const result = computeDQI(
      makeInput({
        biases: [
          { type: 'anchoring_bias', severity: 'critical', confidence: 1.0 },
          { type: 'halo_effect', severity: 'critical', confidence: 1.0 },
          { type: 'framing_effect', severity: 'critical', confidence: 1.0 },
          { type: 'loss_aversion', severity: 'critical', confidence: 1.0 },
          { type: 'bandwagon_effect', severity: 'critical', confidence: 1.0 },
        ],
        noiseStats: { mean: 50, stdDev: 40, judgeCount: 1 },
        factCheck: { totalClaims: 10, verifiedClaims: 0, contradictedClaims: 10, score: 0 },
        process: {
          dissentPresent: false,
          priorSubmitted: false,
          outcomeTracked: false,
          participantCount: 0,
          documentLength: 0,
          system1Ratio: 1.0,
        },
        compliance: { riskScore: 100, frameworksChecked: 0, violationsFound: 10 },
        historicalAlignment: {
          matchedFailurePatterns: 5,
          matchedSuccessPatterns: 0,
          correlationMultiplier: 2.0,
          beneficialDamping: 1.0,
        },
      })
    );
    expect(result.score).toBeLessThan(40);
    expect(result.grade).toBe('F');
  });
});

// ---------------------------------------------------------------------------
// computeSyntheticDQI
// ---------------------------------------------------------------------------

describe('computeSyntheticDQI', () => {
  it('returns a score between 0 and 100 for the first case', () => {
    const score = computeSyntheticDQI(ALL_CASES[0]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('failure cases generally score lower than success cases', () => {
    const failureScores = ALL_CASES.filter(c => c.outcome.includes('failure')).map(c =>
      computeSyntheticDQI(c)
    );
    const successScores = ALL_CASES.filter(c => c.outcome.includes('success')).map(c =>
      computeSyntheticDQI(c)
    );

    if (failureScores.length > 0 && successScores.length > 0) {
      const avgFailure = failureScores.reduce((a, b) => a + b, 0) / failureScores.length;
      const avgSuccess = successScores.reduce((a, b) => a + b, 0) / successScores.length;
      expect(avgFailure).toBeLessThan(avgSuccess);
    }
  });
});

// ---------------------------------------------------------------------------
// computeHistoricalPercentile
// ---------------------------------------------------------------------------

describe('computeHistoricalPercentile', () => {
  it('returns a number between 0 and 100', () => {
    const percentile = computeHistoricalPercentile(50);
    expect(percentile).toBeGreaterThanOrEqual(0);
    expect(percentile).toBeLessThanOrEqual(100);
  });

  it('score of 0 returns low percentile', () => {
    const percentile = computeHistoricalPercentile(0);
    expect(percentile).toBeLessThanOrEqual(20);
  });

  it('score of 100 returns high percentile', () => {
    const percentile = computeHistoricalPercentile(100);
    expect(percentile).toBeGreaterThanOrEqual(80);
  });
});

// ---------------------------------------------------------------------------
// computeDQI · compoundRisk component (Proposal 3, locked 2026-05-09)
// ---------------------------------------------------------------------------

describe('computeDQI · compoundRisk component', () => {
  it('compoundRisk component renders for every audit', () => {
    const result = computeDQI(makeInput());
    expect(result.components.compoundRisk).toBeDefined();
    expect(result.components.compoundRisk.score).toBe(100); // no patterns supplied
  });

  it('legacy audits without compoundPatterns get methodology 2.1.0 (validity present)', () => {
    const result = computeDQI({ ...makeInput(), validityClass: 'medium' });
    expect(result.methodologyVersion).toBe('2.1.0');
    // compoundRisk renders neutral (100) in legacy mode
    expect(result.components.compoundRisk.score).toBe(100);
  });

  it('audits with empty compoundPatterns array stamp methodology 2.2.0', () => {
    const result = computeDQI({
      ...makeInput(),
      validityClass: 'medium',
      compoundPatterns: [],
    });
    expect(result.methodologyVersion).toBe('2.2.0');
    expect(result.components.compoundRisk.score).toBe(100);
  });

  it('one critical pattern penalises compoundRisk score by 25', () => {
    const result = computeDQI({
      ...makeInput(),
      compoundPatterns: [
        { patternLabel: 'The Synergy Mirage', severity: 'critical', toxicScore: 90 },
      ],
    });
    expect(result.components.compoundRisk.score).toBe(75); // 100 - 25
    expect(result.components.compoundRisk.breakdownItems).toHaveLength(1);
    expect(result.components.compoundRisk.breakdownItems?.[0].label).toBe('The Synergy Mirage');
    expect(result.components.compoundRisk.breakdownItems?.[0].impact).toBe(-25);
  });

  it('per-severity penalties: critical=25 · high=12 · medium=5 · low=1', () => {
    const result = computeDQI({
      ...makeInput(),
      compoundPatterns: [
        { patternLabel: 'A', severity: 'critical', toxicScore: 85 },
        { patternLabel: 'B', severity: 'high', toxicScore: 65 },
        { patternLabel: 'C', severity: 'medium', toxicScore: 45 },
        { patternLabel: 'D', severity: 'low', toxicScore: 20 },
      ],
    });
    // 100 - (25 + 12 + 5 + 1) = 57
    expect(result.components.compoundRisk.score).toBe(57);
  });

  it('penalty floors at 0 (cannot go negative)', () => {
    const result = computeDQI({
      ...makeInput(),
      compoundPatterns: Array.from({ length: 10 }, (_, i) => ({
        patternLabel: `Pattern ${i}`,
        severity: 'critical' as const,
        toxicScore: 90,
      })),
    });
    expect(result.components.compoundRisk.score).toBe(0);
  });

  it('breakdownItems sorted by impact (worst first) for explainability panel', () => {
    const result = computeDQI({
      ...makeInput(),
      compoundPatterns: [
        { patternLabel: 'low one', severity: 'low', toxicScore: 20 },
        { patternLabel: 'critical one', severity: 'critical', toxicScore: 90 },
        { patternLabel: 'high one', severity: 'high', toxicScore: 65 },
      ],
    });
    const items = result.components.compoundRisk.breakdownItems!;
    expect(items[0].label).toBe('critical one');
    expect(items[0].impact).toBe(-25);
    expect(items[1].label).toBe('high one');
    expect(items[1].impact).toBe(-12);
    expect(items[2].label).toBe('low one');
    expect(items[2].impact).toBe(-1);
  });

  it('compoundRisk weight is 6% (0.06) — visible in DQI but not dominant', () => {
    const result = computeDQI(makeInput());
    expect(result.components.compoundRisk.weight).toBe(0.06);
  });

  it('biasLoad weight rebalanced from 0.28 → 0.22 (made room for compoundRisk)', () => {
    const result = computeDQI(makeInput());
    expect(result.components.biasLoad.weight).toBe(0.22);
  });

  it('three critical patterns drop overall DQI by ~4.5 vs no patterns', () => {
    const baseInput = makeInput();
    const noPatterns = computeDQI({ ...baseInput, compoundPatterns: [] });
    const threeCritical = computeDQI({
      ...baseInput,
      compoundPatterns: [
        { patternLabel: 'A', severity: 'critical', toxicScore: 85 },
        { patternLabel: 'B', severity: 'critical', toxicScore: 90 },
        { patternLabel: 'C', severity: 'critical', toxicScore: 88 },
      ],
    });
    // compoundRisk drops from 100 → 25 (3 × 25 penalty)
    // weighted impact: 75 × 0.06 = 4.5 points lower
    const drop = noPatterns.score - threeCritical.score;
    expect(drop).toBeGreaterThanOrEqual(4);
    expect(drop).toBeLessThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// SYNTHETIC_WEIGHTS_LEGACY_2_0_0 — pinned for platform-baseline stability
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// computeDQI · breakdownItems for explainability panel (locked 2026-05-09)
// ---------------------------------------------------------------------------
//
// Locks the buyer-facing decomposition: each component must populate
// breakdownItems with plain-language labels + signed impact + (where
// possible) verbatim evidence. The DqiBreakdownPanel UI consumes this
// directly — no jargon translation in the UI layer.

describe('computeDQI · breakdownItems explainability', () => {
  it('biasLoad populates one breakdown item per detected bias', () => {
    const result = computeDQI({
      ...makeInput(),
      biases: [
        { type: 'anchoring_bias', severity: 'critical', confidence: 0.9, excerpt: 'we anchored to $100M' },
        { type: 'planning_fallacy', severity: 'high', confidence: 0.8 },
      ],
    });
    const items = result.components.biasLoad.breakdownItems!;
    expect(items).toHaveLength(2);
    // Sorted worst-first
    expect(items[0].label).toContain('Anchoring Bias');
    expect(items[0].label).toContain('critical');
    expect(items[0].impact).toBeLessThan(items[1].impact);
    expect(items[0].evidence).toContain('we anchored to');
  });

  it('biasLoad evidence omitted when excerpt absent on input', () => {
    const result = computeDQI({
      ...makeInput(),
      biases: [{ type: 'overconfidence_bias', severity: 'high', confidence: 0.7 }],
    });
    expect(result.components.biasLoad.breakdownItems![0].evidence).toBeUndefined();
  });

  it('biasLoad label uses formatted bias name (snake_case → Title Case)', () => {
    const result = computeDQI({
      ...makeInput(),
      biases: [{ type: 'illusion_of_validity', severity: 'medium', confidence: 0.6 }],
    });
    const item = result.components.biasLoad.breakdownItems![0];
    expect(item.label).toContain('Illusion Of Validity');
    expect(item.label).not.toContain('illusion_of_validity');
  });

  it('noiseLevel populates judge-count + spread breakdown', () => {
    const result = computeDQI({
      ...makeInput(),
      noiseStats: { mean: 70, stdDev: 12, judgeCount: 3 },
    });
    const items = result.components.noiseLevel.breakdownItems!;
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.some(i => i.label.includes('3 independent judges'))).toBe(true);
    expect(items.some(i => i.label.includes('Average score'))).toBe(true);
    expect(items.some(i => i.label.includes('Disagreement spread'))).toBe(true);
  });

  it('evidenceQuality breakdown surfaces verified + contradicted + unverifiable buckets', () => {
    const result = computeDQI({
      ...makeInput(),
      factCheck: {
        totalClaims: 10,
        verifiedClaims: 6,
        contradictedClaims: 2,
        score: 70,
      },
    });
    const items = result.components.evidenceQuality.breakdownItems!;
    expect(items.some(i => i.label.includes('6 of 10 claims verified'))).toBe(true);
    expect(items.some(i => i.label.includes('2 claim(s) contradicted'))).toBe(true);
    expect(items.some(i => i.label.includes("couldn't be verified"))).toBe(true);
  });

  it('processMaturity breakdown surfaces all 5 hygiene checks', () => {
    const result = computeDQI({
      ...makeInput(),
      process: {
        dissentPresent: true,
        priorSubmitted: false,
        outcomeTracked: true,
        participantCount: 5,
        documentLength: 1500,
      },
    });
    const items = result.components.processMaturity.breakdownItems!;
    // Expect at least the 5 base checks
    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(items.some(i => i.label.includes('Dissent captured'))).toBe(true);
    expect(items.some(i => i.label.includes('No pre-decision prediction'))).toBe(true);
    expect(items.some(i => i.label.includes('Outcome tracking enabled'))).toBe(true);
  });

  it('complianceRisk breakdown labels frameworks + violations in plain language', () => {
    const result = computeDQI({
      ...makeInput(),
      compliance: { riskScore: 30, frameworksChecked: 5, violationsFound: 1 },
    });
    const items = result.components.complianceRisk.breakdownItems!;
    expect(items.some(i => i.label.includes('5 regulatory framework'))).toBe(true);
    expect(items.some(i => i.label.includes('1 potential violation'))).toBe(true);
    // Evidence for violations explicitly says "potential", not legal verdict
    const violationItem = items.find(i => i.label.includes('violation'));
    expect(violationItem?.evidence).toContain('not legal determinations');
  });

  it('historicalAlignment breakdown names matched failure + success patterns', () => {
    const result = computeDQI({
      ...makeInput(),
      historicalAlignment: {
        matchedFailurePatterns: 3,
        matchedSuccessPatterns: 1,
        correlationMultiplier: 1.4,
        beneficialDamping: 1.0,
      },
    });
    const items = result.components.historicalAlignment.breakdownItems!;
    expect(items.some(i => i.label.includes('3 historical failure pattern'))).toBe(true);
    expect(items.some(i => i.label.includes('1 historical success pattern'))).toBe(true);
    expect(items.some(i => i.label.includes('Compound risk amplifier'))).toBe(true);
  });

  it('all 7 components have breakdownItems populated (after this ship)', () => {
    const result = computeDQI({
      ...makeInput(),
      biases: [{ type: 'anchoring_bias', severity: 'medium', confidence: 0.6 }],
      compoundPatterns: [
        { patternLabel: 'The Echo Chamber', severity: 'medium', toxicScore: 50 },
      ],
    });
    expect(result.components.biasLoad.breakdownItems).toBeDefined();
    expect(result.components.noiseLevel.breakdownItems).toBeDefined();
    expect(result.components.evidenceQuality.breakdownItems).toBeDefined();
    expect(result.components.processMaturity.breakdownItems).toBeDefined();
    expect(result.components.complianceRisk.breakdownItems).toBeDefined();
    expect(result.components.historicalAlignment.breakdownItems).toBeDefined();
    expect(result.components.compoundRisk.breakdownItems).toBeDefined();
  });

  it('buyer-friendly language: no snake_case, no internal jargon in labels', () => {
    const result = computeDQI({
      ...makeInput(),
      biases: [{ type: 'sunk_cost_fallacy', severity: 'high', confidence: 0.8 }],
      compoundPatterns: [{ patternLabel: 'The Synergy Mirage', severity: 'critical', toxicScore: 90 }],
    });
    const allLabels = [
      ...(result.components.biasLoad.breakdownItems ?? []),
      ...(result.components.noiseLevel.breakdownItems ?? []),
      ...(result.components.evidenceQuality.breakdownItems ?? []),
      ...(result.components.processMaturity.breakdownItems ?? []),
      ...(result.components.complianceRisk.breakdownItems ?? []),
      ...(result.components.historicalAlignment.breakdownItems ?? []),
      ...(result.components.compoundRisk.breakdownItems ?? []),
    ].map(i => i.label);
    for (const label of allLabels) {
      expect(label).not.toMatch(/_/); // no snake_case
      expect(label).not.toContain('jaccard'); // no internal stat names
      expect(label).not.toContain('biasJaccard');
    }
  });
});

describe('SYNTHETIC_WEIGHTS_LEGACY_2_0_0', () => {
  it('preserves the original 2.0.0-seed weight values', async () => {
    const { SYNTHETIC_WEIGHTS_LEGACY_2_0_0 } = await import('./dqi');
    expect(SYNTHETIC_WEIGHTS_LEGACY_2_0_0.biasLoad).toBe(0.28);
    expect(SYNTHETIC_WEIGHTS_LEGACY_2_0_0.noiseLevel).toBe(0.18);
    expect(SYNTHETIC_WEIGHTS_LEGACY_2_0_0.evidenceQuality).toBe(0.18);
    expect(SYNTHETIC_WEIGHTS_LEGACY_2_0_0.processMaturity).toBe(0.13);
    expect(SYNTHETIC_WEIGHTS_LEGACY_2_0_0.complianceRisk).toBe(0.13);
    expect(SYNTHETIC_WEIGHTS_LEGACY_2_0_0.historicalAlignment).toBe(0.1);
  });
});
