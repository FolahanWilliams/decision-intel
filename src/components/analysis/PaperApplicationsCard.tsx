'use client';

import { useEffect, useState } from 'react';
import {
  Telescope,
  Compass,
  History,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { ValidityClassification } from '@/lib/learning/validity-classifier';
import type { ReferenceClassForecast } from '@/lib/learning/reference-class-forecast';
import type { FeedbackAdequacy } from '@/lib/learning/feedback-adequacy';

/**
 * PaperApplicationsCard — surfaces the three Kahneman-Klein-anchored
 * signals on the live audit (document detail OverviewTab). Mirrors the
 * DPR cover-page strips so a procurement reader sees the SAME bands
 * before they download the PDF.
 *
 * Data flow: fetches /api/analysis/[id]/insights on mount. The endpoint
 * returns the persisted validity band when available + live-computed
 * reference-class forecast + feedback adequacy. All three blocks are
 * pure-function or single-query lookups — typical response < 50ms.
 *
 * Locked: 2026-04-30 (paper-application sprint UI surfacing).
 */

interface InsightsResponse {
  analysisId: string;
  validityClassification: ValidityClassification;
  referenceClassForecast: ReferenceClassForecast;
  feedbackAdequacy: FeedbackAdequacy;
  validitySource: 'persisted' | 'live';
}

const VALIDITY_LABEL: Record<ValidityClassification['validityClass'], string> = {
  high: 'High-validity environment',
  medium: 'Medium-validity environment',
  low: 'Low-validity environment',
  zero: 'Zero-validity environment',
};

const VALIDITY_COLOR: Record<ValidityClassification['validityClass'], string> = {
  high: 'var(--success)',
  medium: 'var(--accent-tertiary)',
  low: 'var(--warning)',
  zero: 'var(--error)',
};

const RC_BAND_LABEL: Record<ReferenceClassForecast['predictedOutcomeBand'], string> = {
  reference_class_succeeds: 'Favourable base rate',
  reference_class_mixed: 'Mixed base rate',
  reference_class_struggles: 'Challenging base rate',
  reference_class_fails: 'Hostile base rate',
  reference_class_too_small_to_judge: 'Structurally novel',
};

const RC_BAND_COLOR: Record<ReferenceClassForecast['predictedOutcomeBand'], string> = {
  reference_class_succeeds: 'var(--success)',
  reference_class_mixed: 'var(--warning)',
  reference_class_struggles: 'var(--error)',
  reference_class_fails: 'var(--error)',
  reference_class_too_small_to_judge: 'var(--text-muted)',
};

const FA_LABEL: Record<FeedbackAdequacy['verdict'], string> = {
  adequate: 'Adequate feedback history',
  sparse: 'Sparse feedback history',
  cold_start: 'Cold-start · no track record',
  unknown: 'Feedback adequacy unavailable',
};

const FA_COLOR: Record<FeedbackAdequacy['verdict'], string> = {
  adequate: 'var(--success)',
  sparse: 'var(--warning)',
  cold_start: 'var(--text-muted)',
  unknown: 'var(--text-muted)',
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
        className="card"
        style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}
      >
        Loading R²F paper-application signals...
      </div>
    );
  }

  if (error || !data) {
    return null; // Silent failure — non-load-bearing on the audit page
  }

  const { validityClassification, referenceClassForecast, feedbackAdequacy, validitySource } = data;
  const rc = referenceClassForecast;
  const fa = feedbackAdequacy;

  return (
    <div className="card paper-applications-card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2">
            <Compass size={18} style={{ color: 'var(--accent-primary)' }} />
            Recognition-Rigor Framework signals
          </h3>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
            title={
              validitySource === 'persisted'
                ? 'Validity band stored at audit-completion time. Same band the DQI engine scored against.'
                : 'Validity band computed live (legacy audit — pipeline did not persist it). Future audits will surface the persisted band.'
            }
          >
            {validitySource === 'persisted' ? 'pipeline-grade' : 'live-computed'}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Three signals operationalising Kahneman & Klein 2009 + Kahneman &amp; Lovallo 2003. The
          same blocks appear on the Decision Provenance Record cover page.
        </p>
      </div>

      <div className="card-body" style={{ display: 'grid', gap: 14 }}>
        {/* Validity Classification */}
        <div
          style={{
            padding: 14,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${VALIDITY_COLOR[validityClassification.validityClass]}`,
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Telescope size={14} style={{ color: VALIDITY_COLOR[validityClassification.validityClass] }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: VALIDITY_COLOR[validityClassification.validityClass],
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Validity · {VALIDITY_LABEL[validityClassification.validityClass]}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {validityClassification.rationale}.
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 6,
              fontStyle: 'italic',
            }}
          >
            DQI methodology v2.1.0 (Kahneman &amp; Klein 2009 first condition). In low- and zero-
            validity environments the engine reweights toward historical alignment + bias load.
          </div>
        </div>

        {/* Reference Class Forecast */}
        <div
          style={{
            padding: 14,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${RC_BAND_COLOR[rc.predictedOutcomeBand]}`,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={14} style={{ color: RC_BAND_COLOR[rc.predictedOutcomeBand] }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: RC_BAND_COLOR[rc.predictedOutcomeBand],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Reference Class · {RC_BAND_LABEL[rc.predictedOutcomeBand]}
              </span>
            </div>
            {rc.baselineFailureRate !== null && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {Math.round(rc.baselineFailureRate * 100)}% historical failure rate · n=
                {rc.baselineSampleSize}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {rc.note}
          </div>
          {rc.topAnalogs.length > 0 && (
            <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
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
                    padding: '6px 8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong>{a.company}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({a.year})</span>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        textTransform: 'capitalize',
                      }}
                    >
                      · {a.outcome.replace(/_/g, ' ')}
                    </span>
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}
                  >
                    sim {Math.round(a.similarityScore * 100)}%
                    <ExternalLink size={11} />
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Adequacy */}
        <div
          style={{
            padding: 14,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${FA_COLOR[fa.verdict]}`,
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {fa.verdict === 'adequate' ? (
              <CheckCircle2 size={14} style={{ color: FA_COLOR[fa.verdict] }} />
            ) : (
              <AlertTriangle size={14} style={{ color: FA_COLOR[fa.verdict] }} />
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: FA_COLOR[fa.verdict],
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Feedback Adequacy · {FA_LABEL[fa.verdict]}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {fa.note}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          .paper-applications-card .card-body {
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
