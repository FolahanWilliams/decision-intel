'use client';

/**
 * Org-level structural-exposure heatmap (1.3a deep).
 *
 * Aggregates every persisted Dalio structural-assumption finding the
 * caller can read into a per-determinant rollup. Renders as a sortable
 * table with severity bar, defensibility split, EM/DM share, and a
 * top-line "X flags across Y analyses" summary.
 *
 * Mounts on /dashboard/analytics → Decision Intelligence section.
 * Empty state invites running the structural pass on more analyses.
 */

import { useEffect, useMemo, useState } from 'react';
import { Layers, AlertTriangle, Globe2 } from 'lucide-react';

interface DefensibilityMix {
  well_supported: number;
  partially_supported: number;
  unsupported: number;
  contradicted: number;
}

interface DeterminantRollup {
  determinantId: string;
  label: string;
  category: string | null;
  flagCount: number;
  uniqueAnalyses: number;
  avgSeverityIdx: number;
  topSeverity: 'low' | 'medium' | 'high' | 'critical';
  defensibilityMix: DefensibilityMix;
  emShare: number;
}

interface ResponseShape {
  rollup: DeterminantRollup[];
  totals: { flags: number; uniqueAnalyses: number; emFlags: number; dmFlags: number };
  categories?: Record<string, { label: string; description: string }>;
}

const SEV_HEX: Record<DeterminantRollup['topSeverity'], string> = {
  critical: '#7F1D1D',
  high: '#DC2626',
  medium: '#D97706',
  low: '#2563EB',
};

const CATEGORY_HEX: Record<string, string> = {
  cycles: '#7C3AED',
  power: '#DC2626',
  fundamentals: '#16A34A',
  internal: '#2563EB',
  external: '#D97706',
};

export function StructuralExposureCard() {
  const [data, setData] = useState<ResponseShape | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/intelligence/structural-exposure');
        if (!res.ok) {
          if (!cancelled) setError(`Failed (${res.status})`);
          return;
        }
        const body = (await res.json()) as ResponseShape;
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setError('Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const top = useMemo(() => data?.rollup.slice(0, 12) ?? [], [data]);

  if (loading) {
    return (
      <div
        className="card"
        style={{
          padding: 18,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        Loading structural exposure…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="card"
        style={{
          padding: 18,
          fontSize: 12,
          color: 'var(--severity-high)',
        }}
      >
        {error}
      </div>
    );
  }

  if (!data || data.rollup.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: 18,
          fontSize: 12.5,
          color: 'var(--text-muted)',
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-color)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
            color: 'var(--text-secondary)',
          }}
        >
          <Layers size={14} /> Structural exposure across the org
        </div>
        Run the structural-assumptions pass on a few analyses to populate this heatmap. The Dalio
        18-determinant lens is on the document detail page below the bias list.
      </div>
    );
  }

  const { totals } = data;
  const emShare = totals.flags === 0 ? 0 : totals.emFlags / totals.flags;

  return (
    <div className="card" style={{ padding: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            <Layers size={12} /> Structural exposure heatmap
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {totals.flags} flag{totals.flags === 1 ? '' : 's'} across {totals.uniqueAnalyses}{' '}
            analys{totals.uniqueAnalyses === 1 ? 'is' : 'es'}
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <Globe2 size={11} />
          EM share: {(emShare * 100).toFixed(0)}%
          {totals.dmFlags > 0 && ` · DM ${((totals.dmFlags / totals.flags) * 100).toFixed(0)}%`}
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 0.6fr 0.6fr 1.2fr 0.6fr',
            gap: 10,
            padding: '8px 12px',
            background: 'var(--bg-elevated)',
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          <div>Determinant</div>
          <div style={{ textAlign: 'right' }}>Flags</div>
          <div style={{ textAlign: 'right' }}>Top sev.</div>
          <div>Defensibility</div>
          <div style={{ textAlign: 'right' }}>EM</div>
        </div>
        {top.map(r => {
          const sevColour = SEV_HEX[r.topSeverity];
          const catColour = r.category ? CATEGORY_HEX[r.category] ?? '#64748B' : '#64748B';
          const total =
            r.defensibilityMix.well_supported +
            r.defensibilityMix.partially_supported +
            r.defensibilityMix.unsupported +
            r.defensibilityMix.contradicted;
          const wellPct = total === 0 ? 0 : (r.defensibilityMix.well_supported / total) * 100;
          const partialPct = total === 0 ? 0 : (r.defensibilityMix.partially_supported / total) * 100;
          const unsuppPct = total === 0 ? 0 : (r.defensibilityMix.unsupported / total) * 100;
          const contraPct = total === 0 ? 0 : (r.defensibilityMix.contradicted / total) * 100;
          return (
            <div
              key={r.determinantId}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 0.6fr 0.6fr 1.2fr 0.6fr',
                gap: 10,
                padding: '10px 12px',
                borderTop: '1px solid var(--border-color)',
                fontSize: 12,
                color: 'var(--text-primary)',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{r.label}</div>
                {r.category && (
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: catColour,
                      marginTop: 2,
                    }}
                  >
                    {r.category}
                  </div>
                )}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                }}
              >
                {r.flagCount}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontSize: 11,
                  fontWeight: 700,
                  color: sevColour,
                  textTransform: 'capitalize',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 4,
                }}
              >
                <AlertTriangle size={11} /> {r.topSeverity}
              </div>
              <div
                style={{
                  display: 'flex',
                  height: 8,
                  borderRadius: 999,
                  overflow: 'hidden',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                }}
                title={`Well ${r.defensibilityMix.well_supported} · Partial ${r.defensibilityMix.partially_supported} · Unsupported ${r.defensibilityMix.unsupported} · Contradicted ${r.defensibilityMix.contradicted}`}
              >
                <span style={{ width: `${wellPct}%`, background: '#16A34A' }} />
                <span style={{ width: `${partialPct}%`, background: '#D97706' }} />
                <span style={{ width: `${unsuppPct}%`, background: '#DC2626' }} />
                <span style={{ width: `${contraPct}%`, background: '#7F1D1D' }} />
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontSize: 11,
                  color: r.emShare > 0.5 ? '#16A34A' : 'var(--text-muted)',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: r.emShare > 0.5 ? 700 : 500,
                }}
              >
                {(r.emShare * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>

      {data.rollup.length > top.length && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 8,
          }}
        >
          {data.rollup.length - top.length} additional determinants flagged at lower frequency.
        </div>
      )}
    </div>
  );
}
