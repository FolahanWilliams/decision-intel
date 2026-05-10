'use client';

/**
 * ContainerTopFixesCard — top-3 remediation tiles at the container level.
 *
 * Locked 2026-05-10 (audit batch 3 #3, DESIGN.md alignment). Mirrors the
 * doc-detail RemediationChecklist pattern at the container level: per
 * DESIGN.md persona-validated layout direction (universal point #2 — all
 * four buyers want a top-3 remediation list directly under the verdict
 * surface, with verbs + page references + dollar anchors).
 *
 * Container-shaped semantics: the per-document fix list lives on each
 * member doc's RemediationChecklist (one click away via the per-doc DQI
 * breakdown panel). At the container level, the highest-leverage fixes
 * are:
 *   1. Critical / high named patterns (Synergy Mirage / Conglomerate
 *      Fallacy / Winner's Curse / Yes Committee / Sunk Ship / etc.) —
 *      these are deal-blocking compound failure modes that span
 *      multiple member docs. Surface with the canonical pattern
 *      description from NAMED_PATTERNS so the fix is procurement-
 *      grade citable.
 *   2. Most-frequent recurring biases — the cross-doc signature.
 *      Surface with formatted bias name + occurrence count + worst-
 *      offender doc deep-link.
 *
 * Renders nothing when the container has no flagged patterns + no
 * recurring biases (e.g. early-stage container with single doc that
 * audited clean). Top-3 cap matches the doc-detail surface so the
 * cognitive load on the buyer is symmetric across document and
 * container detail pages.
 */

import { AlertOctagon, AlertTriangle, ChevronRight, Brain } from 'lucide-react';
import { formatBiasName } from '@/lib/utils/labels';
import { NAMED_PATTERNS } from '@/lib/learning/named-patterns';
import type { ContainerDetail } from '@/types/containers';

interface Props {
  container: ContainerDetail;
}

interface FixTile {
  kind: 'pattern' | 'bias';
  /** Procurement-grade label — pattern name or formatted bias name. */
  label: string;
  /** One-sentence canonical description (NAMED_PATTERNS for patterns). */
  description: string;
  /** Severity tag drives the colour + icon. */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Per-pattern: docs that triggered. Per-bias: docs that flagged. */
  affectedDocCount: number;
  /** Optional deep-link target for the worst-offender member doc. */
  deepLinkDocId?: string | null;
}

function severityMeta(sev: FixTile['severity']) {
  if (sev === 'critical') {
    return {
      color: 'var(--error)',
      label: 'CRITICAL',
      icon: AlertOctagon,
      verb: 'Fix',
    };
  }
  if (sev === 'high') {
    return {
      color: 'var(--severity-high)',
      label: 'HIGH',
      icon: AlertOctagon,
      verb: 'Fix',
    };
  }
  if (sev === 'medium') {
    return {
      color: 'var(--warning)',
      label: 'MEDIUM',
      icon: AlertTriangle,
      verb: 'Address',
    };
  }
  return {
    color: 'var(--info)',
    label: 'LOW',
    icon: AlertTriangle,
    verb: 'Review',
  };
}

/** Canonical lookup of the NAMED_PATTERNS description by patternLabel. */
function descriptionFor(patternLabel: string): string {
  const match = NAMED_PATTERNS.find(p => p.label === patternLabel);
  return match?.description ?? 'Named compound failure pattern from the canonical R²F taxonomy.';
}

function buildFixTiles(container: ContainerDetail): FixTile[] {
  const tiles: FixTile[] = [];

  // 1. Named patterns first (deal-blocking compound failures).
  // namedPatterns is already sorted critical-first by the aggregator.
  const namedFixes: FixTile[] = container.aggregation.namedPatterns
    .filter(p => p.severity === 'critical' || p.severity === 'high' || p.severity === 'medium')
    .slice(0, 3)
    .map(p => ({
      kind: 'pattern',
      label: p.patternLabel,
      description: descriptionFor(p.patternLabel),
      severity: p.severity,
      affectedDocCount: p.documentCount,
    }));
  tiles.push(...namedFixes);

  // 2. Top recurring biases (cross-doc signature). Skip biases that are
  // already named in a pattern above to avoid duplication.
  const patternBiasKeys = new Set<string>();
  for (const p of container.aggregation.namedPatterns.slice(0, 3)) {
    const match = NAMED_PATTERNS.find(np => np.label === p.patternLabel);
    if (match) match.biasTypes.forEach(bt => patternBiasKeys.add(bt.toLowerCase()));
  }

  const biasSlots = Math.max(0, 3 - tiles.length);
  if (biasSlots > 0) {
    const biasFixes: FixTile[] = container.aggregation.allBiases
      .filter(b => !patternBiasKeys.has(b.biasType.toLowerCase()))
      .slice(0, biasSlots)
      .map(b => ({
        kind: 'bias',
        label: formatBiasName(b.biasType),
        description: `Fires in ${b.documentIds.length} member document${b.documentIds.length === 1 ? '' : 's'}. Open the worst-offender per-doc audit to see the exact memo passages and recommended mitigation.`,
        severity:
          b.severity === 'critical' || b.severity === 'high' || b.severity === 'medium'
            ? b.severity
            : 'low',
        affectedDocCount: b.documentIds.length,
        deepLinkDocId: b.documentIds[0] ?? null,
      }));
    tiles.push(...biasFixes);
  }

  return tiles.slice(0, 3);
}

export function ContainerTopFixesCard({ container }: Props) {
  const tiles = buildFixTiles(container);

  if (tiles.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--fs-md)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Top {tiles.length} fix{tiles.length === 1 ? '' : 'es'} before committee
          </h2>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            Ranked by severity + cross-doc reach. Per-document fixes live on each member doc.
          </p>
        </div>
        <span
          style={{
            fontSize: 'var(--fs-3xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          {container.aggregation.namedPatterns.length} pattern
          {container.aggregation.namedPatterns.length === 1 ? '' : 's'} ·{' '}
          {container.aggregation.allBiases.length} biases
        </span>
      </header>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
        {tiles.map((tile, idx) => {
          const meta = severityMeta(tile.severity);
          const Icon = meta.icon;
          return (
            <li
              key={`${tile.kind}-${tile.label}`}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${meta.color}`,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  paddingTop: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 700,
                    color: meta.color,
                  }}
                >
                  #{idx + 1}
                </span>
                <Icon size={14} style={{ color: meta.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--fs-sm)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {meta.verb}: {tile.label}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--fs-3xs)',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: meta.color,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--fs-2xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {tile.kind === 'pattern' ? (
                      <>
                        fires across {tile.affectedDocCount} member doc
                        {tile.affectedDocCount === 1 ? '' : 's'}
                      </>
                    ) : (
                      <>
                        <Brain size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                        recurring bias
                      </>
                    )}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {tile.description}
                </p>
              </div>
              {tile.deepLinkDocId && (
                <a
                  href={`/documents/${tile.deepLinkDocId}`}
                  title="Open the worst-offender per-document audit"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontSize: 'var(--fs-2xs)',
                    fontWeight: 600,
                  }}
                >
                  Open
                  <ChevronRight size={12} />
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
