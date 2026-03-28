/**
 * Consensus Scoring
 *
 * Computes consensus strength from BlindPrior submissions in Decision Rooms.
 * Higher score = more agreement among committee members.
 */

import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ConsensusScoring');

// ─── Types ──────────────────────────────────────────────────────────────────

interface BlindPriorInput {
  userId: string;
  defaultAction: string;
  confidence: number;
}

export interface ConsensusResult {
  /** 0-100 score; higher = stronger consensus */
  score: number;
  /** Qualitative label */
  convergenceLevel: 'strong' | 'moderate' | 'weak' | 'divided';
  /** User IDs whose priors diverged significantly from the mean */
  dissenterIds: string[];
  /** Average confidence across all priors */
  avgConfidence: number;
  /** Number of distinct action groups */
  actionGroupCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function normalizeAction(action: string): string {
  return action.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

// ─── Core ───────────────────────────────────────────────────────────────────

/**
 * Compute consensus score from a set of blind priors.
 *
 * Formula:
 *   baseScore = 100 - (confidenceStdDev * confidenceWeight) - (actionDivergencePenalty)
 *
 * Where:
 *   - confidenceStdDev penalizes disagreement in confidence levels
 *   - actionDivergencePenalty penalizes split decisions (approve vs reject)
 *
 * Dissenters are users whose confidence diverges > 1.5 stddev from mean.
 */
export function computeConsensusScore(priors: BlindPriorInput[]): ConsensusResult {
  if (priors.length === 0) {
    return {
      score: 0,
      convergenceLevel: 'divided',
      dissenterIds: [],
      avgConfidence: 0,
      actionGroupCount: 0,
    };
  }

  if (priors.length === 1) {
    return {
      score: 100,
      convergenceLevel: 'strong',
      dissenterIds: [],
      avgConfidence: priors[0].confidence,
      actionGroupCount: 1,
    };
  }

  // Confidence analysis
  const confidences = priors.map(p => p.confidence);
  const avgConfidence = confidences.reduce((s, v) => s + v, 0) / confidences.length;
  const confStdDev = stddev(confidences);

  // Action divergence: how many distinct action groups?
  const actionGroups = new Map<string, string[]>();
  for (const p of priors) {
    const normalized = normalizeAction(p.defaultAction);
    // Simple grouping: first word as key (approve, reject, defer, etc.)
    const key = normalized.split(/\s+/)[0] || normalized;
    if (!actionGroups.has(key)) actionGroups.set(key, []);
    actionGroups.get(key)!.push(p.userId);
  }

  const actionGroupCount = actionGroups.size;
  const largestGroup = Math.max(...Array.from(actionGroups.values()).map(g => g.length));
  const unanimityRatio = largestGroup / priors.length;

  // Scoring
  // Confidence divergence penalty: stddev of 25+ is a big disagreement
  const confPenalty = Math.min(40, (confStdDev / 25) * 40);
  // Action divergence penalty: more groups = less consensus
  const actionPenalty = actionGroupCount <= 1 ? 0 : Math.min(40, (1 - unanimityRatio) * 60);

  const rawScore = Math.max(0, Math.min(100, 100 - confPenalty - actionPenalty));
  const score = Math.round(rawScore);

  // Identify dissenters: confidence > 1.5 stddev from mean
  const dissenterThreshold = confStdDev * 1.5;
  const dissenterIds = priors
    .filter(p => Math.abs(p.confidence - avgConfidence) > dissenterThreshold)
    .map(p => p.userId);

  // Also add users in minority action groups as dissenters
  if (actionGroupCount > 1) {
    const majorityKey = Array.from(actionGroups.entries()).sort(
      (a, b) => b[1].length - a[1].length
    )[0][0];
    for (const [key, userIds] of actionGroups) {
      if (key !== majorityKey) {
        for (const uid of userIds) {
          if (!dissenterIds.includes(uid)) dissenterIds.push(uid);
        }
      }
    }
  }

  // Convergence level
  let convergenceLevel: ConsensusResult['convergenceLevel'];
  if (score >= 80) convergenceLevel = 'strong';
  else if (score >= 55) convergenceLevel = 'moderate';
  else if (score >= 30) convergenceLevel = 'weak';
  else convergenceLevel = 'divided';

  log.debug(
    `Consensus: score=${score}, level=${convergenceLevel}, groups=${actionGroupCount}, dissenters=${dissenterIds.length}`
  );

  return {
    score,
    convergenceLevel,
    dissenterIds,
    avgConfidence: Number(avgConfidence.toFixed(1)),
    actionGroupCount,
  };
}
