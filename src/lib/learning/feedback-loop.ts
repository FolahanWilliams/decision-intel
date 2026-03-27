/**
 * Behavioral Data Flywheel — Feedback Loop Module
 *
 * Closes the loop between outcome tracking and analysis calibration.
 * Uses existing proprietary data (DecisionOutcome, Nudge, BiasInstance)
 * to continuously improve bias severity weights, nudge thresholds,
 * and decision twin accuracy per organization.
 *
 * This is the core of the P0 moat: every decision processed makes the
 * platform more accurate for that specific org, creating switching costs.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLogger } from '@/lib/utils/logger';
import { DEFAULT_BIAS_SEVERITY_WEIGHTS, DEFAULT_COUNTERFACTUAL_WEIGHTS } from './constants';

// Re-export constants so existing imports keep working
export { DEFAULT_BIAS_SEVERITY_WEIGHTS, DEFAULT_COUNTERFACTUAL_WEIGHTS };

const log = createLogger('FeedbackLoop');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BiasSeverityCalibration {
  /** Per-bias-type weights learned from outcome data */
  weights: Record<string, number>;
  /** Per-bias-type confirmation rates (what % were real) */
  confirmationRates: Record<string, number>;
  /** Global default weight for uncalibrated bias types */
  defaultWeight: number;
}

export interface NudgeThresholdCalibration {
  /** Per-nudge-type thresholds and effectiveness rates */
  thresholds: Record<
    string,
    {
      /** Fraction of nudges users found helpful (0-1) */
      helpfulRate: number;
      /** Fraction acknowledged */
      acknowledgmentRate: number;
      /** Whether to suppress this nudge type (helpfulRate < 0.2 with n>10) */
      suppressed: boolean;
      sampleSize: number;
    }
  >;
}

export interface TwinWeightCalibration {
  /** Per-persona accuracy data */
  personas: Record<
    string,
    {
      /** How often this twin was the most accurate */
      accuracyRate: number;
      /** Average impact when this twin was most accurate */
      avgImpact: number;
      sampleSize: number;
    }
  >;
}

// ─── Calibration Profile Loaders ────────────────────────────────────────────

/**
 * Load calibration profile for a given org/user and profile type.
 * Falls back to null if no calibration exists.
 */
export async function loadCalibrationProfile<T>(
  profileType: 'bias_severity' | 'nudge_threshold' | 'twin_weight',
  orgId?: string | null,
  userId?: string | null
): Promise<T | null> {
  try {
    // Try org-level first, then user-level, then global
    const candidates = [
      orgId ? { orgId, userId: null, profileType } : null,
      userId ? { orgId: null, userId, profileType } : null,
      { orgId: null, userId: null, profileType },
    ].filter(Boolean);

    for (const where of candidates) {
      if (!where) continue;
      const profile = await prisma.calibrationProfile.findUnique({
        where: {
          orgId_userId_profileType: {
            orgId: where.orgId ?? '',
            userId: where.userId ?? '',
            profileType: where.profileType,
          },
        },
      });
      if (profile) {
        return profile.calibrationData as T;
      }
    }
  } catch (error) {
    // Schema drift — CalibrationProfile table may not exist yet
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('P2021') || msg.includes('P2022') || msg.includes('does not exist')) {
      log.debug('CalibrationProfile table not available (schema drift)');
    } else {
      log.warn('Failed to load calibration profile:', msg);
    }
  }
  return null;
}

/**
 * Load calibrated bias severity weights, falling back to defaults.
 * Used by riskScorerNode and score-calculator.
 */
export async function loadBiasSeverityWeights(
  orgId?: string | null,
  userId?: string | null
): Promise<Record<string, number>> {
  const calibration = await loadCalibrationProfile<BiasSeverityCalibration>(
    'bias_severity',
    orgId,
    userId
  );
  if (!calibration?.weights) return DEFAULT_BIAS_SEVERITY_WEIGHTS;

  // Merge calibrated weights with defaults (calibrated overrides defaults)
  return { ...DEFAULT_BIAS_SEVERITY_WEIGHTS, ...calibration.weights };
}

/**
 * Load calibrated counterfactual weights for score-calculator.
 */
