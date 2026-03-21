/**
 * Meeting Decision Quality Predictor — Meeting Intelligence Data Moat
 *
 * Predicts decision quality from meeting dynamics BEFORE outcomes are known.
 * Uses signals from speaker behavior, bias density, dissent patterns, and
 * decision explicitness to generate a quality score with confidence interval
 * and actionable recommendations.
 *
 * Key insight: meetings with healthy dissent, balanced participation, explicit
 * rationale, and acknowledged risks consistently produce better decisions.
 */

import { createLogger } from '@/lib/utils/logger';
import type { SpeakerBiasProfile, KeyDecision, MeetingSummary } from '@/lib/meetings/intelligence';

const log = createLogger('QualityPredictor');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QualitySignal {
  signal: string;
  /** Raw value for the signal (context-dependent) */
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

// ─── Signal weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  dissentRatio: 20,
  speakerBalance: 20,
  biasDensity: 20,
  decisionExplicitness: 20,
  riskDiscussion: 10,
  engagementQuality: 10,
} as const;

// ─── Signal extractors ──────────────────────────────────────────────────────

/**
 * Dissent ratio: meetings with healthy dissent correlate with better outcomes.
 * Score 0-100 where ~40-60 is optimal (some dissent, not paralysis).
 */
function computeDissentSignal(speakerBiases: SpeakerBiasProfile[]): QualitySignal {
  if (speakerBiases.length === 0) {
    return {
      signal: 'dissent_ratio',
      value: 0,
      impact: -5,
      description: 'No speaker data available to assess dissent levels',
    };
  }

  const dissentScores = speakerBiases.map(s => s.dissenterScore);
  const maxDissent = Math.max(...dissentScores);
  const avgDissent = dissentScores.reduce((a, b) => a + b, 0) / dissentScores.length;
  const hasSubstantialDissent = dissentScores.some(d => d >= 30);

  // Optimal: at least one dissenter with score 30-70
  let normalizedScore: number;
  if (maxDissent < 10) {
    normalizedScore = 15;
  } else if (maxDissent >= 10 && maxDissent < 30) {
    normalizedScore = 35;
  } else if (maxDissent >= 30 && maxDissent <= 70) {
    normalizedScore = 70 + (maxDissent - 30) * 0.5;
  } else {
    normalizedScore = Math.max(40, 90 - (maxDissent - 70) * 0.8);
  }

  const impact = ((normalizedScore - 50) / 100) * WEIGHTS.dissentRatio;

  let description: string;
  if (!hasSubstantialDissent) {
    description = `Low dissent (max ${Math.round(maxDissent)}/100, avg ${Math.round(avgDissent)}/100) — groupthink risk`;
  } else if (maxDissent > 70) {
    description = `High dissent (max ${Math.round(maxDissent)}/100) — may indicate unresolved disagreements`;
  } else {
    description = `Healthy dissent present (max ${Math.round(maxDissent)}/100, avg ${Math.round(avgDissent)}/100) — diverse perspectives considered`;
  }

  return {
    signal: 'dissent_ratio',
    value: Math.round(normalizedScore),
    impact: Math.round(impact * 10) / 10,
    description,
  };
}

/**
 * Speaker balance: dominated meetings correlate with worse outcomes.
 * Measures how evenly conversation is distributed.
 */
