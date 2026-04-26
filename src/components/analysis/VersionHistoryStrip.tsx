'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, GitBranch, GitCompareArrows, Loader2, Pencil, Check, X } from 'lucide-react';
import { MemoDiffViewer } from './MemoDiffViewer';

interface Version {
  id: string;
  filename: string;
  versionNumber: number;
  versionLabel: string | null;
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
  /** Owner flag — shows the version-label inline editor. */
  isOwner?: boolean;
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

export function VersionHistoryStrip({ documentId, hideWhenSingle = true, isOwner }: Props) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diffAgainst, setDiffAgainst] = useState<string | null>(null);
  const [editingLabelFor, setEditingLabelFor] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [savingLabel, setSavingLabel] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}/versions`);
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = (await res.json()) as { versions: Version[] };
      setVersions(data.versions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load version history');
    }
  }, [documentId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}/versions`);
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

  const saveLabel = useCallback(
    async (versionId: string) => {
      setSavingLabel(true);
      try {
        const res = await fetch(`/api/documents/${encodeURIComponent(versionId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ versionLabel: labelDraft.trim() || null }),
        });
        if (res.ok) {
          setEditingLabelFor(null);
          setLabelDraft('');
          await refetch();
        }
      } finally {
        setSavingLabel(false);
      }
    },
    [labelDraft, refetch]
  );

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
                  {isCurrent && <span style={{ marginLeft: 6, fontWeight: 600 }}>· current</span>}
                </div>
                {/* 2.3 deep — version label inline editor (owner-only on the
                    current version). Shows the label inline when set; click
                    pencil to edit. */}
                {isCurrent && isOwner ? (
                  editingLabelFor === v.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <input
                        value={labelDraft}
                        onChange={e => setLabelDraft(e.target.value.slice(0, 80))}
                        placeholder="Pre-IC draft, post-counsel rev, …"
                        autoFocus
                        style={{
                          fontSize: 11,
                          padding: '2px 6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 4,
                          color: 'var(--text-primary)',
                          minWidth: 160,
                        }}
                      />
                      <button
                        onClick={() => void saveLabel(v.id)}
                        disabled={savingLabel}
                        title="Save"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {savingLabel ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingLabelFor(null);
                          setLabelDraft('');
                        }}
                        title="Cancel"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingLabelFor(v.id);
                        setLabelDraft(v.versionLabel ?? '');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 11,
                        color: v.versionLabel ? 'var(--text-secondary)' : 'var(--text-muted)',
                        fontStyle: v.versionLabel ? 'normal' : 'italic',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {v.versionLabel ?? 'Add label'}
                      <Pencil size={9} style={{ opacity: 0.6 }} />
                    </button>
                  )
                ) : v.versionLabel ? (
                  <div
                    style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}
                  >
                    {v.versionLabel}
                  </div>
                ) : null}
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
                {!isCurrent && (
                  <button
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDiffAgainst(diffAgainst === v.id ? null : v.id);
                    }}
                    style={{
                      marginTop: 6,
                      background: diffAgainst === v.id ? 'var(--accent-primary)' : 'transparent',
                      border: `1px solid ${diffAgainst === v.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      color: diffAgainst === v.id ? 'white' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <GitCompareArrows size={10} />
                    {diffAgainst === v.id ? 'Hide diff' : 'Compare'}
                  </button>
                )}
              </div>
            );
            return (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isCurrent ? (
                  inner
                ) : (
                  <Link href={`/documents/${v.id}`} style={{ textDecoration: 'none' }}>
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
        {diffAgainst && (
          <div style={{ marginTop: 12 }}>
            <MemoDiffViewer
              documentId={documentId}
              againstId={diffAgainst}
              onClose={() => setDiffAgainst(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
