'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  computeVersionDelta,
  formatBiasName,
  type VersionDelta,
} from '@/lib/utils/version-delta';

interface AnalysisFingerprint {
  id: string;
  overallScore: number;
  noiseScore: number;
  biases: Array<{ biasType: string; severity: string }>;
}

interface Props {
  /** The current analysis being viewed (the new version's audit). */
  current: AnalysisFingerprint;
  /** Resolved previous-analysis id from `Analysis.previousAnalysisId`. */
  previousAnalysisId: string;
  /** Optional pre-loaded previous analysis — saves a fetch round-trip. */
  previousPreloaded?: AnalysisFingerprint;
}

// ─── helpers ──────────────────────────────────────────────────────────────

function deltaIcon(direction: 'improved' | 'regressed' | 'flat') {
  if (direction === 'improved') return TrendingUp;
  if (direction === 'regressed') return TrendingDown;
  return Minus;
}

function deltaColor(direction: 'improved' | 'regressed' | 'flat') {
  if (direction === 'improved') return 'var(--success, #10b981)';
  if (direction === 'regressed') return 'var(--severity-high, #ef4444)';
  return 'var(--text-muted)';
}

// ─── component ────────────────────────────────────────────────────────────

export function VersionDeltaCard({ current, previousAnalysisId, previousPreloaded }: Props) {
  const [previous, setPrevious] = useState<AnalysisFingerprint | null>(
    previousPreloaded ?? null
  );
  const [loading, setLoading] = useState(!previousPreloaded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (previousPreloaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/analysis/${encodeURIComponent(previousAnalysisId)}/fingerprint`
        );
        if (!res.ok) {
          // If a dedicated fingerprint endpoint isn't available, fall back
          // to the document-detail route to walk back to the analysis row.
          // Surfacing the case as "unavailable" rather than crashing.
          if (res.status === 404) {
            throw new Error('Previous version analysis no longer available');
          }
          throw new Error(`Failed (${res.status})`);
        }
        const data = (await res.json()) as AnalysisFingerprint;
        if (!cancelled) setPrevious(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load previous version');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previousAnalysisId, previousPreloaded]);

  if (loading) {
    return (
      <div
        className="card mb-md"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="card-body flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" />
          Loading version delta…
        </div>
      </div>
    );
  }

  if (error || !previous) {
    // Silent unmount on missing previous — better than a permanent error
    // banner on the detail page. The DPR / version-history strip cover the
    // missing-history case.
    return null;
  }

  const delta = computeVersionDelta(previous, current);

  const DqiIcon = deltaIcon(delta.dqi.direction);
  const NoiseIcon = deltaIcon(delta.noise.direction);
  const dqiColor = deltaColor(delta.dqi.direction);
  const noiseColor = deltaColor(delta.noise.direction);
  const totalChanges =
    delta.biases.resolved.length +
    delta.biases.emerged.length +
    delta.biases.severityShifts.length;

  return (
    <div
      className="card mb-md"
      style={{
        borderLeft: `3px solid ${dqiColor}`,
      }}
    >
      <div className="card-header flex items-center justify-between">
        <div>
          <h3 className="text-base flex items-center gap-2">
            Version delta
            <span
              className="text-xs font-normal px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              vs. previous version
            </span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            What changed between this revision and the prior audit.
          </p>
        </div>
      </div>

      <div className="card-body">
        {/* Score deltas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${dqiColor}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Decision Quality Index
            </div>
            <div className="flex items-baseline gap-2">
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {delta.dqi.previous}
              </span>
              <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
              <span
                style={{
                  fontSize: 22,
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                }}
              >
                {delta.dqi.current}
              </span>
              <span
                className="inline-flex items-center gap-1 text-xs font-bold"
                style={{ color: dqiColor }}
              >
                <DqiIcon size={12} />
                {delta.dqi.delta > 0 ? `+${delta.dqi.delta}` : `${delta.dqi.delta}`}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${noiseColor}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Noise score (lower = better)
            </div>
            <div className="flex items-baseline gap-2">
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {delta.noise.previous}
              </span>
              <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
              <span
                style={{
                  fontSize: 22,
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                }}
              >
                {delta.noise.current}
              </span>
              <span
                className="inline-flex items-center gap-1 text-xs font-bold"
                style={{ color: noiseColor }}
              >
                <NoiseIcon size={12} />
                {delta.noise.delta > 0 ? `+${delta.noise.delta}` : `${delta.noise.delta}`}
              </span>
            </div>
          </div>
        </div>

        {/* Bias diff */}
        {totalChanges === 0 ? (
          <div
            className="text-sm flex items-center gap-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <CheckCircle2 size={14} style={{ color: 'var(--text-muted)' }} />
            Same bias signature as the previous version.
          </div>
        ) : (
          <DiffSection delta={delta} />
        )}
      </div>
    </div>
  );
}

function DiffSection({ delta }: { delta: VersionDelta }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
      }}
    >
      {delta.biases.resolved.length > 0 && (
        <DiffColumn
          label="Resolved"
          color="var(--success, #10b981)"
          items={delta.biases.resolved}
          tooltip="Biases that were flagged in the previous version but no longer detected here."
        />
      )}
      {delta.biases.emerged.length > 0 && (
        <DiffColumn
          label="Emerged"
          color="var(--severity-high, #ef4444)"
          items={delta.biases.emerged}
          tooltip="New biases introduced in this revision that weren't in the prior audit."
        />
      )}
      {delta.biases.severityShifts.length > 0 && (
        <ShiftColumn shifts={delta.biases.severityShifts} />
      )}
    </div>
  );
}

function DiffColumn({
  label,
  color,
  items,
  tooltip,
}: {
  label: string;
  color: string;
  items: string[];
  tooltip: string;
}) {
  return (
    <div>
      <div
        title={tooltip}
        style={{
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color,
          marginBottom: 6,
        }}
      >
        {label} ({items.length})
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
        {items.map(t => (
          <li
            key={t}
            style={{
              fontSize: 12.5,
              color: 'var(--text-primary)',
              padding: '4px 8px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {formatBiasName(t)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShiftColumn({ shifts }: { shifts: VersionDelta['biases']['severityShifts'] }) {
  return (
    <div>
      <div
        title="Biases present in both versions but with different severity."
        style={{
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: 'var(--text-muted)',
          marginBottom: 6,
        }}
      >
        Severity shifted ({shifts.length})
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
        {shifts.map(s => (
          <li
            key={s.biasType}
            style={{
              fontSize: 12.5,
              padding: '4px 8px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)',
              color:
                s.direction === 'improved'
                  ? 'var(--success, #10b981)'
                  : 'var(--severity-high, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {formatBiasName(s.biasType)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {s.previousSeverity} → {s.currentSeverity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
