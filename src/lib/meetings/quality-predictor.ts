/**
 * Meeting Decision Quality Predictor — Meeting Intelligence Data Moat
 *
 * Predicts decision quality from meeting dynamics BEFORE outcomes are known.
 * Uses signals from speaker behavior, bias density, dissent patterns, and
 * decision explicitness to generate a quality score with confidence interval
 * and actionable recommendations.
 */

import { createLogger } from '@/lib/utils/logger';

const log = createLogger('QualityPredictor');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QualitySignal {
  signal: string;
  /** Raw value for the signal (0-1 or other context-dependent scale) */
  value: number;
  /** Impact on predicted score: positive = boosts quality, negative = lowers quality */
  impact: number;
  description: string;
}

export interface QualityPrediction {
  /** Predicted decision quality score (0-100) */
  predictedScore: number;
  /** Confidence in the prediction (0-1) */
  confidence: number;
  /** Individual signals that contributed to the prediction */
  signals: QualitySignal[];
  /** Actionable recommendations to improve decision quality */
  recommendations: string[];
}

// ─── Input types matching the test API ───────────────────────────────────────

interface SpeakerProfile {
  name: string;
  talkTimeSeconds: number;
  interruptionCount: number;
  biasScores: Record<string, number>;
  statements?: string[];
  [key: string]: unknown;
}

interface Decision {
  decision: string;
  timestamp?: string;
  speaker?: string;
  explicitDecision: boolean;
  rationale?: string;
  dissentLevel: number;
  biasesPresent?: string[];
  [key: string]: unknown;
}

interface MeetingContext {
  objective?: string;
  keyPoints?: string[];
  decisions?: string[];
  risks?: string[];
  nextSteps?: string[];
  [key: string]: unknown;
}

// ─── Signal calculators ──────────────────────────────────────────────────────

/**
 * Dissent ratio: proportion of decisions that include voiced dissent.
 * Value 0-1; healthy range is 0.3-0.7.
 */
export function calculateDissentRatio(decisions: Decision[]): QualitySignal {
  if (decisions.length === 0) {
    return {
      signal: 'dissentRatio',
      value: 0,
      impact: 0,
      description: 'No decisions recorded',
    };
  }

  const withDissent = decisions.filter(d => d.dissentLevel > 0).length;
  const value = withDissent / decisions.length;

  let impact: number;
  if (value === 0) {
    impact = -6;
  } else if (value > 0.7) {
    impact = 1.5;
  } else {
    // 0 < value <= 0.7: healthy range
    impact = 4.5;
  }

  const description =
    value === 0
      ? 'No dissent recorded — groupthink risk'
      : `${Math.round(value * 100)}% of decisions had voiced dissent`;

  return {
    signal: 'dissentRatio',
    value: Math.round(value * 1000) / 1000,
    impact,
    description,
  };
}

/**
 * Speaker balance: how evenly talk time is distributed.
 * Value 0-1; higher is more balanced.
 */
export function calculateSpeakerBalance(speakers: SpeakerProfile[]): QualitySignal {
  if (speakers.length === 0) {
    return {
      signal: 'speakerBalance',
      value: 0,
      impact: 0,
      description: 'No speaker data',
    };
  }

  if (speakers.length === 1) {
    return {
      signal: 'speakerBalance',
      value: 0,
      impact: -7.5,
      description: 'Single speaker — balance not applicable',
    };
  }

  const totalTime = speakers.reduce((sum, s) => sum + s.talkTimeSeconds, 0);
  if (totalTime === 0) {
    return {
      signal: 'speakerBalance',
      value: 0,
      impact: 0,
      description: 'No talk time recorded',
    };
  }

  const shares = speakers.map(s => s.talkTimeSeconds / totalTime);
  const idealShare = 1 / speakers.length;
  const deviations = shares.map(s => Math.abs(s - idealShare));
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;

  const value = Math.max(0, 1 - avgDeviation * speakers.length);
  const impact = Math.round((value - 0.5) * 15 * 0.4 * 10) / 10;

  const maxShare = Math.max(...shares);
  const maxIdx = shares.indexOf(maxShare);
  const description =
    value > 0.8
      ? `Well-balanced discussion (balance ${Math.round(value * 100)}%)`
      : `Imbalanced — ${speakers[maxIdx].name} holds ${Math.round(maxShare * 100)}% of talk time`;

  return {
    signal: 'speakerBalance',
    value: Math.round(value * 1000) / 1000,
    impact,
    description,
  };
}

/**
 * Bias density: talk-time-weighted average bias score across all speakers.
 * Lower is better. Scale: 0-10.
 */
