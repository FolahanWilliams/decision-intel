/**
 * SourceLink — every assertion is clickable to its source.
 * Locked 2026-05-20 from DR §7 (FactSet pattern — pervasive drill-down
 * mechanics are the institutional-grade signal).
 *
 * Renders an inline footnote-style link with the canonical
 * superscript-style appearance. Click → external href OR drawer open
 * via the callback.
 *
 * Used for: case-library citations, regulatory-framework references,
 * methodology version stamps, calibration-baseline source notes.
 */

'use client';

import { ExternalLink } from 'lucide-react';
import type { ReactNode, CSSProperties } from 'react';

interface SourceLinkProps {
  /** Label shown alongside the source marker. Optional — when absent
   *  only the numbered marker renders. */
  label?: ReactNode;
  /** Source-display short text (e.g. "McKinsey/KPMG 2024", "v2.4.0"). */
  source: string;
  /** Numbered marker (1, 2, 3...). Renders as a superscript chip. */
  number?: number;
  /** External href when present; otherwise treated as in-app drawer
   *  trigger via onClick. */
  href?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

const MARKER_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 16,
  height: 16,
  padding: '0 4px',
  borderRadius: 4,
  background: 'rgba(15,23,42,0.08)',
  color: 'var(--text-secondary, #475569)',
  fontSize: 9.5,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.02em',
  marginLeft: 4,
  verticalAlign: 'super',
};

export function SourceLink({ label, source, number, href, onClick, style }: SourceLinkProps) {
  const isExternal = Boolean(href);
  const Tag = href ? 'a' : 'button';
  const tagProps = href
    ? { href, target: '_blank' as const, rel: 'noopener noreferrer' as const }
    : { type: 'button' as const, onClick };

  return (
    <Tag
      {...tagProps}
      title={source}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 2,
        padding: 0,
        background: 'transparent',
        border: 'none',
        color: 'var(--text-secondary, #475569)',
        cursor: 'pointer',
        textDecoration: 'none',
        fontSize: 'inherit',
        ...style,
      }}
    >
      {label}
      <span style={MARKER_STYLE}>
        {number ?? '·'}
        {isExternal ? <ExternalLink size={9} style={{ marginLeft: 2 }} /> : null}
      </span>
    </Tag>
  );
}
