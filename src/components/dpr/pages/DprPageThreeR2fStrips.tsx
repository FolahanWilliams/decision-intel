/**
 * DPR Page Three — R²F Procurement Strips.
 *
 * Locked 2026-05-05 (Phase 2), extended 2026-05-07 (wedge-batch-4 to 9
 * strips, completing the K&K 2009 paper-application sprint to 10 of 10).
 * The third page of the legal-evidence-record arc. Nine R²F-anchored
 * signals render as severity-colored strips:
 *
 *   §4.1 — Validity Classification (Kahneman & Klein 2009 first condition)
 *   §4.2 — Reference Class Forecast (Kahneman & Lovallo 2003)
 *   §4.3 — Feedback Adequacy (Kahneman & Klein 2009 second condition)
 *   §4.4 — Confidence Calibration (paper-app #10, Item 3 lock 2026-05-07)
 *          — integrates §4.1 + §4.3 against bias-detective confidence-
 *          language hits to produce the Margaret-class verdict
 *   §4.5 — Org Calibration (Cloverpop-defense — proves the DQI is
 *          calibrated against THIS org's outcomes)
 *   §4.6 — Counterfactual Impact (top-3 bias scenarios with expected
 *          improvement)
 *   §4.7 — Class-Specific Calibration (paper-app #1, wedge-batch-4 lock
 *          2026-05-07) — Fractionation of Expertise; per-class slice of
 *          the author's outcome history. Closes the "your feedback is
 *          sparse FOR WHICH class?" gap §4.3 leaves ambiguous.
 *   §4.8 — Rubric Structure (paper-app #4, Dawes 1979 "The Robust
 *          Beauty of Improper Linear Models") — pure-function scan for
 *          rubric markers vs narrative-coherence signals.
 *   §4.9 — Algorithm Trust (paper-app #7, Dietvorst, Simmons & Massey
 *          2015 "Algorithm Aversion") — flags dismissive-of-quantitative
 *          language as a documented decision-making error rather than
 *          letting it pass as judgment.
 *
 * Each strip is independent — when an audit lacks data for a strip, that
 * strip is silently omitted (no fabrication). The procurement reader sees
 * only the signals the audit could honestly produce.
 */

import { DprPageShell } from '../primitives/DprPageShell';
import { DprSection } from '../primitives/DprSection';
import { DprRiskStrip, type DprSeverity } from '../primitives/DprRiskStrip';
import { DprNotice } from '../primitives/DprNotice';
import type { ProvenanceRecordData } from '@/lib/reports/provenance-record-data';
import type { ValidityClassification } from '@/lib/learning/validity-classifier';
import type { ReferenceClassForecast } from '@/lib/learning/reference-class-forecast';
import type { FeedbackAdequacy } from '@/lib/learning/feedback-adequacy';
import type { CalibratedRejection } from '@/lib/learning/calibrated-rejection';
import type { FractionationOfExpertise } from '@/lib/learning/fractionation-of-expertise';
import {
  fractionationVerdictLabel,
  decisionClassLabel,
} from '@/lib/learning/fractionation-of-expertise';
import type { DecisionRubric } from '@/lib/learning/decision-rubric';
import { decisionRubricVerdictLabel } from '@/lib/learning/decision-rubric';
import type { AlgorithmAversion } from '@/lib/learning/algorithm-aversion';
import { algorithmAversionVerdictLabel } from '@/lib/learning/algorithm-aversion';
import type { SynergyDefensibilitySummary } from '@/lib/parsers/synergy-model-parser';

export interface DprPageThreeR2fStripsProps {
  data: ProvenanceRecordData;
  pageNumber: number;
  totalPages: number;
  classification?: 'sample' | 'specimen' | 'confidential' | 'client-safe-export';
  auditTimestamp: string;
  footerTitle?: string;
}

