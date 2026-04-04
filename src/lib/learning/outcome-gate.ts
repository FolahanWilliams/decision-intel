/**
 * Outcome Reminder Gate
 *
 * Surfaces progressive, non-blocking nudges asking users to report outcomes
 * on past analyses. The behavioral data flywheel produces more value as users
 * close the loop, but outcome reporting is encouraged — never mandatory — so
 * enterprise adoption is not gated behind workflow commitments.
 *
 * Gate levels (informational only — `allowed` is always true):
 *   - SOFT (3+ pending): gentle reminder in SSE stream and dashboard banner
 *   - HARD (5+ pending): stronger visual banner with escalated copy
 *
 * Each reported outcome still improves calibration accuracy and personalizes
 * bias detection, so the incentive structure remains intact without friction.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('OutcomeGate');

/** Thresholds for the outcome enforcement gate */
export const OUTCOME_GATE = {
  /** Number of pending outcomes before showing reminders */
  SOFT_THRESHOLD: 3,
  /** Number of pending outcomes before blocking new analyses */
  HARD_THRESHOLD: 5,
  /** Minimum age (days) of an analysis before it counts as "pending" */
  MIN_AGE_DAYS: 30,
} as const;

export interface OutcomeGateResult {
  /** Whether the user is allowed to proceed */
  allowed: boolean;
  /** Number of analyses awaiting outcome reports */
  pendingCount: number;
  /** Gate level: 'none' | 'soft' | 'hard' */
  level: 'none' | 'soft' | 'hard';
  /** Human-readable message for the UI */
  message: string | null;
  /** Analysis IDs that need outcomes (for linking in the UI) */
  pendingAnalysisIds: string[];
}

/**
 * Check outcome gate status for a given user.
 *
 * Returns gate level, pending count, and analysis IDs that need outcomes.
 * Non-throwing — returns a permissive result on any error (schema drift, etc).
 */
export async function checkOutcomeGate(userId: string): Promise<OutcomeGateResult> {
  const permissive: OutcomeGateResult = {
    allowed: true,
    pendingCount: 0,
    level: 'none',
    message: null,
    pendingAnalysisIds: [],
  };

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - OUTCOME_GATE.MIN_AGE_DAYS);

    const pendingAnalyses = await prisma.$queryRaw<Array<{ id: string; createdAt: Date }>>`
      SELECT a.id, a."createdAt"
      FROM "Analysis" a
      JOIN "Document" d ON d.id = a."documentId"
      LEFT JOIN "DecisionOutcome" do2 ON do2."analysisId" = a.id
      WHERE d."userId" = ${userId}
        AND a."createdAt" < ${cutoffDate}
        AND d.status = 'complete'
        AND do2.id IS NULL
      ORDER BY a."createdAt" ASC
      LIMIT 20
    `;

    const pendingCount = pendingAnalyses.length;
    const pendingAnalysisIds = pendingAnalyses.map((a: { id: string; createdAt: Date }) => a.id);

    if (pendingCount >= OUTCOME_GATE.HARD_THRESHOLD) {
      return {
        allowed: true,
        pendingCount,
        level: 'hard',
        message: `You have ${pendingCount} analyses awaiting outcome reports. Reporting outcomes improves your calibration accuracy and unlocks personalized bias detection. We recommend catching up soon.`,
        pendingAnalysisIds,
      };
    }

    if (pendingCount >= OUTCOME_GATE.SOFT_THRESHOLD) {
      return {
        allowed: true,
        pendingCount,
        level: 'soft',
        message: `You have ${pendingCount} analyses awaiting outcome reports. Reporting outcomes improves your calibration accuracy and unlocks personalized bias detection.`,
        pendingAnalysisIds,
      };
    }

    return { ...permissive, pendingCount, pendingAnalysisIds };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: string }).code;

    if (code === 'P2021' || code === 'P2022' || msg.includes('does not exist')) {
      log.debug('Outcome gate skipped: schema drift');
    } else {
      log.warn('Outcome gate check failed:', msg);
    }

    return permissive;
  }
}

/**
 * Get a compact outcome reminder for inclusion in API responses.
 * Returns null if no reminder is needed.
 */
export function formatOutcomeReminder(gate: OutcomeGateResult): {
  type: 'outcome_reminder';
  level: 'soft' | 'hard';
  pendingCount: number;
  message: string;
  analysisIds: string[];
} | null {
  if (gate.level === 'none' || !gate.message) return null;

  return {
    type: 'outcome_reminder',
    level: gate.level,
    pendingCount: gate.pendingCount,
    message: gate.message,
    analysisIds: gate.pendingAnalysisIds.slice(0, 5), // Limit to first 5 for compactness
  };
}
