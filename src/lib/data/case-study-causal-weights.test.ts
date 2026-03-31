/**
 * Tests for Static Causal Weights from Case Studies
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeStaticCausalWeights,
  getStaticCausalGraph,
  getStaticCausalInsights,
} from './case-study-causal-weights';
import type {
  CausalWeight,
  CausalInsight,
  CausalGraphNode,
} from './case-study-causal-weights';

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

describe('computeStaticCausalWeights', () => {
  let weights: CausalWeight[];

  beforeEach(() => {
    weights = computeStaticCausalWeights();
  });

  it('returns a non-empty array', () => {
    expect(weights.length).toBeGreaterThan(0);
  });

  it('each weight has the expected shape and valid field values', () => {
    for (const w of weights) {
      expect(typeof w.biasType).toBe('string');
      expect(w.biasType.length).toBeGreaterThan(0);
      expect(typeof w.outcomeCorrelation).toBe('number');
      expect(w.failureCount).toBeGreaterThanOrEqual(0);
      expect(w.successCount).toBeGreaterThanOrEqual(0);
      expect(w.dangerMultiplier).toBeGreaterThan(0);
      expect(w.sampleSize).toBeGreaterThan(0);
    }
  });

  it('is sorted by dangerMultiplier descending', () => {
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i - 1].dangerMultiplier).toBeGreaterThanOrEqual(weights[i].dangerMultiplier);
    }
  });

  it('includes at least some pairwise interaction entries (biasType contains "+")', () => {
    const pairwise = weights.filter(w => w.biasType.includes('+'));
    expect(pairwise.length).toBeGreaterThan(0);
  });

  it('returns the same cached reference on a second call', () => {
    const second = computeStaticCausalWeights();
    expect(second).toBe(weights);
  });
});

describe('getStaticCausalGraph', () => {
  it('returns an object with nodes and edges arrays', () => {
    const graph = getStaticCausalGraph();
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(Array.isArray(graph.edges)).toBe(true);
  });

  it('nodes include at least one bias node and one outcome node', () => {
    const { nodes } = getStaticCausalGraph();
    const biasNodes = nodes.filter((n: CausalGraphNode) => n.type === 'bias');
    const outcomeNodes = nodes.filter((n: CausalGraphNode) => n.type === 'outcome');
    expect(biasNodes.length).toBeGreaterThan(0);
    expect(outcomeNodes.length).toBeGreaterThan(0);
  });

  it('bias nodes have x = 50', () => {
    const { nodes } = getStaticCausalGraph();
    const biasNodes = nodes.filter((n: CausalGraphNode) => n.type === 'bias');
    for (const node of biasNodes) {
      expect(node.x).toBe(50);
    }
  });

  it('outcome nodes have x = 750', () => {
    const { nodes } = getStaticCausalGraph();
    const outcomeNodes = nodes.filter((n: CausalGraphNode) => n.type === 'outcome');
    for (const node of outcomeNodes) {
      expect(node.x).toBe(750);
    }
  });

  it('has at least one edge', () => {
    const { edges } = getStaticCausalGraph();
    expect(edges.length).toBeGreaterThan(0);
  });

  it('each edge has from, to, weight, label, color, thickness', () => {
    const { edges } = getStaticCausalGraph();
    for (const e of edges) {
      expect(typeof e.from).toBe('string');
      expect(typeof e.to).toBe('string');
      expect(typeof e.weight).toBe('number');
      expect(typeof e.label).toBe('string');
      expect(typeof e.color).toBe('string');
      expect(typeof e.thickness).toBe('number');
    }
  });

  it('edge from/to reference valid node IDs', () => {
    const graph = getStaticCausalGraph();
    const nodeIds = new Set(graph.nodes.map((n: CausalGraphNode) => n.id));
    for (const e of graph.edges) {
      expect(nodeIds.has(e.from)).toBe(true);
      expect(nodeIds.has(e.to)).toBe(true);
    }
  });
});

describe('getStaticCausalInsights', () => {
  let insights: CausalInsight[];

  beforeEach(() => {
    insights = getStaticCausalInsights();
  });

  it('returns a non-empty array', () => {
    expect(insights.length).toBeGreaterThan(0);
  });

  it('each insight has valid type, message, confidence, and dataPoints', () => {
    const validTypes = new Set(['danger', 'safe', 'noise', 'twin']);
    for (const insight of insights) {
      expect(validTypes.has(insight.type)).toBe(true);
      expect(typeof insight.message).toBe('string');
      expect(insight.message.length).toBeGreaterThan(0);
      expect(insight.confidence).toBeGreaterThanOrEqual(0);
      expect(insight.confidence).toBeLessThanOrEqual(1);
      expect(insight.dataPoints).toBeGreaterThanOrEqual(0);
    }
  });

  it('includes at least one safe or noise type insight given the case study data', () => {
    const safeOrNoise = insights.filter(i => i.type === 'safe' || i.type === 'noise');
    expect(safeOrNoise.length).toBeGreaterThan(0);
  });
});
