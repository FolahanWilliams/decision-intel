import { describe, it, expect } from 'vitest';
import { buildBowtie, BOWTIE_TOP_EVENT } from './bowtie';
import { detectStrategicNodes } from './strategic-nodes';
import { detectResilienceMarkers } from './resilience-signature';
import type { DetectedStrategicNode } from './strategic-nodes';
import type { DetectedResilienceMarker } from './resilience-signature';

function bowtieOf(content: string) {
  return buildBowtie(detectStrategicNodes(content), detectResilienceMarkers(content));
}

const threat = (
  id: string,
  label: string,
  amplifies: string,
  evidence: string
): DetectedStrategicNode => ({
  id,
  class: 'structural',
  label,
  amplifies,
  weight: 3,
  evidence,
});
const marker = (
  id: DetectedResilienceMarker['id'],
  evidence: string
): DetectedResilienceMarker => ({
  id,
  label: id,
  absorbs: 'a',
  weight: 3,
  evidence,
});

describe('buildBowtie — the killer buyer visual, deterministic', () => {
  it('returns null when there is no threat to anchor the bow-tie', () => {
    expect(buildBowtie([], [])).toBeNull();
    expect(
      bowtieOf('An unremarkable operational update with no structural conditions.')
    ).toBeNull();
  });

  it('a concentrated, un-buffered memo: all six canonical barriers MISSING, payoff concave', () => {
    const bt = buildBowtie(
      [
        threat(
          'concentration_risk',
          'Single-tenant concentration',
          'a single point of failure for substantially all revenue',
          'substantially all contracted capacity on a single anchor tenant'
        ),
      ],
      []
    );
    expect(bt).not.toBeNull();
    expect(bt!.topEvent).toBe(BOWTIE_TOP_EVENT);
    expect(bt!.missingBarrierCount).toBe(6);
    expect(bt!.totalCanonicalBarriers).toBe(6);
    expect(bt!.prevention.every(b => !b.present)).toBe(true);
    expect(bt!.mitigation.every(b => !b.present)).toBe(true);
    expect(bt!.convexity.verdict).toBe('concave');
    expect(bt!.convexity.line.toLowerCase()).toContain('shock');
  });

  it('a mitigation barrier flips convexity to buffered and interrupts the coupling', () => {
    const threats = [
      threat(
        'concentration_risk',
        'Single-tenant concentration',
        'concentration for substantially all revenue',
        'substantially all revenue on a single customer'
      ),
      threat(
        'key_person_dependency',
        'Key-person dependency',
        'loss of founder harms the business',
        'we depend on our founder'
      ),
      threat(
        'valuation_vs_fundamentals',
        'Valuation vs fundamentals',
        'valuation detached from revenue',
        'valuation not supported by revenue'
      ),
    ];
    const buffered = buildBowtie(threats, [
      marker('exit_trigger', 'a predefined exit trigger'),
      marker('reserves', 'a contingency reserve'),
    ]);
    expect(buffered!.convexity.verdict).toBe('buffered');
    expect(buffered!.coupling.interrupted).toBe(true);
    expect(buffered!.coupling.degree).toBe('loose'); // 3 threats but interrupted → not tight
    const bare = buildBowtie(threats, []);
    expect(bare!.coupling.degree).toBe('tight'); // 3 threats, no circuit-breaker → cascades
    expect(bare!.coupling.interrupted).toBe(false);
  });

  it('barriers report present + carry their evidence; missing count drops accordingly', () => {
    const bt = buildBowtie(
      [threat('concentration_risk', 'Concentration', 'x', 'single customer')],
      [
        marker('staging', 'committed in three gated tranches'),
        marker('exit_trigger', 'a predefined exit trigger'),
      ]
    );
    const staging = bt!.prevention.find(b => b.dimension === 'staging')!;
    expect(staging.present).toBe(true);
    expect(staging.evidence).toContain('tranches');
    const exit = bt!.mitigation.find(b => b.dimension === 'exit_trigger')!;
    expect(exit.present).toBe(true);
    expect(bt!.missingBarrierCount).toBe(4); // 6 canonical − 2 present
  });

  it('a single dominant condition reads as single-coupling, not cascading', () => {
    const bt = buildBowtie(
      [
        threat(
          'key_person_dependency',
          'Key-person dependency',
          'loss of founder harms us',
          'we depend on our founder'
        ),
      ],
      []
    );
    expect(bt!.coupling.degree).toBe('single');
    expect(bt!.threats).toHaveLength(1);
  });

  it('no asymmetry driver → convexity is insufficient_signal (honest, not a fabricated verdict)', () => {
    // A key-person threat alone is not a concentration/irreversibility driver.
    const bt = buildBowtie(
      [
        threat(
          'key_person_dependency',
          'Key-person dependency',
          'loss of a key hire',
          'we rely on a key hire'
        ),
      ],
      []
    );
    expect(bt!.convexity.verdict).toBe('insufficient_signal');
  });

  it('end-to-end on the Fermi shape: threats detected, barriers all missing, concave + tightly coupled', () => {
    const fermi = `We are pre-revenue with no operating history. We depend on a single anchor tenant
      that accounts for substantially all contracted capacity; we have no definitive leases for the
      remainder. We depend on our founder and chief executive. Capital is committed to long-lead
      construction before any tenant signs.`;
    const bt = bowtieOf(fermi);
    expect(bt).not.toBeNull();
    expect(bt!.threats.length).toBeGreaterThanOrEqual(2);
    expect(bt!.convexity.verdict).toBe('concave');
    expect(bt!.missingBarrierCount).toBe(6);
  });

  it('threats preserve the existential-first order + carry the suppression edge when present', () => {
    const withConceal: DetectedStrategicNode = {
      ...threat('concentration_risk', 'Concentration', 'x', 'single customer'),
      conceals: 'hid the revenue fragility from the committee',
    };
    const bt = buildBowtie([withConceal], []);
    expect(bt!.threats[0].conceals).toBe('hid the revenue fragility from the committee');
  });
});
