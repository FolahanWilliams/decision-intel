import type { AnalysisResult } from '@/types';

export interface ScoreOverrides {
  removeBiases?: string[];
  noiseScore?: number;
  factCheckScore?: number;
  removeFallacies?: string[];
  flipVotes?: Record<string, 'APPROVE' | 'REJECT' | 'REVISE'>;
}

export interface CounterfactualResult {
  projectedScore: number;
  delta: number;
  explanation: string;
}

/**
 * Approximate severity weights used for bias impact on overall score.
 * These are estimates based on how the pipeline calculates scores.
 */
const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 8,
  high: 5,
  medium: 3,
  low: 1,
};

/**
 * Calculate a counterfactual score by applying overrides to the analysis.
 * This is a client-side approximation — it estimates how the score would change
 * if certain biases were removed, noise was different, etc.
 */
export function calculateCounterfactualScore(
  analysis: AnalysisResult,
  overrides: ScoreOverrides
): CounterfactualResult {
  const original = analysis.overallScore;
  let adjustedScore = original;
  const reasons: string[] = [];

  // 1. Remove biases — each removed bias adds back its penalty
  if (overrides.removeBiases?.length) {
    const removedSet = new Set(overrides.removeBiases);
    let recoveredPoints = 0;

    for (const bias of analysis.biases) {
      if (removedSet.has(bias.biasType)) {
        const weight = SEVERITY_WEIGHTS[bias.severity] || 3;
        recoveredPoints += weight;
      }
    }

    adjustedScore += recoveredPoints;
    if (recoveredPoints > 0) {
      reasons.push(
        `Removing ${overrides.removeBiases.length} bias${overrides.removeBiases.length > 1 ? 'es' : ''} recovers ~${recoveredPoints} points`
      );
    }
  }

  // 2. Override noise score
  if (overrides.noiseScore !== undefined && analysis.noiseScore !== undefined) {
    const noiseDelta = analysis.noiseScore - overrides.noiseScore;
    // Lower noise = higher score (noise is a penalty)
    const noiseImpact = Math.round(noiseDelta * 0.3);
    adjustedScore += noiseImpact;
    if (noiseImpact !== 0) {
      reasons.push(
        noiseImpact > 0
          ? `Reducing noise by ${Math.abs(Math.round(noiseDelta))}% improves score by ~${noiseImpact} points`
          : `Increasing noise by ${Math.abs(Math.round(noiseDelta))}% reduces score by ~${Math.abs(noiseImpact)} points`
      );
    }
  }

  // 3. Override fact check score
  if (overrides.factCheckScore !== undefined && analysis.factCheck?.score !== undefined) {
    const factDelta = overrides.factCheckScore - analysis.factCheck.score;
    const factImpact = Math.round(factDelta * 0.2);
    adjustedScore += factImpact;
    if (factImpact !== 0) {
      reasons.push(
        factImpact > 0
          ? `Improving fact-check score adds ~${factImpact} points`
          : `Worsening fact-check score costs ~${Math.abs(factImpact)} points`
      );
    }
  }

  // 4. Remove fallacies
  if (overrides.removeFallacies?.length && analysis.logicalAnalysis?.fallacies) {
    const removedSet = new Set(overrides.removeFallacies);
    let fallacyRecovery = 0;
    for (const fallacy of analysis.logicalAnalysis.fallacies) {
      if (removedSet.has(fallacy.name)) {
        const weight = SEVERITY_WEIGHTS[fallacy.severity] || 3;
        fallacyRecovery += weight;
      }
    }
    adjustedScore += fallacyRecovery;
    if (fallacyRecovery > 0) {
      reasons.push(
        `Removing ${overrides.removeFallacies.length} fallacy recovers ~${fallacyRecovery} points`
      );
    }
  }

  // 5. Flip boardroom votes
  if (overrides.flipVotes && analysis.simulation?.twins) {
    const originalApprovals = analysis.simulation.twins.filter(t => t.vote === 'APPROVE').length;
    const modifiedTwins = analysis.simulation.twins.map(t => ({
      ...t,
      vote: overrides.flipVotes![t.name] || t.vote,
    }));
    const newApprovals = modifiedTwins.filter(t => t.vote === 'APPROVE').length;
    const approvalDelta = newApprovals - originalApprovals;
    const voteImpact = Math.round(approvalDelta * 4);
    adjustedScore += voteImpact;
    if (voteImpact !== 0) {
      reasons.push(
        voteImpact > 0
          ? `More board approvals improve score by ~${voteImpact} points`
          : `Fewer board approvals reduce score by ~${Math.abs(voteImpact)} points`
      );
    }
  }

  // Clamp to 0-100
  adjustedScore = Math.max(0, Math.min(100, Math.round(adjustedScore)));
  const delta = adjustedScore - original;

  const explanation =
    reasons.length > 0 ? reasons.join('. ') + '.' : 'No changes applied — score remains the same.';

  return { projectedScore: adjustedScore, delta, explanation };
}

/**
 * Decompose an analysis into replay steps with approximate score deltas.
 */
export interface ReplayStep {
  id: string;
  label: string;
  description: string;
  status: 'complete' | 'skipped';
  findings: string[];
  scoreDelta: number;
  counterfactualSupported: boolean;
}

