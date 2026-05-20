/**
 * ActionTitle — Pyramid Principle horizontal-logic header.
 *
 * Per the Deep Research synthesis (locked 2026-05-20): action titles
 * drive the entire deliverable's horizontal logic. A reader skimming
 * only the titles across all sections must absorb the full strategic
 * narrative. This component renders one such title with the locked
 * typography rules:
 *
 *   - ≤15 words (validation enforced at compose time)
 *   - Active sentence with a metric or count anchor
 *   - Subject-verb-object grammar
 *   - Letter-spacing -0.02em, weight 700, color text-primary
 *
 * Three contexts share the same component with different size variants:
 *   - 'cover'    → 24-32px clamp (the deliverable's strongest sentence)
 *   - 'section'  → 18-22px (each MECE bucket lead)
 *   - 'compact'  → 14-16px (cards inside the Analyst view)
 */

'use client';

import type { CSSProperties, ReactNode } from 'react';

export type ActionTitleVariant = 'cover' | 'section' | 'compact';

interface ActionTitleProps {
  children: ReactNode;
  variant?: ActionTitleVariant;
  /** Optional eyebrow above the title (e.g. "WHAT THE AUDIT FOUND"). */
  eyebrow?: string;
  /** Optional trailing accessory (chip, badge). */
  accessory?: ReactNode;
  /** Optional inline style overrides. */
  style?: CSSProperties;
  /** Optional className for variant-specific wrapping. */
  className?: string;
}

const SIZES: Record<ActionTitleVariant, CSSProperties> = {
  cover: {
    fontSize: 'clamp(22px, 2.8vw, 30px)',
    fontWeight: 800,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  section: {
    fontSize: 'clamp(17px, 1.8vw, 21px)',
    fontWeight: 700,
    letterSpacing: '-0.018em',
    lineHeight: 1.28,
  },
  compact: {
    fontSize: 'clamp(13px, 1.2vw, 15px)',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.35,
  },
};

const EYEBROW_STYLE: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted, #64748B)',
  marginBottom: 6,
};

export function ActionTitle({
  children,
  variant = 'section',
  eyebrow,
  accessory,
  style,
  className,
}: ActionTitleProps) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {eyebrow ? <div style={EYEBROW_STYLE}>{eyebrow}</div> : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            ...SIZES[variant],
            color: 'var(--text-primary, #0F172A)',
            margin: 0,
            flex: '1 1 320px',
            minWidth: 0,
            ...style,
          }}
        >
          {children}
        </h2>
        {accessory ? <div style={{ flexShrink: 0 }}>{accessory}</div> : null}
      </div>
    </div>
  );
}
