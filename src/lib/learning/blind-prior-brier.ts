/**
 * Per-participant Brier scoring for Decision Room blind-priors (4.1 deep).
 *
 * When a DecisionOutcome is logged for an Analysis, every DecisionRoom
 * built around that Analysis already had a blind-prior survey fired.
 * Each `DecisionRoomBlindPrior` row stores the participant's
 * `confidencePercent` — their pre-decision subjective probability the
 * decision succeeds. Once the actual outcome lands, we can compute the
 * Brier score per participant: lower = better calibrated.
 *
 * The Brier math is shared with `brier-scoring.ts` so the proper-scoring
 * rule semantics (predicted probability vs. actual outcome on [0, 1])
 * are identical between DQI-level and participant-level calibration.
 *
 * Invocation: `recordParticipantBrier({ prisma, analysisId, outcome })`
 * is called once from the outcome-recalibration hook in
 * `/api/outcomes/track`. Idempotent — only stamps rows where
 * `brierCalculatedAt IS NULL`.
 */

import type { PrismaClient } from '@prisma/client';
import { canonicalOutcome, scoreOutcome, type OutcomeCode } from './brier-scoring';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('BlindPriorBrier');

export interface RecordParticipantBrierInput {
  prisma: PrismaClient;
  analysisId: string;
  /** Free-form outcome string — coerced via canonicalOutcome. */
  outcome: string;
}

export interface RecordParticipantBrierResult {
  status: 'ok' | 'no_rooms' | 'no_priors' | 'failed';
  /** Number of priors stamped with a Brier score in this run. */
  scoredCount: number;
  /** Rooms whose priors were processed. */
  roomIds: string[];
  /** Canonical outcome used for the calculation. */
  outcomeCode: OutcomeCode | null;
}

export async function recordParticipantBrier(
  input: RecordParticipantBrierInput
): Promise<RecordParticipantBrierResult> {
  const { prisma, analysisId, outcome } = input;
  const outcomeCode = canonicalOutcome(outcome);

  try {
    // Fetch every DecisionRoom that references this analysis, plus the
    // priors that haven't been Brier-scored yet. Rooms without a fired
    // reveal are intentionally included — the Brier is meaningful as
    // soon as the prior was submitted, regardless of whether the
    // aggregate was revealed.
    const rooms = await prisma.decisionRoom.findMany({
      where: { analysisId },
      select: {
        id: true,
        decisionRoomBlindPriors: {
          where: { brierCalculatedAt: null },
          select: { id: true, confidencePercent: true },
        },
      },
    });

    if (rooms.length === 0) {
      return { status: 'no_rooms', scoredCount: 0, roomIds: [], outcomeCode };
    }

    const roomIds = rooms.map(r => r.id);
    const priorRows = rooms.flatMap(r => r.decisionRoomBlindPriors);
    if (priorRows.length === 0) {
      return { status: 'no_priors', scoredCount: 0, roomIds, outcomeCode };
    }

    let scoredCount = 0;
    const stampedAt = new Date();
    for (const prior of priorRows) {
      const { score, category } = scoreOutcome(prior.confidencePercent, outcomeCode);
      try {
        await prisma.decisionRoomBlindPrior.update({
          where: { id: prior.id },
          data: {
            brierScore: score,
            brierCategory: category,
            brierCalculatedAt: stampedAt,
          },
        });
        scoredCount += 1;
      } catch (err) {
        log.warn(
          `Failed to stamp Brier for prior ${prior.id}:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    log.info(
      `Brier stamped for ${scoredCount}/${priorRows.length} priors across ${rooms.length} room(s) for analysis ${analysisId} (outcome: ${outcomeCode})`
    );

    return { status: 'ok', scoredCount, roomIds, outcomeCode };
  } catch (err) {
    log.error(
      `recordParticipantBrier failed for analysis ${analysisId}:`,
      err instanceof Error ? err.message : String(err)
    );
    return { status: 'failed', scoredCount: 0, roomIds: [], outcomeCode };
  }
}