function computeSpeakerBalanceSignal(speakerBiases: SpeakerBiasProfile[]): QualitySignal {
  if (speakerBiases.length <= 1) {
    return {
      signal: 'speaker_balance',
      value: speakerBiases.length === 0 ? 0 : 50,
      impact: speakerBiases.length === 0 ? -5 : 0,
      description:
        speakerBiases.length === 0
          ? 'No speaker data available'
          : 'Single speaker — balance not applicable',
    };
  }

  const dominanceScores = speakerBiases.map(s => s.dominanceScore);
  const maxDominance = Math.max(...dominanceScores);
  const avgDominance = dominanceScores.reduce((a, b) => a + b, 0) / dominanceScores.length;

  // Standard deviation of dominance
  const variance =
    dominanceScores.reduce((sum, d) => sum + Math.pow(d - avgDominance, 2), 0) /
    dominanceScores.length;
  const stdDev = Math.sqrt(variance);

  const spread = maxDominance - Math.min(...dominanceScores);

  let normalizedScore: number;
  if (spread < 20 && stdDev < 10) {
    normalizedScore = 90;
  } else if (spread < 40 && stdDev < 20) {
    normalizedScore = 70;
  } else if (maxDominance >= 80) {
    normalizedScore = 25;
  } else {
    normalizedScore = Math.max(20, 70 - stdDev);
  }

  const impact = ((normalizedScore - 50) / 100) * WEIGHTS.speakerBalance;

  let description: string;
  if (maxDominance >= 80) {
    const dominant = speakerBiases.find(s => s.dominanceScore === maxDominance);
    description = `Discussion dominated by ${dominant?.speaker ?? 'one speaker'} (${Math.round(maxDominance)}/100) — other voices may be suppressed`;
  } else if (spread < 25) {
    description = `Well-balanced discussion (spread ${Math.round(spread)}, std dev ${Math.round(stdDev)}) — all voices heard`;
  } else {
    description = `Moderate imbalance (spread ${Math.round(spread)}, max dominance ${Math.round(maxDominance)}/100)`;
  }

  return {
    signal: 'speaker_balance',
    value: Math.round(normalizedScore),
    impact: Math.round(impact * 10) / 10,
    description,
  };
}

/**
 * Bias density: more biases detected = lower predicted quality.
 */
function computeBiasDensitySignal(speakerBiases: SpeakerBiasProfile[]): QualitySignal {
  if (speakerBiases.length === 0) {
    return {
      signal: 'bias_density',
      value: 50,
      impact: 0,
      description: 'No speaker data available to assess cognitive biases',
    };
  }

  let totalBiasCount = 0;
  let totalSeverity = 0;
  let biasInstances = 0;
  const uniqueBiasTypes = new Set<string>();

  for (const speaker of speakerBiases) {
    for (const bias of speaker.biases) {
      totalBiasCount += bias.count;
      totalSeverity += bias.avgSeverity * bias.count;
      biasInstances += bias.count;
      uniqueBiasTypes.add(bias.biasType);
    }
  }

  const avgSeverity = biasInstances > 0 ? totalSeverity / biasInstances : 0;
  const biasesPerSpeaker = totalBiasCount / speakerBiases.length;

  let normalizedScore: number;
  if (totalBiasCount === 0) {
    normalizedScore = 90;
  } else if (biasesPerSpeaker < 1 && avgSeverity < 0.4) {
    normalizedScore = 75;
  } else if (biasesPerSpeaker < 2 && avgSeverity < 0.6) {
    normalizedScore = 55;
  } else if (biasesPerSpeaker < 3) {
    normalizedScore = 35;
  } else {
    normalizedScore = Math.max(10, 30 - biasesPerSpeaker * 3);
  }

  const impact = ((normalizedScore - 50) / 100) * WEIGHTS.biasDensity;

  let description: string;
  if (totalBiasCount === 0) {
    description = 'No significant cognitive biases detected';
  } else {
    description = `${totalBiasCount} bias instance${totalBiasCount > 1 ? 's' : ''} detected across ${uniqueBiasTypes.size} type${uniqueBiasTypes.size > 1 ? 's' : ''} (avg severity ${(avgSeverity * 100).toFixed(0)}%)`;
  }

  return {
    signal: 'bias_density',
    value: Math.round(normalizedScore),
    impact: Math.round(impact * 10) / 10,
    description,
  };
}

/**
 * Decision explicitness: explicit decisions with rationale correlate with
 * better outcomes than vague or implicit decisions.
 */