export async function loadCounterfactualWeights(
  orgId?: string | null,
  userId?: string | null
): Promise<Record<string, number>> {
  const calibration = await loadCalibrationProfile<BiasSeverityCalibration>(
    'bias_severity',
    orgId,
    userId
  );
  if (!calibration?.confirmationRates) return DEFAULT_COUNTERFACTUAL_WEIGHTS;

  // Scale counterfactual weights by confirmation rate
  // If a bias type is often a false positive, its counterfactual impact is lower
  const calibrated = { ...DEFAULT_COUNTERFACTUAL_WEIGHTS };
  for (const [biasType, rate] of Object.entries(calibration.confirmationRates)) {
    const defaultWeight = DEFAULT_COUNTERFACTUAL_WEIGHTS[biasType] ?? 3;
    // Scale: 100% confirmation = full weight, 0% = 20% of weight (floor)
    calibrated[biasType] = Math.max(defaultWeight * 0.2, defaultWeight * rate);
  }
  return calibrated;
}

/**
 * Load nudge threshold calibration.
 */
export async function loadNudgeCalibration(
  orgId?: string | null,
  userId?: string | null
): Promise<NudgeThresholdCalibration | null> {
  return loadCalibrationProfile<NudgeThresholdCalibration>('nudge_threshold', orgId, userId);
}

// ─── Recalibration Functions ────────────────────────────────────────────────

/**
 * Recalibrate bias severity weights from outcome data.
 *
 * Logic:
 * - For each bias type, calculate confirmation rate from DecisionOutcome data
 * - High confirmation rate = bias detections are accurate → keep/increase weight
 * - Low confirmation rate = frequent false positives → reduce weight
 * - Requires minimum sample size (5) to adjust weights
 */
