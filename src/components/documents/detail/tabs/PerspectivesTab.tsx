/**
 * PerspectivesTab — "How does each stakeholder read this?"
 *
 * The view-mode toggle (CSO / IC / Board / Analyst) — previously a
 * header-level segmented control — promotes to a first-class tab. Each
 * sub-pill renders a curated lens over the same audit data:
 *
 *   CSO     — Condensed exec summary + DQI + top-3 risks + recommended action
 *   IC      — Pre-IC memo cover + structural-assumptions panel + DPR CTA
 *   Board   — 2-page board export preview (mirrors the exported PDF)
 *   Analyst — Full audit detail with every panel expanded
 *
 * Each lens is its own mini-McKinsey deliverable — visually distinct
 * from the Findings / Actions data views.
 */

'use client';

import { useState, type ReactNode } from 'react';
import { Briefcase, ClipboardCheck, Presentation, FileSearch } from 'lucide-react';
import { SeverityEdgeCard } from '../primitives';

export type PerspectiveLens = 'cso' | 'ic' | 'board' | 'analyst';

const LENS_DEFS: Array<{
  id: PerspectiveLens;
  label: string;
  description: string;
  icon: typeof Briefcase;
  accent: string;
}> = [
  {
    id: 'cso',
    label: 'CSO',
    description: 'Strategic memo, audited before the board sees it',
    icon: Briefcase,
    accent: 'var(--accent-primary)',
  },
  {
    id: 'ic',
    label: 'IC',
    description: 'Pre-IC cover · predicted committee questions · risk verdict',
    icon: ClipboardCheck,
    accent: 'var(--info)',
  },
  {
    id: 'board',
    label: 'Board',
    description: '2-page preview of the board-ready export',
    icon: Presentation,
    accent: 'var(--severity-medium)',
  },
  {
    id: 'analyst',
    label: 'Analyst',
    description: 'Full audit detail — every panel expanded',
    icon: FileSearch,
    accent: 'var(--text-secondary)',
  },
];

export interface PerspectivesTabProps {
  /** Per-lens content slot. Parent supplies the curated body. */
  csoSlot: ReactNode;
  icSlot: ReactNode;
  boardSlot: ReactNode;
  analystSlot: ReactNode;
  /** Initial lens — defaults to CSO. */
  initialLens?: PerspectiveLens;
  /** Optional callback when lens changes (for analytics / persistence). */
  onLensChange?: (lens: PerspectiveLens) => void;
}

export function PerspectivesTab(props: PerspectivesTabProps) {
  const { csoSlot, icSlot, boardSlot, analystSlot, initialLens = 'cso', onLensChange } = props;
  const [lens, setLens] = useState<PerspectiveLens>(initialLens);

  const handleLensChange = (next: PerspectiveLens) => {
    setLens(next);
    onLensChange?.(next);
  };

  const activeDef = LENS_DEFS.find(d => d.id === lens)!;

  const slot: Record<PerspectiveLens, ReactNode> = {
    cso: csoSlot,
    ic: icSlot,
    board: boardSlot,
    analyst: analystSlot,
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Lens picker — 4 large segmented tiles with icon + description */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
        }}
        className="perspectives-pills"
      >
        {LENS_DEFS.map(def => {
          const isActive = lens === def.id;
          const Icon = def.icon;
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => handleLensChange(def.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '14px 14px',
                background: isActive
                  ? `color-mix(in srgb, ${def.accent} 8%, var(--bg-card))`
                  : 'var(--bg-card)',
                border: `1px solid ${isActive ? def.accent : 'var(--border-color)'}`,
                borderTop: `3px solid ${isActive ? def.accent : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md, 8px)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = def.accent;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.05)`;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={16} style={{ color: def.accent }} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isActive ? def.accent : 'var(--text-primary)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {def.label}
                </span>
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  letterSpacing: '0.01em',
                }}
              >
                {def.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active lens body */}
      <div className="perspectives-slot-body">
        {slot[lens] ?? (
          <SeverityEdgeCard severity="neutral">
            <div
              style={{
                padding: '8px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
                fontStyle: 'italic',
                lineHeight: 1.55,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {activeDef.label} lens not yet wired
              </div>
              <div>{activeDef.description}</div>
            </div>
          </SeverityEdgeCard>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 720px) {
          .perspectives-pills {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
