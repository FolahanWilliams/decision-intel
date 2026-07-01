import { describe, it, expect } from 'vitest';
import { buildAuditDeliverable } from './buildAuditDeliverable';
import {
  validateActionTitle,
  ACTION_TITLE_WORD_CAP,
  ACTION_TITLE_BANNED_PHRASES,
} from './actionTitleTemplates';
import { computeFindingValueAtStake, formatExposureLabel, formatTicketLabel } from './valueAtStake';
import type { AnalysisResult } from '@/types';

// Minimal but realistic AnalysisResult fixture
function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    overallScore: 67,
    noiseScore: 42,
    summary: 'Sample audit summary.',
    biases: [
      {
        biasType: 'confirmation_bias',
        found: true,
        severity: 'critical',
        excerpt: 'This aligns with our investment thesis.',
        explanation: 'The memo only surfaces evidence supporting the deal.',
        suggestion: 'Add disconfirming evidence sweep before committee.',
        confidence: 0.87,
      },
      {
        biasType: 'anchoring_bias',
        found: true,
        severity: 'high',
        excerpt: 'At 6x EBITDA, this is below comparable deal multiples.',
        explanation: 'Memo anchors on a single comparable multiple.',
        suggestion: 'Pull a reference class of 5+ deals across regimes.',
        confidence: 0.71,
      },
      {
        biasType: 'overconfidence_bias',
        found: true,
        severity: 'medium',
        excerpt: 'We are confident synergies will fully realize by Y2.',
        explanation: 'No 90-day operational milestones supplied.',
        suggestion: 'Apply BCG mandate: mechanism + owner + 90-day milestone.',
        confidence: 0.65,
      },
    ],
    simulation: {
      overallVerdict: 'MIXED',
      twins: [
        {
          name: 'Karen Chen',
          role: 'CFO',
          vote: 'REJECT',
          confidence: 0.82,
          rationale: 'Synergy timing is undefended.',
          keyRiskIdentified: '90-day operational milestones',
        },
        {
          name: 'Ramon Diaz',
          role: 'Head of Strategy',
          vote: 'APPROVE',
          confidence: 0.68,
          rationale: 'The strategic logic holds.',
        },
        {
          name: 'Sarah Patel',
          role: 'General Counsel',
          vote: 'REVISE',
          confidence: 0.75,
          rationale: 'Regulatory exposure underspecified.',
          keyRiskIdentified: 'EU AI Act Art. 14 compliance',
        },
      ],
    },
    preMortem: {
      failureScenarios: [],
      preventiveMeasures: [],
      inversion: [
        'Skip the 90-day operational milestone discipline',
        'Defer the GC review past committee',
      ],
      redTeam: [
        {
          objection: 'The synergy assumption rests on one unnamed comparable.',
          targetClaim: 'Synergies realize by Y2',
          reasoning: 'No reference-class anchor for the timeline projection.',
        },
      ],
    },
    forgottenQuestions: {
      questions: [
        {
          question: 'What is the integration sponsor accountability for the 90-day milestone?',
          whyItMatters: 'Daimler-Chrysler failed when no single sponsor owned synergy realization.',
          biasGuarded: 'inside_view_dominance',
          severity: 'high',
          analogCompany: 'Daimler-Chrysler',
        },
        {
          question: 'How does the thesis survive a 20% revenue compression in Y1?',
          whyItMatters: 'Stress-test against the WeWork S-1 demand-elasticity miss.',
          biasGuarded: 'overconfidence_bias',
          severity: 'critical',
          analogCompany: 'WeWork',
        },
      ],
      headline: 'Two questions the analog cohort had to answer.',
      analogsUsed: ['Daimler-Chrysler 1998', 'WeWork 2019', 'AOL-Time Warner 2000'],
    },
    compoundScoring: {
      calibratedScore: 67,
      compoundMultiplier: 1.15,
      contextAdjustment: 0,
      confidenceDecay: 0,
      amplifyingInteractions: [],
      adjustments: [],
      // Runtime field from riskScorerNode — cast through unknown for type-safety
      ...({
        namedPatterns: [
          {
            patternLabel: 'Synergy Mirage',
            severity: 'critical',
            biasTypes: ['overconfidence_bias', 'planning_fallacy'],
            description: 'Synergy projections lack the 90-day operational mechanism BCG mandates.',
          },
        ],
      } as unknown as Record<string, unknown>),
    },
    factCheck: {
      score: 70,
      flags: [],
      verifications: [
        {
          claim: 'The European market is growing at 12% CAGR',
          verdict: 'CONTRADICTED',
          explanation: 'Eurostat reports 3.2% CAGR across the sector segment.',
        },
      ],
    },
    ...overrides,
  };
}

