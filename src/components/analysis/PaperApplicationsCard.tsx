'use client';

import {
  Telescope,
  History,
  Activity,
  ExternalLink,
  Scale,
  Layers,
  ListChecks,
  Calculator,
} from 'lucide-react';
import type { ValidityClassification } from '@/lib/learning/validity-classifier';
import {
  MIN_DISPLAY_ANALOG_SIMILARITY,
  type ReferenceClassForecast,
} from '@/lib/learning/reference-class-forecast';
import type { FeedbackAdequacy } from '@/lib/learning/feedback-adequacy';
import type { CalibratedRejection } from '@/lib/learning/calibrated-rejection';
import { calibratedRejectionVerdictLabel } from '@/lib/learning/calibrated-rejection';
import type { FractionationOfExpertise } from '@/lib/learning/fractionation-of-expertise';
import {
  fractionationVerdictLabel,
  decisionClassLabel,
} from '@/lib/learning/fractionation-of-expertise';
import type { DecisionRubric } from '@/lib/learning/decision-rubric';
import { decisionRubricVerdictLabel } from '@/lib/learning/decision-rubric';
import type { AlgorithmAversion } from '@/lib/learning/algorithm-aversion';
import { algorithmAversionVerdictLabel } from '@/lib/learning/algorithm-aversion';
import { SignalBlock, SignalBlockGrid, type SignalBand } from '@/components/ui/SignalBlock';
import { useAnalysisInsights } from '@/hooks/useAnalysisInsights';

/**
 * PaperApplicationsCard — surfaces the three Kahneman-Klein-anchored
 * signals on the live audit (document detail). Mirrors the DPR cover-
 * page strips so a procurement reader sees the SAME bands before they
 * download the PDF.
 *
 * Refactored 2026-05-01 (Phase 2E, persona-validated layout):
 *  - Uses the canonical SignalBlock pattern (DESIGN.md §156) for each
 *    R²F surface — the procurement-grade signal-block aesthetic.
 *  - Plain-language eyebrows by default ("Validity" / "Outside View" /
 *    "Author Calibration") — three of four buyer personas (Margaret,
 *    Adaeze, Richard) said "Recognition-Rigor Framework signals" reads
 *    academic on a cold-context surface. The technical name + academic
 *    citation lives in the citation footer of each SignalBlock and in
 *    a tooltip on the eyebrow info icon.
 *  - Renders as a 3-column SignalBlockGrid that auto-collapses to
 *    single-column on mobile (~280px minimum card width).
 *
 * Data flow: fetches /api/analysis/[id]/insights on mount. The endpoint
 * returns the persisted validity band + live-computed reference-class
 * forecast + feedback adequacy. Typical response <50ms.
 */

// InsightsResponse shape moved to @/hooks/useAnalysisInsights as the
// shared canonical type. Both this card and VerdictBand read from the
// same module-level cache via useAnalysisInsights(analysisId).

// Validity Classification — Kahneman & Klein 2009 first condition.
const VALIDITY_VERDICT: Record<ValidityClassification['validityClass'], string> = {
  high: 'High-validity domain',
  medium: 'Medium-validity domain',
  low: 'Low-validity domain',
  zero: 'Zero-validity domain',
};
const VALIDITY_BAND: Record<ValidityClassification['validityClass'], SignalBand> = {
  high: 'low', // green — trust intuition
  medium: 'neutral',
  low: 'medium',
  zero: 'high',
};

// Reference Class Forecast — Kahneman & Lovallo 2003 HBR.
const RC_VERDICT: Record<ReferenceClassForecast['predictedOutcomeBand'], string> = {
  reference_class_succeeds: 'Favourable base rate',
  reference_class_mixed: 'Mixed base rate',
  reference_class_struggles: 'Challenging base rate',
  reference_class_fails: 'Hostile base rate',
  reference_class_too_small_to_judge: 'Structurally novel',
};
const RC_BAND: Record<ReferenceClassForecast['predictedOutcomeBand'], SignalBand> = {
  reference_class_succeeds: 'low',
  reference_class_mixed: 'medium',
  reference_class_struggles: 'high',
  reference_class_fails: 'critical',
  reference_class_too_small_to_judge: 'unknown',
};