export async function recalibrateBiasSeverity(
  orgId?: string | null
): Promise<{ updated: boolean; sampleSize: number }> {
  const MIN_SAMPLE_SIZE = 5;

  try {
    // Fetch all outcomes with bias feedback (from both analysis and copilot workflows)
    const outcomes = await prisma.decisionOutcome.findMany({
      where: {
        ...(orgId ? { orgId } : {}),
        OR: [{ confirmedBiases: { isEmpty: false } }, { falsPositiveBiases: { isEmpty: false } }],
      },
      select: {
        confirmedBiases: true,
        falsPositiveBiases: true,
        outcome: true,
        impactScore: true,
      },
    });

    // Also load copilot outcomes to increase sample size for org-level metrics
    let copilotOutcomeCount = 0;
    try {
      const copilotOutcomes = await prisma.copilotOutcome.findMany({
        where: {
          ...(orgId ? { orgId } : {}),
          outcome: { in: ['success', 'partial_success', 'failure'] },
        },
        select: { outcome: true, impactScore: true },
      });
      copilotOutcomeCount = copilotOutcomes.length;
    } catch {
      // CopilotOutcome table may not exist yet (schema drift)
    }

    const totalSampleSize = outcomes.length + copilotOutcomeCount;

    if (outcomes.length < MIN_SAMPLE_SIZE) {
      log.info(
        `Insufficient outcome data for bias calibration: ${outcomes.length}/${MIN_SAMPLE_SIZE} (+ ${copilotOutcomeCount} copilot outcomes)`
      );
      return { updated: false, sampleSize: totalSampleSize };
    }

    // Aggregate per-bias-type confirmation rates
    const biasStats: Record<string, { confirmed: number; falsePositive: number }> = {};

    for (const outcome of outcomes) {
      for (const bias of outcome.confirmedBiases) {
        if (!biasStats[bias]) biasStats[bias] = { confirmed: 0, falsePositive: 0 };
        biasStats[bias].confirmed++;
      }
      for (const bias of outcome.falsPositiveBiases) {
        if (!biasStats[bias]) biasStats[bias] = { confirmed: 0, falsePositive: 0 };
        biasStats[bias].falsePositive++;
      }
    }

    // Calculate calibrated weights
    const confirmationRates: Record<string, number> = {};
    const calibratedWeights: Record<string, number> = {};

    for (const [biasType, stats] of Object.entries(biasStats)) {
      const total = stats.confirmed + stats.falsePositive;
      if (total < 3) continue; // Skip bias types with insufficient data

      const rate = stats.confirmed / total;
      confirmationRates[biasType] = Number(rate.toFixed(3));

      // Map bias type to a severity category for weight adjustment
      // High confirmation rate → increase weight, low → decrease
      // Scale factor: 0.5 (50% floor) to 1.5 (150% ceiling)
      const scaleFactor = 0.5 + rate; // 0.5 when rate=0, 1.5 when rate=1
      for (const [severity, defaultWeight] of Object.entries(DEFAULT_BIAS_SEVERITY_WEIGHTS)) {
        const key = `${biasType}:${severity}`;
        calibratedWeights[key] = Math.round(defaultWeight * scaleFactor);
      }
    }

    // Also calculate per-severity-level global adjustments
    const severityConfirmation: Record<string, { confirmed: number; total: number }> = {};

    // Query biases with user ratings to get severity-level stats
    const ratedBiases = await prisma.biasInstance.findMany({
      where: {
        userRating: { not: null },
        ...(orgId
          ? {
              analysis: {
                document: { orgId },
              },
            }
          : {}),
      },
      select: {
        severity: true,
        userRating: true,
      },
    });

    for (const bias of ratedBiases) {
      if (!severityConfirmation[bias.severity]) {
        severityConfirmation[bias.severity] = { confirmed: 0, total: 0 };
      }
      severityConfirmation[bias.severity].total++;
      if (bias.userRating && bias.userRating >= 4) {
        severityConfirmation[bias.severity].confirmed++;
      }
    }

    // Adjust global severity weights
    const adjustedSeverityWeights = { ...DEFAULT_BIAS_SEVERITY_WEIGHTS };
    for (const [severity, stats] of Object.entries(severityConfirmation)) {
      if (stats.total >= MIN_SAMPLE_SIZE) {
        const rate = stats.confirmed / stats.total;
        const scaleFactor = 0.5 + rate;
        const defaultWeight = DEFAULT_BIAS_SEVERITY_WEIGHTS[severity];
        if (defaultWeight) {
          adjustedSeverityWeights[severity] = Math.round(defaultWeight * scaleFactor);
        }
      }
    }

    const calibrationData: BiasSeverityCalibration = {
      weights: adjustedSeverityWeights,
      confirmationRates,
      defaultWeight: DEFAULT_BIAS_SEVERITY_WEIGHTS.medium,
    };

    // Upsert calibration profile
    await prisma.calibrationProfile.upsert({
      where: {
        orgId_userId_profileType: {
          orgId: orgId ?? '',
          userId: '',
          profileType: 'bias_severity',
        },
      },
      create: {
        orgId: orgId || null,
        userId: null,
        profileType: 'bias_severity',
        calibrationData: JSON.parse(JSON.stringify(calibrationData)) as Prisma.InputJsonValue,
        sampleSize: totalSampleSize,
        lastCalibratedAt: new Date(),
      },
      update: {
        calibrationData: JSON.parse(JSON.stringify(calibrationData)) as Prisma.InputJsonValue,
        sampleSize: totalSampleSize,
        lastCalibratedAt: new Date(),
      },
    });

    log.info(
      `Bias severity calibrated for ${orgId || 'global'}: ${Object.keys(confirmationRates).length} bias types, ${outcomes.length} analysis outcomes + ${copilotOutcomeCount} copilot outcomes`
    );
    return { updated: true, sampleSize: outcomes.length };
  } catch (error) {
    log.error('Bias severity recalibration failed:', error);
    return { updated: false, sampleSize: 0 };
  }
}

/**
 * Recalibrate nudge thresholds from nudge feedback data.
 *
 * Logic:
 * - For each nudge type, calculate helpfulness rate and acknowledgment rate
 * - If helpfulness rate < 20% with n>10, suppress that nudge type
 * - If helpfulness rate > 80% with n>10, lower trigger threshold
 */
