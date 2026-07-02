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
import { truncate } from '@/lib/utils/string';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { METHODOLOGY_VERSION } from '@/lib/scoring/dqi';
import { PIPELINE_NODES } from '@/lib/data/pipeline-nodes';
import { MATRIX_DIMENSION } from '@/lib/ontology/interaction-matrix';
import { PLATFORM_BASELINE_SNAPSHOT } from '@/lib/learning/platform-baseline-snapshot';
import { computeFindingValueAtStake, formatExposureLabel } from './valueAtStake';
import { extractTicketFromContent } from './ticket-extractor';
import { buildReferenceClass } from './referenceClass';
import { getNamedPattern } from '@/lib/learning/named-patterns';
import { detectStrategicNodes } from './strategic-nodes';
import { detectResilienceMarkers } from './resilience-signature';
import { computeStructuralFragility } from './fragility-index';
import { computeQuantifiedExposure } from './quantified-exposure';
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
  SynthesizedCritical,
  ValueSuppressingChip,
} from './types';

const SEVERITY_ORDER: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

// ──────────────────────────────────────────────────────────────────────
// Cross-module critical synthesis (2026-07-02 — the blind-Fermi lesson)
//
// The audit caught the kill-shot (anchor-tenant concentration, CRITICAL)
// in Forgotten Questions + 4 red-team objections + a boardroom REJECT —
// while the Reasoning tab headlined "0 critical reasoning risks
// surfaced" and the cover said the memo "cleared the audit". The
// primary surface must NEVER contradict its sibling modules: when the
// bias lane is quiet, the severe adversarial findings are synthesized
// into it, and the cover reconciles with the strongest signal anywhere.
// ──────────────────────────────────────────────────────────────────────

interface CrossModuleSignals {
  /** The severe adversarial findings (critical/high FQs + red-team
   *  objections + boardroom REJECT votes), sorted critical-first,
   *  capped at 8. The headline count IS this list's length — one
   *  number everywhere, no count drift. */
  synthesized: SynthesizedCritical[];
  /** Compact label of the single strongest finding. */
  topConcern?: string;
}

