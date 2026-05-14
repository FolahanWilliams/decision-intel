/**
 * Regression suite for the depends_on ripple detector.
 *
 * Locked 2026-05-13 (M-7 ship). Covers every trigger semantic + the
 * defensive filters (self-edges, archived dependents, unknown containers,
 * dismissed ripples).
 */

import { describe, it, expect } from 'vitest';
import {
  detectDependsOnRipples,
  groupRipplesByAnchor,
  type RippleContainerLite,
  type DependsOnEdge,
} from './ripple-detection';

function mkContainer(
  overrides: Partial<RippleContainerLite> & Pick<RippleContainerLite, 'id' | 'name'>
): RippleContainerLite {
  return {
    kind: 'investment',
    status: 'active',
    decisionFrame: null,
    outcome: null,
    ...overrides,
  };
}

function mkEdge(
  fromId: string,
  toId: string,
  overrides: Partial<DependsOnEdge> = {}
): DependsOnEdge {
  return {
    fromId,
    toId,
    note: null,
    createdAt: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

function buildMap(containers: RippleContainerLite[]): Map<string, RippleContainerLite> {
  return new Map(containers.map(c => [c.id, c]));
}

describe('detectDependsOnRipples — anchor archive flips', () => {
  it('high-severity ripple when anchor.status === archived', () => {
    const anchor = mkContainer({
      id: 'a',
      name: 'WAEMU stability thesis',
      status: 'archived',
    });
    const dependent = mkContainer({ id: 'd', name: 'Portco Alpha' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor, dependent]),
      edges: [mkEdge('d', 'a')],
    });
    expect(ripples).toHaveLength(1);
    expect(ripples[0].severity).toBe('high');
    expect(ripples[0].reason).toBe('anchor_archived');
    expect(ripples[0].anchor.name).toBe('WAEMU stability thesis');
    expect(ripples[0].dependent.name).toBe('Portco Alpha');
  });

  it('no ripple when anchor is active and has no outcome', () => {
    const anchor = mkContainer({ id: 'a', name: 'active thesis' });
    const dependent = mkContainer({ id: 'd', name: 'Portco' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor, dependent]),
      edges: [mkEdge('d', 'a')],
    });
    expect(ripples).toEqual([]);
  });
});

describe('detectDependsOnRipples — anchor outcomes', () => {
  it('high-severity ripple when Brier ≥ 0.20', () => {
    const anchor = mkContainer({
      id: 'a',
      name: 'Thesis A',
      outcome: {
        summary: 'Modest underperformance.',
        realisedDqi: 50,
        brierScore: 0.25,
        reportedAt: '2026-05-01T00:00:00Z',
      },
    });
    const dependent = mkContainer({ id: 'd', name: 'Portco Alpha' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor, dependent]),
      edges: [mkEdge('d', 'a')],
    });
    expect(ripples).toHaveLength(1);
    expect(ripples[0].severity).toBe('high');
    expect(ripples[0].reason).toBe('anchor_outcome_failure');
  });

  it('high-severity ripple when summary contains failure language', () => {
    const anchor = mkContainer({
      id: 'a',
      name: 'Thesis A',
      outcome: {
        summary: 'The thesis failed to deliver — we underperformed on synergy targets.',
        realisedDqi: 70,
        brierScore: 0.05,
        reportedAt: '2026-05-01T00:00:00Z',
      },
    });
    const dependent = mkContainer({ id: 'd', name: 'Portco' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor, dependent]),
      edges: [mkEdge('d', 'a')],
    });
    expect(ripples).toHaveLength(1);
    expect(ripples[0].severity).toBe('high');
    expect(ripples[0].reason).toBe('anchor_outcome_failure');
  });

  it('medium-severity ripple when 0.10 ≤ Brier < 0.20', () => {
    const anchor = mkContainer({
      id: 'a',
      name: 'Thesis',
      outcome: {
        summary: 'Some risks materialised but we delivered partial value.',
        realisedDqi: 72,
        brierScore: 0.15,
        reportedAt: '2026-05-01T00:00:00Z',
      },
    });
    const dependent = mkContainer({ id: 'd', name: 'Portco' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor, dependent]),
      edges: [mkEdge('d', 'a')],
    });
    expect(ripples).toHaveLength(1);
    expect(ripples[0].severity).toBe('medium');
    expect(ripples[0].reason).toBe('anchor_outcome_partial');
  });

  it('no ripple when Brier < 0.10 and summary is clean', () => {
    const anchor = mkContainer({
      id: 'a',
      name: 'Thesis',
      outcome: {
        summary: 'Delivered as forecast.',
        realisedDqi: 82,
        brierScore: 0.05,
        reportedAt: '2026-05-01T00:00:00Z',
      },
    });
    const dependent = mkContainer({ id: 'd', name: 'Portco' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor, dependent]),
      edges: [mkEdge('d', 'a')],
    });
    expect(ripples).toEqual([]);
  });
});