export async function recalibrateNudgeThresholds(
  orgId?: string | null
): Promise<{ updated: boolean; sampleSize: number }> {
  const MIN_SAMPLE_SIZE = 5;

  try {
    const nudges = await prisma.nudge.findMany({
      where: {
        ...(orgId ? { orgId } : {}),
      },
      select: {
        nudgeType: true,
        wasHelpful: true,
        acknowledgedAt: true,
      },
    });

    if (nudges.length < MIN_SAMPLE_SIZE) {
      log.info(`Insufficient nudge data for calibration: ${nudges.length}/${MIN_SAMPLE_SIZE}`);
      return { updated: false, sampleSize: nudges.length };
    }

    // Aggregate per-nudge-type
    const nudgeStats: Record<
      string,
      { total: number; acknowledged: number; helpful: number; notHelpful: number }
    > = {};

    for (const nudge of nudges) {
      if (!nudgeStats[nudge.nudgeType]) {
        nudgeStats[nudge.nudgeType] = { total: 0, acknowledged: 0, helpful: 0, notHelpful: 0 };
      }
      nudgeStats[nudge.nudgeType].total++;
      if (nudge.acknowledgedAt) nudgeStats[nudge.nudgeType].acknowledged++;
      if (nudge.wasHelpful === true) nudgeStats[nudge.nudgeType].helpful++;
      if (nudge.wasHelpful === false) nudgeStats[nudge.nudgeType].notHelpful++;
    }

    // Build calibration data
    const thresholds: NudgeThresholdCalibration['thresholds'] = {};

    for (const [nudgeType, stats] of Object.entries(nudgeStats)) {
      const respondedCount = stats.helpful + stats.notHelpful;
      const helpfulRate = respondedCount > 0 ? stats.helpful / respondedCount : 0.5;
      const acknowledgmentRate = stats.total > 0 ? stats.acknowledged / stats.total : 0;

      thresholds[nudgeType] = {
        helpfulRate: Number(helpfulRate.toFixed(3)),
        acknowledgmentRate: Number(acknowledgmentRate.toFixed(3)),
        // Suppress if consistently unhelpful with enough data
        suppressed: helpfulRate < 0.2 && respondedCount >= 10,
        sampleSize: stats.total,
      };
    }

    const calibrationData: NudgeThresholdCalibration = { thresholds };

    await prisma.calibrationProfile.upsert({
      where: {
        orgId_userId_profileType: {
          orgId: orgId ?? '',
          userId: '',
          profileType: 'nudge_threshold',
        },
      },
      create: {
        orgId: orgId || null,
        userId: null,
        profileType: 'nudge_threshold',
        calibrationData: JSON.parse(JSON.stringify(calibrationData)) as Prisma.InputJsonValue,
        sampleSize: nudges.length,
        lastCalibratedAt: new Date(),
      },
      update: {
        calibrationData: JSON.parse(JSON.stringify(calibrationData)) as Prisma.InputJsonValue,
        sampleSize: nudges.length,
        lastCalibratedAt: new Date(),
      },
    });

    log.info(
      `Nudge thresholds calibrated for ${orgId || 'global'}: ${Object.keys(thresholds).length} nudge types, ${nudges.length} nudges`
    );
    return { updated: true, sampleSize: nudges.length };
  } catch (error) {
    log.error('Nudge threshold recalibration failed:', error);
    return { updated: false, sampleSize: 0 };
  }
}

/**
 * Recalibrate decision twin accuracy weights from outcome data.
 *
 * Logic:
 * - Track which twin persona was most accurate per outcome
 * - Calculate per-persona accuracy rates and average impact
 */