function computeCrossModuleSignals(result: AnalysisResult): CrossModuleSignals {
  const items: SynthesizedCritical[] = [];

  const fqs = result.forgottenQuestions?.questions ?? [];
  for (const q of fqs) {
    const sev = (q.severity as Severity) ?? 'medium';
    if ((sev === 'critical' || sev === 'high') && q.question) {
      items.push({
        source: 'forgotten_question',
        severity: sev,
        label: q.question,
        detail: q.whyItMatters ?? '',
        sourceLabel: 'Historical analogs',
      });
    }
  }

  const redTeam = result.preMortem?.redTeam ?? [];
  for (const r of redTeam) {
    if (!r.objection) continue;
    items.push({
      source: 'red_team',
      severity: 'high',
      label: r.objection,
      detail: r.reasoning ?? r.targetClaim ?? '',
      sourceLabel: 'Stress test · red team',
    });
  }

  const twins = result.simulation?.twins ?? [];
  for (const t of twins) {
    if (t.vote !== 'REJECT') continue;
    items.push({
      source: 'boardroom',
      severity: 'high',
      label: `${t.name ?? 'Reviewer'} (${t.role ?? 'boardroom'}) votes REJECT`,
      detail: t.keyRiskIdentified ?? t.rationale ?? '',
      sourceLabel: 'Stress test · boardroom',
    });
  }

  const synthesized = items
    .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity])
    .slice(0, 8);

  return {
    synthesized,
    topConcern: synthesized[0] ? truncate(synthesized[0].label, 90) : undefined,
  };
}

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
  options: BuildDeliverableOptions,
  crossModule: CrossModuleSignals
): ReasoningRisksBucket {
  const biases = (result.biases ?? []).filter(b => b.found !== false);
  const patterns = extractNamedPatterns(result);
  const biasDetectionDegraded = options.degradedNodes?.includes('biasDetective') === true;

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
    // Join back to the canonical pattern for the buyer-facing narrative: what
    // it LEADS TO (consequence) + what to DO (fix). The reader reads for these,
    // not the mechanism name. Null-safe — an unmatched label falls back to the
    // mechanism-led rendering.
    const canonical = getNamedPattern(p.patternLabel);
    const biasKeys = p.biasTypes ?? canonical?.biasTypes ?? [];
    const finding: ReasoningRiskFinding = {
      kind: 'compound_pattern',
      id: p.patternLabel,
      label: p.patternLabel,
      chip: makeChip(severity, undefined),
      excerpt: '',
      // The mechanism / "how it compounds" body — prefer the runtime
      // description, fall back to the canonical.
      explanation: p.description ?? canonical?.description ?? '',
      mitigation: canonical?.fix ?? '',
      participatingBiases: biasKeys,
      participatingBiasLabels: biasKeys.map(formatBiasName),
      consequence: canonical?.consequence,
      fix: canonical?.fix,
      // Credibility grounding — where this reasoning risk has appeared before.
      // For a pattern, anchor on its first constituent bias.
      referenceClass: biasKeys.length > 0 ? buildReferenceClass(biasKeys[0], 3) : undefined,
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
    reasoningRisksActionTitle({
      counts,
      topBiasLabels,
      topPatternLabels,
      crossModuleCriticals: crossModule.synthesized.length,
      biasDetectionDegraded,
    });

  // The cross-class attack path — the structural / execution / information
  // conditions in the document that multiply the biases into the outcome.
  // Pure text detection, no LLM, no scoring impact.
  const strategicExposure = detectStrategicNodes(result.structuredContent ?? '');

  // Cross-module synthesis (2026-07-02): when the bias lane is empty but
  // the adversarial modules carry severe findings, they render IN this
  // bucket — the primary surface must never read empty while the
  // kill-shot sits one tab over.
  const synthesizedCriticals =
    findings.length === 0 && crossModule.synthesized.length > 0
      ? crossModule.synthesized
      : undefined;

  return {
    actionTitle,
    findings,
    counts,
    ...(strategicExposure.length > 0 ? { strategicExposure } : {}),
    ...(synthesizedCriticals ? { synthesizedCriticals } : {}),
    ...(biasDetectionDegraded ? { biasDetectionDegraded } : {}),
  };
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

  // Bias-derived candidates (the original path). Order preserved so a
  // biases-only audit produces byte-identical scenarios to the prior code.
  const biasCandidates = sortBySeverity(
    biases.map(b => ({ ...b, severity: (b.severity as Severity) ?? ('medium' as Severity) }))
  ).map(b => ({
    severity: b.severity as Severity,
    scenario: {
      targetFindingId: b.biasType,
      targetLabel: formatBiasName(b.biasType),
      mitigation: b.suggestion ?? '',
    },
  }));

  // Forgotten-Question-derived candidates (2026-07-02 — co-work P1 from the
  // blind Victoria's Secret run: ALL findings surfaced as Forgotten
  // Questions with ZERO bias-shaped findings, so the "what to fix" lane
  // rendered empty — the 4th thing a buyer reads for. Every Forgotten
  // Question implies its own mitigation: put the question to the deal team
  // and answer it in the memo before commitment. FQs whose guarded bias
  // already has a bias-derived scenario are skipped — the bias card carries
  // the sharper fix. FQ targetFindingIds deliberately don't match bucket-1
  // finding ids, so the lift-chart sync simply doesn't highlight them.)
  const normalizeKey = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const scenarioedBiasKeys = new Set(
    biasCandidates.map(c => normalizeKey(c.scenario.targetFindingId))
  );
  const fqCandidates = (result.forgottenQuestions?.questions ?? [])
    // Index BEFORE filtering so targetFindingId traces back to the
    // position in the audit's Forgotten Questions list, not a
    // filter-dependent renumbering.
    .map((q, i) => ({ q, i }))
    .filter(
      ({ q }) =>
        q.question && (!q.biasGuarded || !scenarioedBiasKeys.has(normalizeKey(q.biasGuarded)))
    )
    .map(({ q, i }) => ({
      severity: (q.severity as Severity) ?? ('medium' as Severity),
      scenario: {
        targetFindingId: `forgotten_question_${i}`,
        targetLabel: `the unanswered question: "${truncate(q.question, 64)}"`,
        mitigation:
          `Answer this in the memo before commitment: ${q.question}` +
          (q.whyItMatters ? ` Why it matters: ${q.whyItMatters}` : ''),
      },
    }));

  // Merge, rank by severity (stable sort keeps bias candidates ahead of
  // equal-severity FQs — the sharper fix leads), cap at 5, then project the
  // DQI lift with the same conservative heuristic as before.
  const scenarios: CounterfactualScenario[] = [...biasCandidates, ...fqCandidates]
    .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity])
    .slice(0, 5) // Top 5 mitigation candidates
    .map(c => {
      const lift = SEVERITY_LIFT[c.severity] ?? 1;
      const projectedDqi = Math.min(100, currentDqi + lift);
      return {
        ...c.scenario,
        projectedDqi,
        delta: projectedDqi - currentDqi,
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
      topScenarioDelta: scenarios[0]?.delta,
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
  options: BuildDeliverableOptions,
  crossModule: CrossModuleSignals
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
  const crossModuleCriticals = crossModule.synthesized.length;
  const biasDetectionDegraded = options.degradedNodes?.includes('biasDetective') === true;

  // Top concern: highest-severity finding (bias or pattern)
  const topFinding = reasoningRisks.findings[0];
  const topMitigation = counterfactuals.scenarios[0]?.mitigation;

  // Exposure label only when ticket is supplied AND the top finding has
  // a valueAtStake (otherwise null gracefully)
  const exposureLabel =
    topFinding?.valueAtStake && options.ticket
      ? formatExposureLabel(topFinding.valueAtStake)
      : undefined;

  // When the highest-severity finding is a compound (toxic-combination) pattern
  // AND it carries exposure, the hero names that pattern — the differentiator.
  const topPatternName =
    topFinding?.kind === 'compound_pattern' && exposureLabel ? topFinding.label : undefined;

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
      topPatternName,
      crossModuleCriticals,
      biasDetectionDegraded,
    });

  // The actuarial top-line — consolidate the per-finding value-at-stake into
  // one headline "this audit surfaces ~$X exposure" statement with the
  // derivation + the precedent. Null-safe (no ticket → no number).
  const quantifiedExposure = computeQuantifiedExposure(reasoningRisks.findings);

  // The structural-fragility SECOND AXIS (2026-07-02). The DQI measures risk
  // density (boldness); this measures whether the STRUCTURE absorbs a shock or
  // cascades. Fragility conditions (already detected into strategicExposure)
  // offset by the resilience markers the engine now CREDITS (staging, reserves,
  // exit triggers, optionality, diversification). Orthogonal to the DQI,
  // display-only — the risk × fragility 2×2. Omitted when nothing was detected.
  const resilienceMarkers = detectResilienceMarkers(result.structuredContent ?? '');
  const fragilityNodes = reasoningRisks.strategicExposure ?? [];
  const structuralFragility =
    fragilityNodes.length > 0 || resilienceMarkers.length > 0
      ? computeStructuralFragility(fragilityNodes, resilienceMarkers)
      : undefined;

  return {
    actionTitle,
    quantifiedExposure,
    situation: scqaSituation(),
    complication: scqaComplication({
      dqiScore: result.overallScore,
      grade,
      totalRisks,
      criticalRisks,
      topConcern: topFinding?.label,
      topMitigation,
      crossModuleCriticals,
      topCrossModuleConcern: crossModule.topConcern,
      biasDetectionDegraded,
    }),
    question: scqaQuestion(),
    answer: scqaAnswer({
      dqiScore: result.overallScore,
      grade,
      totalRisks,
      criticalRisks,
      topConcern: topFinding?.label,
      topMitigation,
      crossModuleCriticals,
    }),
    dqi: {
      score: result.overallScore,
      grade,
    },
    ...(options.blindAudit ? { blindAudit: true } : {}),
    ...(options.degradedNodes && options.degradedNodes.length > 0
      ? { degradedNodes: options.degradedNodes }
      : {}),
    ...(structuralFragility ? { structuralFragility } : {}),
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

  // Cross-module signals computed ONCE — the reasoning bucket and the
  // cover both reconcile against the same list (one number everywhere).
  const crossModule = computeCrossModuleSignals(result);

  const reasoningRisks = bucketReasoningRisks(result, effectiveOptions, crossModule);
  const stressTest = bucketStressTest(result, effectiveOptions);
  const historicalAnalogs = bucketHistoricalAnalogs(result, effectiveOptions);
  const counterfactuals = bucketCounterfactuals(result, effectiveOptions);
  const provenance = bucketProvenance(result, effectiveOptions);
  const cover = composeCover(
    result,
    reasoningRisks,
    counterfactuals,
    effectiveOptions,
    crossModule
  );

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
