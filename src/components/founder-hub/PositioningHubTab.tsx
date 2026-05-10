'use client';

/**
 * PositioningHubTab — consolidated positioning surface (locked 2026-05-10
 * batch 2 #5).
 *
 * Replaces three separate Founder Hub tabs (Positioning Copilot /
 * Competitive Positioning / Category Position) with one tab surfacing
 * the same three workflows as internal sections. The tabs were ~65%+
 * overlapping in nav-keyword space — a founder asking "tune the
 * positioning", "differentiate from Cloverpop", or "show me the
 * landscape map" could land on any of them and not know which was
 * canonical.
 *
 * Mirrors the OutreachHubTab pattern (A2 lock 2026-04-28; 33 → 31 tabs):
 *
 *   - Practise (Positioning Copilot) — interactive coach, AI-driven
 *   - Reference (Competitive Positioning) — DI-space gaps, moat
 *     layers, investor Q&As, common objections, market context
 *   - Map (Category Position) — landscape map of incumbents + gaps
 *
 * Persistence: active section in `localStorage` under
 * `di-positioning-hub-section` so a founder switching tabs and
 * coming back lands on the section they were last using.
 *
 * Deep-link via URL: `?tab=positioning_hub&section=reference` (or
 * `&section=practise` / `&section=map`) — chat coaching, command
 * palette, founder-school lessons can jump directly to the right
 * section.
 *
 * Forward-looking rule: the 3 component imports stay by-reference —
 * pure consolidation, not feature reduction. When Positioning Copilot
 * gets a new mode or Competitive Positioning gets a new framework, no
 * change here is needed; the component renders inside its section.
 */

import { useEffect, useState } from 'react';
import { Compass, Shield, Radar } from 'lucide-react';
import { PositioningCopilotTab } from './PositioningCopilotTab';
import { CompetitivePositioningTab } from './CompetitivePositioningTab';
import { CategoryPositionTab } from './CategoryPositionTab';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type Section = 'practise' | 'reference' | 'map';

const STORAGE_KEY = 'di-positioning-hub-section';

const SECTIONS: Array<{
  id: Section;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  {
    id: 'practise',
    label: 'Practise',
    description:
      'Interactive coaching for the locked positioning vocabulary — rehearse the H1, drill the contrast sub-head, pressure-test investor Q&A in real time.',
    icon: <Compass size={14} />,
    accent: '#16A34A',
  },
  {
    id: 'reference',
    label: 'Reference',
    description:
      'The 3 DI-space gaps Cloverpop / Aera / Quantellia / IBM watsonx cannot close · 5 moat layers · 8 investor Q&As · objection-handler library · market context.',
    icon: <Shield size={14} />,
    accent: '#7C3AED',
  },
  {
    id: 'map',
    label: 'Map',
    description:
      'Category landscape — 5 incumbents + 3 category gaps DI uniquely closes. Use when the buyer asks "where are you in the landscape" or "who are the 5 competitors".',
    icon: <Radar size={14} />,
    accent: '#0EA5E9',
  },
];

interface Props {
  founderPass: string;
  /** Optional initial section, e.g. from a deep-link or chat-driven nav. */
  initialSection?: Section;
}

function isSection(value: string | null | undefined): value is Section {
  return value === 'practise' || value === 'reference' || value === 'map';
}

export function PositioningHubTab({ founderPass, initialSection }: Props) {
  const [section, setSection] = useState<Section>(initialSection ?? 'reference');

  // Hydrate the persisted section once after mount (avoids SSR hydration
  // mismatch). initialSection prop wins over localStorage when both
  // exist — the deep-link is the explicit user intent.
  useEffect(() => {
    if (initialSection) return;
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount; lazy useState init would mismatch SSR/client first render
      if (isSection(saved)) setSection(saved);
    } catch (_err1) {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
      void _err1;
    }
  }, [initialSection]);

  const handleSelect = (next: Section) => {
    setSection(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (_err2) {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
      void _err2;
    }
  };

  const activeMeta = SECTIONS.find(s => s.id === section) ?? SECTIONS[0];

  return (
    <div>
      {/* Section toggle — mirrors OutreachHubTab so the founder's muscle
          memory transfers across consolidated tabs. */}
      <div
        role="tablist"
        aria-label="Positioning Hub sections"
        style={{
          display: 'flex',
          gap: 6,
          padding: 4,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {SECTIONS.map(s => {
          const active = s.id === section;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelect(s.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: active
                  ? '1px solid var(--border-active, var(--border-color))'
                  : '1px solid transparent',
                borderLeft: active ? `3px solid ${s.accent}` : '3px solid transparent',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ color: s.accent }}>{s.icon}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: '10px 14px',
          marginBottom: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${activeMeta.accent}`,
          borderRadius: 'var(--radius-md)',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        {activeMeta.description}
      </div>

      <div role="tabpanel">
        {section === 'practise' && (
          <ErrorBoundary sectionName="Positioning Copilot">
            <PositioningCopilotTab founderPass={founderPass} />
          </ErrorBoundary>
        )}
        {section === 'reference' && (
          <ErrorBoundary sectionName="Competitive Positioning">
            <CompetitivePositioningTab />
          </ErrorBoundary>
        )}
        {section === 'map' && (
          <ErrorBoundary sectionName="Category Position">
            <CategoryPositionTab />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
