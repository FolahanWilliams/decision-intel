/**
 * NonWedgeRolesTile — discovery signal from the access-amendment (2026-05-19).
 *
 * Surfaces the aggregation of self-described roles from non-wedge ("Other")
 * sign-ups. Now that non-wedge founders get full access with the generic
 * overview + an optional role free-text, this tile makes the data visible
 * instead of leaving it invisible in the DB. The v3.5 §3 mitigation #1
 * product-discovery sprint cohort — somewhat-disappointed Vohra responses
 * + the role text — is exactly where the next-persona signal will come from.
 *
 * Reads /api/founder-hub/non-wedge-roles (founder-pass auth, same shape as
 * VohraHxcPmfTile -> /api/founder-hub/metrics). Self-hides when totalNonWedge
 * is 0 (no signal yet) — no noise on a fresh deploy.
 */

'use client';

import { useEffect, useState } from 'react';
import { Users, ChevronRight } from 'lucide-react';

interface NonWedgeRolesPayload {
  totalNonWedge: number;
  withRoleDetail: number;
  topRoles: Array<{ role: string; count: number }>;
  recent: Array<{ role: string | null; signedUpAt: string }>;
}

interface ResponseEnvelope {
  data?: NonWedgeRolesPayload;
}

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
  infoLight: '#DBEAFE',
};

function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function NonWedgeRolesTile() {
  const [data, setData] = useState<NonWedgeRolesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/founder-hub/non-wedge-roles', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ResponseEnvelope;
        if (!cancelled && json.data) setData(json.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'fetch failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Self-hide entirely while loading, on error, OR when there's no signal yet.
  // No noise on a fresh deploy / pre-launch / auth misconfiguration.
  if (loading || error || !data || data.totalNonWedge === 0) {
    return null;
  }

  const { totalNonWedge, withRoleDetail, topRoles, recent } = data;
  const fillRatePct = totalNonWedge > 0 ? Math.round((withRoleDetail / totalNonWedge) * 100) : 0;

  return (
    <section
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderTop: `3px solid ${C.info}`,
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: C.infoSoft,
            border: `1px solid ${C.infoLight}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Users size={16} style={{ color: C.info }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.info,
              marginBottom: 4,
            }}
          >
            Non-wedge sign-ups · discovery signal
          </div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: C.slate900,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {totalNonWedge} non-wedge sign-up{totalNonWedge === 1 ? '' : 's'} since the access
            amendment
          </h3>
          <p style={{ fontSize: 12.5, color: C.slate500, margin: '4px 0 0', lineHeight: 1.5 }}>
            {withRoleDetail} of them ({fillRatePct}%) self-described their role. Tagged
            phase1HxcEligible=false — excluded from the Vohra cohort by design, but a real discovery
            signal if a pattern emerges.
          </p>
        </div>
      </div>

      {topRoles.length > 0 && (
        <div
          style={{
            background: C.slate100,
            border: `1px solid ${C.slate200}`,
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.slate600,
              marginBottom: 8,
            }}
          >
            Top self-described roles
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
            {topRoles.map(({ role, count }) => (
              <li
                key={role}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontSize: 13,
                  color: C.slate700,
                }}
              >
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {role}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.info,
                    background: C.infoSoft,
                    border: `1px solid ${C.infoLight}`,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: C.info,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {expanded ? 'Hide recent sign-ups' : `See last ${Math.min(recent.length, 20)} sign-ups`}
        <ChevronRight
          size={12}
          style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {expanded && recent.length > 0 && (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: 4,
            fontSize: 12.5,
            color: C.slate600,
          }}
        >
          {recent.map((r, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '4px 0',
                borderBottom: idx === recent.length - 1 ? 'none' : `1px solid ${C.slate100}`,
              }}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.role || <em style={{ color: C.slate400 }}>(no role provided)</em>}
              </span>
              <span style={{ color: C.slate400, fontSize: 11, flexShrink: 0 }}>
                {formatRelativeDate(r.signedUpAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
