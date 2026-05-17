'use client';

/**
 * RippleAlertBanner — proactive `depends_on` ripple-alert surface.
 *
 * Locked 2026-05-13 (M-7 ship). Closes the Aisha-persona blocker from
 * the 2026-05-12 audit (Section 8 A-2): "No proactive depends_on ripple
 * alert when a structural assumption changes status." Sits alongside
 * AmbientSignalBanner on /dashboard. Both follow the same shape rules:
 *   - Polls every 90s.
 *   - Returns null when there are no ripples (banner is silent when
 *     not needed — never adds chrome to a clean dashboard).
 *   - Caps the rendered list at 3 groups (highest-severity-first); the
 *     full list is one click away via "View all decisions".
 *
 * Dismissal: client-side via sessionStorage. The underlying anchor state
 * doesn't change just because the user clicked dismiss; the ripple
 * will re-appear on the next browser session if the assumption is
 * still broken AND the dependent is still active. That's by design —
 * a dismissed ripple isn't "resolved", it's just acknowledged.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, AlertOctagon, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { SEVERITY_COLORS as CANONICAL_SEVERITY_COLORS } from '@/lib/constants/human-audit';

type RippleSeverity = 'high' | 'medium';
type RippleReason = 'anchor_archived' | 'anchor_outcome_failure' | 'anchor_outcome_partial';

interface RippleAlertDto {
  id: string;
  severity: RippleSeverity;
  reason: RippleReason;
  anchor: {
    id: string;
    name: string;
    kind: 'investment' | 'acquisition' | 'strategic';
    status: string;
    decisionFrame: string | null;
    outcomeSummary?: string;
    realisedDqi?: number | null;
    brierScore?: number | null;
  };
  dependent: {
    id: string;
    name: string;
    kind: 'investment' | 'acquisition' | 'strategic';
  };
  edgeNote: string | null;
  edgeCreatedAt: string;
  triggeredAt: string;
  message: string;
}

interface RippleGroupDto {
  anchorId: string;
  anchorName: string;
  anchorStatus: string;
  topSeverity: RippleSeverity;
  topReason: RippleReason;
  triggeredAt: string;
  dependents: Array<{ id: string; name: string; ripple: RippleAlertDto }>;
}

interface RippleResponse {
  ripples: RippleAlertDto[];
  groups: RippleGroupDto[];
  counts: { total: number; high: number; medium: number };
}

// Severity colors derive from the canonical SEVERITY_COLORS export
// (CLAUDE.md "SEVERITY_COLORS canonical-import discipline" locked
// 2026-05-01). RippleSeverity is a subset of the canonical 4-key map
// (high/medium); the canonical entries map to the exact same vars we
// would use locally, so the subset projection stays in lockstep.
const SEVERITY_COLORS: Record<RippleSeverity, string> = {
  high: CANONICAL_SEVERITY_COLORS.high,
  medium: CANONICAL_SEVERITY_COLORS.medium,
};

const SEVERITY_ICONS: Record<RippleSeverity, typeof AlertOctagon> = {
  high: AlertOctagon,
  medium: AlertTriangle,
};

const REASON_LABEL: Record<RippleReason, string> = {
  anchor_archived: 'Anchor archived',
  anchor_outcome_failure: 'Anchor outcome — failure',
  anchor_outcome_partial: 'Anchor outcome — partial',
};

const DISMISSED_KEY = 'di-ripple-alerts-dismissed-v1';

function loadDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.sessionStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter(v => typeof v === 'string'));
  } catch {
    // canonical fire-and-forget — sessionStorage failure (private mode,
    // quota, etc.) falls through to empty Set; the banner just shows
    // all ripples for the session.
    return new Set();
  }
}

function persistDismissed(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    // canonical fire-and-forget — sessionStorage write failure is
    // tolerable; the dismissal just won't persist across reload.
  }
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export function RippleAlertBanner() {
  const router = useRouter();
  const [response, setResponse] = useState<RippleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());

  const fetchRipples = useCallback(async () => {
    try {
      const res = await fetch('/api/ripple-alerts', { credentials: 'include' });
      if (!res.ok) return;
      const data = (await res.json()) as RippleResponse;
      setResponse(data);
    } catch {
      // canonical fire-and-forget — banner is fail-silent. A network
      // hiccup or pre-M-7 env without the endpoint should not block
      // the rest of the dashboard from rendering.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRipples();
    const interval = setInterval(() => void fetchRipples(), 90_000);
    return () => clearInterval(interval);
  }, [fetchRipples]);

  const dismissRipple = (rippleId: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(rippleId);
      persistDismissed(next);
      return next;
    });
  };

  // Filter dismissed ripples client-side. Group-level dismissal
  // requires that EVERY ripple in the group be dismissed; otherwise
  // the group stays.
  const visibleGroups = useMemo(() => {
    if (!response) return [];
    return response.groups
      .map(g => ({
        ...g,
        dependents: g.dependents.filter(d => !dismissed.has(d.ripple.id)),
      }))
      .filter(g => g.dependents.length > 0)
      .slice(0, 3);
  }, [response, dismissed]);

  const totalRemaining = useMemo(() => {
    if (!response) return 0;
    return response.ripples.filter(r => !dismissed.has(r.id)).length;
  }, [response, dismissed]);

  if (loading || visibleGroups.length === 0) return null;

  const topSeverity: RippleSeverity = visibleGroups.some(g => g.topSeverity === 'high')
    ? 'high'
    : 'medium';
  const topColor = SEVERITY_COLORS[topSeverity];

  return (
    <div
      style={{
        marginBottom: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${topColor}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <GitBranch size={14} style={{ color: topColor }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: topColor,
          }}
        >
          Dependency ripple — anchor assumption shifted
        </span>
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            marginLeft: 'auto',
          }}
        >
          {totalRemaining} dependent{totalRemaining !== 1 ? 's' : ''} at risk
        </span>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visibleGroups.map(group => {
          const color = SEVERITY_COLORS[group.topSeverity];
          const Icon = SEVERITY_ICONS[group.topSeverity];
          return (
            <div
              key={group.anchorId}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <Icon size={16} style={{ color, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 4,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/decisions/${group.anchorId}`)}
                    style={{
                      padding: 0,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--fs-sm)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                    }}
                  >
                    {group.anchorName}
                  </button>
                  <span
                    style={{
                      fontSize: 'var(--fs-2xs)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: `color-mix(in srgb, ${color} 12%, transparent)`,
                      color,
                      fontWeight: 600,
                    }}
                  >
                    {REASON_LABEL[group.topReason]}
                  </span>
                  <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                    {timeAgo(group.triggeredAt)}
                  </span>
                </div>
                <p
                  style={{
                    margin: '0 0 6px',
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {group.dependents.length} active decision
                  {group.dependents.length !== 1 ? 's' : ''} rest
                  {group.dependents.length === 1 ? 's' : ''} on this anchor — review whether the
                  assumption still holds before the next committee gate.
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {group.dependents.slice(0, 4).map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => router.push(`/dashboard/decisions/${d.id}`)}
                      style={{
                        padding: '3px 8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--fs-2xs)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {d.name}
                      <ArrowRight size={10} />
                    </button>
                  ))}
                  {group.dependents.length > 4 && (
                    <span
                      style={{
                        padding: '3px 8px',
                        fontSize: 'var(--fs-2xs)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      +{group.dependents.length - 4} more
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss this anchor's ripples"
                onClick={() => {
                  group.dependents.forEach(d => dismissRipple(d.ripple.id));
                }}
                style={{
                  padding: 4,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {totalRemaining > visibleGroups.reduce((acc, g) => acc + g.dependents.length, 0) && (
        <footer
          style={{
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            fontSize: 'var(--fs-2xs)',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            {totalRemaining - visibleGroups.reduce((acc, g) => acc + g.dependents.length, 0)} more
            ripple
            {totalRemaining - visibleGroups.reduce((acc, g) => acc + g.dependents.length, 0) !== 1
              ? 's'
              : ''}{' '}
            across other anchors
          </span>
          <button
            type="button"
            onClick={() => router.push('/dashboard/decisions')}
            style={{
              padding: 0,
              background: 'transparent',
              border: 'none',
              fontSize: 'var(--fs-2xs)',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            View all decisions
            <ArrowRight size={10} />
          </button>
        </footer>
      )}
    </div>
  );
}
