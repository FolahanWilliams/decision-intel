/**
 * Decision Simulation Backtesting Engine
 *
 * Validates the Decision Twin simulation against documented historical
 * decisions with known outcomes. This creates proprietary validation data:
 * "Our simulation correctly predicted outcomes in X% of Y backtested cases."
 *
 * The backtest results themselves become defensible IP — competitors cannot
 * make accuracy claims without doing the same rigorous validation work.
 */

// Deterministic backtesting — no runtime logging needed

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BacktestCase {
  /** Unique case identifier */
  caseId: string;
  /** Case title for display */
  title: string;
  /** The document/decision content to analyze */
  content: string;
  /** Known actual outcome */
  actualOutcome: 'success' | 'partial_success' | 'failure' | 'catastrophic_failure';
  /** Biases that were confirmed present (ground truth) */
  confirmedBiases: string[];
  /** Key risk that materialized (ground truth) */
  materializedRisk: string;
  /** Industry vertical */
  industry: string;
  /** Monetary impact (for severity validation) */
  impactScore: number;
}

export interface PersonaVote {
  personaName: string;
  vote: 'APPROVE' | 'REJECT' | 'REVISE';
  reasoning: string;
  confidence: number;
  flaggedRisks: string[];
}

export interface SimulationOutput {
  overallVerdict: string;
  qualityScore: number;
  detectedBiases: Array<{ type: string; severity: string; confidence: number }>;
  personaVotes: PersonaVote[];
  preMortemScenarios?: string[];
}

export interface BacktestResult {
  caseId: string;
  title: string;
  /** Did the simulation predict the actual outcome? */
  outcomePredicted: boolean;
  /** Did the majority of personas vote correctly? */
  majorityCorrect: boolean;
  /** Which persona(s) were most accurate? */
  mostAccuratePersonas: string[];
  /** Did the Devil's Advocate flag the actual risk? */
  devilsAdvocateAccurate: boolean;
  /** Bias detection accuracy: what % of confirmed biases were detected? */
  biasRecall: number;
  /** Bias precision: what % of detected biases were actually confirmed? */
  biasPrecision: number;
  /** F1 score combining precision and recall */
  biasF1: number;
  /** Did pre-mortem scenarios include the actual failure mode? */
  preMortemHit: boolean;
  /** Score delta: how far was the quality score from reality? */
  scoreDelta: number;
  /** Detailed persona results */
  personaResults: Array<{
    name: string;
    vote: string;
    wasCorrect: boolean;
    flaggedActualRisk: boolean;
  }>;
}

export interface BacktestSummary {
  /** Total cases backtested */
  totalCases: number;
  /** Overall outcome prediction accuracy */
  outcomeAccuracy: number;
  /** Bias detection recall (sensitivity) */
  avgBiasRecall: number;
  /** Bias detection precision */
  avgBiasPrecision: number;
  /** Average F1 score */
  avgBiasF1: number;
  /** Per-persona accuracy ranking */
  personaRanking: Array<{
    name: string;
    correctVotes: number;
    totalVotes: number;
    accuracy: number;
    riskFlagRate: number;
  }>;
  /** Devil's Advocate hit rate */
  devilsAdvocateHitRate: number;
  /** Pre-mortem scenario hit rate */
  preMortemHitRate: number;
  /** Results by industry */
  byIndustry: Record<string, { cases: number; accuracy: number }>;
  /** Individual case results */
  results: BacktestResult[];
  /** Timestamp */
  computedAt: string;
}

// ---------------------------------------------------------------------------
// Outcome mapping
// ---------------------------------------------------------------------------

/** Map actual outcomes to expected simulation behavior */
function shouldReject(outcome: BacktestCase['actualOutcome']): boolean {
  return outcome === 'failure' || outcome === 'catastrophic_failure';
}