// Feedback Adequacy — Kahneman & Klein 2009 second condition.
const FA_VERDICT: Record<FeedbackAdequacy['verdict'], string> = {
  adequate: 'Calibrated track record',
  sparse: 'Sparse track record',
  cold_start: 'Cold start · no history',
  unknown: 'Track record unavailable',
};
const FA_BAND: Record<FeedbackAdequacy['verdict'], SignalBand> = {
  adequate: 'low',
  sparse: 'medium',
  cold_start: 'unknown',
  unknown: 'unknown',
};

// Calibrated Rejection of Subjective Confidence — Kahneman & Klein 2009
// closes both conditions. Item 3 lock 2026-05-07. Renders as the 4th
// SignalBlock answering the Margaret-class CSO's most-asked question:
// "does this memo's confidence match the evidence?"
const CR_BAND: Record<CalibratedRejection['verdict'], SignalBand> = {
  well_calibrated: 'low',
  mildly_overconfident: 'medium',
  materially_overconfident: 'high',
  severely_overconfident: 'critical',
  cannot_assess: 'unknown',
};

// Fractionation of Expertise — Kahneman & Klein 2009. Wedge-batch-4
// lock 2026-05-07. Renders as the 5th SignalBlock answering the
// Margaret-class question "your feedback is sparse FOR WHICH class?"
const FRAC_BAND: Record<FractionationOfExpertise['verdict'], SignalBand> = {
  class_calibrated: 'low',
  broadly_calibrated: 'medium',
  fractionated_uncalibrated: 'high',
  broadly_cold_start: 'unknown',
  cannot_assess: 'unknown',
};

// Decision Rubric Structure — Dawes 1979. Wedge-batch-4 lock 2026-05-07.
// Renders as the 6th SignalBlock answering "did the memo follow Dawes'
// robust pattern (criteria + weights + comparison) or argue narrative
// coherence for a foregone conclusion?"
const RUBRIC_BAND: Record<DecisionRubric['verdict'], SignalBand> = {
  explicit_rubric: 'low',
  partial_criteria: 'neutral',
  narrative_dominant: 'medium',
  narrative_only: 'critical',
  cannot_assess: 'unknown',
};

// Algorithm Aversion — Dietvorst, Simmons & Massey 2015. Wedge-batch-4
// lock 2026-05-07. Renders as the 7th SignalBlock counter-programming
// the most common buyer objection ("we don't want AI overriding our
// CSO") by naming it as a documented decision-making error.
const AVERSION_BAND: Record<AlgorithmAversion['verdict'], SignalBand> = {
  no_aversion_signal: 'low',
  mild_aversion: 'neutral',
  material_aversion: 'high',
  severe_aversion: 'critical',
  cannot_assess: 'unknown',
};

