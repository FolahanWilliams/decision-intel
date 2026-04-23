'use client';

/**
 * R2FBadge — compact chip marking a surface as "audited through the
 * Recognition-Rigor Framework." One shape, one color, one label.
 * Reused on document-detail header, exported PDF footer, DPR cover.
 *
 * CLAUDE.md locks "Recognition-Rigor Framework" / "R²F" as the category
 * claim. Trademark filing is deferred until pre-seed closes; vocabulary
 * ownership comes from consistent usage. Every procurement-stage surface
 * that leaves the platform should carry this badge.
 */

import { Layers } from 'lucide-react';

type R2FBadgeSize = 'xs' | 'sm' | 'md';

interface R2FBadgeProps {
  size?: R2FBadgeSize;
  /** "chip" = filled green on light; "outline" = green border on white (PDF-safe). */
  variant?: 'chip' | 'outline';
  /** When true, renders just "R²F" instead of the full name. */
  compact?: boolean;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<R2FBadgeSize, { font: number; pad: string; icon: number; gap: number }> = {
  xs: { font: 10, pad: '2px 6px', icon: 10, gap: 4 },
  sm: { font: 11, pad: '3px 8px', icon: 12, gap: 5 },
  md: { font: 12, pad: '4px 10px', icon: 13, gap: 6 },
};

export function R2FBadge({
  size = 'sm',
  variant = 'chip',
  compact = false,
  title,
  className,
  style,
}: R2FBadgeProps) {
  const s = SIZE_MAP[size];
  const isChip = variant === 'chip';
  return (
    <span
      className={className}
      title={title ?? 'Audited through the Recognition-Rigor Framework'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.pad,
        fontSize: s.font,
        fontWeight: 700,
        letterSpacing: '0.04em',
        borderRadius: 'var(--radius-full, 9999px)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        background: isChip ? 'rgba(22, 163, 74, 0.12)' : 'transparent',
        color: 'var(--accent-primary)',
        border: isChip
          ? '1px solid rgba(22, 163, 74, 0.35)'
          : '1px solid var(--accent-primary)',
        ...style,
      }}
    >
      <Layers size={s.icon} strokeWidth={2.25} aria-hidden />
      {compact ? 'R²F' : 'R²F · Recognition-Rigor Framework'}
    </span>
  );
}