export function calculateBiasDensity(speakers: SpeakerProfile[]): QualitySignal {
  if (speakers.length === 0) {
    return {
      signal: 'biasDensity',
      value: 0,
      impact: 0,
      description: 'No speaker data',
    };
  }

  const totalTime = speakers.reduce((sum, s) => sum + s.talkTimeSeconds, 0);

  let weightedBiasSum = 0;
  for (const speaker of speakers) {
    const biasValues = Object.values(speaker.biasScores);
    const avgBias =
      biasValues.length > 0 ? biasValues.reduce((a, b) => a + b, 0) / biasValues.length : 0;
    const weight = totalTime > 0 ? speaker.talkTimeSeconds / totalTime : 1 / speakers.length;
    weightedBiasSum += avgBias * weight;
  }

  const value = Math.round(weightedBiasSum * 1000) / 1000;

  // Impact: bias above neutral (5) is negative, below is positive
  const impact = Math.round((5 - value) * 2 * 10) / 10;

  const description =
    value < 3
      ? `Low average bias density (${value.toFixed(1)}/10)`
      : value < 6
        ? `Moderate bias density (${value.toFixed(1)}/10)`
        : `High bias density (${value.toFixed(1)}/10) — decision quality risk`;

  return {
    signal: 'biasDensity',
    value,
    impact,
    description,
  };
}

/**
 * Decision explicitness: fraction of decisions that are explicit and have rationale.
 * Value 0-1; higher is better.
 */
export function calculateDecisionExplicitness(decisions: Decision[]): QualitySignal {
  if (decisions.length === 0) {
    return {
      signal: 'decisionExplicitness',
      value: 0,
      impact: 0,
      description: 'No decisions recorded',
    };
  }

  let totalScore = 0;
  for (const d of decisions) {
    let score = 0;
    if (d.explicitDecision) score += 0.5;
    if (d.rationale && d.rationale.length > 0) score += 0.5;
    totalScore += score;
  }

  const value = Math.round((totalScore / decisions.length) * 1000) / 1000;
  const impact = Math.round((value - 0.5) * 20 * 0.4 * 10) / 10;

  const description = `${decisions.length} decision${decisions.length > 1 ? 's' : ''} recorded, avg explicitness ${Math.round(value * 100)}%`;

  return {
    signal: 'decisionExplicitness',
    value,
    impact,
    description,
  };
}

/**
 * Risk discussion: whether risks were acknowledged.
 * Only meaningful when there are decisions to discuss. Binary: 1 if risks discussed, 0 otherwise.
 */
export function calculateRiskDiscussion(
  summary: MeetingContext,
  decisions: Decision[]
): QualitySignal {
  // If no decisions, risk discussion is not applicable
  if (decisions.length === 0) {
    return {
      signal: 'riskDiscussion',
      value: 0,
      impact: 0,
      description: 'No decisions to assess risk for',
    };
  }

  const risks = summary.risks ?? [];
  const hasRisks = risks.length > 0;
  const value = hasRisks ? 1 : 0;
  const impact = hasRisks ? 4.5 : -3;

  return {
    signal: 'riskDiscussion',
    value,
    impact,
    description: hasRisks
      ? `${risks.length} risk${risks.length > 1 ? 's' : ''} acknowledged`
      : 'No risks discussed — decisions may not account for downside scenarios',
  };
}

/**
 * Engagement quality: based on interruption rate and talk-time coverage.
 * Value 0-1; higher is better.
 */
export function calculateEngagementQuality(
  speakers: SpeakerProfile[],
  totalDuration: number
): QualitySignal {
  if (speakers.length === 0 || totalDuration === 0) {
    return {
      signal: 'engagementQuality',
      value: 0,
      impact: 0,
      description: 'No engagement data',
    };
  }

  const totalInterruptions = speakers.reduce((sum, s) => sum + (s.interruptionCount || 0), 0);
  const totalTalkTime = speakers.reduce((sum, s) => sum + s.talkTimeSeconds, 0);

  // Interruption penalty: based on total interruptions relative to acceptable threshold per speaker
  const acceptablePerSpeaker = 5;
  const penalty = Math.min(1, totalInterruptions / (speakers.length * acceptablePerSpeaker));

  const coverage = Math.min(1, totalTalkTime / totalDuration);
  const value = Math.max(0, coverage * (1 - penalty * 0.5));

  const impact = Math.round((value - 0.5) * 20 * 0.3 * 10) / 10;
  const interruptionsPerMinute = totalInterruptions / (totalDuration / 60);

  return {
    signal: 'engagementQuality',
    value: Math.round(value * 1000) / 1000,
    impact,
    description: `Coverage ${Math.round(coverage * 100)}%, ${totalInterruptions} interruption${totalInterruptions !== 1 ? 's' : ''} (${interruptionsPerMinute.toFixed(1)}/min)`,
  };
}

