/**
 * DeliverablePageNav — slideshow-style top tab bar + prev/next.
 * Locked 2026-05-20 (visual-deliverable rebuild).
 *
 * Replaces the linear-scroll layout with a paginated slide view. Each
 * MECE bucket becomes one slide; the cover is slide 0. Users navigate
 * via the top tab bar or prev/next arrows. Keyboard nav: ←/→.
 *
 * Sticks to the top of the right pane so the active page identifier is
 * always visible while the reader scrolls the slide body. Procurement-
 * grade signal — "this is a deliverable with chapters, not a feed."
 */

'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';

export interface DeliverablePage {
  id: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  /** Optional badge count (e.g. number of findings on that page). */
  badge?: number;
  /** Optional severity color for the badge (red for critical pages). */
  badgeColor?: string;
}

interface DeliverablePageNavProps {
  pages: DeliverablePage[];
  activeId: string;
  onChange: (id: string) => void;
}

export function DeliverablePageNav({ pages, activeId, onChange }: DeliverablePageNavProps) {
  const activeIdx = Math.max(
    0,
    pages.findIndex(p => p.id === activeId)
  );
  const total = pages.length;

  const go = (dir: 1 | -1) => {
    const next = (activeIdx + dir + total) % total;
    onChange(pages[next].id);
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, total]);

  return (
    <nav
      aria-label="Deliverable pages"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 12,
        position: 'sticky',
        top: 12,
        zIndex: 20,
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      }}
    >
      <button type="button" onClick={() => go(-1)} aria-label="Previous page" style={navArrowStyle}>
        <ChevronLeft size={15} />
      </button>

      <div
        role="tablist"
        style={{
          display: 'flex',
          flex: 1,
          gap: 4,
          minWidth: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
        className="deliverable-page-tabs"
      >
        {pages.map((page, idx) => {
          const Icon = page.icon;
          const active = page.id === activeId;
          return (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(page.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 12px',
                background: active ? 'var(--accent-primary, #16A34A)' : 'transparent',
                color: active ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                border: 'none',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 150ms, color 150ms',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-secondary, #F8FAFC)';
                  e.currentTarget.style.color = 'var(--text-primary, #0F172A)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary, #475569)';
                }
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: active ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary, #F8FAFC)',
                  fontSize: 10.5,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <Icon size={13} />
              <span>{page.shortLabel ?? page.label}</span>
              {page.badge !== undefined && page.badge > 0 ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 999,
                    background: active
                      ? 'rgba(255,255,255,0.25)'
                      : (page.badgeColor ?? 'var(--severity-critical, #b91c1c)'),
                    color: active ? '#FFFFFF' : '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {page.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <span
        style={{
          fontSize: 11,
          color: 'var(--text-muted, #64748B)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 700,
          padding: '0 8px',
          whiteSpace: 'nowrap',
        }}
      >
        {activeIdx + 1} / {total}
      </span>

      <button type="button" onClick={() => go(1)} aria-label="Next page" style={navArrowStyle}>
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}

const navArrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  background: 'var(--bg-secondary, #F8FAFC)',
  border: '1px solid var(--border-color, #E2E8F0)',
  borderRadius: 8,
  color: 'var(--text-secondary, #475569)',
  cursor: 'pointer',
  flexShrink: 0,
};
