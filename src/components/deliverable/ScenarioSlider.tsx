/**
 * ScenarioSlider — interactive counterfactual what-if.
 * Locked 2026-05-20 from DR §4 chart-finding mapping (interactive
 * sliders vastly superior to static tables for scenario simulation).
 *
 * Each scenario is a toggle (mitigated / not). The cumulative projected
 * DQI updates in real time as the user toggles scenarios on/off. This
 * is the page where the buyer screenshots and sends to their team:
 * "Look — if we clean these three things up, the memo goes C → B+."
 *
 * Deliberately uses TOGGLES not sliders for the v1: full mitigation is
 * binary (you do the work or you don't), and partial-credit sliders
 * would invite per-scenario haggling that doesn't reflect how real
 * mitigation works. The visual sliders pattern from DR is preserved
 * via the cumulative DQI bar at the bottom.
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { ArrowUp, Check } from 'lucide-react';
import type { CounterfactualScenario } from '@/lib/deliverable/types';
import { gradeFromScore, dqiColorFor } from '@/lib/utils/grade';

interface ScenarioSliderProps {
  currentDqi: number;
  scenarios: CounterfactualScenario[];
  /** Optional callback so a parent can subscribe to the enabled set
   *  for chart syncing. The CounterfactualLiftChart is the canonical
   *  consumer — it visualizes which bars fill as the user toggles. */
  onEnabledChange?: (enabled: Set<string>) => void;
}

export function ScenarioSlider({ currentDqi, scenarios, onEnabledChange }: ScenarioSliderProps) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set());

  // Notify parent on every change (chart sync)
  useEffect(() => {
    onEnabledChange?.(enabled);
  }, [enabled, onEnabledChange]);

  const projectedDqi = useMemo(() => {
    const liftSum = scenarios.reduce(
      (acc, s) => (enabled.has(s.targetFindingId) ? acc + s.delta : acc),
      0
    );
    return Math.min(100, currentDqi + liftSum);
  }, [scenarios, enabled, currentDqi]);

  const projectedGrade = gradeFromScore(projectedDqi);
  const currentGrade = gradeFromScore(currentDqi);
  const dqiDelta = Math.round(projectedDqi - currentDqi);

  // The full potential — DQI with ALL fixes applied. Shown as a hint on the
  // empty state so "with selected fixes" doesn't read as stuck at the current
  // score before the user toggles anything.
  const allFixesDqi = useMemo(
    () => Math.min(100, currentDqi + scenarios.reduce((acc, s) => acc + s.delta, 0)),
    [scenarios, currentDqi]
  );
  const allFixesGrade = gradeFromScore(allFixesDqi);

  function toggle(id: string) {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (scenarios.length === 0) {
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
        No actionable mitigation scenarios surfaced at this audit confidence level.
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
      {/* Top bar — projected DQI gauge */}
      <div
        style={{
          padding: '18px 22px',
          background: 'linear-gradient(90deg, var(--bg-secondary, #F8FAFC), #FFFFFF)',
          borderBottom: '1px solid var(--border-color, #E2E8F0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted, #64748B)',
                marginBottom: 2,
              }}
            >
              Now
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--text-secondary, #475569)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(currentDqi)}
              <span style={{ fontSize: 14, marginLeft: 4 }}>· {currentGrade}</span>
            </div>
          </div>
          <ArrowUp size={18} style={{ color: 'var(--accent-primary, #16A34A)' }} />
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary, #16A34A)',
                marginBottom: 2,
              }}
            >
              With selected fixes
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: dqiColorFor(projectedDqi),
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {Math.round(projectedDqi)}
              <span style={{ fontSize: 16, marginLeft: 6 }}>· {projectedGrade}</span>
            </div>
            {enabled.size === 0 && allFixesDqi > currentDqi ? (
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-muted, #64748B)',
                  marginTop: 3,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                Select fixes below — up to {Math.round(allFixesDqi)} · {allFixesGrade} with all{' '}
                {scenarios.length}.
              </div>
            ) : null}
          </div>
        </div>
        {dqiDelta > 0 ? (
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(22,163,74,0.12)',
              color: 'var(--accent-primary, #16A34A)',
              fontSize: 13,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            +{dqiDelta} points
          </div>
        ) : null}
      </div>

      {/* Scenarios — each is a toggle row */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {scenarios.map((s, idx) => {
          const isOn = enabled.has(s.targetFindingId);
          return (
            <li
              key={s.targetFindingId}
              style={{
                borderBottom:
                  idx === scenarios.length - 1 ? 'none' : '1px solid var(--border-color, #E2E8F0)',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(s.targetFindingId)}
                aria-pressed={isOn}
                style={{
                  width: '100%',
                  padding: '14px 22px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  background: isOn ? 'rgba(22,163,74,0.06)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 150ms',
                }}
              >
                {/* Toggle box */}
                <span
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: isOn ? 'var(--accent-primary, #16A34A)' : 'var(--bg-card, #FFFFFF)',
                    border: `2px solid ${isOn ? 'var(--accent-primary, #16A34A)' : 'var(--border-color, #E2E8F0)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    marginTop: 2,
                    transition: 'all 150ms',
                  }}
                >
                  {isOn ? <Check size={14} strokeWidth={3} /> : null}
                </span>

                {/* Scenario content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-primary, #0F172A)',
                      marginBottom: 4,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Mitigate {s.targetLabel}
                  </div>
                  {s.mitigation ? (
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary, #475569)',
                        lineHeight: 1.55,
                      }}
                    >
                      {s.mitigation}
                    </div>
                  ) : null}
                </div>

                {/* Per-scenario lift */}
                <div
                  style={{
                    flexShrink: 0,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: isOn ? 'var(--accent-primary, #16A34A)' : 'rgba(22,163,74,0.10)',
                    color: isOn ? '#FFFFFF' : 'var(--accent-primary, #16A34A)',
                    fontSize: 12,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  +{Math.round(s.delta)}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