export function DprPageThreeR2fStrips(props: DprPageThreeR2fStripsProps) {
  const {
    data,
    pageNumber,
    totalPages,
    classification = 'confidential',
    auditTimestamp,
    footerTitle = 'Decision Provenance Record',
  } = props;

  const hasAnyStrip =
    data.validityClassification ||
    data.referenceClassForecast ||
    data.feedbackAdequacy ||
    data.calibratedRejection ||
    data.orgCalibration ||
    data.counterfactualImpact ||
    data.fractionationOfExpertise ||
    data.decisionRubric ||
    data.algorithmAversion ||
    data.synergyDefensibility;

  return (
    <DprPageShell
      pageNumber={pageNumber}
      totalPages={totalPages}
      classification={classification}
      documentTitle={footerTitle}
      auditTimestamp={auditTimestamp}
    >
      <DprSection
        marker="§4"
        eyebrow="Recognition-Rigor Framework"
        title="Procurement-grade audit signals"
        strap='The nine strips below operationalise Kahneman & Klein (2009) "Conditions for Intuitive Expertise" plus Kahneman & Lovallo (2003), Dawes (1979), and Dietvorst, Simmons & Massey (2015). Each strip independently answers a question a procurement reviewer should be able to ask of any AI-augmented decision audit. When a signal cannot be honestly produced (insufficient data, novel decision class), the strip is omitted rather than fabricated.'
      >
        {!hasAnyStrip && (
          <DprNotice mark="Cold start">
            This audit predates the R²F instrumentation, or none of the five signals could be
            populated honestly. The audit verdict on page 1 stands; the procurement-grade
            methodology strips below populate progressively as your organisation closes outcomes and
            the platform calibrates.
          </DprNotice>
        )}

        {data.validityClassification && <ValidityStrip vc={data.validityClassification} />}

        {data.referenceClassForecast && <ReferenceClassStrip rc={data.referenceClassForecast} />}

        {data.feedbackAdequacy && <FeedbackAdequacyStrip fa={data.feedbackAdequacy} />}

        {data.calibratedRejection && <CalibratedRejectionStrip cr={data.calibratedRejection} />}

        {data.orgCalibration && <OrgCalibrationStrip oc={data.orgCalibration} />}

        {data.counterfactualImpact && <CounterfactualImpactStrip ci={data.counterfactualImpact} />}

        {data.fractionationOfExpertise && (
          <FractionationStrip frac={data.fractionationOfExpertise} />
        )}

        {data.decisionRubric && <DecisionRubricStrip rubric={data.decisionRubric} />}

        {data.algorithmAversion && <AlgorithmAversionStrip aversion={data.algorithmAversion} />}

        {data.synergyDefensibility && (
          <SynergyDefensibilityStrip sd={data.synergyDefensibility} />
        )}
      </DprSection>

      <DprNotice mark="On vocabulary">
        The R²F is the platform&apos;s integration of Kahneman&apos;s rigour (System 2 debiasing)
        and Klein&apos;s recognition (System 1 amplification), arbitrated in one pipeline. Anchor
        citation: Kahneman & Klein (2009) &ldquo;Conditions for Intuitive Expertise: a failure to
        disagree.&rdquo; Methodology version active at audit time is recorded with the prompt
        fingerprint on page 1 — divergent re-runs surface as fingerprint mismatches.
      </DprNotice>
    </DprPageShell>
  );
}

// ─── Per-strip components ────────────────────────────────────────

function ValidityStrip({ vc }: { vc: ValidityClassification }) {
  const severity: DprSeverity =
    vc.validityClass === 'high'
      ? 'low'
      : vc.validityClass === 'medium'
        ? 'info'
        : vc.validityClass === 'low'
          ? 'medium'
          : 'critical';
  const band =
    vc.validityClass === 'high'
      ? 'High validity environment'
      : vc.validityClass === 'medium'
        ? 'Medium validity environment'
        : vc.validityClass === 'low'
          ? 'Low validity environment'
          : 'Zero validity environment';
  const headline =
    vc.validityClass === 'high'
      ? 'Pattern-recognition-tractable domain — give the audit verdict moderate weight.'
      : vc.validityClass === 'medium'
        ? 'Mixed-validity domain — verdict survives lenses, but treat narrative coherence as a warning sign.'
        : vc.validityClass === 'low'
          ? 'Low-validity domain — narrative coherence does NOT confer credibility. Methodology v2.1.0 reweighs toward historical alignment + bias load and away from evidence quality.'
          : 'Zero-validity domain — pattern recognition is unreliable here. The audit treats every confident claim as a flag for skeptical review.';

  return (
    <DprRiskStrip
      label="§4.1 · Validity"
      band={band}
      severity={severity}
      headline={headline}
      footRows={[
        { k: 'Document type', v: vc.signals.documentType ?? '—' },
        { k: 'Industry', v: vc.signals.industry ?? '—' },
        { k: 'Decision horizon', v: vc.signals.decisionHorizon ?? '—' },
      ]}
    >
      {vc.rationale}. Per Kahneman & Klein (2009), validity is the first precondition for
      trustworthy intuition; in low- and zero-validity environments the audit methodology shifts
      weights to compensate for the documented unreliability of pattern recognition in those
      domains.
    </DprRiskStrip>
  );
}

