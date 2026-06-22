/**
 * FindingsTab — "Where is the reasoning weak?"
 *
 * The catalogue tab. Renders:
 *   1. R²F per-document map (Klein-protected pillar | Kahneman-suppressed pillar)
 *   2. Bias frequency chip-strip (dominant biases at-a-glance)
 *   3. Toxic combinations radial (when two-or-more biases reinforce)
 *   4. Per-bias severity-edge cards (the complete catalogue, sorted by severity)
 *   5. Optional DQ chain wisdom panel (the "wisdom behind the score")
 *
 * The R²F map is the only place the framework earns presence on the doc-
 * detail page — and only as concrete per-document mapping, never as
 * abstract page chrome.
 */

'use client';

import { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { BiasInstance } from '@/types';
import {
  SeverityEdgeCard,
  SeverityMeter,
  R2FPerDocMap,
  ToxicCombinationsRadial,
  type Severity,
  type R2FProtectedItem,
  type R2FSuppressedItem,
  type ToxicCombinationNode,
  type ToxicCombinationEdge,
} from '../primitives';
import { formatBiasName } from '@/lib/utils/labels';
import { CLEAN_AUDIT } from '@/lib/data/clean-audit-copy';

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export interface FindingsTabToxicCombination {
  combinationLabel: string;
  description?: string;
  severity: Severity;
  nodes: ToxicCombinationNode[];
  edges: ToxicCombinationEdge[];
}

/**
 * Synergy defensibility summary — supplied by the parent when the
 * uploaded document is a synergy_model and the parser extracted
 * structured data (or the inline text marker survives in
 * Document.content). Surface (cascade-depth audit ship #2 lock
 * 2026-05-09 evening) shows per-claim verdicts + portfolio summary
 * with the BCG/McKinsey base-rate framing the DPR cover already
 * carries on §4.10.
 */
export interface FindingsTabSynergyDefensibility {
  detected: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  totalClaims: number;
  fullyDefendedPct: number;
  portfolioSummary: string;
  topClaims: Array<{
    label: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    score: number;
    verdict: string;
  }>;
}

export interface FindingsTabProps {
  biases: BiasInstance[];
  /** R²F protected pillar items (mapped per-document). */
  r2fProtected: R2FProtectedItem[];
  /** R²F suppressed pillar items (mapped per-document). */
  r2fSuppressed: R2FSuppressedItem[];
  /** Optional R²F summary line. */
  r2fSummary?: string;
  /** Detected toxic combinations (fires when reinforcing biases cluster). */
  toxicCombinations?: FindingsTabToxicCombination[];
  /**
   * Synergy defensibility summary (synergy_model uploads only). Renders a
   * dedicated section between toxic combinations and the bias catalogue
   * with the per-claim verdicts the DPR cover carries on §4.10. Omit
   * (or pass null) on non-synergy_model audits.
   */
  synergyDefensibility?: FindingsTabSynergyDefensibility | null;
  /** Active bias id from the linked-PDF event bus — drives selected state. */
  activeBiasId?: string | null;
  /** Click handler — when a bias card is clicked, parent jumps the PDF to it. */
  onBiasClick?: (bias: BiasInstance) => void;
  /** Map of taxonomyId per biasType (e.g. confirmation_bias -> DI-B-001). */
  taxonomyIdByType?: Record<string, string>;
}

export function FindingsTab(props: FindingsTabProps) {
  const {
    biases,
    r2fProtected,
    r2fSuppressed,
    r2fSummary,
    toxicCombinations = [],
    synergyDefensibility,
    activeBiasId,
    onBiasClick,
    taxonomyIdByType,
  } = props;

  const sorted = useMemo(
    () =>
      [...biases].sort((a, b) => {
        const sa = SEVERITY_RANK[a.severity?.toLowerCase()] ?? 0;
        const sb = SEVERITY_RANK[b.severity?.toLowerCase()] ?? 0;
        if (sb !== sa) return sb - sa;
        return (b.confidence ?? 0) - (a.confidence ?? 0);
      }),
    [biases]
  );

  const counts = useMemo(() => {
    const c: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      neutral: 0,
    };
    for (const b of biases) {
      const s = (b.severity?.toLowerCase() ?? 'low') as Severity;
      if (s in c) c[s] += 1;
    }
    return c;
  }, [biases]);

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Clean-audit reassurance — leads the tab when zero biases surfaced
          so the user reads "verified clean" before they read four zeros.
          Copy SSOT: clean-audit-copy.ts. */}
      {biases.length === 0 && <CleanAuditPanel />}

      {/* Bias frequency strip */}
      <BiasFrequencyStrip counts={counts} total={biases.length} />

      {/* R²F per-document map */}
      <R2FPerDocMap protected_={r2fProtected} suppressed={r2fSuppressed} summary={r2fSummary} />

      {/* Toxic combinations */}
      {toxicCombinations.length > 0 && (
        <div style={{ display: 'grid', gap: 14 }}>
          <SectionEyebrow label="Toxic combinations" />
          {toxicCombinations.map((tc, i) => (
            <ToxicCombinationsRadial
              key={i}
              combinationLabel={tc.combinationLabel}
              description={tc.description}
              severity={tc.severity}
              nodes={tc.nodes}
              edges={tc.edges}
            />
          ))}
        </div>
      )}

      {/* Synergy defensibility — synergy_model uploads only. Mirrors the
          DPR cover §4.10 strip but adds the per-claim verdicts (the cover
          can only fit a top-N summary). Cascade-depth audit ship #2 lock
          2026-05-09 evening. */}
      {synergyDefensibility?.detected && synergyDefensibility.totalClaims > 0 && (
        <SynergyDefensibilityPanel summary={synergyDefensibility} />
      )}

      {/* Per-bias catalogue — only when there are findings. The zero-bias
          case is handled by the CleanAuditPanel at the top of the tab, so
          we no longer show a terse "nothing detected" placeholder here. */}
      {sorted.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          <SectionEyebrow label={`All findings · ${biases.length}`} />
          {sorted.map(bias => (
            <BiasFindingCard
              key={bias.id}
              bias={bias}
              active={bias.id === activeBiasId}
              onClick={onBiasClick}
              taxonomyId={taxonomyIdByType?.[bias.biasType]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Clean-audit reassurance panel ---------------- */

/**
 * Shown at the top of the Findings tab when an audit surfaces zero biases.
 * Reframes "empty" as a verified, valuable result, explains what the audit
 * actually did so "nothing found" reads as rigor, names what the clean
 * record gives the user, and tells them what to do next. All copy reads
 * from the CLEAN_AUDIT SSOT (clean-audit-copy.ts) so it cannot drift from
 * the dashboard post-upload reveal.
 */
function CleanAuditPanel() {
  return (
    <section
      style={{
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--success)',
        borderRadius: 'var(--radius-md, 8px)',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--success) 6%, transparent), transparent)',
        padding: '18px 20px',
        display: 'grid',
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-md, 8px)',
            background: 'color-mix(in srgb, var(--success) 14%, transparent)',
            color: 'var(--success)',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={19} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--success)',
              marginBottom: 4,
            }}
          >
            {CLEAN_AUDIT.eyebrow}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.35,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
            }}
          >
            {CLEAN_AUDIT.headline}
          </h3>
        </div>
      </div>

      {/* Why a clean pass is worth having */}
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
        {CLEAN_AUDIT.why}
      </p>

      {/* What the audit actually did */}
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.55,
          color: 'var(--text-muted)',
          padding: '10px 12px',
          background: 'var(--bg-secondary)',
          borderRadius: 6,
        }}
      >
        {CLEAN_AUDIT.whatRan}
      </div>

      {/* What the clean result gives you */}
      <div style={{ display: 'grid', gap: 8 }}>
        <CleanSubheading label="What this gives you" />
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {CLEAN_AUDIT.means.map((line, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 12.5,
                lineHeight: 1.55,
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: 'var(--success)', flexShrink: 0, fontWeight: 700 }}>·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* What to do next */}
      <div style={{ display: 'grid', gap: 8 }}>
        <CleanSubheading label="What to do next" />
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {CLEAN_AUDIT.nextSteps.map((step, i) => (
            <li key={i} style={{ display: 'flex', gap: 10 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--success)',
                  color: 'var(--success)',
                  fontSize: 11,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                    marginTop: 2,
                  }}
                >
                  {step.detail}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Honesty caveat */}
      <p
        style={{
          margin: 0,
          fontSize: 11.5,
          lineHeight: 1.55,
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          borderTop: '1px solid var(--border-color)',
          paddingTop: 12,
        }}
      >
        {CLEAN_AUDIT.honesty}
      </p>
    </section>
  );
}

