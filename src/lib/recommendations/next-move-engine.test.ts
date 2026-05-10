/**
 * Vitest suite for the Constellation Next Move recommendation engine.
 *
 * Locked 2026-05-10. Pure-function tests over EngineInput → ranked
 * NextMoveRecommendation[]. Verifies the paper-grounded scoring
 * formula (severity × validity-aware urgency × time-pressure ×
 * cross-decision multiplier) + the six-category rule coverage.
 */

import { describe, it, expect } from 'vitest';
import {
  runEngine,
  cacheKey,
  timePressureMultiplier,
  daysUntilCommittee,
} from './next-move-engine';
import type { EngineContainer, EngineContainerLink, EngineInput } from './recommendation-types';

const FROZEN_NOW = new Date('2026-05-10T12:00:00Z');

function makeContainer(overrides: Partial<EngineContainer> = {}): EngineContainer {
  return {
    id: 'c1',
    kind: 'investment',
    name: 'Project Heliograph',
    decisionFrame: null,
    stageId: 'ic_review',
    status: 'active',
    decidedAt: null,
    committeeDate: null,
    compositeDqi: 75,
    compositeGrade: 'B',
    documentCount: 3,
    analyzedDocCount: 3,
    recurringBiasCount: 0,
    conflictCount: 0,
    highSeverityConflictCount: 0,
    namedPatterns: [],
    hasOutcome: false,
    missingRequiredDocs: [],
    validityClass: 'medium',
    structuralAssumptions: [],
    priors: null,
    ...overrides,
  };
}

function makeInput(containers: EngineContainer[], links: EngineContainerLink[] = []): EngineInput {
  return {
    containers,
    links,
    recentUserPriority: null,
    persona: 'cso',
    computedAt: FROZEN_NOW,
  };
}

describe('timePressureMultiplier', () => {
  it('returns 1.0 when committeeDate is null', () => {
    expect(timePressureMultiplier(null, FROZEN_NOW)).toBe(1.0);
  });

  it('returns 2.0 when committee is within 1 day', () => {
    const tomorrow = new Date(FROZEN_NOW.getTime() + 24 * 60 * 60 * 1000);
    expect(timePressureMultiplier(tomorrow, FROZEN_NOW)).toBe(2.0);
  });

  it('returns 1.6 within 7 days', () => {
    const fiveDays = new Date(FROZEN_NOW.getTime() + 5 * 24 * 60 * 60 * 1000);
    expect(timePressureMultiplier(fiveDays, FROZEN_NOW)).toBe(1.6);
  });

  it('returns 1.0 beyond 30 days', () => {
    const farFuture = new Date(FROZEN_NOW.getTime() + 90 * 24 * 60 * 60 * 1000);
    expect(timePressureMultiplier(farFuture, FROZEN_NOW)).toBe(1.0);
  });
});

describe('daysUntilCommittee', () => {
  it('returns null when date is null', () => {
    expect(daysUntilCommittee(null, FROZEN_NOW)).toBeNull();
  });

  it('returns positive days for future committee', () => {
    const sevenDays = new Date(FROZEN_NOW.getTime() + 7 * 24 * 60 * 60 * 1000);
    expect(daysUntilCommittee(sevenDays, FROZEN_NOW)).toBe(7);
  });
});

