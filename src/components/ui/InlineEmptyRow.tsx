'use client';

import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';

/**
 * InlineEmptyRow — the canonical "this surface has no content yet" row
 * (DESIGN.md §115).
 *
 * Replaces the 200px+ vertical card with paragraph-length copy. Use this
 * when an empty section sits inside a longer page and the user shouldn't
 * scroll past three sentences of "you have no rooms / outcomes / nudges yet."
 *
 * Anatomy: icon + one-line headline + optional CTA on the right.
 *
 * For TRUE empty pages (e.g. the entire dashboard with no documents), use
 * the more elaborate `EmptyState` component. This one is for collapsed
 * sub-sections where vertical real estate is precious.
 */

export interface InlineEmptyRowProps {
  icon: LucideIcon;
  /** One-line headline — keep under 70 chars. */
  headline: string;
  /** Optional secondary line beneath the headline. */
  body?: string;
  /** Right-side primary CTA. Either a button OR a link, not both. */
  ctaLabel?: string;
  /** Provide ONE of: onClick (button) OR href (next/link). */
  onCtaClick?: () => void;
  ctaHref?: string;
  /** Right-side icon next to the CTA label (lucide-react). */
  ctaIcon?: LucideIcon;
}

export function InlineEmptyRow({
  icon: Icon,
  headline,
  body,
  ctaLabel,
  onCtaClick,
  ctaHref,
  ctaIcon: CtaIcon,
}: InlineEmptyRowProps) {
  const cta = ctaLabel ? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 'var(--fs-sm)',
        fontWeight: 500,
        color: 'var(--accent-primary)',
        whiteSpace: 'nowrap',
      }}
    >
      {ctaLabel}
      {CtaIcon && <CtaIcon size={14} aria-hidden />}
    </span>
  ) : null;

  const ctaWrapper = ctaLabel
    ? ctaHref
      ? (
          <Link
            href={ctaHref}
            style={{ textDecoration: 'none', flexShrink: 0 }}
            className="inline-empty-row-cta"
          >
            {cta}
          </Link>
        )
      : (
          <button
            type="button"
            onClick={onCtaClick}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            className="inline-empty-row-cta"
          >
            {cta}
          </button>
        )
    : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <Icon
        size={18}
        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
        aria-hidden
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--fs-sm)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
          }}
        >
          {headline}
        </div>
        {body && (
          <div
            style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-muted)',
              marginTop: 2,
              lineHeight: 1.5,
            }}
          >
            {body}
          </div>
        )}
      </div>
      {ctaWrapper}
    </div>
  );
}
