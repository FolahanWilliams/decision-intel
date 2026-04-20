/**
 * Outcome-driven DQI recalibration — the shared engine behind both
 * `/api/outcomes` (legacy, external-integration callable) and
 * `/api/outcomes/track` (canonical, OutcomeReporter path). Previously
 * both routes carried near-identical copy-pasted math, and the Brier
 * additions diverged them; consolidating here so the scoring rule
 * can't drift between entry points.
 *
 * Writes `Analysis.recalibratedDqi` (JSON blob consumed by ReplayTab).
 * Optionally stamps `brierScore` + `brierCategory` on a
 * DecisionOutcome row so per-org aggregation queries can hit the
 * indexed column instead of parsing JSON.
 */

import type { PrismaClient } from '@prisma/client';
import { canonicalOutcome, scoreOutcome, type BrierCategory } from './brier-scoring';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('Recalibration');

export interface RecalibrationInput {
  prisma: PrismaClient;
  analysisId: string;
  outcome: string;
  confirmedBiases: string[];
  falsPositiveBiases: string[];
  /** If provided, the Brier score will also be stamped on this
   *  DecisionOutcome row (enables per-org aggregation via indexed
   *  column). Leave unset for the legacy POST /api/outcomes path which
   *  stamps nothing on the outcome row. */
  decisionOutcomeId?: string;
}

export interface RecalibrationResult {
  status: 'ok' | 'failed' | 'skipped';
  payload: {
    originalScore: number;
    recalibratedScore: number;
    delta: number;
    grade: string;
  } | null;
  brier: { score: number; category: BrierCategory } | null;
}

/** Grade boundaries locked by CLAUDE.md: A 85+, B 70+, C 55+, D 40+, F 0+. */
function gradeFor(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export async function recalibrateFromOutcome(
  input: RecalibrationInput
): Promise<RecalibrationResult> {
  const { prisma, analysisId, outcome, confirmedBiases, falsPositiveBiases, decisionOutcomeId } =
    input;

  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: { overallScore: true, biases: { select: { id: true } } },
    });
    if (!analysis) {
      return { status: 'skipped', payload: null, brier: null };
    }

    const originalScore = analysis.overallScore;
    const confirmedCount = confirmedBiases.length;
    const falsePositiveCount = falsPositiveBiases.length;
    const totalBiases = analysis.biases?.length || 0;

    let recalibratedScore = originalScore;
    if (totalBiases > 0 && falsePositiveCount > 0) {
      const falsePositiveRatio = falsePositiveCount / totalBiases;
      recalibratedScore += falsePositiveRatio * 12;
    }
    if (confirmedCount > 0) {
      recalibratedScore -= confirmedCount * 1.5;
    }
    recalibratedScore += 3; // outcome tracking boosts process maturity
    if (outcome === 'failure') recalibratedScore -= 5;
    else if (outcome === 'success') recalibratedScore += 4;

    recalibratedScore = Math.max(0, Math.min(100, Math.round(recalibratedScore)));
    const delta = recalibratedScore - Math.round(originalScore);
    const grade = gradeFor(recalibratedScore);

    const brier = scoreOutcome(originalScore, canonicalOutcome(outcome));

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        recalibratedDqi: {
          originalScore: Math.round(originalScore),
          recalibratedScore,
          recalibratedGrade: grade,
          delta,
          recalibratedAt: new Date().toISOString(),
          brierScore: brier.score,
          brierCategory: brier.category,
        },
      },
    });

    if (decisionOutcomeId) {
      await prisma.decisionOutcome.update({
        where: { id: decisionOutcomeId },
        data: {
          brierScore: brier.score,
          brierCategory: brier.category,
        },
      });
    }

    log.info(
      `Recalibrated DQI for ${analysisId}: ${Math.round(originalScore)} → ${recalibratedScore} (${delta > 0 ? '+' : ''}${delta}) · Brier ${brier.score} (${brier.category})`
    );

    return {
      status: 'ok',
      payload: {
        originalScore: Math.round(originalScore),
        recalibratedScore,
        delta,
        grade,
      },
      brier,
    };
  } catch (err) {
    log.error(
      `DQI recalibration failed for ${analysisId}:`,
      err instanceof Error ? err.message : String(err)
    );
    return { status: 'failed', payload: null, brier: null };
  }
}