function computeDecisionExplicitnessSignal(keyDecisions: KeyDecision[]): QualitySignal {
  if (keyDecisions.length === 0) {
    return {
      signal: 'decision_explicitness',
      value: 20,
      impact: -WEIGHTS.decisionExplicitness * 0.3,
      description: 'No explicit decisions recorded — outcomes may be ambiguous',
    };
  }

  let explicitnessSum = 0;
  let withRationale = 0;
  let withDissent = 0;

  for (const decision of keyDecisions) {
    explicitnessSum += decision.confidence;

    if (decision.rationale && decision.rationale.length > 10) {
      withRationale++;
    }

    if (decision.dissent && decision.dissent.length > 5) {
      withDissent++;
    }
  }

  const avgConfidence = explicitnessSum / keyDecisions.length;
  const rationaleRatio = withRationale / keyDecisions.length;
  const dissentDocRatio = withDissent / keyDecisions.length;

  // Weighted score: confidence (40%), rationale (40%), dissent documentation (20%)
  const normalizedScore = avgConfidence * 40 + rationaleRatio * 40 + dissentDocRatio * 20;

  const impact = ((normalizedScore - 50) / 100) * WEIGHTS.decisionExplicitness;

  const parts: string[] = [];
  parts.push(`${keyDecisions.length} decision${keyDecisions.length > 1 ? 's' : ''} recorded`);
  parts.push(`avg confidence ${(avgConfidence * 100).toFixed(0)}%`);
  parts.push(`${withRationale}/${keyDecisions.length} with rationale`);
  if (withDissent > 0) {
    parts.push(`${withDissent} with documented dissent`);
  }

  return {
    signal: 'decision_explicitness',
    value: Math.round(normalizedScore),
    impact: Math.round(impact * 10) / 10,
    description: parts.join(', '),
  };
}

/**
 * Risk discussion presence: meetings that explicitly discuss risks produce
 * better decisions than those that don't.
 */
function computeRiskDiscussionSignal(
  meetingSummary: MeetingSummary,
  keyDecisions: KeyDecision[]
): QualitySignal {
  const riskKeywords = [
    'risk',
    'downside',
    'worst case',
    'concern',
    'challenge',
    'threat',
    'vulnerability',
    'mitigation',
    'contingency',
    'fallback',
  ];

  const summaryText = [
    meetingSummary.executive,
    ...meetingSummary.agenda,
    ...meetingSummary.outcomes,
    ...meetingSummary.openQuestions,
  ]
    .join(' ')
    .toLowerCase();

  const decisionText = keyDecisions
    .map(d => `${d.text} ${d.rationale} ${d.dissent ?? ''}`)
    .join(' ')
    .toLowerCase();

  const allText = `${summaryText} ${decisionText}`;

  let riskMentions = 0;
  for (const keyword of riskKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = allText.match(regex);
    if (matches) riskMentions += matches.length;
  }

  const riskQuestions = meetingSummary.openQuestions.filter(q =>
    riskKeywords.some(k => q.toLowerCase().includes(k))
  ).length;

  let normalizedScore: number;
  if (riskMentions === 0) {
    normalizedScore = 20;
  } else if (riskMentions <= 2) {
    normalizedScore = 45;
  } else if (riskMentions <= 6) {
    normalizedScore = 75;
  } else {
    normalizedScore = 85;
  }

  if (riskQuestions > 0) {
    normalizedScore = Math.min(100, normalizedScore + 10);
  }

  const impact = ((normalizedScore - 50) / 100) * WEIGHTS.riskDiscussion;

  let description: string;
  if (riskMentions === 0) {
    description = 'No risk discussion detected — decisions may not account for downside scenarios';
  } else {
    description = `${riskMentions} risk-related mention${riskMentions > 1 ? 's' : ''} found${riskQuestions > 0 ? ` + ${riskQuestions} open risk question${riskQuestions > 1 ? 's' : ''}` : ''}`;
  }

  return {
    signal: 'risk_discussion',
    value: Math.round(normalizedScore),
    impact: Math.round(impact * 10) / 10,
    description,
  };
}

/**
 * Engagement quality: combines meeting sentiment and engagement score.
 */
function computeEngagementSignal(meetingSummary: MeetingSummary): QualitySignal {
  const { engagementScore, sentiment } = meetingSummary;

  let sentimentBonus = 0;
  switch (sentiment) {
    case 'positive':
      sentimentBonus = 5;
      break;
    case 'mixed':
      sentimentBonus = 3; // Mixed is actually healthy — shows debate
      break;
    case 'neutral':
      sentimentBonus = 0;
      break;
    case 'negative':
      sentimentBonus = -5;
      break;
  }

  const normalizedScore = Math.max(0, Math.min(100, engagementScore + sentimentBonus));
  const impact = ((normalizedScore - 50) / 100) * WEIGHTS.engagementQuality;

  return {
    signal: 'engagement_quality',
    value: Math.round(normalizedScore),
    impact: Math.round(impact * 10) / 10,
    description: `Engagement ${engagementScore}/100, sentiment: ${sentiment}`,
  };
}

