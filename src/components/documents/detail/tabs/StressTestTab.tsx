/**
 * StressTestTab — "Will this hold up under pressure?"
 *
 * The pressure-testing workspace. Consolidates six previously-separate
 * tabs (Boardroom, Simulator, RedTeam, SWOT, Forgotten Questions,
 * Intelligence) into one tab with sub-pill navigation. Each sub-pill
 * switches which existing component renders in the body slot — parent
 * supplies the slot content, this component owns the visual chrome and
 * sub-pill state.
 *
 * Sub-pills are sorted by buyer-question priority (boardroom + what-if
 * are the two most-demoed surfaces; red-team / SWOT / forgotten /
 * intelligence are the long-tail).
 */

'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { Users, GitBranch, Shield, Layers, HelpCircle, Globe, type LucideIcon } from 'lucide-react';
import { SeverityEdgeCard } from '../primitives';

export type StressTestSubTab =
  | 'boardroom'
  | 'whatif'
  | 'redteam'
  | 'swot'
  | 'forgotten'
  | 'intelligence';

export interface StressTestSlot {
  id: StressTestSubTab;
  available: boolean;
  /** Optional count badge — "3 challenges" / "5 questions" */
  badge?: number | string;
  /** The actual content body for this sub-tab. */
  content: ReactNode;
}

export interface StressTestTabProps {
  /** All six sub-tab slots. Parent wires each one with the existing
   *  component (BoardroomTab, SimulatorTab, etc.) or marks unavailable. */
  slots: StressTestSlot[];
  /** Initial sub-pill — defaults to first available. */
  initialSubTab?: StressTestSubTab;
}

const SUB_TAB_DEFS: Array<{
  id: StressTestSubTab;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: 'boardroom',
    label: 'Boardroom',
    description: 'Five personas vote · which seat objects loudest',
    icon: Users,
  },
  {
    id: 'whatif',
    label: 'What-if',
    description: 'Counterfactual scenarios · predicted DQI delta',
    icon: GitBranch,
  },
  {
    id: 'redteam',
    label: 'Red team',
    description: 'Pre-mortem · prospective hindsight · failure modes',
    icon: Shield,
  },
  {
    id: 'swot',
    label: 'SWOT',
    description: 'Structural framing · strengths vs. structural risks',
    icon: Layers,
  },
  {
    id: 'forgotten',
    label: 'Forgotten Qs',
    description: 'Questions the memo did not ask',
    icon: HelpCircle,
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    description: 'External context the audit pulled in',
    icon: Globe,
  },
];

export function StressTestTab(props: StressTestTabProps) {
  const { slots, initialSubTab } = props;
  const slotMap = useMemo(() => {
    const m: Record<string, StressTestSlot> = {};
    for (const s of slots) m[s.id] = s;
    return m;
  }, [slots]);

  const firstAvailable = useMemo(
    () => SUB_TAB_DEFS.find(d => slotMap[d.id]?.available)?.id ?? 'boardroom',
    [slotMap]
  );
  const [active, setActive] = useState<StressTestSubTab>(initialSubTab ?? firstAvailable);

  const activeSlot = slotMap[active];
  const activeDef = SUB_TAB_DEFS.find(d => d.id === active)!;

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Sub-pill nav */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 8,
        }}
        className="stress-subpills"
      >
        {SUB_TAB_DEFS.map(def => {
          const slot = slotMap[def.id];
          const enabled = slot?.available ?? false;
          const isActive = active === def.id;
          const Icon = def.icon;
          return (
            <button
              key={def.id}
              type="button"
              disabled={!enabled}
              onClick={() => enabled && setActive(def.id)}
              title={enabled ? def.description : `${def.label} — no data on this audit`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '10px 8px',
                background: isActive
                  ? 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-card))'
                  : 'var(--bg-card)',
                border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md, 8px)',
                cursor: enabled ? 'pointer' : 'not-allowed',
                opacity: enabled ? 1 : 0.45,
                transition: 'all 0.15s ease',
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (enabled && !isActive) {
                  e.currentTarget.style.borderColor = 'var(--text-muted)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (enabled && !isActive) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={16} />
              <span style={{ letterSpacing: '-0.005em' }}>{def.label}</span>
              {slot?.badge != null && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 6,
                    padding: '0 5px',
                    fontSize: 9,
                    fontWeight: 700,
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    borderRadius: 999,
                    minWidth: 14,
                    textAlign: 'center',
                    lineHeight: '14px',
                  }}
                >
                  {slot.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Description strip */}
      <div
        style={{
          padding: '8px 14px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm, 4px)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          lineHeight: 1.55,
        }}
      >
        {activeDef.description}
      </div>

      {/* Active slot body */}
      {activeSlot?.available ? (
        <div className="stress-slot-body">{activeSlot.content}</div>
      ) : (
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
              No {activeDef.label.toLowerCase()} data for this audit
            </div>
            <div style={{ fontSize: 12 }}>{activeDef.description}</div>
          </div>
        </SeverityEdgeCard>
      )}

      <style jsx>{`
        @media (max-width: 720px) {
          .stress-subpills {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
