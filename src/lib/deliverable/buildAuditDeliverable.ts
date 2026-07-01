/**
 * buildAuditDeliverable — composer from AnalysisResult → AuditDeliverable.
 * Locked 2026-05-20 from Deep Research synthesis.
 *
 * Pure function. No I/O. No LLM. Deterministic: same input → same
 * output. Single source of truth for the MECE-bucket structure of the
 * audit deliverable presentation layer. All three views (/demo, in-
 * product Executive, in-product Analyst) consume the same composed
 * shape.
 *
 * Pyramid Principle applied to a memo audit:
 *   Cover (apex)         → SCQA executive summary
 *   Bucket 1 (1st level) → What the audit found    [reasoning risks]
 *   Bucket 2 (1st level) → How the room will react [stress test]
 *   Bucket 3 (1st level) → What comparables say    [historical analogs]
 *   Bucket 4 (1st level) → What to fix             [counterfactuals]
 *   Bucket 5 (1st level) → How we know             [provenance]
 *
 * Each bucket carries an action title (deterministic template OR LLM-
 * augmented fallback) + the typed evidence rendered by the UI.
 */

import type { AnalysisResult, BiasDetectionResult, DecisionTwin, ForgottenQuestion } from '@/types';
import { gradeFromScore } from '@/lib/utils/grade';
import { formatBiasName } from '@/lib/utils/labels';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';
import { PIPELINE_NODES } from '@/lib/data/pipeline-nodes';
import { MATRIX_DIMENSION } from '@/lib/ontology/interaction-matrix';
import { PLATFORM_BASELINE_SNAPSHOT } from '@/lib/learning/platform-baseline-snapshot';
import { computeFindingValueAtStake, formatExposureLabel } from './valueAtStake';
import { extractTicketFromContent } from './ticket-extractor';
import { buildReferenceClass } from './referenceClass';
import {
  coverActionTitle,
  reasoningRisksActionTitle,
  stressTestActionTitle,
  historicalAnalogsActionTitle,
  counterfactualsActionTitle,
  provenanceActionTitle,
  scqaSituation,
  scqaComplication,
  scqaQuestion,
  scqaAnswer,
} from './actionTitleTemplates';
import type {
  AuditDeliverable,
  BuildDeliverableOptions,
  ConfidenceBand,
  CounterfactualScenario,
  CounterfactualsBucket,
  HistoricalAnalogsBucket,
  ProvenanceBucket,
  ReasoningRiskFinding,
  ReasoningRisksBucket,
  SCQAExecutiveSummary,
  Severity,
  StressTestBucket,
  StressTestObjection,
  ValueSuppressingChip,
} from './types';

const SEVERITY_ORDER: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function confidenceBand(pct: number | null): ConfidenceBand {
  if (pct === null || !Number.isFinite(pct)) return 'Unknown';
  if (pct >= 75) return 'High';
  if (pct >= 50) return 'Medium';
  return 'Low';
}

function makeChip(severity: Severity, rawConfidence: number | undefined): ValueSuppressingChip {
  const pct =
    typeof rawConfidence === 'number' && Number.isFinite(rawConfidence)
      ? Math.round(rawConfidence > 1 ? rawConfidence : rawConfidence * 100)
      : null;
  return { severity, band: confidenceBand(pct), pct };
}

function sortBySeverity<T extends { severity: Severity }>(items: T[]): T[] {
  return [...items].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
}

// ──────────────────────────────────────────────────────────────────────
// Bucket 1 — Reasoning Risks (biases + compound patterns combined)
// ──────────────────────────────────────────────────────────────────────

interface NamedPatternRaw {
  patternLabel?: string;
  severity?: string;
  biasTypes?: string[];
  description?: string;
}

function extractNamedPatterns(result: AnalysisResult): NamedPatternRaw[] {
  // CompoundScoringResult doesn't carry namedPatterns in the canonical
  // type definition; it's a runtime field the riskScorerNode now
  // produces (per the 2026-05-09 NAMED_PATTERNS pipeline activation).
  // Cast carefully and accept null.
  const cs = result.compoundScoring as
    | (typeof result.compoundScoring & { namedPatterns?: NamedPatternRaw[] })
    | undefined;
  return cs?.namedPatterns ?? [];
}