export function decomposeAnalysis(analysis: AnalysisResult): ReplayStep[] {
  const steps: ReplayStep[] = [];

  // Step 1: Document Intelligence
  steps.push({
    id: 'document-intel',
    label: 'Document Intelligence',
    description: 'Parsed document structure and extracted key content',
    status: 'complete',
    findings: [
      analysis.structuredContent ? 'Structured content extracted' : 'Raw content processed',
      analysis.speakers?.length
        ? `${analysis.speakers.length} speakers identified`
        : 'Single-author document',
    ],
    scoreDelta: 0,
    counterfactualSupported: false,
  });

  // Step 2: Bias Detection
  const biasCount = analysis.biases.length;
  const biasPenalty = analysis.biases.reduce(
    (sum, b) => sum + (SEVERITY_WEIGHTS[b.severity] || 3),
    0
  );
  steps.push({
    id: 'bias-detection',
    label: 'Bias Detection',
    description: `Scanned for 16 cognitive biases across 4 categories`,
    status: 'complete',
    findings: [
      `${biasCount} bias${biasCount !== 1 ? 'es' : ''} detected`,
      ...analysis.biases.slice(0, 3).map(b => `${b.biasType} (${b.severity})`),
      biasCount > 3 ? `...and ${biasCount - 3} more` : '',
    ].filter(Boolean),
    scoreDelta: -biasPenalty,
    counterfactualSupported: true,
  });

  // Step 3: Noise Analysis
  const noisePenalty = analysis.noiseScore ? Math.round(analysis.noiseScore * 0.3) : 0;
  steps.push({
    id: 'noise-analysis',
    label: 'Noise Analysis',
    description: '3 independent AI judges evaluated decision consistency',
    status: 'complete',
    findings: [
      `Noise score: ${analysis.noiseScore != null ? Math.round(analysis.noiseScore) : '—'}%`,
      analysis.noiseStats
        ? `Mean: ${analysis.noiseStats.mean.toFixed(1)}, StdDev: ${analysis.noiseStats.stdDev.toFixed(1)}`
        : 'Noise stats not available',
    ],
    scoreDelta: -noisePenalty,
    counterfactualSupported: true,
  });

  // Step 4: Fact Check
  const factPenalty = analysis.factCheck ? Math.round((100 - analysis.factCheck.score) * 0.2) : 0;
  steps.push({
    id: 'fact-check',
    label: 'Fact & Compliance Check',
    description: 'Verified claims against external sources and checked regulatory compliance',
    status: analysis.factCheck ? 'complete' : 'skipped',
    findings: analysis.factCheck
      ? [
          `Fact-check score: ${analysis.factCheck.score}/100`,
          `${analysis.factCheck.verifications?.length || 0} claims verified`,
          analysis.compliance
            ? `Compliance: ${analysis.compliance.status} (risk: ${analysis.compliance.riskScore})`
            : 'Compliance check skipped',
        ]
      : ['Fact-check data not available'],
    scoreDelta: -factPenalty,
    counterfactualSupported: !!analysis.factCheck,
  });

  // Step 5: Deep Analysis
  const logicPenalty = analysis.logicalAnalysis
    ? Math.round((100 - analysis.logicalAnalysis.score) * 0.15)
    : 0;
  steps.push({
    id: 'deep-analysis',
    label: 'Deep Analysis',
    description: 'Sentiment, logical analysis, SWOT, and cognitive blind spot detection',
    status: 'complete',
    findings: [
      analysis.sentiment
        ? `Sentiment: ${analysis.sentiment.label} (${analysis.sentiment.score})`
        : 'Sentiment: N/A',
      analysis.logicalAnalysis
        ? `Logic score: ${analysis.logicalAnalysis.score}/100 · ${analysis.logicalAnalysis.fallacies.length} fallacies`
        : 'Logic: N/A',
      analysis.swotAnalysis
        ? `SWOT: ${analysis.swotAnalysis.strengths.length}S ${analysis.swotAnalysis.weaknesses.length}W ${analysis.swotAnalysis.opportunities.length}O ${analysis.swotAnalysis.threats.length}T`
        : 'SWOT: N/A',
    ],
    scoreDelta: -logicPenalty,
    counterfactualSupported: !!analysis.logicalAnalysis,
  });

  // Step 6: Boardroom Simulation
  steps.push({
    id: 'boardroom',
    label: 'Boardroom Simulation',
    description: 'Decision twin personas evaluated the proposal',
    status: analysis.simulation ? 'complete' : 'skipped',
    findings: analysis.simulation
      ? [
          `Verdict: ${analysis.simulation.overallVerdict}`,
          ...analysis.simulation.twins
            .slice(0, 3)
            .map(t => `${t.name}: ${t.vote} (${t.confidence}% confident)`),
        ]
      : ['Boardroom simulation not available'],
    scoreDelta: 0,
    counterfactualSupported: !!analysis.simulation,
  });

  // Step 7: Final Score
  steps.push({
    id: 'final-score',
    label: 'Final Risk Scoring',
    description: 'Aggregated all agent findings into a final decision quality score',
    status: 'complete',
    findings: [
      `Final score: ${Math.round(analysis.overallScore)}/100`,
      analysis.overallScore >= 70
        ? 'ACCEPTABLE — Low risk'
        : analysis.overallScore >= 40
          ? 'CAUTION — Moderate risk'
          : 'HIGH RISK — Significant concerns',
    ],
    scoreDelta: 0,
    counterfactualSupported: false,
  });

  return steps;
}
