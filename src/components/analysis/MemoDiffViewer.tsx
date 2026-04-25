'use client';

/**
 * Memo diff viewer (2.3 deep).
 *
 * Renders a line-level diff of two same-chain documents. Drives off the
 * GET /api/documents/[id]/diff?against=Y endpoint, which already
 * RBAC-gates both sides and orders before/after by versionNumber.
 *
 * UI: stats strip (added/removed/unchanged) + collapsed line-by-line
 * diff with green/red gutters. Mobile-aware (single column on narrow).
 */

import { useEffect, useState } from 'react';
import { GitCompareArrows, Plus, Minus, Loader2 } from 'lucide-react';

interface DiffSegment {
  type: 'add' | 'remove' | 'context';
  text: string;
  lineNumber?: number;
}

interface DiffResponse {
  before: { id: string; filename: string; versionNumber: number; versionLabel: string | null };
  after: { id: string; filename: string; versionNumber: number; versionLabel: string | null };
  stats: { added: number; removed: number; unchanged: number; truncated: boolean };
  segments: DiffSegment[];
}

interface Props {
  /** Document id of one side; the API determines before/after by versionNumber. */
  documentId: string;
  /** Document id of the other side. */
  againstId: string;
  /** Called when user clicks the close button. */
  onClose?: () => void;
}

export function MemoDiffViewer({ documentId, againstId, onClose }: Props) {
  const [data, setData] = useState<DiffResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/documents/${documentId}/diff?against=${encodeURIComponent(againstId)}`
        );
        if (!cancelled) {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            setError(body.error ?? `Diff failed (${res.status})`);
          } else {
            setData((await res.json()) as DiffResponse);
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
  }, [documentId, againstId]);

  if (loading) {
    return (
      <div
        style={{
          padding: 16,
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Loader2 size={14} className="animate-spin" />
        Computing diff…
      </div>
    );
  }
  if (error) {
    return (
      <div
        className="card"
        style={{
          padding: 14,
          fontSize: 13,
          color: 'var(--severity-high)',
          borderLeft: '3px solid var(--severity-high)',
        }}
      >
        {error}
      </div>
    );
  }
  if (!data) return null;

  const beforeLabel = data.before.versionLabel
    ? `${data.before.versionLabel} (v${data.before.versionNumber})`
    : `v${data.before.versionNumber}`;
  const afterLabel = data.after.versionLabel
    ? `${data.after.versionLabel} (v${data.after.versionNumber})`
    : `v${data.after.versionNumber}`;

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          <GitCompareArrows size={14} style={{ color: 'var(--accent-primary)' }} />
          {beforeLabel} <span style={{ color: 'var(--text-muted)' }}>→</span> {afterLabel}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 11.5,
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ color: '#16A34A', fontWeight: 700 }}>+{data.stats.added}</span>
          <span style={{ color: '#DC2626', fontWeight: 700 }}>−{data.stats.removed}</span>
          <span>{data.stats.unchanged} unchanged</span>
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11 }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 12,
          lineHeight: 1.5,
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        {data.segments.map((s, i) => {
          const colour =
            s.type === 'add'
              ? '#16A34A'
              : s.type === 'remove'
                ? '#DC2626'
                : 'var(--text-muted)';
          const bg =
            s.type === 'add'
              ? 'rgba(22,163,74,0.06)'
              : s.type === 'remove'
                ? 'rgba(220,38,38,0.06)'
                : 'transparent';
          const isHidden = s.text.startsWith('… ');
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr',
                background: bg,
                color: s.type === 'context' ? 'var(--text-secondary)' : 'var(--text-primary)',
                padding: '2px 12px',
                fontStyle: isHidden ? 'italic' : 'normal',
              }}
            >
              <span
                aria-hidden
                style={{
                  color: colour,
                  fontWeight: 700,
                  textAlign: 'center',
                  userSelect: 'none',
                }}
              >
                {s.type === 'add' ? (
                  <Plus size={11} style={{ verticalAlign: -2 }} />
                ) : s.type === 'remove' ? (
                  <Minus size={11} style={{ verticalAlign: -2 }} />
                ) : (
                  ''
                )}
              </span>
              <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {s.text || ' '}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