function ReferenceClassStrip({ rc }: { rc: ReferenceClassForecast }) {
  const severity: DprSeverity =
    rc.predictedOutcomeBand === 'reference_class_succeeds'
      ? 'low'
      : rc.predictedOutcomeBand === 'reference_class_mixed'
        ? 'info'
        : rc.predictedOutcomeBand === 'reference_class_struggles'
          ? 'medium'
          : rc.predictedOutcomeBand === 'reference_class_fails'
            ? 'critical'
            : 'info';
  const band = (() => {
    switch (rc.predictedOutcomeBand) {
      case 'reference_class_succeeds':
        return 'Favourable base rate';
      case 'reference_class_mixed':
        return 'Mixed base rate';
      case 'reference_class_struggles':
        return 'Challenging base rate';
      case 'reference_class_fails':
        return 'Hostile base rate';
      default:
        return 'Reference class too small';
    }
  })();

  const failurePct =
    rc.baselineFailureRate != null ? `${Math.round(rc.baselineFailureRate * 100)}%` : '—';

  return (
    <DprRiskStrip
      label="§4.2 · Reference class forecast"
      band={band}
      severity={severity}
      headline={
        rc.matchedClassSize >= 3
          ? `${rc.matchedClassSize} historically-similar decisions; ${failurePct} failed.`
          : 'Reference class too small for a stable forecast — treat the audit verdict as cold-start.'
      }
      footRows={[
        {
          k: 'Pool searched',
          v: `${rc.poolSize} cases · ${rc.matchedClassSize} matched`,
        },
        {
          k: 'Top analog',
          v: rc.topAnalogs[0]
            ? `${rc.topAnalogs[0].title} (${rc.topAnalogs[0].year}) · sim ${(rc.topAnalogs[0].similarityScore * 100).toFixed(0)}%`
            : '—',
        },
        {
          k: 'Baseline sample',
          v: `${rc.baselineSampleSize} closed cases`,
        },
      ]}
    >
      {rc.note} Per Kahneman & Lovallo (2003) &ldquo;Delusions of Success,&rdquo; the inside-view
      narrative ALWAYS feels more compelling than the outside-view base rate — but the base rate
      wins on average. The memo&apos;s confidence should be calibrated against the matched-class
      failure rate, not against the inside-view story.
    </DprRiskStrip>
  );
}

function FeedbackAdequacyStrip({ fa }: { fa: FeedbackAdequacy }) {
  const severity: DprSeverity =
    fa.verdict === 'adequate'
      ? 'low'
      : fa.verdict === 'sparse'
        ? 'medium'
        : fa.verdict === 'cold_start'
          ? 'critical'
          : 'info';
  const band = (() => {
    switch (fa.verdict) {
      case 'adequate':
        return 'Adequate feedback';
      case 'sparse':
        return 'Sparse feedback';
      case 'cold_start':
        return 'Cold start';
      default:
        return 'Unknown';
    }
  })();

  return (
    <DprRiskStrip
      label="§4.3 · Feedback adequacy"
      band={band}
      severity={severity}
      headline={
        fa.verdict === 'adequate'
          ? 'Sufficient closed-loop feedback for calibrated intuition.'
          : fa.verdict === 'sparse'
            ? 'Few closed-loop outcomes — experience-based claims should be cross-checked against external base rates.'
            : 'Insufficient closed-loop feedback. Treat experience-based confidence with cold-start scrutiny.'
      }
      footRows={[
        { k: 'Closed outcomes (lifetime)', v: fa.closedOutcomes.toString() },
        { k: 'Recent (18 months)', v: fa.recentClosedOutcomes.toString() },
        {
          k: 'Mean Brier',
          v: fa.meanBrier != null ? fa.meanBrier.toFixed(3) : '—',
        },
        {
          k: 'Days since last outcome',
          v: fa.daysSinceLastOutcome != null ? fa.daysSinceLastOutcome.toString() : '—',
        },
      ]}
    >
      {fa.note} Per Kahneman & Klein (2009), the second precondition for trustworthy intuition is
      adequate opportunity to learn from rapid feedback. Domains with sparse feedback (M&A, market
      entry, long-horizon strategy) require independent base-rate cross-checks even when the
      operator is highly experienced.
    </DprRiskStrip>
  );
}

