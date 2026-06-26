'use client';

/**
 * PostFirstAuditWhatsNext — 3-tile contextual action cluster shown to
 * users who just completed their first audit.
 *
 * Shipped 2026-05-28 as Improvement #1 from the platform plan. Closes
 * the gap between "first audit complete" and "what should I do next".
 * The tile pack appears once, between the InlineAnalysisResultCard and
 * the rest of the dashboard, on the user's first audit ONLY.
 *
 * Three tiles, in order of conversion leverage:
 *   1. Group related documents → /dashboard/decisions/new
 *      (the Container wedge feature — for users about to audit a deal
 *      with multiple supporting docs)
 *   2. Connect your tools → /dashboard/settings/integrations
 *      (the data flywheel — Slack/Drive/Email cascade)
 *   3. Share this audit → opens the existing ShareModal pre-loaded
 *      with the just-completed analysis
 *
 * Dismissible — clicking X marks the tile pack as dismissed in
 * sessionStorage so it doesn't redisplay on dashboard re-mount.
 *
 * Persona-aware: the headline + ordering adapts per onboardingRole.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Layers3, Plug, Share2, ArrowRight, X } from 'lucide-react';
import type { EmptyStateRole } from '@/lib/onboarding/role-empty-states';

interface Props {
  onboardingRole: EmptyStateRole | null;
  /** Just-completed analysis ID for the Share tile. Optional — when
   *  absent, the Share tile is rendered without the per-analysis context. */
  analysisId?: string | null;
  /** Filename of the just-completed audit for the Share tile copy. */
  filename?: string | null;
  /** Called when the user clicks the X dismiss. Caller persists the
   *  dismissal so the tile pack doesn't reappear on re-mount. */
  onDismiss?: () => void;
  /** Called when the user clicks the Share tile. Parent opens the
   *  ShareModal pre-loaded with the analysis. When omitted, the Share
   *  tile is a non-functional placeholder (the docs page button is
   *  the canonical Share flow regardless). */
  onShare?: () => void;
}

const HEADLINE_BY_ROLE: Record<EmptyStateRole, string> = {
  cso: 'Now make the most of it',
  ma: 'Now make this useful for IC',
  bizops: 'Now compound the discipline',
  pe_vc: 'Now turn this into a record',
  eta: 'Now make it catch the next one',
  other: 'Now make the most of it',
};

const SUBHEAD_BY_ROLE: Record<EmptyStateRole, string> = {
  cso: 'Three moves that turn one audit into a defensible quarterly discipline.',
  ma: 'Group the supporting documents, automate ingest, share the artefact with the committee.',
  bizops: 'Set up the workflow once, run the discipline on every recurring strategic call.',
  pe_vc:
    'Group the IC supporting documents, connect data sources, share with LPs as a procurement-grade record.',
  eta: 'Group the deal documents, automate ingest, and build the one thing only you can: a calibration record of your own underwriting across deals.',
  other: 'Three high-leverage moves to extend the audit you just ran.',
};

export function PostFirstAuditWhatsNext({
  onboardingRole,
  analysisId,
  filename,
  onDismiss,
  onShare,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const role = onboardingRole ?? 'other';
  const headline = HEADLINE_BY_ROLE[role];
  const subhead = SUBHEAD_BY_ROLE[role];

  // Per-tile copy adapts slightly per persona for the highest-leverage
  // framing. MA/PE-VC frame around IC / committee deliverables; CSO/
  // bizops frame around defensible discipline.
  const tiles = [
    {
      icon: <Layers3 size={18} />,
      eyebrow: 'Wedge feature',
      title:
        role === 'ma' || role === 'pe_vc' ? 'Group your IC documents' : 'Group related documents',
      body:
        role === 'ma'
          ? 'Add CIM + synergy model + integration plan into one Decision Container — audit them together, get a composite DQI + cross-doc conflict scan.'
          : role === 'pe_vc'
            ? 'Add the IC memo + financial model + counsel memo into one container — audit them together, get the LP-grade composite DPR.'
            : 'A Decision Container groups every document for one strategic call. Audit them together; get the composite DPR your committee actually reads.',
      href: '/dashboard/decisions/new',
      ctaLabel: 'New decision →',
      accent: 'var(--accent-primary)',
    },
    {
      icon: <Plug size={18} />,
      eyebrow: 'Data flywheel',
      title: 'Connect your tools',
      body: 'Email forwarding captures memos with zero workflow change. Drive auto-detects closed outcomes — the moat layer that compounds quarter over quarter. Slack delivers nudges in your team channel.',
      href: '/dashboard/settings/integrations',
      ctaLabel: 'Set up integrations →',
      accent: 'var(--info, #2563eb)',
    },
    {
      icon: <Share2 size={18} />,
      eyebrow: 'Forward to committee',
      title: 'Share this audit',
      body: filename
        ? `Forward "${filename.length > 40 ? filename.slice(0, 40) + '…' : filename}" to your audit committee or GC. Token-gated URL, optional password, configurable expiry.`
        : 'Forward this audit to your audit committee or GC. Token-gated URL, optional password, configurable expiry.',
      action: onShare,
      analysisId,
      ctaLabel: 'Open share modal →',
      accent: 'var(--warning, #d97706)',
    },
  ];

  return (
    <div
      style={{
        marginTop: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-md)',
        padding: '20px 22px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        position: 'relative',
      }}
    >
      {/* Dismiss */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss what's next"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={14} />
        </button>
      )}

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--accent-primary)',
            background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
            padding: '3px 10px',
            borderRadius: 999,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          What’s next
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            letterSpacing: '-0.005em',
          }}
        >
          {headline}
        </h3>
        <p
          style={{
            fontSize: 13.5,
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {subhead}
        </p>
      </div>

      {/* Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {tiles.map((tile, i) => {
          const isHovered = hovered === i;
          const sharedStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            padding: '14px 16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderTop: `3px solid ${tile.accent}`,
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
            transition: 'transform 0.12s ease, box-shadow 0.12s ease',
            transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
            boxShadow: isHovered ? '0 4px 12px rgba(15, 23, 42, 0.08)' : 'none',
            textAlign: 'left',
          };
          const inner = (
            <>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  color: tile.accent,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {tile.icon}
                {tile.eyebrow}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                  letterSpacing: '-0.005em',
                }}
              >
                {tile.title}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  marginBottom: 12,
                  flex: 1,
                }}
              >
                {tile.body}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: tile.accent,
                }}
              >
                {tile.ctaLabel}
              </div>
            </>
          );

          if ('href' in tile && tile.href) {
            return (
              <Link
                key={i}
                href={tile.href}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={sharedStyle}
              >
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if ('action' in tile && tile.action) tile.action();
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ ...sharedStyle, background: 'var(--bg-elevated)', textAlign: 'left' }}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Empty default export for sessionStorage key shared by parent + tile.
export const POST_FIRST_AUDIT_DISMISSED_KEY = 'di-post-first-audit-dismissed';

export function isPostFirstAuditDismissed(): boolean {
  try {
    return sessionStorage.getItem(POST_FIRST_AUDIT_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPostFirstAuditDismissed(): void {
  try {
    sessionStorage.setItem(POST_FIRST_AUDIT_DISMISSED_KEY, '1');
  } catch {
    // sessionStorage failure: silent per fire-and-forget pattern. The
    // tile will reappear once but that's a minor UX downgrade.
  }
}

/** ArrowRight import (kept lazy to avoid an unused-import lint when the
 *  tile pack is hidden). */
export { ArrowRight };