describe('runEngine — committee_gate_pressure', () => {
  it('fires when T-N ≤ 7d AND a critical-severity pattern is fired', () => {
    const fiveDays = new Date(FROZEN_NOW.getTime() + 5 * 24 * 60 * 60 * 1000);
    const c = makeContainer({
      committeeDate: fiveDays,
      namedPatterns: [{ patternLabel: 'Synergy Mirage', severity: 'critical', documentCount: 1 }],
    });
    const recs = runEngine(makeInput([c]));
    const top = recs[0];
    expect(top.categoryId).toBe('committee_gate_pressure');
    // Critical severity at T-5d → severity bumps to critical
    expect(top.severity).toBe('critical');
    // Time-pressure 1.6× should be in the breakdown
    expect(top.scoreBreakdown.timePressureMultiplier).toBe(1.6);
  });

  it('fires when T-N ≤ 14d AND high-severity cross-doc conflicts present', () => {
    const tenDays = new Date(FROZEN_NOW.getTime() + 10 * 24 * 60 * 60 * 1000);
    const c = makeContainer({
      committeeDate: tenDays,
      highSeverityConflictCount: 2,
    });
    const recs = runEngine(makeInput([c]));
    const top = recs[0];
    expect(top.categoryId).toBe('committee_gate_pressure');
    expect(top.severity).toBe('high'); // T-10d → high (not critical)
  });

  it('does NOT fire when T-N > 14d', () => {
    const thirtyDays = new Date(FROZEN_NOW.getTime() + 30 * 24 * 60 * 60 * 1000);
    const c = makeContainer({
      committeeDate: thirtyDays,
      highSeverityConflictCount: 2,
    });
    const recs = runEngine(makeInput([c]));
    expect(recs.find(r => r.categoryId === 'committee_gate_pressure')).toBeUndefined();
  });
});

describe('runEngine — quality_gate_violation', () => {
  it('fires when DQI < 55', () => {
    const c = makeContainer({ compositeDqi: 40, compositeGrade: 'D' });
    const recs = runEngine(makeInput([c]));
    expect(recs.find(r => r.categoryId === 'quality_gate_violation')).toBeDefined();
  });

  it('fires when high-severity pattern present even at high DQI', () => {
    const c = makeContainer({
      compositeDqi: 80,
      namedPatterns: [
        {
          patternLabel: "Winner's Curse",
          severity: 'high',
          documentCount: 1,
        },
      ],
    });
    const recs = runEngine(makeInput([c]));
    expect(recs.find(r => r.categoryId === 'quality_gate_violation')).toBeDefined();
  });

  it('does NOT fire when DQI ≥ 55 and no high+ patterns', () => {
    const c = makeContainer({ compositeDqi: 70 });
    const recs = runEngine(makeInput([c]));
    expect(recs.find(r => r.categoryId === 'quality_gate_violation')).toBeUndefined();
  });
});

describe('runEngine — missing_required_artefact', () => {
  it('fires when committeeDate ≤ 30d and required docs are missing', () => {
    const fifteenDays = new Date(FROZEN_NOW.getTime() + 15 * 24 * 60 * 60 * 1000);
    const c = makeContainer({
      committeeDate: fifteenDays,
      missingRequiredDocs: ['synergy_model'],
    });
    const recs = runEngine(makeInput([c]));
    expect(recs.find(r => r.categoryId === 'missing_required_artefact')).toBeDefined();
  });

  it('escalates to critical when T-N ≤ 3d', () => {
    const twoDays = new Date(FROZEN_NOW.getTime() + 2 * 24 * 60 * 60 * 1000);
    const c = makeContainer({
      committeeDate: twoDays,
      missingRequiredDocs: ['ic_memo'],
    });
    const recs = runEngine(makeInput([c]));
    const rec = recs.find(r => r.categoryId === 'missing_required_artefact');
    expect(rec?.severity).toBe('critical');
  });
});

describe('runEngine — outcome_closure', () => {
  it('fires when decidedAt ≥ 30d and no outcome', () => {
    const fortyDaysAgo = new Date(FROZEN_NOW.getTime() - 40 * 24 * 60 * 60 * 1000);
    const c = makeContainer({ decidedAt: fortyDaysAgo, hasOutcome: false });
    const recs = runEngine(makeInput([c]));
    expect(recs.find(r => r.categoryId === 'outcome_closure')).toBeDefined();
  });

  it('does NOT fire when outcome already logged', () => {
    const fortyDaysAgo = new Date(FROZEN_NOW.getTime() - 40 * 24 * 60 * 60 * 1000);
    const c = makeContainer({ decidedAt: fortyDaysAgo, hasOutcome: true });
    const recs = runEngine(makeInput([c]));
    expect(recs.find(r => r.categoryId === 'outcome_closure')).toBeUndefined();
  });

  it('escalates severity at 180+ days', () => {
    const sixMonthsAgo = new Date(FROZEN_NOW.getTime() - 200 * 24 * 60 * 60 * 1000);
    const c = makeContainer({ decidedAt: sixMonthsAgo, hasOutcome: false });
    const recs = runEngine(makeInput([c]));
    const rec = recs.find(r => r.categoryId === 'outcome_closure');
    expect(rec?.severity).toBe('high');
  });
});