function CalibratedRejectionStrip({ cr }: { cr: CalibratedRejection }) {
  // Item 3 lock 2026-05-07. Severity ladder mirrors the verdict ladder:
  // well_calibrated → low (green); mildly → info; materially → medium;
  // severely → critical; cannot_assess → info (honest fallback).
  const severity: DprSeverity =
    cr.verdict === 'well_calibrated'
      ? 'low'
      : cr.verdict === 'mildly_overconfident'
        ? 'info'
        : cr.verdict === 'materially_overconfident'
          ? 'medium'
          : cr.verdict === 'severely_overconfident'
            ? 'critical'
            : 'info';

  const band = (() => {
    switch (cr.verdict) {
      case 'well_calibrated':
        return 'Calibrated';
      case 'mildly_overconfident':
        return 'Mildly overconfident';
      case 'materially_overconfident':
        return 'Materially overconfident';
      case 'severely_overconfident':
        return 'Severely overconfident';
      case 'cannot_assess':
        return 'Cannot assess';
    }
  })();

  return (
    <DprRiskStrip
      label="§4.4 · Confidence calibration"
      band={band}
      severity={severity}
      headline={
        cr.verdict === 'well_calibrated'
          ? 'Memo confidence in range of what validity + feedback adequacy support.'
          : cr.verdict === 'mildly_overconfident'
            ? 'Some confidence-language hits — surface but no audit-committee flag fires.'
            : cr.verdict === 'materially_overconfident'
              ? 'Audit-committee-readiness flag: memo projects more certainty than evidence supports.'
              : cr.verdict === 'severely_overconfident'
                ? 'Procurement-blocker: confidence language structurally unsupported by validity × feedback adequacy.'
                : 'Calibration cannot be assessed — feedback adequacy lookup unavailable.'
      }
      footRows={[
        { k: 'Calibration gap', v: cr.calibrationGap.toFixed(2) },
        { k: 'Rhetorical confidence', v: cr.rhetoricalConfidenceScore.toFixed(2) },
        { k: 'Earned confidence', v: cr.earnedConfidenceScore.toFixed(2) },
        {
          k: 'Triggers',
          v: cr.triggers.length > 0 ? cr.triggers.slice(0, 2).join(', ') : 'none',
        },
      ]}
    >
      {cr.note} Per Kahneman &amp; Klein (2009) &ldquo;Conditions for Intuitive Expertise,&rdquo;
      subjective confidence is a valid accuracy indicator only when BOTH conditions hold —
      high-validity environment AND adequate closed-loop feedback. The Calibrated Rejection detector
      is the procurement-grade integration of strips §4.1 + §4.3 against the bias detective&apos;s
      confidence-language hits.
    </DprRiskStrip>
  );
}

function OrgCalibrationStrip({ oc }: { oc: NonNullable<ProvenanceRecordData['orgCalibration']> }) {
  const isOrg = oc.source === 'org';
  const severity: DprSeverity =
    oc.brierCategory === 'excellent' || oc.brierCategory === 'good'
      ? 'low'
      : oc.brierCategory === 'fair'
        ? 'info'
        : oc.brierCategory === 'poor'
          ? 'medium'
          : 'critical';

  const band = isOrg
    ? `${oc.outcomesClosed} outcomes · ${oc.brierCategory ?? 'fair'} band`
    : 'Platform seed baseline';

  const recalibrated = oc.recalibratedFromOriginal;

  return (
    <DprRiskStrip
      label="§4.5 · Org calibration"
      band={band}
      severity={severity}
      headline={
        isOrg
          ? `Calibrated against ${oc.outcomesClosed} closed decisions for this organisation${
              oc.meanBrierScore != null ? ` · mean Brier ${oc.meanBrierScore.toFixed(3)}` : ''
            }${
              recalibrated
                ? ` · recalibrated ${recalibrated.delta > 0 ? '+' : ''}${recalibrated.delta} from absolute`
                : ''
            }.`
          : `Platform seed baseline · ${oc.platformSeed?.n ?? 143}-case reference-class corpus from primary sources.`
      }
      footRows={
        isOrg
          ? [
              { k: 'Decisions tracked', v: oc.decisionsTracked.toString() },
              { k: 'Outcomes closed', v: oc.outcomesClosed.toString() },
              {
                k: 'Mean Brier',
                v: oc.meanBrierScore != null ? oc.meanBrierScore.toFixed(3) : '—',
              },
              { k: 'Calibration band', v: oc.brierCategory ?? '—' },
            ]
          : oc.platformSeed
            ? [
                { k: 'Case library', v: `${oc.platformSeed.n} cases` },
                {
                  k: 'Mean Brier',
                  v: oc.platformSeed.meanBrier.toFixed(3),
                },
                {
                  k: 'Classification accuracy',
                  v: `${(oc.platformSeed.classificationAccuracy * 100).toFixed(1)}%`,
                },
                {
                  k: 'Methodology',
                  v: oc.platformSeed.methodologyVersion,
                },
              ]
            : []
      }
    >
      {oc.calibrationNote}{' '}
      {isOrg
        ? 'The DQI shown on this audit reflects this organisation’s calibrated-by-outcome history; per-org calibration is the platform’s structural answer to the Cloverpop data-advantage attack vector.'
        : 'Per-org calibration replaces this seed once your organisation closes its first outcome via the Outcome Gate. The seed is derived from running the same DQI methodology over the platform’s case library with hindsight neutralised.'}
    </DprRiskStrip>
  );
}

