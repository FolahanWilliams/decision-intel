'use client';

/**
 * RemediationChecklist — E4 lock 2026-04-30.
 *
 * Reframes "you scored 42/100" from a grade into a prioritized action
 * plan. The junior-analyst persona (Emeka) said the bare score
 * intimidates without guiding; this component takes the bias array
 * already on the page, prioritizes by severity × confidence, and
 * renders three actionable steps:
 *
 *   #1 Fix · {bias name} · HIGH IMPACT · 87% confidence
 *      {bias.suggestion}
 *
 *   #2 Address · ...
 *   #3 Review · ...
 *
 * The verbs scale by step (Fix → Address → Review) so the user
 * understands the prioritization implicitly. The suggestion body comes
 * straight from the bias detection node — no LLM call here, just
 * sorting + framing.
 *
 * Renders null when there are zero biases (the post-upload reveal
 * already shows the "no high-risk patterns surfaced" empty state).
 */

import { CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import type { BiasInstance } from '@/types';

interface Props {
  biases: BiasInstance[];
  /** When set, the "Open in document" link routes deep into the doc
   *  detail page so the user lands on the bias's exact context. */
  documentId?: string;
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const STEP_VERB = ['Fix', 'Address', 'Review'];
const STEP_VERB_DESCRIPTOR = [
  'highest impact · clearest fix',
  'next-largest blocker',
  'cleanup pass · lower priority',
];

function humanizeBiasType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function severityAccent(severity: string): string {
  const k = severity.toLowerCase();
  if (k === 'critical') return 'var(--severity-critical, var(--error))';
  if (k === 'high') return 'var(--error)';
  if (k === 'medium') return 'var(--warning)';
  return 'var(--info)';
}

function rankScore(b: BiasInstance): number {
  const sev = SEVERITY_RANK[b.severity?.toLowerCase()] ?? 0;
  // Confidence falls in [0, 1] when set, default to 0.7 (a reasonable
  // mid-range belief) if missing so unscored biases don't sink to the
  // bottom of the priority list.
  const conf = b.confidence ?? 0.7;
  return sev * conf;
}

export function RemediationChecklist({ biases, documentId }: Props) {
  const top3 = [...biases].sort((a, b) => rankScore(b) - rankScore(a)).slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <h3 className="flex items-center gap-2">
          <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)' }} />
          Remediation Roadmap
          <span className="section-heading" style={{ marginLeft: 'auto' }}>
            Top 3 prioritized fixes
          </span>
        </h3>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {top3.map((bias, i) => {
          const accent = severityAccent(bias.severity);
          const confidencePct =
            bias.confidence !== null && bias.confidence !== undefined
              ? Math.round(bias.confidence * 100)
              : null;
          return (
            <div
              key={bias.id ?? `${bias.biasType}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '12px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${accent}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              {/* Step number tile */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: accent,
                  fontWeight: 800,
                  fontSize: 15,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                #{i + 1}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {STEP_VERB[i]} · {humanizeBiasType(bias.biasType)}
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: accent,
                      background: 'var(--bg-secondary)',
                      border: `1px solid ${accent}`,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {bias.severity} severity
                  </span>
                  {confidencePct !== null && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {confidencePct}% confidence
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 6,
                  }}
                >
                  {STEP_VERB_DESCRIPTOR[i]}
                </div>
                {bias.suggestion ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {bias.suggestion}
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: 'var(--warning)',
                    }}
                  >
                    <AlertTriangle size={11} />
                    No remediation suggestion captured for this bias.
                  </div>
                )}
                {documentId && bias.excerpt && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '6px 10px',
                      background: 'var(--bg-secondary)',
                      borderLeft: `2px solid ${accent}`,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11.5,
                      fontStyle: 'italic',
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      maxHeight: 80,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={bias.excerpt}
                  >
                    “{bias.excerpt.length > 200 ? `${bias.excerpt.slice(0, 200)}…` : bias.excerpt}”
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {biases.length > 3 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11.5,
              color: 'var(--text-muted)',
              padding: '4px 0',
            }}
          >
            <ChevronRight size={11} />
            {biases.length - 3} additional {biases.length - 3 === 1 ? 'bias' : 'biases'}{' '}
            flagged · resolve the top 3 first, then revisit the full list below.
          </div>
        )}
      </div>
    </div>
  );
}
