/**
 * Decision Conviction Score
 *
 * Measures how well-supported a thesis is INDEPENDENT of bias presence.
 * A document can score low on DQI (biased) but high on conviction
 * (well-evidenced, logically coherent, diverse perspectives considered).
 *
 * This gives decision-makers the full picture:
 * "This memo has strong conviction but also has anchoring bias — proceed
 *  with eyes open, not blindly."
 *
 * Inspired by Strebulaev's Principle 1 ("Home Runs Matter, Strikeouts Don't"):
 * The goal isn't to kill bold bets but to make them eyes-wide-open.
 *
 * Components:
 *   Evidence Strength (35%) — fact-check verification rate + score
 *   Argument Coherence (30%) — logical analysis score
 *   Judge Agreement (20%)   — inverse of noise (high agreement = high conviction)
 *   Perspective Diversity (15%) — cognitive blind spot gap
 */

import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ConvictionScore');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConvictionResult {
  /** 0-100 composite conviction score */
  score: number;
  /** Letter grade A-F */
  grade: string;
  /** Individual component scores */
  components: {
    evidenceStrength: number;
    argumentCoherence: number;
    judgeAgreement: number;
    perspectiveDiversity: number;
  };
  /** Human-readable interpretation */
  interpretation: string;
}

export interface ConvictionInput {
  /** Fact-check score (0-100) */
  factCheckScore?: number | null;
  /** Ratio of verified claims (0-1) */
  verificationRate?: number | null;
  /** Logical analysis score (0-100) */
  logicalScore?: number | null;
  /** Noise standard deviation across judges */
  noiseStdDev?: number | null;
  /** Cognitive blind spot gap score (0-100) */
  blindSpotGap?: number | null;
}

// ─── Weights ────────────────────────────────────────────────────────────────

const WEIGHTS = {
  evidenceStrength: 0.35,
  argumentCoherence: 0.3,
  judgeAgreement: 0.2,
  perspectiveDiversity: 0.15,
};

// ─── Grade Thresholds ───────────────────────────────────────────────────────

function getGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// ─── Interpretation ─────────────────────────────────────────────────────────

function getInterpretation(score: number, components: ConvictionResult['components']): string {
  if (score >= 80) {
    return 'Strong conviction — well-evidenced thesis with logical coherence and diverse perspectives. Proceed with confidence.';
  }
  if (score >= 60) {
    const weakest = Object.entries(components).sort(([, a], [, b]) => a - b)[0][0];
    const weakestLabel =
      weakest === 'evidenceStrength'
        ? 'evidence'
        : weakest === 'argumentCoherence'
          ? 'argument logic'
          : weakest === 'judgeAgreement'
            ? 'judge consensus'
            : 'perspective diversity';
    return `Moderate conviction — thesis is supported but ${weakestLabel} could be strengthened. Consider gathering more ${weakestLabel === 'evidence' ? 'data points' : weakestLabel === 'argument logic' ? 'structured reasoning' : 'independent perspectives'}.`;
  }
  if (score >= 40) {
    return 'Weak conviction — thesis lacks sufficient evidence or coherence. Significant gaps in the reasoning should be addressed before committing capital.';
  }
  return 'Very low conviction — thesis is poorly supported. Major gaps across evidence, logic, and perspective. Recommend substantially more diligence before proceeding.';
}

// ─── Core ───────────────────────────────────────────────────────────────────

/**
 * Compute conviction score from analysis data.
 * All inputs are optional — missing data gets a neutral default of 50.
 */
export function computeConviction(input: ConvictionInput): ConvictionResult {
  // Evidence strength: blend of fact-check score and verification rate
  const fcScore = input.factCheckScore ?? 50;
  const vRate = input.verificationRate ?? 0.5;
  const evidenceStrength = Math.min(100, Math.max(0, fcScore * 0.5 + vRate * 50));

  // Argument coherence: direct from logical analysis
  const argumentCoherence = Math.min(100, Math.max(0, input.logicalScore ?? 50));

  // Judge agreement: inverse of noise — low stdDev = high agreement
  const stdDev = input.noiseStdDev ?? 10;
  const judgeAgreement = Math.min(100, Math.max(0, 100 - stdDev * 5));

  // Perspective diversity: blind spot gap (higher = more perspectives considered)
  const perspectiveDiversity = Math.min(100, Math.max(0, input.blindSpotGap ?? 50));

  const components = {
    evidenceStrength: Math.round(evidenceStrength),
    argumentCoherence: Math.round(argumentCoherence),
    judgeAgreement: Math.round(judgeAgreement),
    perspectiveDiversity: Math.round(perspectiveDiversity),
  };

  const rawScore =
    evidenceStrength * WEIGHTS.evidenceStrength +
    argumentCoherence * WEIGHTS.argumentCoherence +
    judgeAgreement * WEIGHTS.judgeAgreement +
    perspectiveDiversity * WEIGHTS.perspectiveDiversity;

  const score = Math.round(Math.min(100, Math.max(0, rawScore)));
  const grade = getGrade(score);
  const interpretation = getInterpretation(score, components);

  log.debug(
    `Conviction: score=${score} (${grade}), evidence=${components.evidenceStrength}, logic=${components.argumentCoherence}, agreement=${components.judgeAgreement}, diversity=${components.perspectiveDiversity}`
  );

  return { score, grade, components, interpretation };
}