function CounterfactualImpactStrip({
  ci,
}: {
  ci: NonNullable<ProvenanceRecordData['counterfactualImpact']>;
}) {
  const severity: DprSeverity =
    ci.weightedImprovementPct >= 12 ? 'high' : ci.weightedImprovementPct >= 6 ? 'medium' : 'low';

  const top = ci.scenarios[0];

  return (
    <DprRiskStrip
      label="§4.6 · Counterfactual impact"
      band={`+${ci.weightedImprovementPct.toFixed(1)}% if all flagged biases addressed`}
      severity={severity}
      headline={
        top
          ? `Top scenario: addressing ${top.biasLabel} alone would have lifted the verdict by ${top.expectedImprovementPct.toFixed(1)}%.`
          : 'Counterfactual scenarios surface here when the audit flags biases with measurable improvement signals.'
      }
      footRows={ci.scenarios.slice(0, 3).map(s => ({
        k: s.biasLabel,
        v: `+${s.expectedImprovementPct.toFixed(1)}% · n=${s.historicalSampleSize}`,
      }))}
    >
      {ci.methodologyNote}
      {!ci.monetaryAnchorAvailable
        ? ' Estimates are capped to percentage points; this audit lacks a monetary anchor (no DecisionFrame value attached).'
        : ''}
    </DprRiskStrip>
  );
}

function FractionationStrip({ frac }: { frac: FractionationOfExpertise }) {
  // Wedge-batch-4 lock 2026-05-07. R²F paper-app #1.
  const severity: DprSeverity =
    frac.verdict === 'class_calibrated'
      ? 'low'
      : frac.verdict === 'broadly_calibrated'
        ? 'medium'
        : frac.verdict === 'fractionated_uncalibrated'
          ? 'high'
          : 'info';

  const headline =
    frac.verdict === 'class_calibrated'
      ? `Author has calibrated track record on ${decisionClassLabel(frac.detectedClass)} specifically.`
      : frac.verdict === 'broadly_calibrated'
        ? `Author has aggregate outcomes but only ${frac.thisClassRecentOutcomes} on ${decisionClassLabel(frac.detectedClass)} — sub-domain calibration matters per K&K 2009.`
        : frac.verdict === 'fractionated_uncalibrated'
          ? `Fractionation pattern: track record exists on adjacent classes but NOT on ${decisionClassLabel(frac.detectedClass)} — the canonical "senior expert, wrong sub-domain" failure mode.`
          : frac.verdict === 'broadly_cold_start'
            ? `Insufficient closed-loop outcomes across all decision classes — treat experience claims as cold-start.`
            : `Fractionation cannot be assessed — outcome lookup unavailable.`;

  const topClasses = frac.classBreakdown.slice(0, 3);

  return (
    <DprRiskStrip
      label="§4.7 · Class-specific calibration"
      band={fractionationVerdictLabel(frac.verdict)}
      severity={severity}
      headline={headline}
      footRows={[
        { k: 'Detected class', v: decisionClassLabel(frac.detectedClass) },
        {
          k: 'This-class outcomes (18mo)',
          v: frac.thisClassRecentOutcomes.toString(),
        },
        ...topClasses.map(row => ({
          k: decisionClassLabel(row.decisionClass),
          v: `${row.recentOutcomes} recent · ${row.outcomes} total · ${row.verdict}`,
        })),
      ]}
    >
      {frac.note} Per Kahneman &amp; Klein (2009), expert validity is sub-domain-specific — a senior
      expert can be calibrated on M&amp;A integration and cold-start on market entry. The
      Fractionation of Expertise detector slices the author&apos;s outcome history per decision
      class and contrasts this-class to other-class calibration.
    </DprRiskStrip>
  );
}

