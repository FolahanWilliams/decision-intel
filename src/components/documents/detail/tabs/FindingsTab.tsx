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
      {/* Bias frequency strip */}
      <BiasFrequencyStrip counts={counts} total={biases.length} />

      {/* R²F per-document map */}
      <R2FPerDocMap
        protected_={r2fProtected}
        suppressed={r2fSuppressed}
        summary={r2fSummary}
      />

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

      {/* Per-bias catalogue */}
      <div style={{ display: 'grid', gap: 12 }}>
        <SectionEyebrow label={`All findings · ${biases.length}`} />
        {sorted.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md, 8px)',
              fontStyle: 'italic',
            }}
          >
            No biases detected on this audit. Either the memo is exceptionally clean — or
            the analysis is still in flight.
          </div>
        ) : (
          sorted.map(bias => (
            <BiasFindingCard
              key={bias.id}
              bias={bias}
              active={bias.id === activeBiasId}
              onClick={onBiasClick}
              taxonomyId={taxonomyIdByType?.[bias.biasType]}
            />
          ))
        )}
      </div>
    </div>
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
        {bias.userRating != null && (
          <span style={{ fontStyle: 'italic' }}>marked relevant</span>
        )}
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