describe('buildAuditDeliverable', () => {
  it('composes all 5 buckets + cover from a realistic AnalysisResult', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'doc-abc',
      analysisId: 'ana-xyz',
    });

    expect(deliverable.id).toBe('ana-xyz');
    expect(deliverable.cover).toBeTruthy();
    expect(deliverable.reasoningRisks).toBeTruthy();
    expect(deliverable.stressTest).toBeTruthy();
    expect(deliverable.historicalAnalogs).toBeTruthy();
    expect(deliverable.counterfactuals).toBeTruthy();
    expect(deliverable.provenance).toBeTruthy();
  });

  it('cover DQI grade derives from canonical gradeFromScore (not local copy)', () => {
    const result = makeResult({ overallScore: 67 });
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    expect(deliverable.cover.dqi.grade).toBe('C'); // 67 → C per 85/70/55/40 canonical
    expect(deliverable.cover.dqi.score).toBe(67);
  });

  it('reasoningRisks puts compound patterns FIRST, then biases sorted by severity', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    const findings = deliverable.reasoningRisks.findings;
    expect(findings[0].kind).toBe('compound_pattern');
    expect(findings[0].id).toBe('Synergy Mirage');
    // After the pattern, biases ordered by severity
    expect(findings[1].kind).toBe('bias');
    expect(findings[1].id).toBe('confirmation_bias'); // critical
    expect(findings[2].id).toBe('anchoring_bias'); // high
    expect(findings[3].id).toBe('overconfidence_bias'); // medium
  });

  it('reasoningRisks counts match the input data exactly (no drift)', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    expect(deliverable.reasoningRisks.counts.critical).toBe(1);
    expect(deliverable.reasoningRisks.counts.high).toBe(1);
    expect(deliverable.reasoningRisks.counts.medium).toBe(1);
    expect(deliverable.reasoningRisks.counts.namedPatterns).toBe(1);
  });

  it('stressTest objections include boardroom + red-team in MECE order', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    const objections = deliverable.stressTest.objections;
    // Boardroom twins come first (3), then red team (1)
    const boardroomCount = objections.filter(o => o.kind === 'boardroom').length;
    const redTeamCount = objections.filter(o => o.kind === 'red_team').length;
    expect(boardroomCount).toBe(3);
    expect(redTeamCount).toBe(1);
    expect(deliverable.stressTest.counts.approve).toBe(1);
    expect(deliverable.stressTest.counts.reject).toBe(1);
    expect(deliverable.stressTest.counts.revise).toBe(1);
    expect(deliverable.stressTest.counts.redTeam).toBe(1);
  });

  it('historicalAnalogs sorts forgottenQuestions by severity (critical first)', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    const qs = deliverable.historicalAnalogs.forgottenQuestions;
    expect(qs[0].severity).toBe('critical');
    expect(qs[1].severity).toBe('high');
    expect(deliverable.historicalAnalogs.analogsUsed.length).toBeGreaterThan(0);
  });

  it('counterfactuals derives scenarios from top-severity biases', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    expect(deliverable.counterfactuals.scenarios.length).toBeGreaterThan(0);
    expect(deliverable.counterfactuals.scenarios[0].targetFindingId).toBe('confirmation_bias');
    expect(deliverable.counterfactuals.bestCaseDqi).toBeGreaterThan(
      deliverable.counterfactuals.currentDqi
    );
  });

  it('provenance pulls methodology version + node count + Brier baseline from canonical sources', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'doc-abcdef-123456',
      analysisId: 'analysis-fedcba-654321',
    });
    expect(deliverable.provenance.methodologyVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(deliverable.provenance.pipelineNodeCount).toBeGreaterThan(0);
    expect(deliverable.provenance.calibrationBaseline.meanBrier).toBe(0.258);
    expect(deliverable.provenance.auditHashPrefix.length).toBeGreaterThanOrEqual(8);
  });

  it('valueAtStake is null on every finding when ticket is absent', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    for (const f of deliverable.reasoningRisks.findings) {
      expect(f.valueAtStake).toBeNull();
    }
  });

  it('valueAtStake is populated honestly when ticket is supplied', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
      ticket: { amount: 50_000_000, currency: 'USD' },
    });
    const patternFinding = deliverable.reasoningRisks.findings.find(
      f => f.kind === 'compound_pattern'
    );
    expect(patternFinding?.valueAtStake).toBeTruthy();
    // Synergy Mirage base rate 80% → 40M exposure on a 50M ticket
    expect(patternFinding?.valueAtStake?.exposureAmount).toBe(40_000_000);
    expect(patternFinding?.valueAtStake?.baseRateSource).toContain('McKinsey');
  });

  it('cover hero NAMES the toxic combination + its exposure when a ticket is supplied', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
      ticket: { amount: 50_000_000, currency: 'USD' },
    });
    // The differentiator: "[Synergy Mirage] compounds into ~$40.0M at risk …"
    expect(deliverable.cover.actionTitle).toContain('Synergy Mirage');
    expect(deliverable.cover.actionTitle).toContain('compounds into');
    expect(deliverable.cover.actionTitle).toContain('at risk');
    expect(deliverable.cover.actionTitle).toMatch(/\$40(\.0)?M/);
    expect(validateActionTitle(deliverable.cover.actionTitle).ok).toBe(true);
  });

  it('cover hero falls back to the count-led headline when NO ticket is supplied', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, { documentId: 'd', analysisId: null });
    // No ticket → no exposure → no pattern-name lead; must NOT say "compounds into"
    expect(deliverable.cover.actionTitle).not.toContain('compounds into');
    expect(validateActionTitle(deliverable.cover.actionTitle).ok).toBe(true);
  });

  it('cover action title is non-empty and references real counts', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    expect(deliverable.cover.actionTitle.length).toBeGreaterThan(10);
    // Must contain at least one digit (the count or DQI anchor)
    expect(/\d/.test(deliverable.cover.actionTitle)).toBe(true);
  });

  it('all 6 deterministic action titles pass the validator', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    const titles = [
      deliverable.cover.actionTitle,
      deliverable.reasoningRisks.actionTitle,
      deliverable.stressTest.actionTitle,
      deliverable.historicalAnalogs.actionTitle,
      deliverable.counterfactuals.actionTitle,
      deliverable.provenance.actionTitle,
    ];
    for (const t of titles) {
      const v = validateActionTitle(t);
      expect(v.ok, `Title failed: "${t}" (reason: ${v.reason})`).toBe(true);
    }
  });

  it('handles a clean memo (zero biases, no patterns) gracefully', () => {
    const result = makeResult({
      overallScore: 92,
      biases: [],
      compoundScoring: undefined,
      preMortem: { failureScenarios: [], preventiveMeasures: [] },
    });
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    expect(deliverable.cover.dqi.grade).toBe('A');
    expect(deliverable.reasoningRisks.findings.length).toBe(0);
    // Still produces valid action titles
    expect(validateActionTitle(deliverable.cover.actionTitle).ok).toBe(true);
    expect(validateActionTitle(deliverable.reasoningRisks.actionTitle).ok).toBe(true);
  });

  it('handles missing simulation gracefully', () => {
    const result = makeResult({ simulation: undefined });
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
    });
    expect(deliverable.stressTest.objections.filter(o => o.kind === 'boardroom').length).toBe(0);
    expect(validateActionTitle(deliverable.stressTest.actionTitle).ok).toBe(true);
  });

  it('honors pre-fetched LLM-augmented action titles when supplied', () => {
    const result = makeResult();
    const customCover = 'Three critical biases drop this thesis to DQI 67 grade C';
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
      actionTitles: { cover: customCover },
    });
    expect(deliverable.cover.actionTitle).toBe(customCover);
    // Other titles fall back to templates
    expect(deliverable.reasoningRisks.actionTitle).not.toBe(customCover);
  });
});