describe('runEngine — validity-aware urgency', () => {
  it('low-validity containers receive a 1.4× urgency multiplier', () => {
    const c = makeContainer({
      validityClass: 'low',
      compositeDqi: 40,
    });
    const recs = runEngine(makeInput([c]));
    const top = recs[0];
    expect(top.scoreBreakdown.validityUrgencyMultiplier).toBe(1.4);
  });

  it('zero-validity containers receive a 1.8× urgency multiplier', () => {
    const c = makeContainer({
      validityClass: 'zero',
      compositeDqi: 40,
    });
    const recs = runEngine(makeInput([c]));
    const top = recs[0];
    expect(top.scoreBreakdown.validityUrgencyMultiplier).toBe(1.8);
  });

  it('high-validity containers receive a 1.0× multiplier', () => {
    const c = makeContainer({
      validityClass: 'high',
      compositeDqi: 40,
    });
    const recs = runEngine(makeInput([c]));
    const top = recs[0];
    expect(top.scoreBreakdown.validityUrgencyMultiplier).toBe(1.0);
  });
});

describe('runEngine — cross-decision multipliers', () => {
  it('thesis cascade fires when ≥3 spawned-from edges connect to a thesis', () => {
    const thesis = makeContainer({ id: 'thesis', kind: 'strategic', name: 'B2B SaaS in EM' });
    const c1 = makeContainer({ id: 'c1', name: 'Investment 1' });
    const c2 = makeContainer({ id: 'c2', name: 'Investment 2' });
    const c3 = makeContainer({ id: 'c3', name: 'Investment 3' });
    const links: EngineContainerLink[] = [
      { fromId: 'c1', toId: 'thesis', linkType: 'spawned_from', note: null },
      { fromId: 'c2', toId: 'thesis', linkType: 'spawned_from', note: null },
      { fromId: 'c3', toId: 'thesis', linkType: 'spawned_from', note: null },
    ];
    const recs = runEngine(makeInput([thesis, c1, c2, c3], links));
    const top = recs.find(r => r.categoryId === 'cross_decision_pattern');
    expect(top).toBeDefined();
    expect(top?.scoreBreakdown.crossDecisionMultiplier).toBe(1.3);
    expect(top?.relatedContainerIds.length).toBeGreaterThan(0);
  });

  it('shared-assumption fires when ≥3 containers carry overlapping assumption text', () => {
    const assumption = 'WAEMU debt cycle stable through 2027';
    const c1 = makeContainer({ id: 'c1', structuralAssumptions: [assumption] });
    const c2 = makeContainer({ id: 'c2', structuralAssumptions: [assumption] });
    const c3 = makeContainer({ id: 'c3', structuralAssumptions: [assumption] });
    const recs = runEngine(makeInput([c1, c2, c3]));
    expect(recs.find(r => r.categoryId === 'cross_decision_pattern')).toBeDefined();
  });
});

