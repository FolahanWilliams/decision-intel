'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  Briefcase,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  SAMPLE_BUNDLES,
  bundlesForRole,
  ROLE_LABEL,
  type SampleBundle,
  type SampleRole,
} from '@/lib/data/sample-bundles';

interface Props {
  /**
   * If set, the picker uses this role instead of fetching from
   * /api/onboarding. Useful for the public /demo page where we don't
   * have an authenticated user but might know the role from a query
   * string.
   */
  initialRole?: SampleRole | null;
  /** Called when the user picks a sample to load. */
  onSelect: (bundle: SampleBundle) => void;
  /** Optional title; defaults to "Try a sample memo". */
  title?: string;
  /** Optional subtitle. */
  subtitle?: string;
  /**
   * If true, fetch the role from /api/onboarding (authenticated path).
   * The /demo page calls with `false`; the dashboard inline card with
   * `true`.
   */
  fetchRole?: boolean;
  /** Hide the role-toggle row (e.g. when the host already shows it). */
  hideRoleToggle?: boolean;
}

const ROLE_ICONS: Record<SampleRole, typeof Compass> = {
  cso: Compass,
  ma: Briefcase,
  bizops: TrendingUp,
  other: Users,
};

export function RoleSamplePicker({
  initialRole = null,
  onSelect,
  title = 'Try a role-routed sample memo',
  subtitle,
  fetchRole = false,
  hideRoleToggle = false,
}: Props) {
  const [role, setRole] = useState<SampleRole | null>(initialRole ?? null);
  const [loading, setLoading] = useState(fetchRole);

  useEffect(() => {
    if (!fetchRole) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/onboarding', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { onboardingRole?: string };
        if (cancelled) return;
        if (
          data.onboardingRole === 'cso' ||
          data.onboardingRole === 'ma' ||
          data.onboardingRole === 'bizops' ||
          data.onboardingRole === 'other'
        ) {
          setRole(data.onboardingRole);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchRole]);

  const bundles = useMemo(() => bundlesForRole(role), [role]);
  const effectiveLabel = role ? ROLE_LABEL[role] : 'Mixed selection';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              marginBottom: 4,
            }}
          >
            <Sparkles size={12} /> {effectiveLabel}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              {subtitle}
            </p>
          )}
        </div>
        {!hideRoleToggle && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['cso', 'ma', 'bizops'] as const).map(r => {
              const Icon = ROLE_ICONS[r];
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: active ? 'rgba(22,163,74,0.1)' : 'transparent',
                    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={11} />
                  {r === 'cso' ? 'CSO' : r === 'ma' ? 'M&A' : 'BizOps'}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {loading ? (
        <div
          style={{
            padding: 'var(--spacing-md)',
            color: 'var(--text-muted)',
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          <Loader2 size={14} className="animate-spin" />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {bundles.map(b => (
            <button
              key={b.slug}
              onClick={() => onSelect(b)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'border-color 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {b.role === 'cso' ? 'CSO' : b.role === 'ma' ? 'M&A' : 'BizOps'}
                {b.regulatoryTag && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(59,130,246,0.12)',
                      color: '#3b82f6',
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {b.regulatoryTag}
                  </span>
                )}
                {b.marketContext === 'emerging_market' && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(168,85,247,0.12)',
                      color: '#a855f7',
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    EM
                  </span>
                )}
                {b.marketContext === 'cross_border' && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(234,179,8,0.12)',
                      color: '#eab308',
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    Cross-border
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  lineHeight: 1.3,
                }}
              >
                {b.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {b.summary}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                Try it <ArrowRight size={11} />
              </div>
            </button>
          ))}
        </div>
      )}
      {!loading && bundles.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
          No samples for this role.
        </p>
      )}
    </div>
  );
}

export { SAMPLE_BUNDLES };
