import { describe, it, expect } from 'vitest';
import { buildAuditDeliverable } from './buildAuditDeliverable';
import {
  validateActionTitle,
  ACTION_TITLE_WORD_CAP,
  ACTION_TITLE_BANNED_PHRASES,
  counterfactualsActionTitle,
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

  // 2026-07-02 regression — the blind Victoria's Secret shape: ZERO
  // bias-shaped findings, all severity carried by Forgotten Questions. The
  // "what to fix" lane must derive mitigation scenarios from the FQs
  // instead of rendering "No actionable mitigation scenarios" (co-work P1).
  it('counterfactuals derives scenarios from Forgotten Questions when there are no biases (VS blind-run shape)', () => {
    const result = makeResult({
      biases: [],
      forgottenQuestions: {
        questions: [
          {
            question: 'What operationalizes founder retention over the next 12-24 months?',
            whyItMatters: 'The thesis rests entirely on the acquired team.',
            biasGuarded: 'key person dependency',
            severity: 'critical',
          },
          {
            question: 'What churn data falsifies the accretion claim?',
            whyItMatters: 'Accretive-by-2023 is asserted, never evidenced.',
            biasGuarded: 'overconfidence_bias',
            severity: 'high',
          },
        ],
        headline: 'Two questions the memo never asks.',
        analogsUsed: ['AIG'],
        generatedAt: new Date(0).toISOString(),
      },
    });
    const deliverable = buildAuditDeliverable(result, { documentId: 'd', analysisId: null });
    const scenarios = deliverable.counterfactuals.scenarios;
    expect(scenarios.length).toBe(2);
    // Critical FQ leads; deltas use the same severity heuristic as biases.
    expect(scenarios[0].targetFindingId).toBe('forgotten_question_0');
    expect(scenarios[0].delta).toBe(8);
    expect(scenarios[0].mitigation).toContain('founder retention');
    expect(scenarios[0].mitigation).toContain('Answer this in the memo before commitment');
    expect(scenarios[1].delta).toBe(5);
    expect(deliverable.counterfactuals.bestCaseDqi).toBeGreaterThan(
      deliverable.counterfactuals.currentDqi
    );
  });

  it('FQ scenarios dedupe against bias scenarios guarding the same bias, and bias fixes lead on severity ties', () => {
    const result = makeResult({
      forgottenQuestions: {
        questions: [
          {
            // Guards a bias that ALREADY has a bias-derived scenario — skipped.
            question: 'Is the thesis merely confirming itself?',
            whyItMatters: 'Duplicate of the confirmation_bias finding.',
            biasGuarded: 'Confirmation Bias',
            severity: 'critical',
          },
          {
            // New ground — survives the dedupe and joins the ranking.
            question: 'What reserves cover a tenant breach beyond 36 months?',
            whyItMatters: 'The AIG analog had to answer this.',
            biasGuarded: 'concentration',
            severity: 'critical',
          },
        ],
        analogsUsed: ['AIG'],
        generatedAt: new Date(0).toISOString(),
      },
    });
    const deliverable = buildAuditDeliverable(result, { documentId: 'd', analysisId: null });
    const ids = deliverable.counterfactuals.scenarios.map(sc => sc.targetFindingId);
    // The duplicated FQ (index 0) is absent; the novel FQ (index 1) present.
    expect(ids).not.toContain('forgotten_question_0');
    expect(ids).toContain('forgotten_question_1');
    // Stable sort: the critical BIAS scenario still leads the critical FQ.
    expect(ids[0]).toBe('confirmation_bias');
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

  it('compound-pattern finding carries the buyer narrative (consequence + fix + plain-language chain)', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, { documentId: 'd', analysisId: null });
    const pattern = deliverable.reasoningRisks.findings.find(f => f.kind === 'compound_pattern');
    expect(pattern).toBeTruthy();
    // Joined to the canonical NAMED_PATTERNS (mock label 'Synergy Mirage' →
    // 'The Synergy Mirage') → the outcome + the fix a buyer reads for.
    expect(pattern!.consequence).toMatch(/pay a premium|synergies/i);
    expect(pattern!.fix).toMatch(/mechanism|owner|milestone/i);
    // Plain-language chain, not raw snake_case.
    expect(pattern!.participatingBiasLabels?.join(' ')).not.toMatch(/_/);
    expect(pattern!.participatingBiasLabels?.length).toBeGreaterThan(0);
    // Credibility grounding for the pattern (reference class from its bias).
    expect(pattern!.referenceClass?.length).toBeGreaterThan(0);
  });

  it('counterfactuals title is HONEST — top fix claims its own delta, not the all-fixes sum (Fermi bug)', () => {
    // Fermi shape: 8 → 39 total, but the TOP fix (Planning Fallacy) is only +8.
    const title = counterfactualsActionTitle({
      currentDqi: 8,
      bestCaseDqi: 39,
      scenarioCount: 5,
      topScenarioLabel: 'Planning Fallacy',
      topScenarioDelta: 8,
    });
    // Must NOT claim the top fix alone reaches 39.
    expect(title).not.toMatch(/alone raises DQI from 8 to 39/);
    expect(title).toContain('+8'); // the top fix's real lift
    expect(title).toContain('39'); // the all-fixes total, correctly attributed
    expect(validateActionTitle(title).ok).toBe(true);
  });

  it('counterfactuals title with a SINGLE fix states the plain lift (alone === all)', () => {
    const title = counterfactualsActionTitle({
      currentDqi: 50,
      bestCaseDqi: 62,
      scenarioCount: 1,
      topScenarioLabel: 'Anchoring',
      topScenarioDelta: 12,
    });
    expect(title).toMatch(/raises DQI from 50 to 62/);
  });

  it('cover carries the actuarial quantified exposure when a ticket is supplied', () => {
    const result = makeResult();
    const deliverable = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
      ticket: { amount: 50_000_000, currency: 'USD' },
    });
    const q = deliverable.cover.quantifiedExposure;
    expect(q).toBeTruthy();
    // Synergy Mirage 80% base rate × $50M ticket → $40M consolidated exposure.
    expect(q!.exposureAmount).toBe(40_000_000);
    expect(q!.baseRatePct).toBe(80);
    expect(q!.drivingKind).toBe('compound_pattern');
  });

  it('cover has NO quantified exposure when no ticket is supplied (never fabricated)', () => {
    const deliverable = buildAuditDeliverable(makeResult(), { documentId: 'd', analysisId: null });
    expect(deliverable.cover.quantifiedExposure ?? null).toBeNull();
  });

  it('reasoning-risks bucket surfaces the cross-class attack path from the document text', () => {
    const result = makeResult({
      structuredContent:
        'The dominant CEO sidelined the board of 17 in a hostile bid, on due diligence of only six hours, financed with short-term wholesale funding.',
    });
    const deliverable = buildAuditDeliverable(result, { documentId: 'd', analysisId: null });
    const exposure = deliverable.reasoningRisks.strategicExposure ?? [];
    const ids = exposure.map(n => n.id);
    expect(ids).toContain('dominant_ceo');
    expect(ids).toContain('oversized_board');
    expect(ids).toContain('hostile_auction');
    expect(ids).toContain('compressed_diligence');
    // Structural nodes lead the path (the render order).
    expect(exposure[0].class).toBe('structural');
  });

  it('attack path is ABSENT when the document has none of the conditions', () => {
    const result = makeResult({
      structuredContent: 'A staged market pilot with an independent gate review.',
    });
    const deliverable = buildAuditDeliverable(result, { documentId: 'd', analysisId: null });
    expect(deliverable.reasoningRisks.strategicExposure).toBeUndefined();
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

// ──────────────────────────────────────────────────────────────────────
// Cross-module critical synthesis + audit-posture surfaces (2026-07-02 —
// the blind-Fermi lesson: the audit caught the kill-shot in Forgotten
// Questions + red team + boardroom while the Reasoning tab headlined
// "0 critical reasoning risks surfaced" and the cover said the memo
// "cleared the audit" at grade F).
// ──────────────────────────────────────────────────────────────────────

describe('cross-module critical synthesis (blind-Fermi shape)', () => {
  /** Zero bias-shaped findings, zero compound patterns — all severity
   *  carried by the adversarial modules, exactly the blind Fermi run. */
  function blindFermiShape(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
    return makeResult({
      overallScore: 35,
      biases: [],
      compoundScoring: {
        calibratedScore: 35,
        compoundMultiplier: 1,
        contextAdjustment: 0,
        confidenceDecay: 0,
        amplifyingInteractions: [],
        adjustments: [],
      },
      forgottenQuestions: {
        questions: [
          {
            question:
              'If the first anchor tenant never signs a binding lease, what is the maximum standalone loss?',
            whyItMatters: 'Tenant revenue was assumed to fund 100% of long lead-time items.',
            biasGuarded: 'concentration',
            severity: 'critical',
            analogCompany: 'Lehman Brothers',
          },
          {
            question: 'What reserves cover the take-or-pay gas minimums?',
            whyItMatters: 'AIG wrote obligations without posting collateral.',
            biasGuarded: 'overconfidence_bias',
            severity: 'high',
            analogCompany: 'American International Group',
          },
        ],
        headline: 'Questions the analogs had to answer.',
        analogsUsed: ['Lehman Brothers', 'American International Group'],
      },
      ...overrides,
    } as Partial<AnalysisResult>);
    // makeResult's base simulation carries 1 REJECT twin + 1 red-team
    // objection — the adversarial signal this shape depends on.
  }

  it('reasoning headline never reads "0 critical reasoning risks" while adversarial criticals exist', () => {
    const d = buildAuditDeliverable(blindFermiShape(), { documentId: 'd', analysisId: null });
    expect(d.reasoningRisks.actionTitle).not.toContain('0 critical reasoning risks');
    expect(d.reasoningRisks.actionTitle).toContain('synthesized from the adversarial modules');
    expect(validateActionTitle(d.reasoningRisks.actionTitle).ok).toBe(true);
  });

  it('synthesizes the adversarial criticals INTO the reasoning bucket, critical-first, count matching the headline', () => {
    const d = buildAuditDeliverable(blindFermiShape(), { documentId: 'd', analysisId: null });
    const synth = d.reasoningRisks.synthesizedCriticals ?? [];
    // 1 critical FQ + 1 high FQ + 1 red team + 1 boardroom REJECT = 4
    expect(synth.length).toBe(4);
    expect(synth[0].severity).toBe('critical');
    expect(synth[0].source).toBe('forgotten_question');
    expect(synth[0].label).toContain('anchor tenant');
    // The headline count IS the list length — one number everywhere.
    expect(d.reasoningRisks.actionTitle).toContain(`${synth.length} existential risks`);
    expect(d.cover.actionTitle).toContain(`${synth.length} existential risks`);
  });

  it('cover reconciles: never "cleared the audit"; complication names the risks; answer demands revision', () => {
    const d = buildAuditDeliverable(blindFermiShape(), { documentId: 'd', analysisId: null });
    expect(d.cover.actionTitle).not.toContain('cleared the audit');
    expect(d.cover.actionTitle).toContain('existential risks');
    expect(d.cover.complication).toContain('existential risk');
    expect(d.cover.complication).toContain('anchor tenant');
    expect(d.cover.answer).toContain('Revise before committee');
    expect(validateActionTitle(d.cover.actionTitle).ok).toBe(true);
  });

  it('a genuinely clean memo at a failing grade says "scored", never "cleared"; a passing grade keeps "cleared"', () => {
    const clean = (score: number) =>
      buildAuditDeliverable(
        blindFermiShape({
          overallScore: score,
          simulation: { overallVerdict: 'APPROVED', twins: [] },
          preMortem: { failureScenarios: [], preventiveMeasures: [], inversion: [], redTeam: [] },
          forgottenQuestions: { questions: [], headline: '', analogsUsed: [] },
        } as Partial<AnalysisResult>),
        { documentId: 'd', analysisId: null }
      );
    const failing = clean(35);
    expect(failing.cover.actionTitle).toContain('scored');
    expect(failing.cover.actionTitle).not.toContain('cleared');
    const passing = clean(90);
    expect(passing.cover.actionTitle).toContain('cleared the audit');
    // Truly clean → no synthesis panel, the clean state stands.
    expect(failing.reasoningRisks.synthesizedCriticals).toBeUndefined();
  });

  it('biases-present audits are unaffected: the synthesis never attaches when findings exist', () => {
    const d = buildAuditDeliverable(makeResult(), { documentId: 'd', analysisId: null });
    expect(d.reasoningRisks.synthesizedCriticals).toBeUndefined();
    expect(d.reasoningRisks.findings.length).toBeGreaterThan(0);
  });
});

describe('audit posture on the cover (blind badge + degraded-node honesty)', () => {
  it('blindAudit option surfaces on the cover; absent by default', () => {
    const on = buildAuditDeliverable(makeResult(), {
      documentId: 'd',
      analysisId: null,
      blindAudit: true,
    });
    expect(on.cover.blindAudit).toBe(true);
    const off = buildAuditDeliverable(makeResult(), { documentId: 'd', analysisId: null });
    expect(off.cover.blindAudit).toBeUndefined();
  });

  it('a degraded bias detector NEVER reads as a clean pass — headline + cover + bucket all say unavailable', () => {
    const result = makeResult({
      biases: [],
      compoundScoring: {
        calibratedScore: 35,
        compoundMultiplier: 1,
        contextAdjustment: 0,
        confidenceDecay: 0,
        amplifyingInteractions: [],
        adjustments: [],
      },
    } as Partial<AnalysisResult>);
    const d = buildAuditDeliverable(result, {
      documentId: 'd',
      analysisId: null,
      degradedNodes: ['biasDetective'],
    });
    expect(d.reasoningRisks.biasDetectionDegraded).toBe(true);
    expect(d.reasoningRisks.actionTitle).toContain('unavailable');
    expect(d.reasoningRisks.actionTitle).not.toContain('0 critical reasoning risks');
    expect(d.cover.actionTitle).toContain('unavailable');
    expect(d.cover.degradedNodes).toEqual(['biasDetective']);
    expect(validateActionTitle(d.cover.actionTitle).ok).toBe(true);
  });
});
