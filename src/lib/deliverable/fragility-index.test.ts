import { describe, it, expect } from 'vitest';
import { computeStructuralFragility } from './fragility-index';
import type { DetectedStrategicNode } from './strategic-nodes';
import { detectStrategicNodes } from './strategic-nodes';
import type { DetectedResilienceMarker } from './resilience-signature';
import { detectResilienceMarkers } from './resilience-signature';

// End-to-end on realistic memo shapes: the Fermi (fragile) shape must land far
// ABOVE a resilient-bold (Amazon-like) shape — the discrimination the DQI can't
// produce (both are bold; only the STRUCTURE differs). Deterministic → this is
// the in-sandbox verification of the whole thesis.
function fragilityOf(content: string) {
  return computeStructuralFragility(
    detectStrategicNodes(content),
    detectResilienceMarkers(content)
  );
}

describe('computeStructuralFragility — the second axis (risk × fragility)', () => {
  it('the Fermi shape (concentration + valuation + key-person, no resilience) lands FRAGILE', () => {
    const fermi = `We are pre-revenue with no operating history. We depend on a single anchor tenant
      that accounts for substantially all contracted capacity; we have no definitive leases for the
      remainder. We depend on our founder and chief executive; the loss of our founder could materially
      harm the business. Capital is committed to long-lead construction before any tenant signs.`;
    const f = fragilityOf(fermi);
    expect(['fragile', 'avalanche_zone']).toContain(f.band);
    expect(f.index).toBeGreaterThanOrEqual(50);
    expect(f.resilienceMarkers).toHaveLength(0);
  });

  it('a bold-but-RESILIENT memo (same boldness, staged/reversible/reserved) lands far LOWER', () => {
    const resilient = `This is a bold, pre-revenue bet in an unproven market. But we commit capital in
      three gated tranches, each a reversible two-way door with a predefined exit trigger. Revenue is
      diversified across multiple independent customers. A contingency reserve funds the downside case,
      and a pre-mortem runs at each stage-gate. We are well-capitalised with a strong balance sheet.`;
    const r = fragilityOf(resilient);
    expect(r.index).toBeLessThan(50);
    expect(r.resilienceMarkers.length).toBeGreaterThanOrEqual(4);
  });

  it('DISCRIMINATION: the fragile shape scores materially higher than the resilient shape', () => {
    const fermi = `We depend on a single anchor tenant for substantially all revenue; no definitive
      contracts. Pre-revenue, no operating history. Loss of our founder could materially harm us.`;
    const resilient = `We commit in staged tranches, reversible, with an exit trigger and a contingency
      reserve; revenue diversified across many customers; profitable with a strong balance sheet.`;
    expect(fragilityOf(fermi).index).toBeGreaterThan(fragilityOf(resilient).index + 25);
  });

  it('missingResilience names the absent dimensions (the actionable half)', () => {
    const f = fragilityOf(
      'We depend on a single anchor tenant. Pre-revenue, no operating history.'
    );
    expect(f.missingResilience).toContain('staging');
    expect(f.missingResilience).toContain('exit_trigger');
    expect(f.missingResilience.length).toBeGreaterThan(0);
  });

  it('pure index math: fragility raises, resilience lowers, clamped 0-100', () => {
    const node = (weight: number): DetectedStrategicNode => ({
      id: 'x',
      class: 'structural',
      label: 'x',
      amplifies: 'x',
      weight,
      evidence: 'x',
    });
    const marker = (weight: number): DetectedResilienceMarker => ({
      id: 'staging',
      label: 's',
      absorbs: 'a',
      weight,
      evidence: 'e',
    });
    expect(computeStructuralFragility([node(3), node(3), node(3)], []).index).toBeGreaterThan(60);
    const buffered = computeStructuralFragility(
      [node(3), node(3), node(3)],
      [marker(3), marker(3), marker(3), marker(3)]
    );
    expect(buffered.index).toBeLessThan(50);
    expect(buffered.index).toBeGreaterThanOrEqual(0);
  });
});