describe('detectDependsOnRipples — defensive filters', () => {
  it('filters self-edges (fromId === toId)', () => {
    const c = mkContainer({ id: 'a', name: 'self', status: 'archived' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([c]),
      edges: [mkEdge('a', 'a')],
    });
    expect(ripples).toEqual([]);
  });

  it('skips edges referencing unknown containers', () => {
    const anchor = mkContainer({ id: 'a', name: 'a', status: 'archived' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor]),
      edges: [mkEdge('missing', 'a'), mkEdge('a', 'also-missing')],
    });
    expect(ripples).toEqual([]);
  });

  it('skips dependents that are themselves archived', () => {
    const anchor = mkContainer({ id: 'a', name: 'a', status: 'archived' });
    const dependent = mkContainer({ id: 'd', name: 'd', status: 'archived' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor, dependent]),
      edges: [mkEdge('d', 'a')],
    });
    expect(ripples).toEqual([]);
  });

  it('filters dismissed ripple ids', () => {
    const anchor = mkContainer({ id: 'a', name: 'a', status: 'archived' });
    const dependent = mkContainer({ id: 'd', name: 'd' });
    const dismissedId = 'a::d::anchor_archived';
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor, dependent]),
      edges: [mkEdge('d', 'a')],
      dismissedIds: new Set([dismissedId]),
    });
    expect(ripples).toEqual([]);
  });
});

describe('detectDependsOnRipples — sort order', () => {
  it('sorts high-severity first, then most-recent triggered first', () => {
    const anchorHigh = mkContainer({
      id: 'high',
      name: 'High thesis',
      status: 'archived',
    });
    const anchorMedium = mkContainer({
      id: 'med',
      name: 'Medium thesis',
      outcome: {
        summary: 'Partial.',
        realisedDqi: 70,
        brierScore: 0.15,
        reportedAt: '2026-05-12T00:00:00Z',
      },
    });
    const dependent = mkContainer({ id: 'd', name: 'd' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchorHigh, anchorMedium, dependent]),
      edges: [mkEdge('d', 'med'), mkEdge('d', 'high')],
    });
    expect(ripples).toHaveLength(2);
    expect(ripples[0].severity).toBe('high');
    expect(ripples[1].severity).toBe('medium');
  });
});

describe('groupRipplesByAnchor', () => {
  it('groups multiple dependents on the same anchor', () => {
    const anchor = mkContainer({ id: 'a', name: 'WAEMU', status: 'archived' });
    const dep1 = mkContainer({ id: 'd1', name: 'Portco 1' });
    const dep2 = mkContainer({ id: 'd2', name: 'Portco 2' });
    const dep3 = mkContainer({ id: 'd3', name: 'Portco 3' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor, dep1, dep2, dep3]),
      edges: [mkEdge('d1', 'a'), mkEdge('d2', 'a'), mkEdge('d3', 'a')],
    });
    const groups = groupRipplesByAnchor(ripples);
    expect(groups).toHaveLength(1);
    expect(groups[0].anchorId).toBe('a');
    expect(groups[0].dependents).toHaveLength(3);
    expect(new Set(groups[0].dependents.map(d => d.name))).toEqual(
      new Set(['Portco 1', 'Portco 2', 'Portco 3'])
    );
  });

  it('upgrades group severity when ANY dependent ripples high', () => {
    const anchorHigh = mkContainer({ id: 'a1', name: 'A1', status: 'archived' });
    const anchorMed = mkContainer({
      id: 'a2',
      name: 'A2',
      outcome: {
        summary: 'partial',
        realisedDqi: 70,
        brierScore: 0.15,
        reportedAt: '2026-05-01T00:00:00Z',
      },
    });
    const dep = mkContainer({ id: 'd', name: 'd' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchorHigh, anchorMed, dep]),
      edges: [mkEdge('d', 'a1'), mkEdge('d', 'a2')],
    });
    const groups = groupRipplesByAnchor(ripples);
    // Two anchors → two groups, but the high-severity one sorts first.
    expect(groups).toHaveLength(2);
    expect(groups[0].topSeverity).toBe('high');
    expect(groups[1].topSeverity).toBe('medium');
  });

  it('returns empty array on empty ripples', () => {
    expect(groupRipplesByAnchor([])).toEqual([]);
  });
});

describe('detectDependsOnRipples — message + id stability', () => {
  it('message names both anchor and dependent', () => {
    const anchor = mkContainer({ id: 'a', name: 'WAEMU thesis', status: 'archived' });
    const dependent = mkContainer({ id: 'd', name: 'Portco Alpha' });
    const ripples = detectDependsOnRipples({
      containers: buildMap([anchor, dependent]),
      edges: [mkEdge('d', 'a')],
    });
    expect(ripples[0].message).toContain('WAEMU thesis');
    expect(ripples[0].message).toContain('Portco Alpha');
  });

  it('ripple id is stable across calls (anchor::dependent::reason)', () => {
    const anchor = mkContainer({ id: 'a', name: 'a', status: 'archived' });
    const dependent = mkContainer({ id: 'd', name: 'd' });
    const input = {
      containers: buildMap([anchor, dependent]),
      edges: [mkEdge('d', 'a')],
    };
    const first = detectDependsOnRipples(input);
    const second = detectDependsOnRipples(input);
    expect(first[0].id).toBe(second[0].id);
    expect(first[0].id).toBe('a::d::anchor_archived');
  });
});
