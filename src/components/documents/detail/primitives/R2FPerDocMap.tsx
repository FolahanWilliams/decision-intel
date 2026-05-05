/**
 * R2FPerDocMap — Recognition-Rigor Framework, mapped onto THIS specific document.
 *
 * The framework only earns space when it's mapped to the user's document.
 * No abstract branding, no "we use R²F." Instead, two concrete pillars:
 *
 *   ⟢ Klein-side intuition PROTECTED
 *     What pattern-matching expertise the memo author got RIGHT, with
 *     evidence (validity classification, reference-class match, feedback
 *     adequacy band).
 *
 *   ⟣ Kahneman-side bias SUPPRESSED
 *     What System-1 leak the audit caught, with the verbatim flagged
 *     passage + which bias detector fired.
 *
 * Visual: 2-column split. Left pillar = green-tinted (low severity / good).
 * Right pillar = severity-tinted by the worst bias caught. Source anchors:
 * Kahneman-Klein (2009), Kahneman-Lovallo (2003), feedback-adequacy module.
 */

import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { Severity } from './SeverityEdgeCard';
import { severityToken } from './SeverityEdgeCard';

export interface R2FProtectedItem {
  /** Short label — e.g. "Operator-experience claim" */
  label: string;
  /** Why this got Klein-protected — e.g. "validity: high · n=12 closed outcomes" */
  rationale: string;
  /** Optional verbatim quote from the memo — anchors the claim. */
  quote?: string;
}

export interface R2FSuppressedItem {
  /** Bias name — e.g. "Illusion of Validity" */
  biasLabel: string;
  /** Taxonomy id — e.g. "DI-B-021" */
  taxonomyId?: string;
  severity: Severity;
  /** Verbatim flagged passage. */
  quote: string;
  /** Why the detector fired — e.g. "n=2 closed outcomes too few to calibrate" */
  rationale: string;
}

export interface R2FPerDocMapProps {
  protected_: R2FProtectedItem[]; // `protected` is reserved
  suppressed: R2FSuppressedItem[];
  /** Optional one-line summary line above the two pillars. */
  summary?: string;
}

export function R2FPerDocMap({ protected_, suppressed, summary }: R2FPerDocMapProps) {
  const klein = severityToken('low');
  const worstSeverity = pickWorstSeverity(suppressed);
  const kahneman = severityToken(worstSeverity);

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: 24,
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04))',
      }}
    >
      <header style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            R²F · Mapped to your memo
          </span>
          <span
            style={{
              flex: 1,
              height: 1,
              background: 'var(--border-color)',
            }}
          />
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
          }}
        >
          Where we protected your intuition · where we suppressed your bias
        </h3>
        {summary && (
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--text-secondary)',
            }}
          >
            {summary}
          </p>
        )}
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
        className="r2f-pillars"
      >
        {/* Klein-side: intuition protected */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderTop: `3px solid ${klein}`,
            borderRadius: 'var(--radius-sm, 4px)',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={14} style={{ color: klein }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: klein,
              }}
            >
              Klein · intuition protected
            </span>
          </div>
          {protected_.length === 0 ? (
            <EmptyState message="No high-validity intuition claims detected. The memo lacks the kind of pattern-matching expertise that survives outside-view scrutiny." />
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
              {protected_.map((item, i) => (
                <li key={i}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.rationale}
                  </div>
                  {item.quote && (
                    <blockquote
                      style={{
                        margin: '8px 0 0',
                        padding: '8px 12px',
                        borderLeft: `2px solid ${klein}`,
                        background: 'var(--bg-card)',
                        fontSize: 12,
                        fontStyle: 'italic',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Kahneman-side: bias suppressed */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderTop: `3px solid ${kahneman}`,
            borderRadius: 'var(--radius-sm, 4px)',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={14} style={{ color: kahneman }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: kahneman,
              }}
            >
              Kahneman · bias suppressed
            </span>
          </div>
          {suppressed.length === 0 ? (
            <EmptyState message="No System-1 leaks detected. Either the audit is still running, or the memo is exceptionally clean." />
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
              {suppressed.slice(0, 3).map((item, i) => {
                const itemColor = severityToken(item.severity);
                return (
                  <li key={i}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {item.biasLabel}
                      </span>
                      {item.taxonomyId && (
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: itemColor,
                            background: `color-mix(in srgb, ${itemColor} 12%, transparent)`,
                            padding: '1px 6px',
                            borderRadius: 3,
                            fontFamily: 'ui-monospace, monospace',
                          }}
                        >
                          {item.taxonomyId}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {item.rationale}
                    </div>
                    <blockquote
                      style={{
                        margin: '8px 0 0',
                        padding: '8px 12px',
                        borderLeft: `2px solid ${itemColor}`,
                        background: 'var(--bg-card)',
                        fontSize: 12,
                        fontStyle: 'italic',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>
                  </li>
                );
              })}
              {suppressed.length > 3 && (
                <li
                  style={{
                    fontSize: 11.5,
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    marginTop: 2,
                  }}
                >
                  + {suppressed.length - 3} more flagged in Findings
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 720px) {
          .r2f-pillars {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        fontSize: 12.5,
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
}

function pickWorstSeverity(items: R2FSuppressedItem[]): Severity {
  if (items.length === 0) return 'neutral';
  const order: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
  for (const sev of order) {
    if (items.some(i => i.severity === sev)) return sev;
  }
  return 'neutral';
}