function bucketReasoningRisks(
  result: AnalysisResult,
  options: BuildDeliverableOptions
): ReasoningRisksBucket {
  const biases = (result.biases ?? []).filter(b => b.found !== false);
  const patterns = extractNamedPatterns(result);

  const biasFindings: ReasoningRiskFinding[] = sortBySeverity(biases).map(
    (b: BiasDetectionResult) => {
      const matchingPattern = patterns.find(p => p.biasTypes?.includes(b.biasType));
      const ticket = options.ticket;
      return {
        kind: 'bias',
        id: b.biasType,
        label: formatBiasName(b.biasType),
        chip: makeChip(b.severity as Severity, b.confidence),
        excerpt: b.excerpt ?? '',
        explanation: b.explanation ?? '',
        mitigation: b.suggestion ?? '',
        referenceClass: buildReferenceClass(b.biasType, 3),
        valueAtStake: ticket
          ? computeFindingValueAtStake({
              ticketAmount: ticket.amount,
              ticketCurrency: ticket.currency,
              severity: b.severity as Severity,
              namedPatternLabel: matchingPattern?.patternLabel,
            })
          : null,
      };
    }
  );

  const patternFindings: ReasoningRiskFinding[] = patterns.flatMap(p => {
    if (!p.patternLabel) return [];
    const severity = ((p.severity ?? 'high').toLowerCase() as Severity) ?? 'high';
    const ticket = options.ticket;
    const finding: ReasoningRiskFinding = {
      kind: 'compound_pattern',
      id: p.patternLabel,
      label: p.patternLabel,
      chip: makeChip(severity, undefined),
      excerpt: '',
      explanation: p.description ?? '',
      mitigation: '',
      participatingBiases: p.biasTypes ?? [],
      valueAtStake: ticket
        ? computeFindingValueAtStake({
            ticketAmount: ticket.amount,
            ticketCurrency: ticket.currency,
            severity,
            namedPatternLabel: p.patternLabel,
          })
        : null,
    };
    return [finding];
  });

  // Compound patterns lead — they're the strongest signal per the
  // moat. Individual biases follow, sorted by severity.
  const findings: ReasoningRiskFinding[] = [...patternFindings, ...biasFindings];

  const counts = {
    critical: biases.filter(b => b.severity === 'critical').length,
    high: biases.filter(b => b.severity === 'high').length,
    medium: biases.filter(b => b.severity === 'medium').length,
    low: biases.filter(b => b.severity === 'low').length,
    namedPatterns: patternFindings.length,
  };

  const topBiasLabels = sortBySeverity(biases)
    .slice(0, 3)
    .map(b => formatBiasName(b.biasType));
  const topPatternLabels = patternFindings.slice(0, 2).map(p => p.label);

  const actionTitle =
    options.actionTitles?.reasoningRisks ??
    reasoningRisksActionTitle({ counts, topBiasLabels, topPatternLabels });

  return { actionTitle, findings, counts };
}

// ──────────────────────────────────────────────────────────────────────
// Bucket 2 — Stress Test (boardroom + red team)
// ──────────────────────────────────────────────────────────────────────