function DecisionRubricStrip({ rubric }: { rubric: DecisionRubric }) {
  // Wedge-batch-4 lock 2026-05-07. R²F paper-app #4 (Dawes 1979).
  const severity: DprSeverity =
    rubric.verdict === 'explicit_rubric'
      ? 'low'
      : rubric.verdict === 'partial_criteria'
        ? 'info'
        : rubric.verdict === 'narrative_dominant'
          ? 'medium'
          : rubric.verdict === 'narrative_only'
            ? 'critical'
            : 'info';

  const headline =
    rubric.verdict === 'explicit_rubric'
      ? `Memo follows Dawes' (1979) robust pattern — criteria + weights + systematic comparison.`
      : rubric.verdict === 'partial_criteria'
        ? `Some structural rubric markers detected but the full robust pattern is incomplete.`
        : rubric.verdict === 'narrative_dominant'
          ? `Narrative-dominant memo with confidence-language hits — the inside-view error pattern Dawes (1979) showed reduces predictive accuracy.`
          : rubric.verdict === 'narrative_only'
            ? `Procurement-blocker class: the canonical Dawes-failure pattern — narrative-only with multiple confidence-language hits and no structural counter-signal.`
            : `Decision rubric structure cannot be assessed — insufficient signal in available excerpts.`;

  return (
    <DprRiskStrip
      label="§4.8 · Rubric structure"
      band={decisionRubricVerdictLabel(rubric.verdict)}
      severity={severity}
      headline={headline}
      footRows={[
        { k: 'Structure score', v: rubric.structureScore.toFixed(2) },
        { k: 'Narrative score', v: rubric.narrativeScore.toFixed(2) },
        {
          k: 'Markers detected',
          v:
            rubric.structuralMarkers.length > 0
              ? rubric.structuralMarkers.slice(0, 3).join(', ')
              : 'none',
        },
        {
          k: 'Narrative triggers',
          v:
            rubric.narrativeTriggers.length > 0
              ? rubric.narrativeTriggers.slice(0, 2).join(', ')
              : 'none',
        },
      ]}
    >
      {rubric.note} Per Dawes (1979) &ldquo;The Robust Beauty of Improper Linear Models in Decision
      Making,&rdquo; a simple equal-weight rubric outperforms expert intuition + rubric override.
      The most reliable memos identify decision criteria, weight them, and evaluate options
      systematically; the least reliable argue narrative coherence for a foregone conclusion.
    </DprRiskStrip>
  );
}

