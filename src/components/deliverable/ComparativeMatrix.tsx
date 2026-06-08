/**
 * ComparativeMatrix — side-by-side rows for boardroom personas +
 * historical analogs. Locked 2026-05-20 from DR §4 (Tegus pattern for
 * qualitative comparison).
 *
 * The Tegus AI-powered comparative grid is the canonical pattern for
 * "view N perspectives side-by-side" that procurement-grade buyers
 * already recognize. We adapt it for two use cases:
 *
 *   1. Stress Test bucket → boardroom personas vs red-team objections
 *   2. Historical Analogs bucket → forgotten questions × analog cases
 *
 * Rows are deliberately uniform (same column structure across all
 * rows) so the eye can scan a single column across multiple rows
 * without re-orienting. The Bloomberg-density discipline applies in
 * Analyst view; the same component renders looser spacing in
 * Executive + /demo views.
 */

'use client';

import type { ReactNode } from 'react';

export interface ComparativeMatrixColumn {
  key: string;
  /** Column header label. */
  label: string;
  /** Optional width hint (CSS value). Defaults to flex:1. */
  width?: string;
  /** Optional alignment hint. */
  align?: 'left' | 'center' | 'right';
}

export interface ComparativeMatrixRow {
  id: string;
  /** Cells keyed by column.key. */
  cells: Record<string, ReactNode>;
  /** Optional row-level severity tint applied to the leading cell. */
  severityColor?: string;
  /** Optional drawer-open handler — row becomes interactive when present. */
  onOpenDrawer?: () => void;
}

interface ComparativeMatrixProps {
  columns: ComparativeMatrixColumn[];
  rows: ComparativeMatrixRow[];
  /** Density preset — 'standard' for Executive + demo; 'dense' for Analyst. */
  density?: 'standard' | 'dense';
  /** Empty-state message when no rows. */
  emptyState?: string;
}

export function ComparativeMatrix({
  columns,
  rows,
  density = 'standard',
  emptyState = 'No comparable rows for this audit.',
}: ComparativeMatrixProps) {
  const rowPadding = density === 'dense' ? '8px 12px' : '14px 16px';
  const fontSize = density === 'dense' ? 12.5 : 13.5;

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          border: '1px dashed var(--border-color, #E2E8F0)',
          borderRadius: 10,
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-muted, #64748B)',
        }}
      >
        {emptyState}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          padding: rowPadding,
          background: 'var(--bg-secondary, #F8FAFC)',
          borderBottom: '1px solid var(--border-color, #E2E8F0)',
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted, #64748B)',
        }}
      >
        {columns.map(col => (
          <div
            key={col.key}
            style={{
              flex: col.width ? `0 0 ${col.width}` : '1 1 0',
              minWidth: 0,
              textAlign: col.align ?? 'left',
              padding: '0 4px',
            }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {rows.map((row, idx) => (
        <div
          key={row.id}
          onClick={row.onOpenDrawer}
          role={row.onOpenDrawer ? 'button' : undefined}
          tabIndex={row.onOpenDrawer ? 0 : undefined}
          onKeyDown={
            row.onOpenDrawer
              ? e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    row.onOpenDrawer?.();
                  }
                }
              : undefined
          }
          style={{
            display: 'flex',
            padding: rowPadding,
            borderBottom:
              idx === rows.length - 1 ? 'none' : '1px solid var(--border-color, #E2E8F0)',
            fontSize,
            color: 'var(--text-primary, #0F172A)',
            cursor: row.onOpenDrawer ? 'pointer' : 'default',
            transition: 'background 120ms',
            borderLeft: row.severityColor
              ? `3px solid ${row.severityColor}`
              : '3px solid transparent',
          }}
          onMouseEnter={e => {
            if (row.onOpenDrawer) {
              e.currentTarget.style.background = 'var(--bg-secondary, #F8FAFC)';
            }
          }}
          onMouseLeave={e => {
            if (row.onOpenDrawer) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
          onFocus={e => {
            // Keyboard focus indicator — inline styles can't do :focus-visible,
            // and the row is role=button/tabIndex=0, so without this a keyboard
            // user tabbing the matrix sees no focus state at all.
            if (row.onOpenDrawer) {
              e.currentTarget.style.background = 'var(--bg-secondary, #F8FAFC)';
              e.currentTarget.style.outline = '2px solid var(--accent-primary, #16A34A)';
              e.currentTarget.style.outlineOffset = '-2px';
            }
          }}
          onBlur={e => {
            if (row.onOpenDrawer) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.outline = 'none';
            }
          }}
        >
          {columns.map(col => (
            <div
              key={col.key}
              style={{
                flex: col.width ? `0 0 ${col.width}` : '1 1 0',
                minWidth: 0,
                textAlign: col.align ?? 'left',
                padding: '0 4px',
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {row.cells[col.key] ?? '—'}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
