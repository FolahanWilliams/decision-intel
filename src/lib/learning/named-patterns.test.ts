/**
 * Unit tests for the pure-function named-pattern matcher.
 *
 * Locks the in-pipeline pattern detection behaviour the
 * `riskScorerNode → computeCompoundScore` integration relies on
 * (locked 2026-05-09 evening, M&A cascade pipeline-activation ship).
 *
 * The `matchNamedPatterns` function is the live-pipeline path that
 * activates `firedPatternLabels` for compound-engine PATTERN_PAIR_OVERRIDES
 * amplification. If these tests drift, the M&A signal stops firing on
 * real audits — which silently degrades DQI scoring on every M&A memo.
 *
 * Pure function — same input → same output. Tests are deterministic.
 */

import { describe, it, expect } from 'vitest';
import { matchNamedPatterns, NAMED_PATTERNS } from './named-patterns';

describe('matchNamedPatterns', () => {
  it('returns empty array when no biases supplied', () => {
    expect(matchNamedPatterns({ biasTypes: [], context: {} })).toEqual([]);
  });

  it('returns empty array when biases present but no pattern fully matches', () => {
    // Only one of the two required Echo Chamber biases.
    const result = matchNamedPatterns({
      biasTypes: ['groupthink'],
      context: { dissentAbsent: true },
    });
    expect(result).toEqual([]);
  });

  it('matches Echo Chamber when groupthink + confirmation + dissentAbsent', () => {
    const result = matchNamedPatterns({
      biasTypes: ['groupthink', 'confirmation_bias'],
      context: { dissentAbsent: true },
    });
    expect(result).toContain('The Echo Chamber');
  });

  it('does NOT match Echo Chamber without dissentAbsent context', () => {
    const result = matchNamedPatterns({
      biasTypes: ['groupthink', 'confirmation_bias'],
      context: { dissentAbsent: false },
    });
    expect(result).not.toContain('The Echo Chamber');
  });

  it('matches Synergy Mirage when overconfidence + planning_fallacy + high stakes (M&A pattern)', () => {
    const result = matchNamedPatterns({
      biasTypes: ['overconfidence_bias', 'planning_fallacy'],
      context: { monetaryStakes: 'high' },
    });
    expect(result).toContain('The Synergy Mirage');
  });

  it('matches Synergy Mirage at very_high stakes (ladder upgrade direction)', () => {
    const result = matchNamedPatterns({
      biasTypes: ['overconfidence_bias', 'planning_fallacy'],
      context: { monetaryStakes: 'very_high' },
    });
    expect(result).toContain('The Synergy Mirage');
  });

  it('does NOT match Synergy Mirage at medium stakes (below ladder threshold)', () => {
    const result = matchNamedPatterns({
      biasTypes: ['overconfidence_bias', 'planning_fallacy'],
      context: { monetaryStakes: 'medium' },
    });
    expect(result).not.toContain('The Synergy Mirage');
  });

  it("matches Winner's Curse when anchoring + overconfidence + high stakes + time pressure", () => {
    const result = matchNamedPatterns({
      biasTypes: ['anchoring_bias', 'overconfidence_bias'],
      context: { monetaryStakes: 'high', timePressure: true },
    });
    expect(result).toContain("The Winner's Curse");
  });

  it("does NOT match Winner's Curse without timePressure (pattern requires both context fields)", () => {
    const result = matchNamedPatterns({
      biasTypes: ['anchoring_bias', 'overconfidence_bias'],
      context: { monetaryStakes: 'high', timePressure: false },
    });
    expect(result).not.toContain("The Winner's Curse");
  });

  it('matches Conglomerate Fallacy with no contextRequired (illusion + halo, any context)', () => {
    const result = matchNamedPatterns({
      biasTypes: ['illusion_of_validity', 'halo_effect'],
      context: {},
    });
    expect(result).toContain('The Conglomerate Fallacy');
  });

  it('matches multiple patterns when biases overlap (M&A audit firing 3 patterns)', () => {
    // Bias set covering Synergy Mirage + Winner's Curse + Optimism Trap.
    const result = matchNamedPatterns({
      biasTypes: [
        'overconfidence_bias',
        'planning_fallacy',
        'anchoring_bias',
        'confirmation_bias',
      ],
      context: { monetaryStakes: 'high', timePressure: true },
    });
    expect(result).toContain('The Synergy Mirage');
    expect(result).toContain("The Winner's Curse");
    expect(result).toContain('The Optimism Trap');
  });

  it('handles uppercase / mixed-case bias types via case-insensitive matching', () => {
    const result = matchNamedPatterns({
      biasTypes: ['GROUPTHINK', 'Confirmation_Bias'],
      context: { dissentAbsent: true },
    });
    expect(result).toContain('The Echo Chamber');
  });

  it('matches Yes Committee when groupthink + authority + unanimousConsensus', () => {
    const result = matchNamedPatterns({
      biasTypes: ['groupthink', 'authority_bias'],
      context: { unanimousConsensus: true },
    });
    expect(result).toContain('The Yes Committee');
  });

  it('does NOT match patterns whose context cannot be derived (under-fire, never fabricate)', () => {
    // Yes Committee requires unanimousConsensus. The in-pipeline matcher
    // doesn't have decision-room data, so unanimousConsensus is absent.
    // The pattern should NOT fire — the persisted toxic-combinations.ts
    // detector with full Prisma context catches it later.
    const result = matchNamedPatterns({
      biasTypes: ['groupthink', 'authority_bias'],
      context: { monetaryStakes: 'high' }, // no unanimousConsensus key
    });
    expect(result).not.toContain('The Yes Committee');
  });

  it('catalogue stays at 13 named patterns (M&A cascade lock)', () => {
    // Drift-class guard — if NAMED_PATTERNS adds a 14th entry, the
    // CLAUDE.md M&A Workflow Native lock + founder-context.ts coaching
    // must update in the same commit. Mirrors the bias-taxonomy cascade.
    expect(NAMED_PATTERNS).toHaveLength(13);
  });
});
