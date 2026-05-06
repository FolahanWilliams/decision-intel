/**
 * DPR Page Three — R²F Procurement Strips.
 *
 * Locked 2026-05-05 (Phase 2). The third page of the legal-evidence-record
 * arc. Five R²F-anchored signals (locked 2026-04-30 in the Kahneman & Klein
 * 2009 paper-application sprint) render as severity-colored strips:
 *
 *   §4.1 — Validity Classification (Kahneman & Klein 2009 first condition)
 *   §4.2 — Reference Class Forecast (Kahneman & Lovallo 2003)
 *   §4.3 — Feedback Adequacy (Kahneman & Klein 2009 second condition)
 *   §4.4 — Org Calibration (Cloverpop-defense — proves the DQI is
 *          calibrated against THIS org's outcomes)
 *   §4.5 — Counterfactual Impact (top-3 bias scenarios with expected
 *          improvement)
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
    data.orgCalibration ||
    data.counterfactualImpact;

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
        strap='The five strips below operationalise Kahneman & Klein (2009) "Conditions for Intuitive Expertise." Each strip independently answers a question a procurement reviewer should be able to ask of any AI-augmented decision audit. When a signal cannot be honestly produced (insufficient data, novel decision class), the strip is omitted rather than fabricated.'
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

        {data.orgCalibration && <OrgCalibrationStrip oc={data.orgCalibration} />}

        {data.counterfactualImpact && <CounterfactualImpactStrip ci={data.counterfactualImpact} />}
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
      label="§4.4 · Org calibration"
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
      label="§4.5 · Counterfactual impact"
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