function SynergyDefensibilityStrip({ sd }: { sd: SynergyDefensibilitySummary }) {
  // Locked 2026-05-09 (M&A cascade depth ship). Surfaces the synergy-model
  // parser output on the DPR cover when documentType === 'synergy_model'.
  // Severity is driven by the fully-defended percentage and the count of
  // critical claims in the portfolio:
  //   - any claim at critical severity → critical
  //   - fullyDefendedPct < 50% → high
  //   - fullyDefendedPct < 70% → medium
  //   - fullyDefendedPct >= 70% → low
  const criticalCount = sd.topClaims.filter(c => c.severity === 'critical').length;
  const highCount = sd.topClaims.filter(c => c.severity === 'high').length;
  let severity: DprSeverity;
  if (criticalCount > 0) severity = 'critical';
  else if (sd.fullyDefendedPct < 50) severity = 'high';
  else if (sd.fullyDefendedPct < 70) severity = 'medium';
  else severity = 'low';

  const band =
    severity === 'critical'
      ? 'Synergy Mirage critical'
      : severity === 'high'
        ? 'Under-defended'
        : severity === 'medium'
          ? 'Partially defended'
          : 'Well defended';

  const headline =
    sd.totalClaims === 0
      ? 'No synergy claims extracted from the spreadsheet — synergy model may be narrative-only or the parser bailed out.'
      : criticalCount > 0
        ? `${criticalCount} synergy claim(s) at critical severity — Synergy Mirage fires on the portfolio. ${highCount} additional claims at high severity.`
        : sd.fullyDefendedPct < 50
          ? `${100 - sd.fullyDefendedPct}% of claims under-defended — synergy model has structural Synergy Mirage exposure across the portfolio.`
          : sd.fullyDefendedPct < 70
            ? `Mixed defensibility — ${sd.fullyDefendedPct}% of claims fully defended; the under-defended share carries Synergy Mirage risk.`
            : `${sd.fullyDefendedPct}% of claims fully defended (mechanism + owner + milestone). Apply BCG/McKinsey base-rate realisation discount before underwriting.`;

  // Surface up to 2 top critical/high claims so the strip is procurement-grade
  // specific — names the labels the reviewer should attack.
  const topClaimsLine =
    sd.topClaims.length > 0
      ? sd.topClaims
          .slice(0, 2)
          .map(c => `${c.label} (${c.severity})`)
          .join(' · ')
      : 'no claims surfaced';

  return (
    <DprRiskStrip
      label="§4.10 · Synergy defensibility"
      band={band}
      severity={severity}
      headline={headline}
      footRows={[
        { k: 'Claims extracted', v: String(sd.totalClaims) },
        { k: 'Fully defended', v: `${sd.fullyDefendedPct}%` },
        { k: 'Confidence', v: sd.confidence },
        { k: 'Top claims', v: topClaimsLine },
      ]}
    >
      Per BCG / McKinsey integration-best-practices, every synergy claim should carry a named
      operational mechanism, an accountable executive, and a measurable 90-day milestone.
      Revenue synergies historically realise at 30-50% of projection; cost synergies at 60-80%.
      Apply the appropriate base-rate discount to claims that are not fully defended before
      underwriting the deal valuation.
    </DprRiskStrip>
  );
}

function AlgorithmAversionStrip({ aversion }: { aversion: AlgorithmAversion }) {
  // Wedge-batch-4 lock 2026-05-07. R²F paper-app #7 (Dietvorst 2015).
  const severity: DprSeverity =
    aversion.verdict === 'no_aversion_signal'
      ? 'low'
      : aversion.verdict === 'mild_aversion'
        ? 'info'
        : aversion.verdict === 'material_aversion'
          ? 'high'
          : aversion.verdict === 'severe_aversion'
            ? 'critical'
            : 'info';

  const headline =
    aversion.verdict === 'no_aversion_signal'
      ? `Memo treats quantitative + systematic analysis on its merits — no algorithm-aversion signal detected.`
      : aversion.verdict === 'mild_aversion'
        ? `Mild algorithm-aversion language detected — surface but no audit-committee flag fires.`
        : aversion.verdict === 'material_aversion'
          ? `Material algorithm-aversion pattern — memo dismisses systematic analysis in a way Dietvorst et al. (2015) named as a documented decision-making error.`
          : aversion.verdict === 'severe_aversion'
            ? `Procurement-blocker class: severe algorithm-aversion pattern — the canonical "experienced operator overruling the data" failure mode.`
            : `Algorithm-aversion verdict cannot be assessed — no scannable text.`;

  return (
    <DprRiskStrip
      label="§4.9 · Algorithm trust"
      band={algorithmAversionVerdictLabel(aversion.verdict)}
      severity={severity}
      headline={headline}
      footRows={[
        { k: 'Aversion score', v: aversion.aversionScore.toFixed(2) },
        { k: 'Dismissive phrases', v: aversion.dismissivePhraseCount.toString() },
        {
          k: 'Patterns',
          v:
            aversion.patternsDetected.length > 0
              ? aversion.patternsDetected.slice(0, 2).join(', ')
              : 'none',
        },
        {
          k: 'Compound bias hits',
          v:
            aversion.compoundBiasHits.length > 0
              ? aversion.compoundBiasHits.slice(0, 2).join(', ')
              : 'none',
        },
      ]}
    >
      {aversion.note} Per Dietvorst, Simmons &amp; Massey (2015) &ldquo;Algorithm Aversion: People
      Erroneously Avoid Algorithms After Seeing Them Err,&rdquo; humans are systematically more
      forgiving of human errors than equivalent algorithm errors. The detector flags dismissive-of-
      quantitative language as a documented bias rather than letting it pass as judgment — the
      counter-program to the most common buyer objection.
    </DprRiskStrip>
  );
}
