'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle, FileText, Scale, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScoreReveal } from '@/components/ui/ScoreReveal';
import { CounterfactualPanel } from '@/components/ui/CounterfactualPanel';
import { trackEvent } from '@/lib/analytics/track';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('InlineAnalysisResultCard');

export interface CompletedAnalysisSummary {
  docId: string;
  filename: string;
  overallScore: number;
  biasCount: number;
  noiseScore?: number;
  detectedBiases: Array<{ type: string; severity?: string }>;
}

interface Props {
  analysis: CompletedAnalysisSummary;
  onDismiss: () => void;
}

function humanizeBias(type: string): string {
  const words = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return /bias$/i.test(words) ? words : `${words} Bias`;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  unknown: 0,
};

function severityColor(severity: string | undefined): string {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'var(--severity-high, #ef4444)';
    case 'medium':
      return 'var(--warning, #eab308)';
    default:
      return 'var(--text-muted)';
  }
}

export function InlineAnalysisResultCard({ analysis, onDismiss }: Props) {
  const top3 = [...analysis.detectedBiases]
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[b.severity ?? 'unknown'] ?? 0) -
        (SEVERITY_ORDER[a.severity ?? 'unknown'] ?? 0)
    )
    .slice(0, 3);

  // Resolve the Analysis row ID from the Document so we can feed the
  // Featured Counterfactual card below. Self-contained so the dashboard
  // caller doesn't need to know about counterfactuals. Silent-fail — if
  // the lookup hiccups the card just doesn't render, no broken UI.
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function resolveAnalysisId() {
      try {
        const res = await fetch(`/api/documents/${analysis.docId}`);
        if (!res.ok) return;
        const data = (await res.json().catch(() => null)) as {
          analyses?: Array<{ id: string }>;
        } | null;
        const id = data?.analyses?.[0]?.id;
        if (id && !cancelled) setAnalysisId(id);
      } catch (err) {
        log.warn('Failed to resolve analysisId for counterfactual:', err);
      }
    }
    resolveAnalysisId();
    return () => {
      cancelled = true;
    };
  }, [analysis.docId]);

  // Pull the team's benchmark DQI so the post-upload reveal can show
  // "+12 above your org's avg." The endpoint returns null profile for
  // individual-plan users and for team-plan orgs with < 3 analyses —
  // in both cases the benchmark chip simply doesn't render.
  const [orgAvg, setOrgAvg] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function loadBenchmark() {
      try {
        const res = await fetch('/api/team/intelligence');
        if (!res.ok) return;
        const data = (await res.json().catch(() => null)) as {
          profile?: { avgDecisionQuality?: number | null } | null;
        } | null;
        const avg = data?.profile?.avgDecisionQuality;
        if (typeof avg === 'number' && !cancelled) setOrgAvg(avg);
      } catch (err) {
        log.warn('Failed to load team benchmark for score reveal:', err);
      }
    }
    loadBenchmark();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--accent-primary)',
        overflow: 'hidden',
        boxShadow: 'var(--liquid-shadow)',
      }}
    >
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <CheckCircle size={16} style={{ color: 'var(--success)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--success)',
            }}
          >
            60-second audit complete
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-primary)',
              fontWeight: 500,
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileText size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {analysis.filename}
            </span>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss analysis result"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 4,
            display: 'flex',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div
        style={{
          padding: '24px 20px',
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 1fr) 1.5fr',
          gap: 28,
          alignItems: 'start',
        }}
      >
        <div>
          <ScoreReveal
            score={analysis.overallScore}
            label="Decision Quality Index"
            showGrade
            suspenseMs={1200}
            benchmark={orgAvg !== null ? { value: orgAvg } : undefined}
          />
          {analysis.noiseScore != null && (
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md, 8px)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  flexShrink: 0,
                }}
                aria-hidden
              >
                <Scale size={14} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    marginBottom: 1,
                  }}
                >
                  Noise score
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {Math.round(analysis.noiseScore)}%
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.35 }}>
                    judge disagreement across 3 independent reads
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: 10,
            }}
          >
            {analysis.biasCount === 0
              ? 'No cognitive biases flagged'
              : `${analysis.biasCount} cognitive bias${analysis.biasCount === 1 ? '' : 'es'} flagged`}
          </div>
          {top3.length > 0 ? (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {top3.map((b, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13.5,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: severityColor(b.severity),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>{humanizeBias(b.type)}</span>
                  {b.severity && b.severity !== 'unknown' && (
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 600,
                      }}
                    >
                      {b.severity}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Reasoning chain scanned — no high-risk cognitive patterns surfaced.
            </div>
          )}
        </div>
      </div>

      {/* Inline live co-edit — paste a rewritten passage, get a 5s bias
          re-check + DQI delta without leaving the dashboard. The endpoint
          is a lightweight bias-only check; canonical DQI still requires
          uploading the full revised memo. */}
      {analysis.biasCount > 0 && (
        <div
          style={{
            padding: '16px 20px 0',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <InlineCoEditPanel originalScore={analysis.overallScore} />
        </div>
      )}

      {/* Featured counterfactual — ROI beat that closes the pitch loop before
          the "Upload another / Deep Dive" footer. Renders null until the
          analysisId resolves AND there's a positive scenario to show, so the
          card never flashes an empty or negative-impact message. */}
      {analysisId && (
        <div
          style={{
            padding: '0 20px 8px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div style={{ paddingTop: 14 }}>
            <CounterfactualPanel analysisId={analysisId} variant="featured" />
          </div>
        </div>
      )}

      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 13,
            padding: '6px 0',
          }}
        >
          Upload another
        </button>
        <Link
          href={`/documents/${analysis.docId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: 'var(--accent-primary)',
            color: 'var(--text-on-accent, #fff)',
            borderRadius: 'var(--radius-full)',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Deep Dive
          <ArrowRight size={14} />
        </Link>
      </div>

      <PostRevealBookingRow />
    </motion.div>
  );
}

/**
 * InlineCoEditPanel — paste a rewritten passage, watch the DQI update.
 *
 * Collapsed by default (keeps the post-upload reveal focused on the wow
 * moment). Expands to a compact textarea + submit. On submit, POSTs to
 * /api/passages/re-audit and renders the returned estimated DQI + delta
 * + bias list in-place. The endpoint is deliberately lightweight — a
 * single focused Gemini call, not the full pipeline — so the iteration
 * feels instant (~3-5s) without burning the audit budget.
 */
type PassageReAuditResponse = {
  data: {
    biases: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      evidence?: string;
    }>;
    estimatedDqi: number;
    originalDqi?: number;
    delta?: number;
    disclaimer: string;
  };
};

function InlineCoEditPanel({ originalScore }: { originalScore: number }) {
  const [expanded, setExpanded] = useState(false);
  const [passage, setPassage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PassageReAuditResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (passage.trim().length < 24) {
      setError('Add at least 24 characters so we have something to audit.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/passages/re-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: passage.trim(),
          originalOverallScore: originalScore,
        }),
      });
      const json = (await res.json()) as
        | PassageReAuditResponse
        | { error: string };
      if (!res.ok || 'error' in json) {
        setError(
          'error' in json ? json.error : 'Passage audit failed. Try again.'
        );
        return;
      }
      setResult(json.data);
      trackEvent('dashboard_inline_coedit_submit', {
        biasCountAfter: json.data.biases.length,
        delta: json.data.delta ?? null,
      });
    } catch (err) {
      log.warn('Inline re-audit failed:', err);
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-color)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: 13,
          textAlign: 'left',
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 16,
            color: 'var(--accent-primary)',
            fontWeight: 700,
          }}
        >
          ✎
        </span>
        <span style={{ flex: 1 }}>
          Rewrite a flagged passage — see the DQI update in seconds.
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>passage-level</span>
      </button>
    );
  }

  const delta = result?.delta ?? null;
  const deltaColor =
    delta == null
      ? 'var(--text-muted)'
      : delta > 0
        ? 'var(--success)'
        : delta < 0
          ? 'var(--error)'
          : 'var(--text-muted)';

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
          Rewrite a flagged passage
        </strong>
        <button
          onClick={() => {
            setExpanded(false);
            setResult(null);
            setPassage('');
            setError(null);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 2,
          }}
        >
          <X size={14} />
        </button>
      </div>
      <textarea
        value={passage}
        onChange={e => setPassage(e.target.value)}
        placeholder="Paste the 2 lines we flagged, rewritten — we'll re-audit the passage and return a DQI delta in ~5s."
        rows={4}
        maxLength={6000}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontFamily: 'inherit',
          resize: 'vertical',
          minHeight: 80,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {passage.length}/6000 · passage-level estimate, not the canonical DQI
        </span>
        <button
          onClick={submit}
          disabled={submitting || passage.trim().length < 24}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background:
              submitting || passage.trim().length < 24
                ? 'var(--bg-tertiary)'
                : 'var(--accent-primary)',
            color:
              submitting || passage.trim().length < 24
                ? 'var(--text-muted)'
                : 'var(--text-on-accent, #fff)',
            fontSize: 13,
            fontWeight: 600,
            cursor:
              submitting || passage.trim().length < 24 ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Auditing…' : 'Re-audit passage'}
        </button>
      </div>
      {error && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: 'var(--error)',
          }}
        >
          {error}
        </div>
      )}
      {result && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Passage DQI estimate
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginTop: 2,
                }}
              >
                {result.estimatedDqi}
                {delta != null && (
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: deltaColor,
                      marginLeft: 10,
                    }}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta} vs original
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--text-muted)',
                maxWidth: 300,
                lineHeight: 1.55,
              }}
            >
              {result.disclaimer}
            </div>
          </div>
          {result.biases.length > 0 ? (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {result.biases.slice(0, 5).map((b, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: severityColor(b.severity),
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {humanizeBias(b.type)}
                    </span>
                    {b.evidence && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                          lineHeight: 1.5,
                        }}
                      >
                        &ldquo;{b.evidence}&rdquo;
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--success)',
                fontWeight: 600,
              }}
            >
              No biases detected in the rewrite.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Design-partner booking beat that sits under the DQI reveal. The user
 * just saw their own score — this is the highest-intent moment in the
 * whole product surface, and a 30-minute founder call is the natural
 * next step. Uses CSS variables so it reads correctly under both light
 * and dark platform themes, unlike the marketing-side BookDemoCTA which
 * is light-only by design.
 */
function PostRevealBookingRow() {
  const bookingUrl = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL;
  const href = bookingUrl || '/pricing#design-partner';
  const external = !!bookingUrl;

  return (
    <div
      style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        background: 'linear-gradient(to right, var(--bg-card) 0%, rgba(22, 163, 74, 0.06) 100%)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'rgba(22, 163, 74, 0.15)',
          color: 'var(--accent-primary)',
          border: '1px solid rgba(22, 163, 74, 0.3)',
          flexShrink: 0,
        }}
        aria-hidden
      >
        <Calendar size={15} strokeWidth={2.25} />
      </span>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            marginBottom: 2,
          }}
        >
          Want the founder to walk through this audit with you?
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          30 minutes, live. Bring another memo and we&rsquo;ll audit that too.
        </div>
      </div>
      <Link
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        onClick={() => trackEvent('book_demo_click', { source: 'post_reveal' })}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          background: 'transparent',
          color: 'var(--accent-primary)',
          border: '1px solid var(--accent-primary)',
          borderRadius: 'var(--radius-full)',
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Book a 30-min call
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