export async function recalibrateTwinWeights(
  orgId?: string | null
): Promise<{ updated: boolean; sampleSize: number }> {
  const MIN_SAMPLE_SIZE = 5;

  try {
    const outcomes = await prisma.decisionOutcome.findMany({
      where: {
        ...(orgId ? { orgId } : {}),
        mostAccurateTwin: { not: null },
      },
      select: {
        mostAccurateTwin: true,
        outcome: true,
        impactScore: true,
      },
    });

    // Also load copilot outcomes — helpfulAgents maps to "most accurate twin" equivalent
    let copilotTwinData: Array<{
      helpfulAgents: string[];
      outcome: string;
      impactScore: number | null;
    }> = [];
    try {
      copilotTwinData = await prisma.copilotOutcome.findMany({
        where: {
          ...(orgId ? { orgId } : {}),
          helpfulAgents: { isEmpty: false },
        },
        select: {
          helpfulAgents: true,
          outcome: true,
          impactScore: true,
        },
      });
    } catch {
      // CopilotOutcome table may not exist yet (schema drift)
    }

    const totalSampleSize = outcomes.length + copilotTwinData.length;

    if (totalSampleSize < MIN_SAMPLE_SIZE) {
      log.info(`Insufficient twin data for calibration: ${totalSampleSize}/${MIN_SAMPLE_SIZE}`);
      return { updated: false, sampleSize: totalSampleSize };
    }

    // Aggregate per-persona from DecisionOutcome
    const twinStats: Record<
      string,
      { total: number; successfulPredictions: number; totalImpact: number }
    > = {};

    for (const outcome of outcomes) {
      const twin = outcome.mostAccurateTwin!;
      if (!twinStats[twin]) {
        twinStats[twin] = { total: 0, successfulPredictions: 0, totalImpact: 0 };
      }
      twinStats[twin].total++;
      if (outcome.outcome === 'success' || outcome.outcome === 'partial_success') {
        twinStats[twin].successfulPredictions++;
      }
      if (outcome.impactScore) {
        twinStats[twin].totalImpact += outcome.impactScore;
      }
    }

    // Merge copilot outcomes — each helpful agent in a successful outcome gets credited
    for (const co of copilotTwinData) {
      const isSuccess = co.outcome === 'success' || co.outcome === 'partial_success';
      for (const agent of co.helpfulAgents) {
        if (!twinStats[agent]) {
          twinStats[agent] = { total: 0, successfulPredictions: 0, totalImpact: 0 };
        }
        twinStats[agent].total++;
        if (isSuccess) {
          twinStats[agent].successfulPredictions++;
        }
        if (co.impactScore) {
          twinStats[agent].totalImpact += co.impactScore;
        }
      }
    }

    const personas: TwinWeightCalibration['personas'] = {};
    for (const [name, stats] of Object.entries(twinStats)) {
      personas[name] = {
        accuracyRate: Number((stats.total / totalSampleSize).toFixed(3)),
        avgImpact: stats.total > 0 ? Number((stats.totalImpact / stats.total).toFixed(1)) : 0,
        sampleSize: stats.total,
      };
    }

    const calibrationData: TwinWeightCalibration = { personas };

    await prisma.calibrationProfile.upsert({
      where: {
        orgId_userId_profileType: {
          orgId: orgId ?? '',
          userId: '',
          profileType: 'twin_weight',
        },
      },
      create: {
        orgId: orgId || null,
        userId: null,
        profileType: 'twin_weight',
        calibrationData: JSON.parse(JSON.stringify(calibrationData)) as Prisma.InputJsonValue,
        sampleSize: totalSampleSize,
        lastCalibratedAt: new Date(),
      },
      update: {
        calibrationData: JSON.parse(JSON.stringify(calibrationData)) as Prisma.InputJsonValue,
        sampleSize: totalSampleSize,
        lastCalibratedAt: new Date(),
      },
    });

    log.info(
      `Twin weights calibrated for ${orgId || 'global'}: ${Object.keys(personas).length} personas, ${outcomes.length} analysis + ${copilotTwinData.length} copilot outcomes`
    );
    return { updated: true, sampleSize: outcomes.length };
  } catch (error) {
    log.error('Twin weight recalibration failed:', error);
    return { updated: false, sampleSize: 0 };
  }
}

/**
 * Run all recalibration tasks for a given org (or globally).
 * Designed to be called by cron or after batch outcome submissions.
 */
export async function runFullRecalibration(orgId?: string | null): Promise<{
  biasSeverity: { updated: boolean; sampleSize: number };
  nudgeThresholds: { updated: boolean; sampleSize: number };
  twinWeights: { updated: boolean; sampleSize: number };
}> {
  log.info(`Starting full recalibration for ${orgId || 'global'}...`);

  const [biasSeverity, nudgeThresholds, twinWeights] = await Promise.all([
    recalibrateBiasSeverity(orgId),
    recalibrateNudgeThresholds(orgId),
    recalibrateTwinWeights(orgId),
  ]);

  log.info(
    `Recalibration complete: biases=${biasSeverity.updated}(n=${biasSeverity.sampleSize}), ` +
      `nudges=${nudgeThresholds.updated}(n=${nudgeThresholds.sampleSize}), ` +
      `twins=${twinWeights.updated}(n=${twinWeights.sampleSize})`
  );

  return { biasSeverity, nudgeThresholds, twinWeights };
}
