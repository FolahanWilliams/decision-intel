'use client';

/**
 * Decision Provenance Record preview card (1.1 deep).
 *
 * Surfaces the eight key DPR fields directly on the analysis detail
 * page so the owner doesn't have to download the full PDF to see what
 * the record will contain. Live-fetches /api/analysis/[id]/provenance
 * on mount and renders a procurement-styled summary chip with a
 * "Download full PDF" CTA that triggers the existing flow.
 *
 * Stays compact — this is the "at a glance" surface, not a competitor
 * to the full 4-page PDF. Owner-only data; the underlying endpoint is
 * already RBAC-gated via resolveAnalysisAccess.
 */

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Hash,
  Cpu,
  Scale,
  BookText,
  ScrollText,
  Loader2,
  Download,
  ChevronDown,
} from 'lucide-react';
import type {
  ProvenanceRecordData,
} from '@/lib/reports/provenance-record-data';

interface Props {
  analysisId: string;
  /** Triggered when the user clicks the "Download full PDF" button. */
  onDownload?: () => void;
}

function shortHash(h: string | null | undefined): string {
  if (!h) return '—';
  return h.length <= 12 ? h : `${h.slice(0, 8)}…${h.slice(-4)}`;
}

export function DprPreviewCard({ analysisId, onDownload }: Props) {
  const [data, setData] = useState<ProvenanceRecordData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/analysis/${analysisId}/provenance`);
        if (!cancelled) {
          if (!res.ok) {
            setError(`Failed (${res.status})`);
          } else {
            setData((await res.json()) as ProvenanceRecordData);
          }
        }
      } catch {
        if (!cancelled) setError('Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 16,
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Loader2 size={14} className="animate-spin" /> Loading provenance preview…
      </div>
    );
  }
  if (error || !data) return null;

  const granular = data.judgeVariance.granular;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--accent-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            <ShieldCheck size={11} style={{ color: 'var(--accent-primary)' }} />
            Decision Provenance Record · preview
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Schema v{data.schemaVersion} · {data.regulatoryMapping.length} regulator
            {data.regulatoryMapping.length === 1 ? '' : 's'} mapped ·{' '}
            {data.citations.length} citation{data.citations.length === 1 ? '' : 's'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setExpanded(prev => !prev)}
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide' : 'Inspect'}
            <ChevronDown
              size={11}
              style={{
                transform: expanded ? 'rotate(180deg)' : undefined,
                transition: 'transform 0.15s ease',
              }}
            />
          </button>
          {onDownload && (
            <button
              onClick={onDownload}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
              }}
            >
              <Download size={11} />
              Full PDF
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <Field
            icon={<Hash size={11} />}
            label="Input hash"
            value={shortHash(data.inputHash)}
          />
          <Field
            icon={<Hash size={11} />}
            label="Prompt fingerprint"
            value={shortHash(data.promptFingerprint)}
          />
          <Field
            icon={<Cpu size={11} />}
            label="Pipeline nodes"
            value={`${data.pipelineLineage.length} ordered`}
          />
          <Field
            icon={<Scale size={11} />}
            label="Noise score"
            value={`${Math.round(data.judgeVariance.noiseScore)} / 100`}
          />
          {granular?.biasDetective && (
            <Field
              icon={<ScrollText size={11} />}
              label="Bias detective"
              value={`${granular.biasDetective.flagCount} flagged · ${granular.biasDetective.severeFlagCount} severe`}
            />
          )}
          {granular?.factChecker && granular.factChecker.totalClaims != null && (
            <Field
              icon={<BookText size={11} />}
              label="Fact checker"
              value={`${granular.factChecker.verified ?? 0}/${granular.factChecker.totalClaims} verified · ${granular.factChecker.contradicted ?? 0} contradicted`}
            />
          )}
          {granular?.preMortem && (
            <Field
              icon={<ScrollText size={11} />}
              label="Pre-mortem"
              value={`${granular.preMortem.failureScenarioCount} scenarios · ${granular.preMortem.redTeamCount} red team`}
            />
          )}
          {data.judgeVariance.metaVerdict && (
            <div
              style={{
                gridColumn: '1 / -1',
                marginTop: 4,
                padding: '8px 10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11.5,
                lineHeight: 1.55,
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>Meta verdict:</strong>{' '}
              {data.judgeVariance.metaVerdict}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 2,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 12,
          color: 'var(--text-primary)',
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}
