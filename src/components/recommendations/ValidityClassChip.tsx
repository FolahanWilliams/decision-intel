'use client';

/**
 * ValidityClassChip — small chip indicating a recommendation's
 * validity-class band per Kahneman & Klein 2009 / Deep Research
 * paper Ch 3.
 *
 * The chip teaches the user the framework: "high validity → trust the
 * pattern" vs "low validity → force outside view." When users see the
 * chip on every recommendation, they internalize the framing instead
 * of needing it explained.
 *
 * Locked 2026-05-10.
 */

import { Brain, AlertTriangle, ShieldAlert, Telescope } from 'lucide-react';
import type { ValidityClass } from '@/lib/learning/validity-classifier';

const VALIDITY_META: Record<
  ValidityClass,
  { label: string; tooltip: string; color: string; bg: string; Icon: typeof Brain }
> = {
  high: {
    label: 'High validity',
    tooltip:
      'Repeat-game environment with rapid feedback. Calibrated intuition outperforms — minimize friction.',
    color: 'var(--success)',
    bg: 'color-mix(in srgb, var(--success) 12%, transparent)',
    Icon: Brain,
  },
  medium: {
    label: 'Medium validity',
    tooltip:
      'Mixed feedback environment. Standard recommendation depth — balance pattern recognition with reference-class checks.',
    color: 'var(--info)',
    bg: 'color-mix(in srgb, var(--info) 12%, transparent)',
    Icon: Telescope,
  },
  low: {
    label: 'Low validity',
    tooltip:
      'Novel paradigm — pattern recognition does not apply. Force outside view + reference-class forecasting before commit.',
    color: 'var(--warning)',
    bg: 'color-mix(in srgb, var(--warning) 14%, transparent)',
    Icon: AlertTriangle,
  },
  zero: {
    label: 'Zero validity',
    tooltip:
      'Reasoning history insufficient for any pattern application. Hold for reference-class assembly before committing.',
    color: 'var(--error)',
    bg: 'color-mix(in srgb, var(--error) 14%, transparent)',
    Icon: ShieldAlert,
  },
};

export function ValidityClassChip({
  validityClass,
  size = 'sm',
  showLabel = true,
}: {
  validityClass: ValidityClass;
  size?: 'xs' | 'sm';
  showLabel?: boolean;
}) {
  const meta = VALIDITY_META[validityClass];
  const Icon = meta.Icon;
  const fontSize = size === 'xs' ? 10 : 11;
  const iconSize = size === 'xs' ? 10 : 11;
  return (
    <span
      title={meta.tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'xs' ? '1px 6px' : '2px 8px',
        borderRadius: 999,
        background: meta.bg,
        color: meta.color,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        border: `1px solid ${meta.color}`,
        flexShrink: 0,
      }}
    >
      <Icon size={iconSize} />
      {showLabel && meta.label}
    </span>
  );
}