function bucketStressTest(
  result: AnalysisResult,
  options: BuildDeliverableOptions
): StressTestBucket {
  const twins: DecisionTwin[] = result.simulation?.twins ?? [];
  const redTeam = result.preMortem?.redTeam ?? [];

  const boardroomObjections: StressTestObjection[] = twins.map(t => ({
    kind: 'boardroom',
    persona: t.name,
    role: t.role,
    vote: t.vote,
    objection: t.keyRiskIdentified ?? t.rationale ?? '',
    reasoning: t.rationale ?? '',
  }));

  const redTeamObjections: StressTestObjection[] = redTeam.map(r => ({
    kind: 'red_team',
    persona: 'Red Team',
    role: 'Adversarial reviewer',
    objection: r.objection,
    targetClaim: r.targetClaim,
    reasoning: r.reasoning,
  }));

  const objections = [...boardroomObjections, ...redTeamObjections];

  const counts = {
    approve: twins.filter(t => t.vote === 'APPROVE').length,
    reject: twins.filter(t => t.vote === 'REJECT').length,
    revise: twins.filter(t => t.vote === 'REVISE').length,
    redTeam: redTeamObjections.length,
  };

  // Find the highest-confidence dissenting twin for the dynamic title
  const topDissenter = [...twins]
    .filter(t => t.vote === 'REJECT' || t.vote === 'REVISE')
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];

  const actionTitle =
    options.actionTitles?.stressTest ??
    stressTestActionTitle({
      counts,
      overallVerdict: result.simulation?.overallVerdict,
      topDissentPersona: topDissenter?.name,
      topDissentSubject: topDissenter?.keyRiskIdentified,
    });

  return {
    actionTitle,
    overallVerdict: result.simulation?.overallVerdict,
    objections,
    counts,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Bucket 3 — Historical Analogs (forgotten questions)
// ──────────────────────────────────────────────────────────────────────

function bucketHistoricalAnalogs(
  result: AnalysisResult,
  options: BuildDeliverableOptions
): HistoricalAnalogsBucket {
  const fq = result.forgottenQuestions;
  const questions = (fq?.questions ?? []).map((q: ForgottenQuestion) => ({
    question: q.question,
    whyItMatters: q.whyItMatters,
    biasGuarded: q.biasGuarded,
    severity: q.severity as Severity,
    analogCompany: q.analogCompany,
  }));

  const sortedQuestions = sortBySeverity(questions);
  const analogs = (fq?.analogsUsed ?? []).filter(Boolean);
  const topAnalog = analogs[0];
  const highSeverityCount = sortedQuestions.filter(
    q => q.severity === 'critical' || q.severity === 'high'
  ).length;

  const actionTitle =
    options.actionTitles?.historicalAnalogs ??
    historicalAnalogsActionTitle({
      forgottenQuestionCount: sortedQuestions.length,
      topAnalog,
      highSeverityCount,
    });

  return {
    actionTitle,
    forgottenQuestions: sortedQuestions,
    headline: fq?.headline,
    analogsUsed: analogs,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Bucket 4 — Counterfactuals (what to fix)
// ──────────────────────────────────────────────────────────────────────

function bucketCounterfactuals(
  result: AnalysisResult,
  options: BuildDeliverableOptions
): CounterfactualsBucket {
  const biases = (result.biases ?? []).filter(b => b.found !== false);
  const inversion = result.preMortem?.inversion ?? [];
  const currentDqi = result.overallScore;

  // Derive mitigation scenarios from the top biases. Each scenario
  // projects DQI lift if that bias is mitigated. Lift is a function of
  // the bias's severity weight + the count of remaining biases — we
  // borrow the canonical severity weights from the dqi.ts module
  // structure via a conservative heuristic.
  const SEVERITY_LIFT: Record<Severity, number> = {
    critical: 8,
    high: 5,
    medium: 3,
    low: 1,
  };

  const scenarios: CounterfactualScenario[] = sortBySeverity(biases)
    .slice(0, 5) // Top 5 mitigation candidates
    .map(b => {
      const lift = SEVERITY_LIFT[b.severity as Severity] ?? 1;
      const projectedDqi = Math.min(100, currentDqi + lift);
      return {
        targetFindingId: b.biasType,
        targetLabel: formatBiasName(b.biasType),
        projectedDqi,
        delta: projectedDqi - currentDqi,
        mitigation: b.suggestion ?? '',
      };
    });

  // Best case: all 5 scenarios applied, clamped to 100
  const totalLift = scenarios.reduce((acc, s) => acc + s.delta, 0);
  const bestCaseDqi = Math.min(100, currentDqi + totalLift);

  const topScenarioLabel = scenarios[0]?.targetLabel;

  const actionTitle =
    options.actionTitles?.counterfactuals ??
    counterfactualsActionTitle({
      currentDqi,
      bestCaseDqi,
      scenarioCount: scenarios.length,
      topScenarioLabel,
    });

  return {
    actionTitle,
    currentDqi,
    bestCaseDqi,
    scenarios,
    inversionFailureModes: inversion,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Bucket 5 — Provenance (how we know)
// ──────────────────────────────────────────────────────────────────────

function bucketProvenance(
  result: AnalysisResult,
  options: BuildDeliverableOptions
): ProvenanceBucket {
  const auditHashPrefix = (options.analysisId ?? options.documentId).replace(/-/g, '').slice(0, 12);

  // Pull regulatory frameworks from the compliance result when present.
  // The compliance node emits per-framework hits; we surface up to 6 on
  // the cover and offer drill-down to the full list.
  type ComplianceLike = {
    frameworkHits?: Array<{ frameworkId?: string; label?: string; region?: string }>;
  };
  const compliance = result.compliance as ComplianceLike | undefined;
  const frameworks = (compliance?.frameworkHits ?? []).slice(0, 6).map(f => ({
    id: f.frameworkId ?? f.label ?? 'unknown',
    label: f.label ?? f.frameworkId ?? 'Unknown framework',
    region: f.region ?? 'global',
  }));

  const claimVerifications = result.factCheck?.verifications;

  const actionTitle =
    options.actionTitles?.provenance ??
    provenanceActionTitle({
      methodologyVersion: METHODOLOGY_VERSION,
      pipelineNodeCount: PIPELINE_NODES.length,
      matrixDimension: MATRIX_DIMENSION,
      caseCorpusSize: HISTORICAL_CASE_COUNT,
      meanBrier: PLATFORM_BASELINE_SNAPSHOT.meanBrier,
      frameworkCount: frameworks.length,
      auditHashPrefix,
    });

  return {
    actionTitle,
    methodologyVersion: METHODOLOGY_VERSION,
    pipelineNodeCount: PIPELINE_NODES.length,
    matrixDimension: MATRIX_DIMENSION,
    auditHashPrefix,
    calibrationBaseline: {
      meanBrier: PLATFORM_BASELINE_SNAPSHOT.meanBrier,
      sampleSize: PLATFORM_BASELINE_SNAPSHOT.n,
      classificationAccuracy: PLATFORM_BASELINE_SNAPSHOT.classificationAccuracy,
    },
    regulatoryFrameworks: frameworks,
    claimVerifications,
  };
}

// ──────────────────────────────────────────────────────────────────────
// SCQA Cover composition
// ──────────────────────────────────────────────────────────────────────

function composeCover(
  result: AnalysisResult,
  reasoningRisks: ReasoningRisksBucket,
  counterfactuals: CounterfactualsBucket,
  options: BuildDeliverableOptions
): SCQAExecutiveSummary {
  const totalRisks =
    reasoningRisks.counts.critical +
    reasoningRisks.counts.high +
    reasoningRisks.counts.medium +
    reasoningRisks.counts.low;
  const criticalRisks = reasoningRisks.counts.critical;
  const namedPatternCount = reasoningRisks.counts.namedPatterns;
  const projectedLift = Math.max(0, counterfactuals.bestCaseDqi - counterfactuals.currentDqi);
  const grade = gradeFromScore(result.overallScore);

  // Top concern: highest-severity finding (bias or pattern)
  const topFinding = reasoningRisks.findings[0];
  const topMitigation = counterfactuals.scenarios[0]?.mitigation;

  // Exposure label only when ticket is supplied AND the top finding has
  // a valueAtStake (otherwise null gracefully)
  const exposureLabel =
    topFinding?.valueAtStake && options.ticket
      ? formatExposureLabel(topFinding.valueAtStake)
      : undefined;

  const actionTitle =
    options.actionTitles?.cover ??
    coverActionTitle({
      dqiScore: result.overallScore,
      grade,
      totalRisks,
      criticalRisks,
      namedPatternCount,
      projectedLift,
      exposureLabel,
    });

  return {
    actionTitle,
    situation: scqaSituation(),
    complication: scqaComplication({
      dqiScore: result.overallScore,
      grade,
      totalRisks,
      criticalRisks,
      topConcern: topFinding?.label,
      topMitigation,
    }),
    question: scqaQuestion(),
    answer: scqaAnswer({
      dqiScore: result.overallScore,
      grade,
      totalRisks,
      criticalRisks,
      topConcern: topFinding?.label,
      topMitigation,
    }),
    dqi: {
      score: result.overallScore,
      grade,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────
// Public composer
// ──────────────────────────────────────────────────────────────────────

/**
 * Compose a presentation-ready AuditDeliverable from a raw
 * AnalysisResult. Pure function — deterministic given the same input.
 *
 * The caller may pass pre-fetched LLM-augmented action titles via
 * `options.actionTitles`; any missing keys fall back to the
 * deterministic templates. Templates ALWAYS produce a valid string.
 */
export function buildAuditDeliverable(
  result: AnalysisResult,
  options: BuildDeliverableOptions
): AuditDeliverable {
  // Auto-extract the decision size from the document when no ticket was supplied
  // manually, so the value-at-stake reveal ("this pattern puts ~$X at risk")
  // fires on cold UPLOADED audits — the Taktile move. Honest: null when nothing
  // confident is found → the DQI-lift fallback renders (never a fabricated $). A
  // manual ticket (the /demo form / Decision Frame) always wins.
  let effectiveOptions = options;
  if (!options.ticket) {
    const auto = extractTicketFromContent(result.structuredContent ?? '');
    if (auto) {
      effectiveOptions = { ...options, ticket: { amount: auto.amount, currency: auto.currency } };
    }
  }

  const reasoningRisks = bucketReasoningRisks(result, effectiveOptions);
  const stressTest = bucketStressTest(result, effectiveOptions);
  const historicalAnalogs = bucketHistoricalAnalogs(result, effectiveOptions);
  const counterfactuals = bucketCounterfactuals(result, effectiveOptions);
  const provenance = bucketProvenance(result, effectiveOptions);
  const cover = composeCover(result, reasoningRisks, counterfactuals, effectiveOptions);

  const id = effectiveOptions.analysisId ?? effectiveOptions.documentId;

  return {
    id,
    composedAt: new Date().toISOString(),
    cover,
    reasoningRisks,
    stressTest,
    historicalAnalogs,
    counterfactuals,
    provenance,
    source: {
      analysisResult: result,
      documentId: effectiveOptions.documentId,
      analysisId: effectiveOptions.analysisId,
      ticket: effectiveOptions.ticket,
    },
  };
}

// Re-exports for consumers
export { gradeFromScore };
export { BIAS_EDUCATION };
