/**
 * FindingCard — the universal modular grid item that replaces the
 * dense network graph (banned per Quantellia Trap, locked 2026-05-20).
 *
 * Per DR §4 chart-finding mapping: relationship structures (compound
 * patterns, bias clusters) should be presented via MODULAR GRID
 * SUMMARIES with click-to-drawer drill-down — NOT via node-and-edge
 * graphs which alienate executive readers.
 *
 * Card grammar:
 *   - Top edge: severity color band (3px, severity-coded)
 *   - Header row: short action-titled headline + ValueSuppressingPalette
 *   - Body: 1-2 line plain-language explanation OR verbatim excerpt
 *   - Footer: "View audit trail →" trigger (opens ProgressiveDrawer)
 *
 * Used across all three views (demo, executive, analyst) with the
 * same shape; density of the rendered grid varies by view.
 */

'use client';

import type { CSSProperties, ReactNode } from 'react';
import { ChevronRight, History } from 'lucide-react';
import type { Severity, ValueSuppressingChip, ReferenceClassEntry } from '@/lib/deliverable/types';
import { ValueSuppressingPalette } from './ValueSuppressingPalette';

interface FindingCardProps {
  /** Action-titled finding label (e.g. "Synergy Mirage", "Confirmation Bias"). */
  title: string;
  /** Optional eyebrow chip (e.g. "Compound pattern", "Cognitive bias"). */
  eyebrow?: string;
  /** Severity + confidence chip. */
  chip: ValueSuppressingChip;
  /** Brief body — 1-2 lines, plain language. */
  body?: ReactNode;
  /** Verbatim memo excerpt — rendered in italics with a left rule when present. */
  excerpt?: string;
  /** Optional value-at-stake or stat row at the bottom. */
  metaRow?: ReactNode;
  /** Historical reference class — renders a compact "Seen before" teaser.
   *  The clickable case list lives in the drawer. */
  referenceClass?: ReferenceClassEntry[];
  /** "View audit trail" trigger label. Defaults to "View audit trail →". */
  drawerTriggerLabel?: string;
  /** Drawer open handler — when present, card becomes interactive. */
  onOpenDrawer?: () => void;
  /** Optional style overrides. */
  style?: CSSProperties;
}

const SEVERITY_TOP_BORDER: Record<Severity, string> = {
  critical: 'var(--severity-critical, #b91c1c)',
  high: 'var(--severity-high, #ef4444)',
  medium: 'var(--warning, #d97706)',
  low: 'var(--success, #16a34a)',
};

export function FindingCard({
  title,
  eyebrow,
  chip,
  body,
  excerpt,
  metaRow,
  referenceClass,
  drawerTriggerLabel = 'View audit trail',
  onOpenDrawer,
  style,
}: FindingCardProps) {
  const topBorder = SEVERITY_TOP_BORDER[chip.severity];

  return (
    <article
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderTop: `3px solid ${topBorder}`,
        borderRadius: 12,
        padding: '16px 18px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        ...style,
      }}
    >
      {/* Header — eyebrow + title + chip */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {eyebrow ? (
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-muted, #64748B)',
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h3
            style={{
              fontSize: 15.5,
              fontWeight: 700,
              color: 'var(--text-primary, #0F172A)',
              margin: 0,
              letterSpacing: '-0.012em',
              lineHeight: 1.35,
              flex: '1 1 220px',
              minWidth: 0,
            }}
          >
            {title}
          </h3>
          <ValueSuppressingPalette chip={chip} />
        </div>
      </header>

      {/* Body — plain-language summary */}
      {body ? (
        <div
          style={{
            fontSize: 13.5,
            color: 'var(--text-secondary, #475569)',
            lineHeight: 1.55,
          }}
        >
          {body}
        </div>
      ) : null}

      {/* Verbatim excerpt — italic, left-rule, distinct from explanation */}
      {excerpt ? (
        <blockquote
          style={{
            margin: 0,
            paddingLeft: 12,
            borderLeft: `3px solid ${topBorder}55`,
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--text-secondary, #475569)',
            lineHeight: 1.6,
          }}
        >
          &ldquo;{excerpt}&rdquo;
        </blockquote>
      ) : null}

      {/* Optional meta row (value-at-stake, mitigation lift, etc.) */}
      {metaRow ? (
        <div
          style={{
            paddingTop: 10,
            borderTop: '1px dashed var(--border-color, #E2E8F0)',
          }}
        >
          {metaRow}
        </div>
      ) : null}

      {/* Historical reference class — compact teaser (links live in the drawer) */}
      {referenceClass && referenceClass.length > 0 ? (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            color: 'var(--text-muted, #64748B)',
            lineHeight: 1.4,
          }}
        >
          <History size={12} style={{ flexShrink: 0 }} />
          <span>
            Seen before ·{' '}
            {referenceClass
              .slice(0, 2)
              .map(c => c.company)
              .join(', ')}
            {referenceClass.length > 2 ? ` +${referenceClass.length - 2}` : ''}
          </span>
        </div>
      ) : null}

      {/* Drawer trigger — single source of progressive disclosure */}
      {onOpenDrawer ? (
        <button
          type="button"
          onClick={onOpenDrawer}
          style={{
            alignSelf: 'flex-start',
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: 'var(--accent-primary, #16A34A)',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {drawerTriggerLabel}
          <ChevronRight size={13} />
        </button>
      ) : null}
    </article>
  );
}