describe('validateActionTitle', () => {
  it('passes a valid title with metric + ≤15 words', () => {
    const v = validateActionTitle('3 critical biases drop this thesis to DQI 67, grade C');
    expect(v.ok).toBe(true);
  });

  it('rejects titles over the word cap', () => {
    const long = Array.from({ length: ACTION_TITLE_WORD_CAP + 1 })
      .map((_, i) => `word${i}`)
      .join(' ');
    const v = validateActionTitle(long + ' 1');
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('too_long');
  });

  it('rejects titles without a metric', () => {
    const v = validateActionTitle('This memo has reasoning risks worth reviewing now');
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('no_metric');
  });

  it('rejects each banned phrase', () => {
    for (const phrase of ACTION_TITLE_BANNED_PHRASES) {
      const v = validateActionTitle(`This is 1 example of ${phrase} on display`);
      expect(v.ok, `Should reject "${phrase}"`).toBe(false);
      expect(v.reason).toBe('banned_phrase');
    }
  });

  it('rejects empty title', () => {
    expect(validateActionTitle('').ok).toBe(false);
    expect(validateActionTitle('   ').ok).toBe(false);
  });

  it('detects count drift when expectedCounts supplied and numbers do not match', () => {
    // drift-tolerant — test fixture intentionally claims a wrong count
    const claimed = 5;
    const real = 3;
    const v = validateActionTitle(`${claimed} biases threaten this thesis`, {
      expectedCounts: { biasCount: real },
    });
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('count_mismatch');
  });

  it('accepts title when one numeric token matches expected counts', () => {
    // drift-tolerant — title carries the EXACT real count + a DQI score
    const real = 3;
    const v = validateActionTitle(`${real} biases drop this thesis to DQI 67`, {
      expectedCounts: { biasCount: real },
    });
    expect(v.ok).toBe(true);
  });
});