function CleanSubheading({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}
    >
      {label}
    </span>
  );
}

/* ---------------- Bias frequency strip ---------------- */

interface BiasFrequencyStripProps {
  counts: Record<Severity, number>;
  total: number;
}

function BiasFrequencyStrip({ counts, total }: BiasFrequencyStripProps) {
  const tiles: Array<{ severity: Severity; label: string; count: number }> = [
    { severity: 'critical', label: 'Critical', count: counts.critical },
    { severity: 'high', label: 'High', count: counts.high },
    { severity: 'medium', label: 'Medium', count: counts.medium },
    { severity: 'low', label: 'Low', count: counts.low },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}
      className="findings-frequency-strip"
    >
      {tiles.map(tile => (
        <SeverityEdgeCard key={tile.severity} severity={tile.severity} compact>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              {tile.label}
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em',
                fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
                lineHeight: 1.05,
              }}
            >
              {tile.count}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {total > 0 && tile.count > 0
                ? `${Math.round((tile.count / total) * 100)}% of findings`
                : 'no findings'}
            </span>
          </div>
        </SeverityEdgeCard>
      ))}
      <style jsx>{`
        @media (max-width: 640px) {
          .findings-frequency-strip {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Bias finding card ---------------- */

interface BiasFindingCardProps {
  bias: BiasInstance;
  active: boolean;
  onClick?: (bias: BiasInstance) => void;
  taxonomyId?: string;
}

function BiasFindingCard({ bias, active, onClick, taxonomyId }: BiasFindingCardProps) {
  const severity = (bias.severity?.toLowerCase() ?? 'low') as Severity;
  const confidence = bias.confidence ?? null;

  return (
    <SeverityEdgeCard
      severity={severity}
      selected={active}
      onClick={onClick ? () => onClick(bias) : undefined}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flex: 1, minWidth: 0 }}>
          {taxonomyId && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {taxonomyId}
            </span>
          )}
          <h4
            style={{
              margin: 0,
              fontSize: 14.5,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.005em',
              fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
            }}
          >
            {formatBiasName(bias.biasType)}
          </h4>
        </div>
        <SeverityMeter severity={severity} showLabel size="sm" />
      </header>

      {bias.excerpt && (
        <blockquote
          style={{
            margin: '0 0 10px',
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            borderLeft: `2px solid var(--text-muted)`,
            borderRadius: 'var(--radius-sm, 4px)',
            fontSize: 12.5,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          &ldquo;{bias.excerpt}&rdquo;
        </blockquote>
      )}

      {bias.explanation && (
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 12.5,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
          }}
        >
          {bias.explanation}
        </p>
      )}

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.02em',
        }}
      >
        {confidence != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: 'var(--text-muted)',
              }}
            />
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
        {bias.userRating != null && <span style={{ fontStyle: 'italic' }}>marked relevant</span>}
      </footer>
    </SeverityEdgeCard>
  );
}

/* ---------------- Section eyebrow ---------------- */

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: 6,
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
        {label}
      </span>
      <span
        style={{
          flex: 1,
          height: 1,
          background: 'var(--border-color)',
        }}
      />
    </div>
  );
}

// ─── Synergy Defensibility Panel ──────────────────────────────────────────────
// Cascade-depth audit ship #2 (locked 2026-05-09 evening). Renders for
// synergy_model uploads only — the parent decides whether to pass the
// summary based on documentType. Mirrors the DPR cover §4.10 vocabulary
// but adds the per-claim breakdown (the cover can only fit a top-N
// summary; the doc-detail page has the room).

const SYNERGY_SEVERITY_HEX: Record<'critical' | 'high' | 'medium' | 'low', string> = {
  critical: 'var(--severity-critical, #7F1D1D)',
  high: 'var(--severity-high, #DC2626)',
  medium: 'var(--warning, #D97706)',
  low: 'var(--info, #2563EB)',
};

function SynergyDefensibilityPanel({ summary }: { summary: FindingsTabSynergyDefensibility }) {
  const criticalCount = summary.topClaims.filter(c => c.severity === 'critical').length;
  const highCount = summary.topClaims.filter(c => c.severity === 'high').length;
  let portfolioBand: 'critical' | 'high' | 'medium' | 'low';
  if (criticalCount > 0) portfolioBand = 'critical';
  else if (summary.fullyDefendedPct < 50) portfolioBand = 'high';
  else if (summary.fullyDefendedPct < 70) portfolioBand = 'medium';
  else portfolioBand = 'low';
  const accent = SYNERGY_SEVERITY_HEX[portfolioBand];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <SectionEyebrow label="Synergy defensibility" />
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${accent}`,
          background: 'var(--bg-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: accent,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {summary.fullyDefendedPct}%
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 2,
              }}
            >
              Portfolio defensibility — {summary.totalClaims} claim
              {summary.totalClaims === 1 ? '' : 's'} extracted
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {summary.portfolioSummary}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            borderRadius: 6,
          }}
        >
          Per BCG / McKinsey integration-best-practices, every synergy claim should carry a named
          operational mechanism, an accountable executive, and a measurable 90-day milestone.
          Revenue synergies historically realise at 30-50% of projection; cost synergies at 60-80%.
          Apply the appropriate base-rate discount to under-defended claims before underwriting.
        </div>
      </div>

      {summary.topClaims.length > 0 && (
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
          {summary.topClaims.slice(0, 8).map((c, i) => (
            <li
              key={i}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${SYNERGY_SEVERITY_HEX[c.severity]}`,
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {c.type} · {c.verdict}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--text-muted)',
                  }}
                >
                  {c.score}/3
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: SYNERGY_SEVERITY_HEX[c.severity],
                  }}
                >
                  {c.severity}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(criticalCount > 0 || highCount > 0) && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md, 8px)',
          }}
        >
          <strong style={{ color: 'var(--text-secondary)' }}>What to do:</strong>{' '}
          {criticalCount > 0
            ? `Synergy Mirage fires on ${criticalCount} critical claim${criticalCount === 1 ? '' : 's'}. Flag to the deal committee before next IC; require a named owner + 90-day milestone for each.`
            : `${highCount} claim${highCount === 1 ? '' : 's'} at high severity. Tighten before IC: name the operational mechanism that delivers each synergy.`}
        </div>
      )}
    </div>
  );
}
