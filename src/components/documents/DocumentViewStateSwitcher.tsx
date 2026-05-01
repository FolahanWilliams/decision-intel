'use client';

import { Compass, Mic2, FileSignature, Microscope } from 'lucide-react';
import type { DocumentViewState } from '@/hooks/useDocumentViewState';

/**
 * DocumentViewStateSwitcher — the 4-pill toggle that lets a user override
 * the auto-detected document view state.
 *
 * Locked 2026-05-01 from NotebookLM Q5 synthesis. Renders top-right of the
 * document detail page. Auto-detection is the default; this is the manual
 * escape hatch for users who want to jump between states (e.g. a returning
 * CSO who wants to re-enter Discovery framing to screenshot the hook line
 * for a colleague, or an analyst who wants the dense dashboard).
 *
 * The pills mirror the 3-state framework + the analyst escape hatch:
 *   - Discovery   (Compass) — "Did I mess up?"
 *   - Rehearsal   (Mic2)    — "Walking into the room"
 *   - Provenance  (FileSignature) — "Deliverable for GC / board"
 *   - Analyst     (Microscope) — escape hatch to the dense dashboard
 *
 * Visual treatment: subtle segmented control, tighter than the marketing
 * surface chips, with active pill highlighted via accent green border.
 */

const STATE_META: Record<
  DocumentViewState,
  { label: string; icon: typeof Compass; tooltip: string }
> = {
  discovery: {
    label: 'Discovery',
    icon: Compass,
    tooltip: 'The hook · 3 flags + cost-of-ignoring',
  },
  rehearsal: {
    label: 'Rehearsal',
    icon: Mic2,
    tooltip: 'Walking into the room · Skeptic + What-If',
  },
  provenance: {
    label: 'Provenance',
    icon: FileSignature,
    tooltip: 'The deliverable · DPR + regulatory map',
  },
  analyst: {
    label: 'Analyst',
    icon: Microscope,
    tooltip: 'Power-user dashboard · every panel',
  },
};

const ORDER: DocumentViewState[] = ['discovery', 'rehearsal', 'provenance', 'analyst'];

interface Props {
  state: DocumentViewState;
  onChange: (next: DocumentViewState) => void;
  /** Optional: hide a state from the switcher (e.g. provenance hidden for
   *  pending audits). */
  hide?: DocumentViewState[];
}

export function DocumentViewStateSwitcher({ state, onChange, hide = [] }: Props) {
  const visible = ORDER.filter(s => !hide.includes(s));
  return (
    <div
      role="tablist"
      aria-label="Document view mode"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 4,
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      {visible.map(s => {
        const meta = STATE_META[s];
        const Icon = meta.icon;
        const active = state === s;
        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={active}
            title={meta.tooltip}
            onClick={() => onChange(s)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid transparent',
              background: active ? 'var(--bg-card)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 'var(--fs-xs)',
              fontWeight: active ? 600 : 500,
              cursor: 'pointer',
              transition: 'background 150ms ease-out, color 150ms ease-out',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              }
            }}
          >
            <Icon size={13} aria-hidden />
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}
