'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, GitBranch, Loader2 } from 'lucide-react';

interface Version {
  id: string;
  filename: string;
  versionNumber: number;
  parentDocumentId: string | null;
  uploadedAt: string;
  status: string;
  latestAnalysis: {
    id: string;
    overallScore: number;
    noiseScore: number;
    createdAt: string;
    biasCount: number;
    biases: Array<{ biasType: string; severity: string }>;
  } | null;
}

interface Props {
  documentId: string;
  /** Hide the strip entirely when only v1 exists. Defaults true. */
  hideWhenSingle?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function dqiColorFor(score: number): string {
  if (score >= 85) return 'var(--success, #10b981)';
  if (score >= 70) return 'var(--accent-primary, #16A34A)';
  if (score >= 55) return 'var(--warning, #d97706)';
  if (score >= 40) return 'var(--severity-high, #ef4444)';
  return 'var(--severity-critical, #b91c1c)';
}

export function VersionHistoryStrip({ documentId, hideWhenSingle = true }: Props) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/documents/${encodeURIComponent(documentId)}/versions`
        );
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = (await res.json()) as { versions: Version[] };
        if (!cancelled) setVersions(data.versions);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load version history');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (versions === null && error === null) {
    return (
      <div
        className="text-xs flex items-center gap-2"
        style={{ color: 'var(--text-muted)', padding: 'var(--spacing-sm) 0' }}
      >
        <Loader2 size={11} className="animate-spin" /> Loading version history…
      </div>
    );
  }
  if (error) return null;
  if (!versions || versions.length === 0) return null;
  if (hideWhenSingle && versions.length < 2) return null;

  return (
    <div
      className="card mb-md"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}
    >
      <div className="card-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <div className="flex items-center gap-2 mb-2">
          <GitBranch size={14} style={{ color: 'var(--accent-primary)' }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'var(--text-muted)',
            }}
          >
            Version history ({versions.length})
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          {versions.map((v, i) => {
            const isCurrent = v.id === documentId;
            const score = v.latestAnalysis?.overallScore ?? null;
            const color = score != null ? dqiColorFor(score) : 'var(--text-muted)';
            const inner = (
              <div
                style={{
                  padding: '8px 12px',
                  background: isCurrent ? 'var(--bg-card)' : 'transparent',
                  border: `1px solid ${isCurrent ? color : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 110,
                  cursor: isCurrent ? 'default' : 'pointer',
                  transition: 'background .15s, border-color .15s',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: isCurrent ? color : 'var(--text-muted)',
                  }}
                >
                  v{v.versionNumber}
                  {isCurrent && (
                    <span style={{ marginLeft: 6, fontWeight: 600 }}>· current</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 220,
                  }}
                  title={v.filename}
                >
                  {v.filename}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>{formatDate(v.uploadedAt)}</span>
                  {score != null && (
                    <span
                      style={{
                        fontWeight: 700,
                        color,
                      }}
                    >
                      DQI {Math.round(score)}
                    </span>
                  )}
                </div>
              </div>
            );
            return (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isCurrent ? (
                  inner
                ) : (
                  <Link
                    href={`/documents/${v.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    {inner}
                  </Link>
                )}
                {i < versions.length - 1 && (
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