// ─── Recommendation engine ──────────────────────────────────────────────────

export function generateRecommendations(signals: QualitySignal[]): string[] {
  const recommendations: string[] = [];

  for (const signal of signals) {
    switch (signal.signal) {
      case 'dissentRatio':
        if (signal.value < 0.3 && signal.impact < 0) {
          recommendations.push(
            "Encourage constructive dissent and devil's advocacy in decision-making"
          );
        }
        break;

      case 'speakerBalance':
        if (signal.value < 0.6) {
          recommendations.push('Ensure balanced participation from all attendees');
        }
        break;

      case 'biasDensity':
        if (signal.value > 6) {
          recommendations.push('Implement bias checks and structured decision frameworks');
        }
        break;

      case 'decisionExplicitness':
        if (signal.value < 0.5) {
          recommendations.push(
            'Document decisions explicitly with clear rationale and dissenting views'
          );
        }
        break;

      case 'riskDiscussion':
        if (signal.value === 0 && signal.impact < 0) {
          recommendations.push(
            'Add a risk review step — identify at least one downside per major decision'
          );
        }
        break;

      case 'engagementQuality':
        if (signal.value < 0.5) {
          recommendations.push(
            'Reduce interruptions and improve meeting structure to boost engagement'
          );
        }
        break;
    }

    if (recommendations.length >= 4) break;
  }

  return recommendations;
}

// ─── Main prediction function ────────────────────────────────────────────────

/**
 * Predict decision quality from meeting dynamics before outcomes are known.
 */
export function predictMeetingQuality(
  speakers: SpeakerProfile[],
  decisions: Decision[],
  summary: MeetingContext,
  totalDuration: number
): QualityPrediction {
  log.info(
    `Predicting meeting quality: ${speakers.length} speakers, ${decisions.length} decisions`
  );

  const signals: QualitySignal[] = [
    calculateDissentRatio(decisions),
    calculateSpeakerBalance(speakers),
    calculateBiasDensity(speakers),
    calculateDecisionExplicitness(decisions),
    calculateRiskDiscussion(summary, decisions),
    calculateEngagementQuality(speakers, totalDuration),
  ];

  const totalImpact = signals.reduce((sum, s) => sum + s.impact, 0);
  const predictedScore = Math.max(0, Math.min(100, Math.round(50 + totalImpact)));

  // Confidence increases with data richness
  let confidence = 0.25;
  if (speakers.length > 0) confidence += 0.1;
  if (speakers.length >= 3) confidence += 0.1;
  if (decisions.length > 0) confidence += 0.1;
  if (decisions.length >= 2) confidence += 0.1;
  if ((summary.risks ?? []).length > 0) confidence += 0.1;
  confidence = Math.min(0.95, confidence);

  const recommendations = generateRecommendations(signals);

  log.info(`Quality prediction: score=${predictedScore}, confidence=${confidence.toFixed(2)}`);

  return {
    predictedScore,
    confidence: Math.round(confidence * 100) / 100,
    signals,
    recommendations,
  };
}

// ─── Backward compatibility ──────────────────────────────────────────────────

/**
 * @deprecated Use predictMeetingQuality instead.
 */
export function predictDecisionQuality(
  meetingSummary: unknown,
  speakerBiases: unknown[],
  keyDecisions: unknown[]
): QualityPrediction {
  const speakers: SpeakerProfile[] = (speakerBiases as Array<Record<string, unknown>>).map(s => ({
    name: (s.speaker as string) ?? 'Unknown',
    talkTimeSeconds: 300,
    interruptionCount: 0,
    biasScores: Object.fromEntries(
      ((s.biases as Array<{ biasType: string; avgSeverity: number }>) ?? []).map(b => [
        b.biasType,
        b.avgSeverity * 10,
      ])
    ),
  }));

  const decisions: Decision[] = (keyDecisions as Array<Record<string, unknown>>).map(d => ({
    decision: (d.text as string) ?? '',
    explicitDecision: (d.confidence as number) >= 0.7,
    rationale: d.rationale as string | undefined,
    dissentLevel: d.dissent ? 1 : 0,
  }));

  const summary = (meetingSummary as MeetingContext) ?? {};
  const partialSummary: MeetingContext = {
    risks: (summary.openQuestions as string[] | undefined) ?? [],
  };

  return predictMeetingQuality(speakers, decisions, partialSummary, 0);
}
