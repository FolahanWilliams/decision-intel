'use client';

import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

/**
 * DetailTabBar — the canonical tab-bar pattern for detail pages
 * (DESIGN.md §104, persona-validated layout 2026-05-01).
 *
 * Replaces the hand-rolled inline tab markup on the document detail page
 * that had:
 *   - hardcoded font-sizes ('9px' eyebrow labels — below the fs-3xs floor)
 *   - hardcoded padding ('10px 18px' — not from spacing tokens)
 *   - awkward `borderBottom + borderRadius + overflow:hidden` container
 *     that read as half-baked card-meets-divider on every page
 *   - no mobile horizontal scroll-snap
 *
 * This component:
 *   - Uses --fs-* + --spacing-* tokens throughout
 *   - Renders a clean underline-style tab bar (no awkward outer border)
 *   - Supports group labels above clusters of tabs (Deep Analysis / Scenarios)
 *   - Mobile (<700px): collapses to horizontal scroll-snap with hidden scrollbar
 *   - Active tab gets accent-green underline + bolder text — no background fill
 *   - Sticky-on-scroll optional (callers pass `sticky` prop to enable)
 *
 * The existing `TabBar` component at src/components/ui/TabBar.tsx is a
 * different glass-pill pattern used by /dashboard/meetings + /dashboard/
 * analytics — kept separate to avoid regressing those surfaces.
 */

export interface DetailTabDefinition<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Optional small badge / count chip at the right edge of the tab. */
  badge?: ReactNode;
  /** Hidden from the tab bar (used for tabs that are conditionally available). */
  hidden?: boolean;
}

export interface DetailTabGroup<T extends string = string> {
  /** Group label shown above the cluster. Omit on a single-group bar. */
  label?: string;
  tabs: DetailTabDefinition<T>[];
}

export interface DetailTabBarProps<T extends string = string> {
  groups: DetailTabGroup<T>[];
  activeId: T;
  onChange: (id: T) => void;
  /** Sticky-on-scroll. Caller provides the top offset (e.g. account for a
   *  fixed header). Defaults to 0. */
  sticky?: boolean;
  stickyTop?: number;
  /** Optional aria-label for the tablist. Defaults to "Tabs". */
  ariaLabel?: string;
  /** Stable id for testing / anchor scroll. */
  id?: string;
}

export function DetailTabBar<T extends string = string>({
  groups,
  activeId,
  onChange,
  sticky = false,
  stickyTop = 0,
  ariaLabel = 'Tabs',
  id,
}: DetailTabBarProps<T>) {
  const visibleGroups = groups
    .map(g => ({
      ...g,
      tabs: g.tabs.filter(t => !t.hidden),
    }))
    .filter(g => g.tabs.length > 0);

  return (
    <div
      id={id}
      role="tablist"
      aria-label={ariaLabel}
      className="detail-tab-bar"
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: 24,
        alignItems: 'flex-end',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto',
        scrollSnapType: 'x proximity',
        ...(sticky
          ? {
              position: 'sticky',
              top: stickyTop,
              background: 'var(--bg-primary)',
              zIndex: 10,
            }
          : {}),
      }}
    >
      {visibleGroups.map((group, gi) => (
        <div
          key={group.label ?? `group-${gi}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            scrollSnapAlign: 'start',
          }}
        >
          {group.label && (
            <span
              style={{
                fontSize: 'var(--fs-3xs)',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                paddingLeft: 4,
                marginBottom: 4,
                userSelect: 'none',
              }}
            >
              {group.label}
            </span>
          )}
          <div style={{ display: 'flex', gap: 4 }}>
            {group.tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  onClick={() => onChange(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 14px',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive
                      ? '2px solid var(--accent-primary)'
                      : '2px solid transparent',
                    marginBottom: -1,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'color 150ms ease-out, border-color 150ms ease-out',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  {Icon && <Icon size={14} aria-hidden />}
                  <span>{tab.label}</span>
                  {tab.badge != null && (
                    <span
                      style={{
                        fontSize: 'var(--fs-3xs)',
                        fontWeight: 700,
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                        background: 'var(--bg-secondary)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        marginLeft: 2,
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <style jsx>{`
        .detail-tab-bar {
          scrollbar-width: none;
        }
        .detail-tab-bar::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 700px) {
          .detail-tab-bar {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
