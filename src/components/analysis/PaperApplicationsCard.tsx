'use client';

import { useEffect, useState } from 'react';
import { Telescope, History, Activity, ExternalLink } from 'lucide-react';
import type { ValidityClassification } from '@/lib/learning/validity-classifier';
import type { ReferenceClassForecast } from '@/lib/learning/reference-class-forecast';
import type { FeedbackAdequacy } from '@/lib/learning/feedback-adequacy';
import { SignalBlock, SignalBlockGrid, type SignalBand } from '@/components/ui/SignalBlock';

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

interface InsightsResponse {
  analysisId: string;
  validityClassification: ValidityClassification;
  referenceClassForecast: ReferenceClassForecast;
  feedbackAdequacy: FeedbackAdequacy;
  validitySource: 'persisted' | 'live';
}

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

export function PaperApplicationsCard({ analysisId }: { analysisId: string }) {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/analysis/${analysisId}/insights`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as InsightsResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'fetch failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

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

  const { validityClassification, referenceClassForecast, feedbackAdequacy } = data;
  const rc = referenceClassForecast;
  const fa = feedbackAdequacy;

  return (
    <div style={{ marginBottom: 16 }}>
      <SignalBlockGrid minWidth={260}>
        {/* Validity (plain-language eyebrow). The technical name and academic
            citation live in the citation footer + tooltip. */}
        <SignalBlock
          eyebrow="Validity"
          icon={Telescope}
          verdict={VALIDITY_VERDICT[validityClassification.validityClass]}
          band={VALIDITY_BAND[validityClassification.validityClass]}
          rationale={validityClassification.rationale}
          tooltip="Validity Classification — Kahneman & Klein 2009 first condition for trustworthy intuition. In low- and zero-validity domains the DQI engine reweights toward historical alignment + bias load."
          citation={<>Kahneman &amp; Klein 2009 · methodology v2.1.0</>}
        />

        {/* Outside View (plain-language eyebrow for Reference Class Forecast). */}
        <SignalBlock
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
          {rc.topAnalogs.length > 0 && (
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
              {rc.topAnalogs.slice(0, 3).map(a => (
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

        {/* Author Calibration (plain-language eyebrow for Feedback Adequacy). */}
        <SignalBlock
          eyebrow="Author Calibration"
          icon={Activity}
          verdict={FA_VERDICT[fa.verdict]}
          band={FA_BAND[fa.verdict]}
          rationale={fa.note}
          tooltip="Feedback Adequacy — Kahneman & Klein 2009 second condition: has the author had enough closed-loop feedback in this domain to be calibrated? An 'adequate' verdict means experience-based confidence in this domain is trustworthy; 'sparse' or 'cold start' means treat experience claims with more scrutiny."
          citation={<>Kahneman &amp; Klein 2009 · author 18-month closed outcomes</>}
        />
      </SignalBlockGrid>
    </div>
  );
}
