'use client';

/**
 * First-run inline walkthrough on /dashboard (4.2 deep).
 *
 * Strategic judgment: Onborda spotlight tours convert poorly (industry
 * data caps tour completion <40%); the dashboard is more honest if the
 * empty state IS the walkthrough. When an org has zero analyses, this
 * panel renders ABOVE the upload zone with a role-matched sample memo
 * pre-loaded — one click runs the audit pipeline and the user lands in
 * the InlineAnalysisResultCard with the wow moment intact.
 *
 * Once they have at least one analysis, the panel never renders again
 * for them.
 *
 * Dismissible per-org via localStorage; resumable from the Founder Hub
 * via the existing `di:launch-tour` event.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Briefcase,
  TrendingUp,
  Landmark,
  Users,
  ArrowRight,
  Loader2,
  X,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { bundlesForRole, type SampleBundle, type SampleRole } from '@/lib/data/sample-bundles';

const STORAGE_DISMISSED = 'di-first-run-walkthrough-dismissed';

const ROLE_LABEL: Record<SampleRole, string> = {
  cso: 'Corporate Strategy',
  ma: 'M&A / Corp Dev',
  bizops: 'BizOps / FP&A',
  pe_vc: 'PE / Venture / Fund',
  other: 'Mixed library',
};

const ROLE_ICON: Record<SampleRole, typeof Compass> = {
  cso: Compass,
  ma: Briefcase,
  bizops: TrendingUp,
  pe_vc: Landmark,
  other: Users,
};

const ROLE_TAG_LABEL: Record<SampleRole, string> = {
  cso: 'CSO',
  ma: 'M&A',
  bizops: 'BizOps',
  pe_vc: 'PE / VC',
  other: 'Mixed',
};

const ROLE_PITCH: Record<SampleRole, string> = {
  cso: 'Three role-matched memos: a market-entry recommendation, a board-level product-defer call, and a strategic acquisition with a load-bearing conflict. Pick whichever sits closest to a decision you actually face.',
  ma: 'Three IC-grade memos: a synergy-and-integration deal, a bank-regulatory diligence note, and a cross-border reverse merger. Pasting any of them and clicking Run produces a procurement-grade audit.',
  bizops:
    'Three planning-grade memos: a buy-vs-build re-platform, an FY26 R&D budget recommendation, and a regional-hub shutdown call. The biases the audit catches map onto the patterns that produce miss-the-quarter forecasts.',
  pe_vc:
    'Two IC-grade memos: a Pan-African consumer-staples roll-up with FX-cycle exposure, and a Series-B growth round into a Nairobi neo-bank with multi-jurisdiction regulatory risk. Decision-grade memos of the shape your IC actually reads.',
  other:
    'A handful of decision-grade memos picked from across the buyer-personas — pick the closest to a decision your team makes.',
};

interface Props {
  /** Whether to show the panel — driven by the parent's empty check. */
  visible: boolean;
  /** Called when the user picks a sample to load + auto-run. */
  onLoadAndRun: (bundle: SampleBundle) => void;
  /** Called when the user picks a sample but only wants to load (not run). */
  onLoadOnly: (bundle: SampleBundle) => void;
}

export function FirstRunInlineWalkthrough({ visible, onLoadAndRun, onLoadOnly }: Props) {
  const [role, setRole] = useState<SampleRole | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Defer the localStorage read out of the effect's synchronous body so
    // react-hooks/set-state-in-effect doesn't flag a cascading-render risk.
    const dismissTimer = setTimeout(() => {
      if (localStorage.getItem(STORAGE_DISMISSED) === 'true') {
        setDismissed(true);
      }
    }, 0);
    fetch('/api/onboarding')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data: { onboardingRole?: string | null }) => {
        if (
          data.onboardingRole === 'cso' ||
          data.onboardingRole === 'ma' ||
          data.onboardingRole === 'bizops' ||
          data.onboardingRole === 'pe_vc' ||
          data.onboardingRole === 'other'
        ) {
          setRole(data.onboardingRole);
        }
      })
      .catch(() => {
        /* fall back to mixed selection */
      })
      .finally(() => setLoading(false));
    return () => clearTimeout(dismissTimer);
  }, []);

  const bundles = useMemo(() => bundlesForRole(role), [role]);
  const Icon = ROLE_ICON[role ?? 'other'];

  if (!visible || dismissed || loading) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_DISMISSED, 'true');
    setDismissed(true);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(22,163,74,0.06), rgba(59,130,246,0.04))',
        border: '1px solid rgba(22,163,74,0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-md)',
        position: 'relative',
      }}
    >
      <button
        onClick={handleDismiss}
        aria-label="Dismiss first-run walkthrough"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 4,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 6,
        }}
      >
        <Icon size={16} color="#16A34A" />
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
          }}
        >
          First run · {role ? ROLE_LABEL[role] : ROLE_LABEL.other}
        </span>
      </div>
      <h2
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.25,
        }}
      >
        Run the audit on a memo you actually face.
      </h2>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          maxWidth: 680,
        }}
      >
        {ROLE_PITCH[role ?? 'other']}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 10,
          marginTop: 16,
        }}
      >
        {bundles.map(b => {
          const isBusy = busySlug === b.slug;
          return (
            <div
              key={b.slug}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {ROLE_TAG_LABEL[b.role]}
                {b.regulatoryTag && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(59,130,246,0.12)',
                      color: '#3b82f6',
                      fontSize: 9.5,
                    }}
                  >
                    {b.regulatoryTag.split(' · ')[0]}
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
                    }}
                  >
                    EM
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
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
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  onClick={() => {
                    setBusySlug(b.slug);
                    onLoadAndRun(b);
                  }}
                  disabled={isBusy}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isBusy ? 'wait' : 'pointer',
                    opacity: isBusy ? 0.7 : 1,
                  }}
                >
                  {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                  Run audit
                </button>
                <button
                  onClick={() => onLoadOnly(b)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Load into paste editor without running"
                >
                  Edit first
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/case-studies"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Explore the full case-study library
          <ArrowRight size={11} />
        </Link>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
        <Link
          href="/dashboard/provenance"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ShieldCheck size={11} />
          Where Decision Provenance Records (hashed + tamper-evident) land
        </Link>
      </div>
    </div>
  );
}
