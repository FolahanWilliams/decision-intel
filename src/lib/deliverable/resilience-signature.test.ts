import { describe, it, expect } from 'vitest';
import { detectResilienceMarkers, RESILIENCE_DIMENSIONS } from './resilience-signature';

const ids = (content: string) => detectResilienceMarkers(content).map(m => m.id);

describe('detectResilienceMarkers — the resilience side (the missing half)', () => {
  it('a staged, reversible, reserved bold bet fires the circuit-breakers', () => {
    const text = `We will commit capital in three tranches, each gated on a milestone. The pilot is a
      reversible two-way door — we can wind down after the trial market with a predefined exit trigger.
      A contingency reserve funds the downside case, and a pre-mortem review runs at each stage-gate.`;
    const got = ids(text);
    expect(got).toContain('staging');
    expect(got).toContain('reversibility');
    expect(got).toContain('exit_trigger');
    expect(got).toContain('reserves');
    expect(got).toContain('disconfirmation');
  });

  it('diversification + optionality (mechanisms), and rhetoric is NOT a marker', () => {
    const text = `Revenue is diversified across multiple independent customers, no single counterparty.
      The platform preserves optionality — an option to expand into adjacent markets. We are profitable
      with a strong balance sheet and ample liquidity.`;
    const got = ids(text);
    expect(got).toContain('diversification');
    expect(got).toContain('optionality');
    // "profitable / strong balance sheet / ample liquidity" is RHETORIC, not a
    // structure — capital_access was deleted 2026-07-02 (the Zillow lesson).
    expect(got).not.toContain('capital_access');
  });

  it('pure rhetoric ("strong position / access to capital") fires NO markers', () => {
    const text = `We are in a strong position, executing with operational rigor, well-capitalised with
      access to capital and a strong balance sheet.`;
    expect(detectResilienceMarkers(text)).toHaveLength(0);
  });

  it('a concentrated, all-in, irreversible memo fires NO resilience markers', () => {
    const text = `We depend on a single anchor tenant. Capital is committed upfront under a take-or-pay
      obligation before any lease is signed. There is no operating history and no definitive contracts.`;
    expect(detectResilienceMarkers(text)).toHaveLength(0);
  });

  it('circuit-breakers (weight 3) lead the ordering', () => {
    const text = `We commit in staged tranches with a reversible pilot and a predefined exit trigger,
      and revenue is diversified across many customers.`;
    const first = detectResilienceMarkers(text)[0];
    expect(first.weight).toBe(3); // staging / reversibility / exit_trigger lead the weight-2 markers
  });

  it('returns [] on empty input; every marker id is a canonical dimension', () => {
    expect(detectResilienceMarkers('')).toHaveLength(0);
    for (const m of detectResilienceMarkers('we commit in tranches gated on milestones')) {
      expect(RESILIENCE_DIMENSIONS).toContain(m.id);
    }
  });
});
