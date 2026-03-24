/**
 * Decision Triage — Context-Aware Prioritization
 *
 * Ranks active decisions by risk-adjusted impact to surface the
 * "top 5 decisions needing attention now." Inspired by Wiz's
 * context-aware vulnerability prioritization that reduces alert fatigue.
 *
 * triageScore = overallScore_inverse × monetaryWeight × biasWeight × timeUrgency × toxicMultiplier
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { DEFAULT_BIAS_SEVERITY_WEIGHTS } from './constants';

const log = createLogger('DecisionTriage');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TriagedDecision {
  analysisId: string;
  documentId: string;
  filename: string;
  overallScore: number;
  triageScore: number;
  topRiskFactor: string;
  biasCount: number;
  toxicComboCount: number;
  monetaryValue: number | null;
  outcomeDueAt: Date | null;
  createdAt: Date;
}

export interface TriageResult {
  orgId: string;
  decisions: TriagedDecision[];
  totalPending: number;
}

// ─── Core Function ──────────────────────────────────────────────────────────

/**
 * Triage active decisions for an org, returning the top N by risk-adjusted impact.
 */
export async function triageDecisions(
  orgId: string,
  limit: number = 5
): Promise<TriageResult> {
  try {
    // Fetch pending analyses with related data
    const analyses = await prisma.analysis.findMany({
      where: {
        outcomeStatus: 'pending_outcome',
        document: { orgId },
      },
      include: {
        biases: { select: { biasType: true, severity: true } },
        document: {
          select: {
            id: true,
            filename: true,
            decisionFrame: {
              select: { monetaryValue: true },
            },
          },
        },
        toxicCombinations: {
          where: { status: 'active' },
          select: { toxicScore: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // process max 200 recent decisions
    });

    const scored: TriagedDecision[] = analyses.map(analysis => {
      // 1. Overall score inverse (lower score = higher risk)
      const scoreInverse = Math.max(1, 100 - analysis.overallScore) / 100;

      // 2. Monetary weight (log-scaled)
      const monetaryValue = analysis.document.decisionFrame?.monetaryValue
        ? Number(analysis.document.decisionFrame.monetaryValue)
        : null;
      const monetaryWeight = monetaryValue
        ? Math.min(3.0, 1.0 + Math.log10(Math.max(1, monetaryValue)) / 6)
        : 1.0;

      // 3. Bias weight (severity-weighted count)
      const biasWeight = analysis.biases.reduce((sum, b) => {
        return sum + (DEFAULT_BIAS_SEVERITY_WEIGHTS[b.severity] ?? 5);
      }, 0);
      const normalizedBiasWeight = Math.min(3.0, 1.0 + biasWeight / 100);

      // 4. Time urgency (exponential as deadline approaches)
      let timeUrgency = 1.0;
      if (analysis.outcomeDueAt) {
        const daysRemaining = Math.max(
          0,
          (analysis.outcomeDueAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );
        if (daysRemaining < 1) timeUrgency = 3.0; // overdue
        else if (daysRemaining < 7) timeUrgency = 2.0;
        else if (daysRemaining < 30) timeUrgency = 1.5;
      }

      // 5. Toxic combination multiplier
      const maxToxicScore = analysis.toxicCombinations.length > 0
        ? Math.max(...analysis.toxicCombinations.map(t => t.toxicScore))
        : 0;
      const toxicMultiplier = maxToxicScore > 0 ? 1.0 + maxToxicScore / 50 : 1.0;

      // Composite triage score
      const triageScore = Math.round(
        scoreInverse * monetaryWeight * normalizedBiasWeight * timeUrgency * toxicMultiplier * 100
      ) / 100;

      // Determine top risk factor
      const factors: Array<{ label: string; weight: number }> = [
        { label: 'Low decision quality', weight: scoreInverse },
        { label: 'High monetary stakes', weight: monetaryWeight },
        { label: 'Multiple severe biases', weight: normalizedBiasWeight },
        { label: 'Approaching deadline', weight: timeUrgency },
        { label: 'Toxic bias combination', weight: toxicMultiplier },
      ];
      factors.sort((a, b) => b.weight - a.weight);
      const topRiskFactor = factors[0].weight > 1.5 ? factors[0].label : 'Cumulative risk';

      return {
        analysisId: analysis.id,
        documentId: analysis.document.id,
        filename: analysis.document.filename,
        overallScore: analysis.overallScore,
        triageScore,
        topRiskFactor,
        biasCount: analysis.biases.length,
        toxicComboCount: analysis.toxicCombinations.length,
        monetaryValue,
        outcomeDueAt: analysis.outcomeDueAt,
        createdAt: analysis.createdAt,
      };
    });

    // Sort by triage score descending
    scored.sort((a, b) => b.triageScore - a.triageScore);

    return {
      orgId,
      decisions: scored.slice(0, limit),
      totalPending: analyses.length,
    };
  } catch (error) {
    log.error('Failed to triage decisions:', error);
    return { orgId, decisions: [], totalPending: 0 };
  }
}
