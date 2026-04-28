'use client';

/**
 * OutreachHubTab — consolidated outreach surface (A2 lock 2026-04-28).
 *
 * Replaces three separate Founder Hub tabs (Outreach Strategy / Message
 * Generator / Design Partners) with one tab that surfaces the same
 * three workflows as internal sections. The tabs were 65%+ overlapping
 * in nav-keyword space — a founder prepping an investor meeting could
 * land on any of them and not know which was canonical.
 *
 * The internal toggle makes the relationship explicit: outbound
 * strategy → message generation → inbound conversion is one motion,
 * not three. Each section keeps every existing component by reference;
 * this is pure consolidation, not feature reduction.
 *
 * Persistence: the active section is stored in `localStorage` under
 * `di-outreach-hub-section` so a founder switching between tabs and
 * coming back lands on the section they were last using.
 *
 * Deep-link via URL hash: `?tab=outreach&section=pipeline` (or
 * `&section=messages`, `&section=design_partners`) lets external links
 * (chat coaching, command palette, founder-school lessons) jump
 * directly to the right section.
 */

import { useEffect, useState } from 'react';
import { Zap, Crosshair, Handshake } from 'lucide-react';
import { OutreachCommandCenterTab } from './OutreachCommandCenterTab';
import { OutreachAndMeetingsTab } from './OutreachAndMeetingsTab';
import { DesignPartnersTab } from './DesignPartnersTab';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type Section = 'pipeline' | 'messages' | 'design_partners';

const STORAGE_KEY = 'di-outreach-hub-section';

const SECTIONS: Array<{
  id: Section;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  {
    id: 'pipeline',
    label: 'Pipeline & Strategy',
    description:
      'ICP events, this-week priority, persona map, channel matrix, contact tracker, POC kit, framework punch list — the operational layer.',
    icon: <Zap size={14} />,
    accent: '#16A34A',
  },
  {
    id: 'messages',
    label: 'Message Generator',
    description:
      'Paste a profile, pick an intent, draft a tailored message backed by your positioning. Saves to the pipeline above for tracking.',
    icon: <Crosshair size={14} />,
    accent: '#EC4899',
  },
  {
    id: 'design_partners',
    label: 'Design Partners',
    description:
      'Inbound prospect intake, design-partner program structure, conversion path from POC to paid pilot.',
    icon: <Handshake size={14} />,
    accent: '#0EA5E9',
  },
];

interface Props {
  founderPass: string;
  /** Optional initial section, e.g. from a deep-link or chat-driven nav. */
  initialSection?: Section;
}

function isSection(value: string | null | undefined): value is Section {
  return value === 'pipeline' || value === 'messages' || value === 'design_partners';
}

export function OutreachHubTab({ founderPass, initialSection }: Props) {
  const [section, setSection] = useState<Section>(initialSection ?? 'pipeline');

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
    } catch {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
  }, [initialSection]);

  const handleSelect = (next: Section) => {
    setSection(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
  };

  const activeMeta = SECTIONS.find(s => s.id === section) ?? SECTIONS[0];

  return (
    <div>
      {/* Section toggle — sits at the top of the tab so the founder can
          flip between outbound / message / inbound without scrolling. */}
      <div
        role="tablist"
        aria-label="Outreach Hub sections"
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
                border: active ? '1px solid var(--border-active, var(--border-color))' : '1px solid transparent',
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

      {/* Section description strip — names what this section is for in
          one line so the founder doesn't have to re-derive it from the
          tab's hero copy. */}
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

      {/* Section bodies — each wrapped in its own ErrorBoundary so a
          failure in one section never takes down the whole hub. The
          components are imported by reference; we are not duplicating
          their internal structure here. */}
      <div role="tabpanel">
        {section === 'pipeline' && (
          <ErrorBoundary sectionName="Outreach Command Center">
            <OutreachCommandCenterTab founderPass={founderPass} />
          </ErrorBoundary>
        )}
        {section === 'messages' && (
          <ErrorBoundary sectionName="Message Generator">
            <OutreachAndMeetingsTab founderPass={founderPass} />
          </ErrorBoundary>
        )}
        {section === 'design_partners' && (
          <ErrorBoundary sectionName="Design Partners">
            <DesignPartnersTab founderPass={founderPass} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