describe('valueAtStake math', () => {
  it('returns null when ticket is zero or negative', () => {
    expect(
      computeFindingValueAtStake({
        ticketAmount: 0,
        ticketCurrency: 'USD',
        severity: 'critical',
      })
    ).toBeNull();
    expect(
      computeFindingValueAtStake({
        ticketAmount: -100,
        ticketCurrency: 'USD',
        severity: 'high',
      })
    ).toBeNull();
  });

  it('uses pattern base rate when namedPatternLabel matches', () => {
    const v = computeFindingValueAtStake({
      ticketAmount: 100_000_000,
      ticketCurrency: 'USD',
      severity: 'critical',
      namedPatternLabel: 'Synergy Mirage',
    });
    expect(v?.exposureAmount).toBe(80_000_000); // 80% base rate
    expect(v?.baseRateSource).toContain('McKinsey');
  });

  it('falls back to severity rate when pattern label unmatched', () => {
    const v = computeFindingValueAtStake({
      ticketAmount: 100_000_000,
      ticketCurrency: 'USD',
      severity: 'critical',
      namedPatternLabel: 'Unknown Pattern XYZ',
    });
    expect(v?.exposureAmount).toBe(55_000_000); // critical severity 55% base
  });

  it('formats exposure correctly for millions, billions, thousands', () => {
    const m = formatExposureLabel({
      ticketAmount: 1,
      ticketCurrency: 'USD',
      exposureAmount: 5_500_000,
      baseRateSource: '',
    });
    expect(m).toBe('$5.5M');

    const b = formatExposureLabel({
      ticketAmount: 1,
      ticketCurrency: 'GBP',
      exposureAmount: 2_300_000_000,
      baseRateSource: '',
    });
    expect(b).toBe('£2.3B');

    const k = formatExposureLabel({
      ticketAmount: 1,
      ticketCurrency: 'EUR',
      exposureAmount: 45_000,
      baseRateSource: '',
    });
    expect(k).toBe('€45K');
  });

  it('formatTicketLabel produces the same shape as exposure', () => {
    expect(formatTicketLabel(50_000_000, 'USD')).toBe('$50.0M');
    expect(formatTicketLabel(2_500_000_000, 'GBP')).toBe('£2.5B');
  });
});
