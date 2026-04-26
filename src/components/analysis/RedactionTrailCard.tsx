'use client';

/**
 * Redaction trail card on the document detail page (3.2 deep).
 *
 * Renders the audit-log evidence that PII was scrubbed before the
 * memo entered the pipeline. Categories + counts + hashes — never
 * the originals (they don't exist server-side anyway).
 *
 * The redactor's own browser may also have a sessionStorage placeholder
 * map for this analysis; when present, a "Reveal local copy" button
 * locally rehydrates the original text in the DOM (purely client-side,
 * never sent back to the server).
 */

import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Eye, EyeOff, Clock, FileLock2 } from 'lucide-react';
import { loadPlaceholderMap, type PlaceholderMapEntry } from '@/lib/utils/redaction-trail';
import { REDACTION_CATEGORY_LABEL, type RedactionCategory } from '@/lib/utils/redaction-scanner';

interface AuditRow {
  id: string;
  userId: string;
  action: 'REDACTION_APPLIED' | 'REDACTION_SKIPPED' | string;
  details: {
    source?: string;
    originalHash?: string;
    submittedHash?: string;
    detectedCounts?: Record<RedactionCategory, number>;
    redactedCounts?: Record<RedactionCategory, number>;
    placeholderCount?: number;
    detectedTotal?: number;
    redactedTotal?: number;
  } | null;
  createdAt: string;
}

interface Props {
  analysisId: string;
  /** When true, owner-only viewer features (placeholder replay) are exposed. */
  isOwner?: boolean;
}

function formatTimeAgo(ts: string): string {
  try {
    const ms = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } catch {
    return ts;
  }
}

const CATEGORY_HEX: Record<RedactionCategory, string> = {
  ssn: '#7F1D1D',
  email: '#2563EB',
  phone: '#2563EB',
  amount: '#D97706',
  entity: '#7C3AED',
  name: '#16A34A',
};

export function RedactionTrailCard({ analysisId, isOwner = false }: Props) {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [placeholderMap, setPlaceholderMap] = useState<PlaceholderMapEntry[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!analysisId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/redaction/log?analysisId=${analysisId}`);
        if (!cancelled && res.ok) {
          const body = await res.json().catch(() => ({}));
          setRows(body.rows ?? []);
        } else if (!cancelled) {
          setRows([]);
        }
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  useEffect(() => {
    if (!isOwner) return;
    setPlaceholderMap(loadPlaceholderMap(analysisId));
  }, [analysisId, isOwner]);

  const handleReveal = useCallback(() => {
    // Reveal is a client-only DOM swap, but for v1 we keep the surface
    // simple: just toggle a "show map" panel that displays the
    // placeholder→original mapping. Future: allow the panel to splice
    // the mapping back into the rendered memo body.
    setRevealed(prev => !prev);
  }, []);

  if (loading) return null;
  const latest = rows?.[0];
  if (!latest) return null;

  const details = latest.details ?? {};
  const wasApplied = latest.action === 'REDACTION_APPLIED';
  const detected = details.detectedTotal ?? 0;
  const redacted = details.redactedTotal ?? 0;
  const placeholders = details.placeholderCount ?? 0;
  const detectedBreakdown = (details.detectedCounts ?? {}) as Record<RedactionCategory, number>;
  const redactedBreakdown = (details.redactedCounts ?? {}) as Record<RedactionCategory, number>;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${wasApplied ? '#16A34A' : '#D97706'}`,
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
          <ShieldCheck
            size={16}
            style={{
              color: wasApplied ? '#16A34A' : '#D97706',
              marginTop: 2,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Clock size={11} />
              Redaction trail · {formatTimeAgo(latest.createdAt)}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.45,
              }}
            >
              {wasApplied
                ? `Redacted ${redacted} of ${detected} detected token${detected === 1 ? '' : 's'} before submit`
                : `Continued without redacting (${detected} detected token${detected === 1 ? '' : 's'} reviewed)`}
            </div>
            {placeholders > 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginTop: 3,
                }}
              >
                {placeholders} unique placeholder{placeholders === 1 ? '' : 's'} emitted into the
                memo.
              </div>
            )}
          </div>
        </div>

        {isOwner && placeholderMap && placeholderMap.length > 0 && (
          <button
            onClick={handleReveal}
            className="btn btn-outline btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
            {revealed ? 'Hide local map' : 'Reveal local map'}
          </button>
        )}
      </div>

      {/* Category breakdown */}
      {(detected > 0 || redacted > 0) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 10,
          }}
        >
          {(Object.keys(REDACTION_CATEGORY_LABEL) as RedactionCategory[])
            .filter(c => (detectedBreakdown[c] ?? 0) > 0 || (redactedBreakdown[c] ?? 0) > 0)
            .map(c => {
              const det = detectedBreakdown[c] ?? 0;
              const red = redactedBreakdown[c] ?? 0;
              const colour = CATEGORY_HEX[c];
              return (
                <span
                  key={c}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: colour,
                    background: `${colour}14`,
                    border: `1px solid ${colour}33`,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                  title={`${red} of ${det} ${c} tokens redacted`}
                >
                  {REDACTION_CATEGORY_LABEL[c]} · {red}/{det}
                </span>
              );
            })}
        </div>
      )}

      {/* Hash row — defensive evidence procurement asks for. Truncated for display. */}
      {(details.originalHash || details.submittedHash) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginTop: 10,
            padding: '8px 10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-muted)',
          }}
        >
          {details.originalHash && (
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>orig sha256:</strong>{' '}
              {details.originalHash.slice(0, 16)}…
            </div>
          )}
          {details.submittedHash && (
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>sent sha256:</strong>{' '}
              {details.submittedHash.slice(0, 16)}…
            </div>
          )}
        </div>
      )}

      {/* Owner-only placeholder reveal — purely client-side */}
      {isOwner && revealed && placeholderMap && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            background: 'rgba(217,119,6,0.08)',
            border: '1px solid rgba(217,119,6,0.30)',
            borderRadius: 6,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#9A6D08',
              marginBottom: 8,
            }}
          >
            <FileLock2 size={11} />
            Local-only — never left this browser
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {placeholderMap.map(e => (
              <div key={e.placeholder} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    color: CATEGORY_HEX[e.category],
                    fontWeight: 700,
                    minWidth: 90,
                  }}
                >
                  {e.placeholder}
                </span>
                <span style={{ opacity: 0.55 }}>→</span>
                <span style={{ color: 'var(--text-secondary)' }}>{e.original}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
