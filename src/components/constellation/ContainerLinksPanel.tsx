'use client';

/**
 * ContainerLinksPanel — list + create + delete cognitive-lineage edges
 * for a single container. Mounted on /dashboard/decisions/[id] below
 * the cross-reference card. Lets a user wire the constellation manually
 * without leaving the decision they're auditing.
 *
 * Phase 3.5 ship — paired with /api/containers/[id]/links + the
 * ContainerConstellation viz.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Network, Plus, Trash2, X } from 'lucide-react';
import {
  CONTAINER_LINK_TYPES,
  CONTAINER_LINK_TYPE_META,
  type ContainerLinkType,
} from '@/lib/data/container-link-types';
import { CONTAINER_MODES } from '@/lib/data/decision-container-modes';
import type { DecisionContainerKind } from '@/lib/data/decision-container-modes';

interface OutboundLink {
  id: string;
  fromId: string;
  toId: string;
  toName: string;
  toKind: string;
  linkType: ContainerLinkType;
  note: string | null;
  createdAt: string;
}

interface InboundLink {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  fromKind: string;
  linkType: ContainerLinkType;
  note: string | null;
  createdAt: string;
}

interface ContainerOption {
  id: string;
  name: string;
  kind: DecisionContainerKind;
}

export function ContainerLinksPanel({ containerId }: { containerId: string }) {
  const [outbound, setOutbound] = useState<OutboundLink[]>([]);
  const [inbound, setInbound] = useState<InboundLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/containers/${containerId}/links`);
      if (!res.ok) throw new Error('Failed to load links');
      const json = (await res.json()) as { outbound: OutboundLink[]; inbound: InboundLink[] };
      setOutbound(json.outbound);
      setInbound(json.inbound);
    } catch {
      // Non-fatal — links panel renders empty if the lookup fails
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  const handleDelete = async (linkId: string) => {
    const res = await fetch(`/api/containers/${containerId}/links?linkId=${linkId}`, {
      method: 'DELETE',
    });
    if (res.ok) refresh();
  };

  const totalLinks = outbound.length + inbound.length;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 'var(--fs-2xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Cognitive lineage
          </div>
          <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600 }}>
            {totalLinks === 0
              ? 'No links yet'
              : `${totalLinks} link${totalLinks === 1 ? '' : 's'} to other decisions`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link
            href="/dashboard/decisions/constellation"
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Network size={11} />
            View constellation
          </Link>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={11} />
            Link decision
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 8, color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>
          Loading…
        </div>
      ) : totalLinks === 0 ? (
        <p
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Link this decision to a thesis it spawned from, a structural assumption it depends on, a
          strategic frame that parents it, or a prior decision it precedes. Edges surface
          compounding risk the audit alone can&rsquo;t see.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {outbound.map(l => (
            <LinkRow
              key={l.id}
              direction="outbound"
              linkType={l.linkType}
              otherId={l.toId}
              otherName={l.toName}
              otherKind={l.toKind}
              note={l.note}
              onDelete={() => handleDelete(l.id)}
            />
          ))}
          {inbound.map(l => (
            <LinkRow
              key={l.id}
              direction="inbound"
              linkType={l.linkType}
              otherId={l.fromId}
              otherName={l.fromName}
              otherKind={l.fromKind}
              note={l.note}
              // Inbound links are deleted from the OTHER container's perspective
              // — surface as read-only here.
              onDelete={null}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateLinkModal
          containerId={containerId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function LinkRow({
  direction,
  linkType,
  otherId,
  otherName,
  otherKind,
  note,
  onDelete,
}: {
  direction: 'outbound' | 'inbound';
  linkType: ContainerLinkType;
  otherId: string;
  otherName: string;
  otherKind: string;
  note: string | null;
  onDelete: (() => void) | null;
}) {
  const meta = CONTAINER_LINK_TYPE_META[linkType];
  const otherKindLabel =
    otherKind in CONTAINER_MODES
      ? CONTAINER_MODES[otherKind as DecisionContainerKind].label
      : otherKind;
  const verb =
    direction === 'outbound' ? meta.fromLabel : `${meta.fromLabel.replace(/s\b/, '')} (inbound)`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${meta.edgeColor}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--fs-3xs)',
            color: meta.edgeColor,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 2,
          }}
        >
          {direction === 'outbound' ? 'this' : otherName} {verb}{' '}
          {direction === 'outbound' ? otherName : 'this'}
        </div>
        <Link
          href={`/dashboard/decisions/${otherId}`}
          style={{
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: 500,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {otherName}{' '}
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-2xs)' }}>
            · {otherKindLabel}
          </span>
        </Link>
        {note && (
          <div
            style={{
              fontSize: 'var(--fs-2xs)',
              color: 'var(--text-secondary)',
              marginTop: 2,
              fontStyle: 'italic',
            }}
          >
            {note}
          </div>
        )}
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Remove link"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

function CreateLinkModal({
  containerId,
  onClose,
  onCreated,
}: {
  containerId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [options, setOptions] = useState<ContainerOption[]>([]);
  const [toId, setToId] = useState('');
  const [linkType, setLinkType] = useState<ContainerLinkType>('spawned_from');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/containers?limit=100');
        if (!res.ok) return;
        const json = (await res.json()) as {
          data: Array<{ id: string; name: string; kind: DecisionContainerKind }>;
        };
        setOptions(json.data.filter(c => c.id !== containerId));
      } catch {
        // Non-fatal
      }
    };
    load();
  }, [containerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!toId) {
      setError('Pick a decision to link to.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/containers/${containerId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toId, linkType, note: note.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to create link');
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = CONTAINER_LINK_TYPE_META[linkType];

  return (
    <div
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.40)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 520,
          width: '100%',
          padding: 24,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 600, margin: 0 }}>
            Link to another decision
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <Label>Link type</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CONTAINER_LINK_TYPES.map(lt => {
                const m = CONTAINER_LINK_TYPE_META[lt];
                const active = lt === linkType;
                return (
                  <button
                    key={lt}
                    type="button"
                    onClick={() => setLinkType(lt)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${active ? m.edgeColor : 'var(--border-color)'}`,
                      background: active
                        ? `color-mix(in srgb, ${m.edgeColor} 12%, transparent)`
                        : 'transparent',
                      color: active ? m.edgeColor : 'var(--text-secondary)',
                      fontSize: 'var(--fs-xs)',
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            <p
              style={{
                fontSize: 'var(--fs-2xs)',
                color: 'var(--text-secondary)',
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {meta.workflowMoment}
            </p>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Label>Decision to link to</Label>
            <select
              value={toId}
              onChange={e => setToId(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">— pick a decision —</option>
              {options.map(o => (
                <option key={o.id} value={o.id}>
                  {CONTAINER_MODES[o.kind].label} · {o.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Label>Note (optional)</Label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={
                linkType === 'depends_on'
                  ? 'e.g. depends on Q3 governance regime per Dangote DPR'
                  : linkType === 'spawned_from'
                    ? 'e.g. flows from B2B SaaS in EM thesis'
                    : ''
              }
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                padding: 8,
                marginBottom: 12,
                fontSize: 'var(--fs-xs)',
                color: 'var(--error)',
                background: 'rgba(239, 68, 68, 0.06)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-sm)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: submitting ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? 'Linking…' : 'Create link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 'var(--fs-2xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        marginBottom: 6,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-sm)',
  fontFamily: 'inherit',
};