function isCorrectVote(
  vote: string,
  actualOutcome: BacktestCase['actualOutcome'],
): boolean {
  const bad = shouldReject(actualOutcome);
  if (bad) return vote === 'REJECT' || vote === 'REVISE';
  return vote === 'APPROVE' || vote === 'REVISE'; // REVISE is acceptable for partial_success
}

// ---------------------------------------------------------------------------
// Core backtesting logic
// ---------------------------------------------------------------------------

/**
 * Evaluate a single simulation output against a known case.
 */
export function evaluateBacktest(
  testCase: BacktestCase,
  simulation: SimulationOutput,
): BacktestResult {
  // --- Outcome prediction ---
  const bad = shouldReject(testCase.actualOutcome);
  const simulationSaysBad = simulation.qualityScore < 50;
  const outcomePredicted = bad === simulationSaysBad;

  // --- Persona voting accuracy ---
  const personaResults = simulation.personaVotes.map((pv) => {
    const wasCorrect = isCorrectVote(pv.vote, testCase.actualOutcome);
    const flaggedActualRisk = pv.flaggedRisks.some((risk) =>
      testCase.materializedRisk
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.length > 3 && risk.toLowerCase().includes(word)),
    );
    return {
      name: pv.personaName,
      vote: pv.vote,
      wasCorrect,
      flaggedActualRisk,
    };
  });

  const correctVotes = personaResults.filter((p) => p.wasCorrect).length;
  const majorityCorrect = correctVotes > simulation.personaVotes.length / 2;

  const mostAccuratePersonas = personaResults
    .filter((p) => p.wasCorrect && p.flaggedActualRisk)
    .map((p) => p.name);

  // Devil's Advocate
  const devilsAdvocate = personaResults.find(
    (p) =>
      p.name.toLowerCase().includes('devil') ||
      p.name.toLowerCase().includes('advocate') ||
      p.name.toLowerCase().includes('contrarian'),
  );
  const devilsAdvocateAccurate = devilsAdvocate?.flaggedActualRisk ?? false;

  // --- Bias detection accuracy ---
  const detectedBiasTypes = new Set(
    simulation.detectedBiases.map((b) => b.type),
  );
  const confirmedSet = new Set(testCase.confirmedBiases);

  const truePositives = testCase.confirmedBiases.filter((b) =>
    detectedBiasTypes.has(b),
  ).length;
  const biasRecall =
    confirmedSet.size > 0 ? truePositives / confirmedSet.size : 1;
  const biasPrecision =
    detectedBiasTypes.size > 0 ? truePositives / detectedBiasTypes.size : 1;
  const biasF1 =
    biasRecall + biasPrecision > 0
      ? (2 * biasRecall * biasPrecision) / (biasRecall + biasPrecision)
      : 0;

  // --- Pre-mortem accuracy ---
  const preMortemHit =
    simulation.preMortemScenarios?.some((scenario) =>
      testCase.materializedRisk
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .some((word) => scenario.toLowerCase().includes(word)),
    ) ?? false;

  // --- Score delta ---
  const expectedScore = bad ? 30 : 70; // rough expected score for bad/good outcomes
  const scoreDelta = Math.abs(simulation.qualityScore - expectedScore);

  return {
    caseId: testCase.caseId,
    title: testCase.title,
    outcomePredicted,
    majorityCorrect,
    mostAccuratePersonas,
    devilsAdvocateAccurate,
    biasRecall: Math.round(biasRecall * 1000) / 1000,
    biasPrecision: Math.round(biasPrecision * 1000) / 1000,
    biasF1: Math.round(biasF1 * 1000) / 1000,
    preMortemHit,
    scoreDelta: Math.round(scoreDelta * 10) / 10,
    personaResults,
  };
}

/**
 * Aggregate multiple backtest results into a summary report.
 */
