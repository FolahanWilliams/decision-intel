'use client';

/**
 * CsoDashboardRail — collapsible top strip on /dashboard for Strategy+
 * users (team + enterprise plans). Clones the "daily" muscle that
 * CsoPipelineBoard gives the founder in the Founder Hub.
 *
 * Three columns, three verbs:
 *   - Backlog         → in-flight audits
 *   - Outcomes        → audits awaiting outcome report (overdue subset
 *                        colored amber)
 *   - Rooms active    → open decision rooms the user participates in
 *
 * Data: /api/cso-rail — plan-gated server-side; when `gated: true` the
 * rail short-circuits and renders nothing. Collapse state persists in
 * localStorage so the user's choice survives page reloads.
 *
 * Intentionally minimal chrome: this is a rail, not a widget. Three
 * stat tiles + one "Open flywheel / open rooms" CTA each.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, AlarmClock, Users, Activity, ChevronDown, ChevronUp } from 'lucide-react';

const COLLAPSE_KEY = 'di-cso-rail-collapsed';

interface RailData {
  gated: boolean;
  plan: string;
  backlog: number;
  outcomesPending: number;
  outcomesOverdue: number;
  outcomesTotal: number;
  roomsActive: number;
}

export function CsoDashboardRail() {
  const [data, setData] = useState<RailData | null>(null);
  const [loading, setLoading] = useState(true);
  // Lazy initialiser reads persisted state directly so we never flash
  // "expanded" on first paint and never setState inside an effect (the
  // Next.js 16 / React 19 react-hooks/set-state-in-effect rule bans the
  // read-then-setState-in-useEffect pattern). Guards SSR by checking
  // `typeof window` before touching localStorage.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      // localStorage may throw in private-mode Safari — silent fallback to default per CLAUDE.md fire-and-forget exceptions.
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/cso-rail')
      .then(r => (r.ok ? r.json() : null))
      .then((json: RailData | null) => {
        if (!cancelled) setData(json);
      })
      .catch(err => console.warn('[CsoDashboardRail] cso-rail fetch failed:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = () => {
    setCollapsed(next => {
      const value = !next;
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
      } catch {
        // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
      }
      return value;
    });
  };

  // Hide on plan mismatch or while loading. We don't render a skeleton
  // because a Strategy+ user seeing "0" is the point of the rail, but a
  // Free/Pro user seeing a loading skeleton for this gated feature would
  // only confuse.
  if (loading) return null;
  if (!data || data.gated) return null;

  const { backlog, outcomesPending, outcomesOverdue, outcomesTotal, roomsActive } = data;

  return (
    <section
      aria-label="CSO pipeline rail"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: 'var(--spacing-lg, 20px)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} strokeWidth={2.25} style={{ color: 'var(--accent-primary)' }} />
          CSO pipeline · today
        </span>
        {collapsed ? (
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
        )}
      </button>

      {!collapsed && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--border-color)',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <StatTile
            icon={<Loader2 size={14} strokeWidth={2.25} />}
            label="Backlog"
            sublabel="audits in flight"
            value={backlog}
            href="/dashboard"
            cta="Open dashboard"
            tone="neutral"
          />
          <StatTile
            icon={<AlarmClock size={14} strokeWidth={2.25} />}
            label="Outcomes"
            sublabel={
              outcomesOverdue > 0
                ? `${outcomesOverdue} overdue · ${outcomesPending} pending`
                : 'awaiting report'
            }
            value={outcomesTotal}
            href="/dashboard/outcome-flywheel"
            cta="Open flywheel"
            tone={outcomesOverdue > 0 ? 'warning' : 'accent'}
          />
          <StatTile
            icon={<Users size={14} strokeWidth={2.25} />}
            label="Rooms"
            sublabel="active, you participate"
            value={roomsActive}
            href="/dashboard/meetings?tab=rooms"
            cta="Open rooms"
            tone="neutral"
          />
        </div>
      )}
    </section>
  );
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  value: number;
  href: string;
  cta: string;
  tone: 'neutral' | 'accent' | 'warning';
}

function StatTile({ icon, label, sublabel, value, href, cta, tone }: StatTileProps) {
  const color =
    tone === 'warning'
      ? 'var(--warning, #D97706)'
      : tone === 'accent'
        ? 'var(--accent-primary)'
        : 'var(--text-primary)';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minWidth: 0,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md, 8px)',
          background: tone === 'warning' ? 'rgba(217,119,6,0.08)' : 'rgba(22,163,74,0.08)',
          color,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 1,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sublabel}
          </span>
        </div>
      </div>
      <Link
        href={href}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--accent-primary)',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full, 9999px)',
          background: 'rgba(22,163,74,0.08)',
          border: '1px solid rgba(22,163,74,0.22)',
          flexShrink: 0,
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
