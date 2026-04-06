/**
 * Static Causal Weights from Case Studies
 *
 * Computes causal weights (bias → outcome correlations) and a graph
 * structure from the static case study database. This is the synchronous
 * equivalent of computeOrgCausalWeights() — no DB queries needed.
 */

import { ALL_CASES, isFailureOutcome, isSuccessOutcome } from '@/lib/data/case-studies';

// ─── Types (inlined to avoid importing from causal-learning.ts which pulls in Prisma) ──

export interface CausalWeight {
  biasType: string;
  outcomeCorrelation: number;
  failureCount: number;
  successCount: number;
  dangerMultiplier: number;
  sampleSize: number;
}

export interface CausalInsight {
  type: 'danger' | 'safe' | 'noise' | 'twin';
  message: string;
  confidence: number;
  biasType?: string;
  dataPoints: number;
}

function formatBiasName(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getCausalInsights(weights: CausalWeight[], totalOutcomes: number): CausalInsight[] {
  if (weights.length === 0 || totalOutcomes === 0) {
    return [
      {
        type: 'noise',
        message: 'Not enough data to generate causal insights.',
        confidence: 0,
        dataPoints: 0,
      },
    ];
  }
  const insights: CausalInsight[] = [];
  const dangerous = weights.filter(w => w.dangerMultiplier >= 1.5 && w.sampleSize >= 5);
  for (const w of dangerous.slice(0, 3)) {
    insights.push({
      type: 'danger',
      message: `${formatBiasName(w.biasType)} is associated with poor outcomes ${w.dangerMultiplier}x more than baseline (${w.failureCount} failures in ${w.sampleSize} decisions).`,
      confidence: Math.min(0.95, w.sampleSize / 20),
      biasType: w.biasType,
      dataPoints: w.sampleSize,
    });
  }
  const safe = weights.filter(w => w.dangerMultiplier <= 0.9 && w.sampleSize >= 5);
  for (const w of safe.slice(0, 2)) {
    insights.push({
      type: 'safe',
      message: `${formatBiasName(w.biasType)} detections are mostly benign — only ${w.failureCount} failures out of ${w.sampleSize} decisions.`,
      confidence: Math.min(0.9, w.sampleSize / 15),
      biasType: w.biasType,
      dataPoints: w.sampleSize,
    });
  }
  const noisy = weights.filter(w => w.sampleSize < 5);
  for (const w of noisy) {
    insights.push({
      type: 'noise',
      message: `${formatBiasName(w.biasType)} has insufficient outcome data (${w.sampleSize} records).`,
      confidence: w.sampleSize / 10,
      biasType: w.biasType,
      dataPoints: w.sampleSize,
    });
  }
  if (totalOutcomes >= 50 && dangerous.length > 0) {
    insights.push({
      type: 'twin',
      message: `Based on ${totalOutcomes} outcomes, ${formatBiasName(dangerous[0].biasType)} is the strongest failure predictor.`,
      confidence: Math.min(0.9, totalOutcomes / 200),
      dataPoints: totalOutcomes,
    });
  }
  return insights;
}

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
  const biasStats = new Map<string, { failures: number; successes: number; partials: number }>();

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

      if (interactionStrength > 1.2) {
        // Slightly lower threshold for static data
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
        w.dangerMultiplier >= 1.5 ? '#ef4444' : w.dangerMultiplier >= 1.0 ? '#f59e0b' : '#22c55e',
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
          w.dangerMultiplier >= 1.5 ? '#ef4444' : w.dangerMultiplier >= 1.0 ? '#f59e0b' : '#71717a',
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