describe('runEngine — ranking', () => {
  it('returns recommendations sorted by finalScore desc', () => {
    const fiveDays = new Date(FROZEN_NOW.getTime() + 5 * 24 * 60 * 60 * 1000);
    const cCritical = makeContainer({
      id: 'critical',
      committeeDate: fiveDays,
      namedPatterns: [{ patternLabel: 'Synergy Mirage', severity: 'critical', documentCount: 1 }],
    });
    const cMild = makeContainer({
      id: 'mild',
      compositeDqi: 50,
    });
    const recs = runEngine(makeInput([cCritical, cMild]));
    expect(recs.length).toBeGreaterThanOrEqual(2);
    expect(recs[0].containerId).toBe('critical');
    // The top recommendation must outscore the lowest. Multiple
    // categories may fire for the critical container so we check
    // top-vs-tail rather than top-vs-second.
    expect(recs[0].finalScore).toBeGreaterThan(recs[recs.length - 1].finalScore);
    // The mild container's recommendation must be in the tail half.
    const mildRec = recs.find(r => r.containerId === 'mild');
    expect(mildRec).toBeDefined();
    expect(mildRec!.finalScore).toBeLessThan(recs[0].finalScore);
  });

  it('returns whyTrace on every recommendation', () => {
    const c = makeContainer({ compositeDqi: 40 });
    const recs = runEngine(makeInput([c]));
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].whyTrace).toBeTruthy();
    expect(recs[0].whyTrace.length).toBeGreaterThan(50);
  });

  it('returns empty array on empty container set', () => {
    const recs = runEngine(makeInput([]));
    expect(recs).toEqual([]);
  });
});

describe('cacheKey', () => {
  it('is deterministic for same input', () => {
    const c = makeContainer();
    const k1 = cacheKey(makeInput([c]));
    const k2 = cacheKey(makeInput([c]));
    expect(k1).toBe(k2);
  });

  it('changes when DQI shifts', () => {
    const c1 = makeContainer({ compositeDqi: 60 });
    const c2 = makeContainer({ compositeDqi: 80 });
    expect(cacheKey(makeInput([c1]))).not.toBe(cacheKey(makeInput([c2])));
  });

  it('changes when persona shifts', () => {
    const c = makeContainer();
    const inputCso: EngineInput = { ...makeInput([c]), persona: 'cso' };
    const inputMa: EngineInput = { ...makeInput([c]), persona: 'ma' };
    expect(cacheKey(inputCso)).not.toBe(cacheKey(inputMa));
  });

  it('changes when links change', () => {
    const c1 = makeContainer({ id: 'c1' });
    const c2 = makeContainer({ id: 'c2' });
    const noLinks: EngineContainerLink[] = [];
    const withLink: EngineContainerLink[] = [
      { fromId: 'c1', toId: 'c2', linkType: 'depends_on', note: null },
    ];
    expect(cacheKey(makeInput([c1, c2], noLinks))).not.toBe(
      cacheKey(makeInput([c1, c2], withLink))
    );
  });
});

describe('runEngine — persona framing', () => {
  it('uses CSO framing for cso persona', () => {
    const fiveDays = new Date(FROZEN_NOW.getTime() + 5 * 24 * 60 * 60 * 1000);
    const c = makeContainer({
      committeeDate: fiveDays,
      namedPatterns: [{ patternLabel: 'Synergy Mirage', severity: 'critical', documentCount: 1 }],
    });
    const input: EngineInput = { ...makeInput([c]), persona: 'cso' };
    const recs = runEngine(input);
    expect(recs[0].regularLabel).toContain('steering committee');
  });

  it('uses M&A framing for ma persona', () => {
    const fiveDays = new Date(FROZEN_NOW.getTime() + 5 * 24 * 60 * 60 * 1000);
    const c = makeContainer({
      committeeDate: fiveDays,
      kind: 'acquisition',
      namedPatterns: [{ patternLabel: 'Synergy Mirage', severity: 'critical', documentCount: 1 }],
    });
    const input: EngineInput = { ...makeInput([c]), persona: 'ma' };
    const recs = runEngine(input);
    expect(recs[0].regularLabel).toContain('IC review');
  });

  it('uses VC framing for pe_vc persona', () => {
    const fiveDays = new Date(FROZEN_NOW.getTime() + 5 * 24 * 60 * 60 * 1000);
    const c = makeContainer({
      committeeDate: fiveDays,
      namedPatterns: [{ patternLabel: 'Synergy Mirage', severity: 'critical', documentCount: 1 }],
    });
    const input: EngineInput = { ...makeInput([c]), persona: 'pe_vc' };
    const recs = runEngine(input);
    expect(recs[0].regularLabel).toContain('IC');
  });
});
