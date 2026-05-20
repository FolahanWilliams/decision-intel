/**
 * ViewModeToggle — Executive ↔ Analyst toggle for in-product
 * document-detail pages. Locked 2026-05-20 from DR §9 (cross-context
 * format calibration).
 *
 * Executive view is the default; the toggle surfaces in the top-right
 * of the page chrome. Selecting Analyst flips density to 'dense' +
 * preserves the existing /documents/[id] tabbed layout shape as a
 * sibling render.
 *
 * The /demo surface does NOT mount this — Choice Paradox discipline
 * keeps the conversion surface single-mode.
 */

'use client';

import { Eye, Microscope } from 'lucide-react';

export type InProductViewMode = 'executive' | 'analyst';

interface ViewModeToggleProps {
  value: InProductViewMode;
  onChange: (mode: InProductViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Audit view mode"
      style={{
        display: 'inline-flex',
        background: 'var(--bg-secondary, #F8FAFC)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 999,
        padding: 3,
      }}
    >
      <ToggleButton
        active={value === 'executive'}
        onClick={() => onChange('executive')}
        icon={<Eye size={13} />}
        label="Executive"
        title="Pyramid-principle view — action titles, MECE buckets, progressive disclosure"
      />
      <ToggleButton
        active={value === 'analyst'}
        onClick={() => onChange('analyst')}
        icon={<Microscope size={13} />}
        label="Analyst"
        title="Controlled-density grid — expanded matrices, raw metadata inline, pervasive drill-down"
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        background: active ? 'var(--bg-card, #FFFFFF)' : 'transparent',
        border: 'none',
        borderRadius: 999,
        boxShadow: active ? '0 1px 2px rgba(15,23,42,0.08)' : undefined,
        color: active ? 'var(--accent-primary, #16A34A)' : 'var(--text-secondary, #475569)',
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '0.01em',
        cursor: 'pointer',
        transition: 'background 150ms, color 150ms',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