export function summarizeBacktests(
  results: BacktestResult[],
  caseMetadata?: Array<{ caseId: string; industry: string }>,
): BacktestSummary {
  if (results.length === 0) {
    return {
      totalCases: 0,
      outcomeAccuracy: 0,
      avgBiasRecall: 0,
      avgBiasPrecision: 0,
      avgBiasF1: 0,
      personaRanking: [],
      devilsAdvocateHitRate: 0,
      preMortemHitRate: 0,
      byIndustry: {},
      results: [],
      computedAt: new Date().toISOString(),
    };
  }

  const totalCases = results.length;

  // Outcome accuracy
  const outcomeAccuracy =
    results.filter((r) => r.outcomePredicted).length / totalCases;

  // Bias detection averages
  const avgBiasRecall =
    results.reduce((s, r) => s + r.biasRecall, 0) / totalCases;
  const avgBiasPrecision =
    results.reduce((s, r) => s + r.biasPrecision, 0) / totalCases;
  const avgBiasF1 =
    results.reduce((s, r) => s + r.biasF1, 0) / totalCases;

  // Devil's Advocate hit rate
  const daResults = results.filter((r) => r.personaResults.some(
    (p) =>
      p.name.toLowerCase().includes('devil') ||
      p.name.toLowerCase().includes('advocate'),
  ));
  const devilsAdvocateHitRate =
    daResults.length > 0
      ? daResults.filter((r) => r.devilsAdvocateAccurate).length /
        daResults.length
      : 0;

  // Pre-mortem hit rate
  const preMortemHitRate =
    results.filter((r) => r.preMortemHit).length / totalCases;

  // Per-persona ranking
  const personaStats: Record<
    string,
    { correct: number; total: number; riskFlags: number }
  > = {};
  for (const result of results) {
    for (const pr of result.personaResults) {
      if (!personaStats[pr.name]) {
        personaStats[pr.name] = { correct: 0, total: 0, riskFlags: 0 };
      }
      personaStats[pr.name].total++;
      if (pr.wasCorrect) personaStats[pr.name].correct++;
      if (pr.flaggedActualRisk) personaStats[pr.name].riskFlags++;
    }
  }

  const personaRanking = Object.entries(personaStats)
    .map(([name, stats]) => ({
      name,
      correctVotes: stats.correct,
      totalVotes: stats.total,
      accuracy: Math.round((stats.correct / stats.total) * 1000) / 1000,
      riskFlagRate:
        Math.round((stats.riskFlags / stats.total) * 1000) / 1000,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  // By industry
  const byIndustry: Record<string, { cases: number; accuracy: number }> = {};
  if (caseMetadata) {
    const industryMap = new Map(
      caseMetadata.map((c) => [c.caseId, c.industry]),
    );
    const industryResults: Record<
      string,
      { total: number; correct: number }
    > = {};
    for (const result of results) {
      const industry = industryMap.get(result.caseId) ?? 'unknown';
      if (!industryResults[industry]) {
        industryResults[industry] = { total: 0, correct: 0 };
      }
      industryResults[industry].total++;
      if (result.outcomePredicted) industryResults[industry].correct++;
    }
    for (const [industry, stats] of Object.entries(industryResults)) {
      byIndustry[industry] = {
        cases: stats.total,
        accuracy:
          Math.round((stats.correct / stats.total) * 1000) / 1000,
      };
    }
  }

  return {
    totalCases,
    outcomeAccuracy: Math.round(outcomeAccuracy * 1000) / 1000,
    avgBiasRecall: Math.round(avgBiasRecall * 1000) / 1000,
    avgBiasPrecision: Math.round(avgBiasPrecision * 1000) / 1000,
    avgBiasF1: Math.round(avgBiasF1 * 1000) / 1000,
    personaRanking,
    devilsAdvocateHitRate:
      Math.round(devilsAdvocateHitRate * 1000) / 1000,
    preMortemHitRate: Math.round(preMortemHitRate * 1000) / 1000,
    byIndustry,
    results,
    computedAt: new Date().toISOString(),
  };
}