// ─── Recommendation engine ──────────────────────────────────────────────────

function generateRecommendations(signals: QualitySignal[]): string[] {
  const recommendations: string[] = [];

  for (const signal of signals) {
    switch (signal.signal) {
      case 'dissent_ratio':
        if (signal.value < 40) {
          recommendations.push(
            'Assign a "devil\'s advocate" role in the next meeting to encourage constructive dissent and prevent groupthink.'
          );
        } else if (signal.value > 85) {
          recommendations.push(
            'High dissent may indicate unresolved conflict. Consider a structured decision framework (e.g., RAPID) to reach alignment.'
          );
        }
        break;

      case 'speaker_balance':
        if (signal.value < 40) {
          recommendations.push(
            'Use round-robin input or anonymous pre-meeting submissions to ensure quieter voices are heard.'
          );
        }
        break;

      case 'bias_density':
        if (signal.value < 50) {
          recommendations.push(
            'Multiple cognitive biases detected. Consider a structured pre-mortem exercise before finalizing decisions.'
          );
        }
        break;

      case 'decision_explicitness':
        if (signal.value < 40) {
          recommendations.push(
            'Decisions lack explicit rationale. End each decision point with a clear "We decided X because Y" statement.'
          );
        }
        if (signal.value < 25) {
          recommendations.push(
            'No explicit decisions were recorded. Assign a decision scribe to capture commitments in real-time.'
          );
        }
        break;

      case 'risk_discussion':
        if (signal.value < 40) {
          recommendations.push(
            'Add a "risks and mitigations" agenda item to future meetings. Every major decision should have at least one identified downside.'
          );
        }
        break;

      case 'engagement_quality':
        if (signal.value < 35) {
          recommendations.push(
            'Low engagement detected. Consider shorter, more focused meetings with pre-reads distributed in advance.'
          );
        }
        break;
    }
  }

  // Positive reinforcement when quality is high
  const totalImpact = signals.reduce((sum, s) => sum + s.impact, 0);
  if (totalImpact > 8 && recommendations.length === 0) {
    recommendations.push(
      'This meeting exhibited strong decision-making dynamics. Continue using the current discussion format.'
    );
  }

  return recommendations;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Predict decision quality from meeting dynamics before outcomes are known.
 *
 * Analyzes six independent signals from meeting data and combines them into
 * a weighted prediction with confidence interval and recommendations.
 */
export function predictDecisionQuality(
  meetingSummary: MeetingSummary,
  speakerBiases: SpeakerBiasProfile[],
  keyDecisions: KeyDecision[]
): QualityPrediction {
  log.info(
    `Predicting decision quality: ${speakerBiases.length} speakers, ${keyDecisions.length} decisions`
  );

  // Compute all signals
  const signals: QualitySignal[] = [
    computeDissentSignal(speakerBiases),
    computeSpeakerBalanceSignal(speakerBiases),
    computeBiasDensitySignal(speakerBiases),
    computeDecisionExplicitnessSignal(keyDecisions),
    computeRiskDiscussionSignal(meetingSummary, keyDecisions),
    computeEngagementSignal(meetingSummary),
  ];

  // Base score of 50 + sum of all impacts
  const totalImpact = signals.reduce((sum, s) => sum + s.impact, 0);
  const predictedScore = Math.max(0, Math.min(100, Math.round(50 + totalImpact)));

  // Confidence is based on data completeness
  let confidence = 0.5; // baseline
  if (speakerBiases.length > 0) confidence += 0.15;
  if (speakerBiases.length >= 3) confidence += 0.1;
  if (keyDecisions.length > 0) confidence += 0.1;
  if (keyDecisions.length >= 3) confidence += 0.05;
  if (meetingSummary.executive.length > 20) confidence += 0.05;
  if (meetingSummary.openQuestions.length > 0) confidence += 0.05;
  confidence = Math.min(0.95, confidence);

  const recommendations = generateRecommendations(signals);

  log.info(
    `Quality prediction: score=${predictedScore}, confidence=${confidence.toFixed(2)}, signals=${signals.length}, recommendations=${recommendations.length}`
  );

  return {
    predictedScore,
    confidence: Math.round(confidence * 100) / 100,
    signals,
    recommendations,
  };
}