export function PaperApplicationsCard({ analysisId }: { analysisId: string }) {
  // Shared module-level cache via useAnalysisInsights — VerdictBand
  // (J.2 + M.2 author-calibration chip) reads the same payload from the
  // same fetch, so the page only hits /api/analysis/[id]/insights once.
  const insights = useAnalysisInsights(analysisId);
  const data = insights.data;
  const loading = insights.status === 'loading';
  const error = insights.status === 'error' ? insights.error : null;

  if (loading) {
    return (
      <div
        style={{
          padding: 16,
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 'var(--fs-sm)',
        }}
      >
        Loading audit signals…
      </div>
    );
  }

  if (error || !data) {
    return null; // Silent failure — non-load-bearing on the audit page
  }

  const {
    validityClassification,
    referenceClassForecast,
    feedbackAdequacy,
    calibratedRejection,
    fractionationOfExpertise,
    decisionRubric,
    algorithmAversion,
  } = data;
  const rc = referenceClassForecast;
  const fa = feedbackAdequacy;
  const cr = calibratedRejection;
  const frac = fractionationOfExpertise;
  const rubric = decisionRubric;
  const aversion = algorithmAversion;

  // SIGNAL-GATING (2026-06-30): only render a detector card when it carries
  // real signal. The cold-start / cannot-assess / no-aversion states are dead
  // weight (the founder: "some aren't even relevant") — they tell the reader
  // nothing about THIS decision and just inflate the card wall. Validity always
  // has a band; the rest gate on whether they could actually assess.
  const showOutsideView = rc.baselineFailureRate !== null || rc.topAnalogs.length > 0;
  // Only NAME analogs that are actually similar — an opioid-fraud case at 22%
  // on a nuclear-IPO filing reads as broken pattern-matching (same floor as the
  // DPR strip). The base-rate metric still shows regardless.
  const displayAnalogs = rc.topAnalogs.filter(
    a => a.similarityScore >= MIN_DISPLAY_ANALOG_SIMILARITY
  );
  const showAuthorCalibration = fa.verdict === 'adequate' || fa.verdict === 'sparse';
  const showConfidence = cr.verdict !== 'cannot_assess';
  const showClassCalibration =
    frac.verdict !== 'cannot_assess' && frac.verdict !== 'broadly_cold_start';
  const showRubric = rubric.verdict !== 'cannot_assess';
  const showAlgoTrust =
    aversion.verdict !== 'no_aversion_signal' && aversion.verdict !== 'cannot_assess';

  return (
    <div style={{ marginBottom: 16 }}>
      <SignalBlockGrid minWidth={240}>
        {/* Validity (plain-language eyebrow). The technical name and academic
            citation live in the citation footer + tooltip. */}
        <SignalBlock
          compact
          eyebrow="Validity"
          icon={Telescope}
          verdict={VALIDITY_VERDICT[validityClassification.validityClass]}
          band={VALIDITY_BAND[validityClassification.validityClass]}
          rationale={validityClassification.rationale}
          tooltip="Validity Classification — Kahneman & Klein 2009 first condition for trustworthy intuition. In low- and zero-validity domains the DQI engine reweights toward historical alignment + bias load."
          citation={<>Kahneman &amp; Klein 2009 · methodology v2.1.0</>}
        />

        {/* Outside View (plain-language eyebrow for Reference Class Forecast). */}
        {showOutsideView && (
          <SignalBlock
            compact
            eyebrow="Outside View"
            icon={History}
            verdict={RC_VERDICT[rc.predictedOutcomeBand]}
            band={RC_BAND[rc.predictedOutcomeBand]}
            metric={
              rc.baselineFailureRate !== null
                ? `${Math.round(rc.baselineFailureRate * 100)}% historical fail rate · n=${rc.baselineSampleSize}`
                : null
            }
            rationale={rc.note}
            tooltip="Reference Class Forecast — Kahneman & Lovallo 2003 HBR 'Delusions of Success.' Top-5 historical analogs from the 143-case library, base-rate failure prediction."
            citation={<>Kahneman &amp; Lovallo 2003 · 143-case library</>}
          >
            {displayAnalogs.length > 0 && (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Closest historical analogs
                </div>
                {displayAnalogs.slice(0, 3).map(a => (
                  <a
                    key={a.caseId}
                    href={`/case-studies/${a.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '6px 8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.company}
                      </strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-3xs)' }}>
                        {a.year}
                      </span>
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 'var(--fs-3xs)',
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      sim {Math.round(a.similarityScore * 100)}%
                      <ExternalLink size={10} aria-hidden />
                    </span>
                  </a>
                ))}
              </div>
            )}
          </SignalBlock>
        )}

        {/* Author Calibration (plain-language eyebrow for Feedback Adequacy). */}
        {showAuthorCalibration && (
          <SignalBlock
            compact
            eyebrow="Author Calibration"
            icon={Activity}
            verdict={FA_VERDICT[fa.verdict]}
            band={FA_BAND[fa.verdict]}
            rationale={fa.note}
            tooltip="Feedback Adequacy — Kahneman & Klein 2009 second condition: has the author had enough closed-loop feedback in this domain to be calibrated? An 'adequate' verdict means experience-based confidence in this domain is trustworthy; 'sparse' or 'cold start' means treat experience claims with more scrutiny."
            citation={<>Kahneman &amp; Klein 2009 · author 18-month closed outcomes</>}
          />
        )}

        {/* Calibrated Rejection (plain-language eyebrow for the verdict
            band that closes both K&K conditions). Item 3 lock 2026-05-07.
            This is the Margaret-class CSO's most-asked question rendered
            as a verdict: "does the memo's confidence match the evidence?"
            The detector is a pure-function combination of the validity
            class + feedback adequacy + bias-detective hits on confidence-
            language patterns (illusion_of_validity / overconfidence /
            authority / anchoring). When the gap is material, the audit-
            committee-readiness flag fires. */}
        {showConfidence && (
          <SignalBlock
            compact
            eyebrow="Confidence Calibration"
            icon={Scale}
            verdict={calibratedRejectionVerdictLabel(cr.verdict)}
            band={CR_BAND[cr.verdict]}
            metric={
              cr.verdict !== 'cannot_assess'
                ? `gap ${cr.calibrationGap.toFixed(2)} · rhetoric ${cr.rhetoricalConfidenceScore.toFixed(2)} · earned ${cr.earnedConfidenceScore.toFixed(2)}`
                : null
            }
            rationale={cr.note}
            tooltip="Calibrated Rejection of Subjective Confidence — Kahneman & Klein 2009 closes both conditions. Subjective confidence is a valid accuracy indicator only when both validity AND feedback adequacy are present. The detector compares the memo's rhetorical confidence (proxied by bias-detective hits on illusion_of_validity / overconfidence / authority / anchoring) against the earned confidence (validity × feedback). Material gaps fire an audit-committee-readiness flag."
            citation={<>Kahneman &amp; Klein 2009 · paper-application #10</>}
          >
            {cr.triggers.length > 0 && (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Confidence-language triggers
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                  }}
                >
                  {cr.triggers.slice(0, 4).map((trig, i) => (
                    <span
                      key={`${trig}-${i}`}
                      style={{
                        fontSize: 'var(--fs-3xs)',
                        fontFamily: 'ui-monospace, monospace',
                        padding: '2px 6px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {trig}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </SignalBlock>
        )}

        {/* Fractionation of Expertise — Kahneman & Klein 2009. Wedge-
            batch-4 lock 2026-05-07. Per-class slicing of the author's
            outcome history; surfaces the detected decision class for
            this memo + the comparative track record on other classes.
            The procurement-grade answer to "your feedback is sparse —
            sparse FOR WHICH decision class?" */}
        {showClassCalibration && (
          <SignalBlock
            compact
            eyebrow="Class-Specific Calibration"
            icon={Layers}
            verdict={fractionationVerdictLabel(frac.verdict)}
            band={FRAC_BAND[frac.verdict]}
            metric={
              frac.verdict !== 'cannot_assess'
                ? `${decisionClassLabel(frac.detectedClass)} · ${frac.thisClassRecentOutcomes} this-class outcomes (18mo)`
                : null
            }
            rationale={frac.note}
            tooltip="Fractionation of Expertise — Kahneman & Klein 2009 finding that expert validity is sub-domain-specific. A senior expert can be calibrated on M&A integration but cold-start on market entry. The detector slices the author's outcome history by decision class and contrasts this-class to other-class calibration."
            citation={<>Kahneman &amp; Klein 2009 · paper-application #1</>}
          >
            {frac.classBreakdown.length > 1 && (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Track record by class
                </div>
                {frac.classBreakdown.slice(0, 4).map(row => (
                  <div
                    key={row.decisionClass}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '4px 8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>
                      {decisionClassLabel(row.decisionClass)}
                      {row.decisionClass === frac.detectedClass && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 'var(--fs-3xs)',
                            color: 'var(--accent-primary)',
                            fontWeight: 600,
                          }}
                        >
                          · this memo
                        </span>
                      )}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-3xs)' }}>
                      {row.recentOutcomes} recent · {row.outcomes} total · {row.verdict}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SignalBlock>
        )}

        {/* Decision Rubric Structure — Dawes 1979 "Improper Linear
            Models." Pure-function scan of bias excerpts for rubric
            markers vs narrative-coherence signals. The procurement-grade
            answer to "did the memo argue narrative coherence or follow
            Dawes' robust pattern?" */}
        {showRubric && (
          <SignalBlock
            compact
            eyebrow="Rubric Structure"
            icon={ListChecks}
            verdict={decisionRubricVerdictLabel(rubric.verdict)}
            band={RUBRIC_BAND[rubric.verdict]}
            metric={
              rubric.verdict !== 'cannot_assess'
                ? `structure ${rubric.structureScore.toFixed(2)} · narrative ${rubric.narrativeScore.toFixed(2)}`
                : null
            }
            rationale={rubric.note}
            tooltip="Decision Rubric Structure — Dawes (1979) 'The Robust Beauty of Improper Linear Models in Decision Making.' A simple equal-weight rubric outperforms expert intuition + rubric override. The detector scans for structural rubric markers (criteria + weights + comparison) and contrasts them with narrative-coherence signals (illusion_of_validity / inside_view_dominance hits)."
            citation={<>Dawes 1979 · paper-application #4</>}
          >
            {rubric.structuralMarkers.length > 0 && (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Structural markers detected
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {rubric.structuralMarkers.slice(0, 4).map((marker, i) => (
                    <span
                      key={`${marker}-${i}`}
                      style={{
                        fontSize: 'var(--fs-3xs)',
                        fontFamily: 'ui-monospace, monospace',
                        padding: '2px 6px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {marker}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </SignalBlock>
        )}

        {/* Algorithm Aversion — Dietvorst, Simmons & Massey 2015.
            Counter-programs the most common buyer objection ("we don't
            want AI overruling our CSO") by naming dismissive-of-
            quantitative language as a documented decision-making error. */}
        {showAlgoTrust && (
          <SignalBlock
            compact
            eyebrow="Algorithm Trust"
            icon={Calculator}
            verdict={algorithmAversionVerdictLabel(aversion.verdict)}
            band={AVERSION_BAND[aversion.verdict]}
            metric={
              aversion.verdict !== 'cannot_assess' && aversion.dismissivePhraseCount > 0
                ? `${aversion.dismissivePhraseCount} dismissive phrase${aversion.dismissivePhraseCount === 1 ? '' : 's'} · score ${aversion.aversionScore.toFixed(2)}`
                : null
            }
            rationale={aversion.note}
            tooltip="Algorithm Aversion — Dietvorst, Simmons & Massey (2015) 'Algorithm Aversion: People Erroneously Avoid Algorithms After Seeing Them Err.' Humans are systematically more forgiving of human errors than equivalent algorithm errors, even when the algorithm is statistically superior. The detector flags dismissive-of-quantitative language as a documented bias rather than letting it pass as judgment."
            citation={<>Dietvorst, Simmons &amp; Massey 2015 · paper-application #7</>}
          >
            {aversion.flaggedSnippets.length > 0 && (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Flagged language
                </div>
                {aversion.flaggedSnippets.slice(0, 2).map((snip, i) => (
                  <div
                    key={`${snip}-${i}`}
                    style={{
                      fontSize: 'var(--fs-xs)',
                      padding: '4px 8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{snip.trim()}&rdquo;
                  </div>
                ))}
              </div>
            )}
          </SignalBlock>
        )}
      </SignalBlockGrid>
    </div>
  );
}
