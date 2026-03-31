/**
 * Static Causal Weights from Case Studies
 *
 * Computes causal weights (bias → outcome correlations) and a graph
 * structure from the static case study database. This is the synchronous
 * equivalent of computeOrgCausalWeights() — no DB queries needed.
 */

import { ALL_CASES, isFailureOutcome, isSuccessOutcome } from '@/lib/data/case-studies';
import type { CausalWeight, CausalInsight } from '@/lib/learning/causal-learning';
import { getCausalInsights } from '@/lib/learning/causal-learning';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CausalGraphNode {
  id: string;
  label: string;
  type: 'bias' | 'outcome' | 'context';
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface CausalGraphEdge {
  from: string;
  to: string;
  weight: number;
  label: string;
  color: string;
  thickness: number;
}

export interface CausalGraph {
  nodes: CausalGraphNode[];
  edges: CausalGraphEdge[];
}

// ─── Static Causal Weights ───────────────────────────────────────────────────

let _cachedWeights: CausalWeight[] | null = null;

/**
 * Compute causal weights from the static case study database.
 * Mirrors the logic of computeOrgCausalWeights but operates on ALL_CASES.
 */
export function computeStaticCausalWeights(): CausalWeight[] {
  if (_cachedWeights) return _cachedWeights;

  const totalCases = ALL_CASES.length;
  const totalFailures = ALL_CASES.filter(c => isFailureOutcome(c.outcome)).length;
  const baseFailureRate = totalFailures / totalCases;

  // Per-bias statistics
  const biasStats = new Map<
    string,
    { failures: number; successes: number; partials: number }
  >();

  for (const c of ALL_CASES) {
    const isFailure = isFailureOutcome(c.outcome);
    const isSuccess = isSuccessOutcome(c.outcome);

    for (const bias of c.biasesPresent) {
      const stats = biasStats.get(bias) ?? { failures: 0, successes: 0, partials: 0 };
      if (isFailure) stats.failures++;
      else if (isSuccess) stats.successes++;
      else stats.partials++;
      biasStats.set(bias, stats);
    }
  }

  const weights: CausalWeight[] = [];

  for (const [biasType, stats] of biasStats.entries()) {
    const total = stats.failures + stats.successes + stats.partials;
    if (total < 2) continue;

    const biasFailureRate = stats.failures / total;
    const outcomeCorrelation = Number((biasFailureRate - baseFailureRate).toFixed(3));

    const dangerMultiplier =
      baseFailureRate > 0
        ? Number((biasFailureRate / baseFailureRate).toFixed(2))
        : biasFailureRate > 0
          ? 2.0
          : 1.0;

    weights.push({
      biasType,
      outcomeCorrelation,
      failureCount: stats.failures,
      successCount: stats.successes,
      dangerMultiplier,
      sampleSize: total,
    });
  }

  // Pairwise interaction detection (same as causal-learning.ts)
  const biasTypesList = Array.from(biasStats.keys());
  const caseBiasSets = ALL_CASES.map(c => ({
    biases: new Set(c.biasesPresent),
    isFailure: isFailureOutcome(c.outcome),
    isSuccess: isSuccessOutcome(c.outcome),
  }));

  for (let i = 0; i < biasTypesList.length; i++) {
    for (let j = i + 1; j < biasTypesList.length; j++) {
      const biasA = biasTypesList[i];
      const biasB = biasTypesList[j];

      let jointTotal = 0;
      let jointFailures = 0;
      let jointSuccesses = 0;

      for (const entry of caseBiasSets) {
        if (entry.biases.has(biasA) && entry.biases.has(biasB)) {
          jointTotal++;
          if (entry.isFailure) jointFailures++;
          else if (entry.isSuccess) jointSuccesses++;
        }
      }

      if (jointTotal < 3) continue; // Lower threshold for static data (fewer cases)

      const jointFailureRate = jointFailures / jointTotal;
      const statsA = biasStats.get(biasA)!;
      const statsB = biasStats.get(biasB)!;
      const totalA = statsA.failures + statsA.successes + statsA.partials;
      const totalB = statsB.failures + statsB.successes + statsB.partials;
      if (totalA === 0 || totalB === 0) continue;
      const expectedRate = (statsA.failures / totalA) * (statsB.failures / totalB);

      if (expectedRate === 0) continue;
      const interactionStrength = jointFailureRate / expectedRate;

      if (interactionStrength > 1.2) { // Slightly lower threshold for static data
        weights.push({
          biasType: [biasA, biasB].sort().join('+'),
          outcomeCorrelation: Number((jointFailureRate - baseFailureRate).toFixed(3)),
          failureCount: jointFailures,
          successCount: jointSuccesses,
          dangerMultiplier: Number(interactionStrength.toFixed(2)),
          sampleSize: jointTotal,
        });
      }
    }
  }

  weights.sort((a, b) => b.dangerMultiplier - a.dangerMultiplier);
  _cachedWeights = weights;
  return weights;
}

/**
 * Get causal insights from the static case study data.
 */
export function getStaticCausalInsights(): CausalInsight[] {
  const weights = computeStaticCausalWeights();
  return getCausalInsights(weights, ALL_CASES.length);
}

// ─── Causal Graph ────────────────────────────────────────────────────────────

let _cachedGraph: CausalGraph | null = null;

/**
 * Build a visual causal graph from static case study data.
 * Bias nodes on the left, outcome nodes on the right.
 */
export function getStaticCausalGraph(): CausalGraph {
  if (_cachedGraph) return _cachedGraph;

  const weights = computeStaticCausalWeights();

  // Only include single-bias weights (not pairs) as nodes
  const singleWeights = weights.filter(w => !w.biasType.includes('+'));

  // Create bias nodes (left column)
  const biasNodes: CausalGraphNode[] = singleWeights
    .slice(0, 15) // Top 15 by danger
    .map((w, i) => ({
      id: w.biasType,
      label: w.biasType
        .split('_')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' '),
      type: 'bias' as const,
      x: 50,
      y: 40 + i * 30,
      size: Math.max(8, Math.min(20, w.sampleSize * 2)),
      color:
        w.dangerMultiplier >= 1.5
          ? '#ef4444'
          : w.dangerMultiplier >= 1.0
            ? '#f59e0b'
            : '#22c55e',
    }));

  // Outcome nodes (right column)
  const outcomeNodes: CausalGraphNode[] = [
    {
      id: 'failure',
      label: 'Failure',
      type: 'outcome' as const,
      x: 750,
      y: 120,
      size: 24,
      color: '#ef4444',
    },
    {
      id: 'success',
      label: 'Success',
      type: 'outcome' as const,
      x: 750,
      y: 280,
      size: 24,
      color: '#22c55e',
    },
  ];

  // Create edges from bias nodes to outcome nodes
  const edges: CausalGraphEdge[] = [];

  for (const w of singleWeights.slice(0, 15)) {
    const biasNode = biasNodes.find(n => n.id === w.biasType);
    if (!biasNode) continue;

    // Edge to failure (if any failures)
    if (w.failureCount > 0) {
      edges.push({
        from: w.biasType,
        to: 'failure',
        weight: w.dangerMultiplier,
        label: `×${w.dangerMultiplier.toFixed(1)}`,
        color:
          w.dangerMultiplier >= 1.5
            ? '#ef4444'
            : w.dangerMultiplier >= 1.0
              ? '#f59e0b'
              : '#71717a',
        thickness: Math.max(1, Math.min(4, w.failureCount)),
      });
    }

    // Edge to success (if any successes)
    if (w.successCount > 0) {
      edges.push({
        from: w.biasType,
        to: 'success',
        weight: w.successCount / w.sampleSize,
        label: `${w.successCount}/${w.sampleSize}`,
        color: '#22c55e',
        thickness: Math.max(1, Math.min(3, w.successCount)),
      });
    }
  }

  _cachedGraph = { nodes: [...biasNodes, ...outcomeNodes], edges };
  return _cachedGraph;
}
