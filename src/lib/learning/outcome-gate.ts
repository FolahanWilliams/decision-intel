/**
 * Outcome Reminder Gate (HARDENED 2026-04-26 with optional enforcement).
 *
 * Surfaces progressive nudges asking users to report outcomes on past
 * analyses. The behavioral data flywheel produces more value as users close
 * the loop. Two modes:
 *
 *   - DEFAULT (enforce=false): non-blocking. `allowed` is always true.
 *     SOFT (3+ pending): gentle reminder in SSE stream and dashboard banner.
 *     HARD (5+ pending): stronger visual banner with escalated copy.
 *     Outcome reporting is encouraged but never mandatory.
 *
 *   - ENFORCED (enforce=true, set per-org via Organization.enforceOutcomeGate):
 *     SOFT and HARD reminders both still fire. Additionally, at HARD
 *     threshold, `allowed` returns FALSE — caller (the analyze stream
 *     route) returns HTTP 409 with code 'OUTCOME_GATE_BLOCKED' and the
 *     pending analysis IDs. The user must log outcomes on the past
 *     analyses before they can run a new audit.
 *
 * The enforced mode is the structural fix for the "outcome-gate avoidance"
 * failure mode identified by NotebookLM strategic synthesis Q6 pre-mortem
 * (locked 2026-04-26). Pre-existing soft mode preserved for free /
 * individual / non-design-partner accounts. Enforced mode is opt-in per org
 * — typically turned ON for design-partner orgs as a contractual term of
 * the partnership so the data flywheel actually rotates.
 *
 * See `es_11` Founder School lesson: "Outcome Gate Enforcement as a
 * Design-Partner Contractual Term."
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
 *
 * @param userId  Authenticated Supabase user ID.
 * @param enforce When true (typically passed because the user's org has
 *                Organization.enforceOutcomeGate = true), the HARD threshold
 *                returns `allowed: false` so the caller can hard-block.
 *                When false (default), preserves the legacy soft-nudge
 *                behaviour where `allowed` is always true.
 */
export async function checkOutcomeGate(
  userId: string,
  enforce: boolean = false
): Promise<OutcomeGateResult> {
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
      // Enforced HARD: block. Legacy soft HARD: still allow with reminder.
      const blocked = enforce;
      return {
        allowed: !blocked,
        pendingCount,
        level: 'hard',
        message: blocked
          ? `Outcome Gate blocked: log outcomes on ${pendingCount} pending analyses (older than ${OUTCOME_GATE.MIN_AGE_DAYS} days) before running a new audit. The flywheel only compounds when the loop closes.`
          : `You have ${pendingCount} analyses awaiting outcome reports. Reporting outcomes improves your calibration accuracy and unlocks personalized bias detection. We recommend catching up soon.`,
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
