'use client';

/**
 * TwoXTomorrowStressTest — interactive surface for Sharran's "If the
 * business doubled tomorrow, where would it break?" mental simulation,
 * specialized for Decision Intel's current operational state.
 *
 * Item locked 2026-05-07 from the Q2 + Q3 master KB synthesis. The KB
 * confirmed APPLICABLE-NOW status and named the Agentic Shift as the
 * #1 second-order risk DI is under-prepared for.
 *
 * Tool shape:
 *   1. Five inputs reflecting current state — daily audits, paid
 *      Individuals, warm intros/wk, London events/mo, Founder Hub tabs.
 *      Each carries a default value + a hint.
 *   2. Doubled-state column auto-computes from the input.
 *   3. Bottleneck library (canonical, KB-derived) maps each input to
 *      the specific 2× breaking point + the pre-emptive build needed.
 *   4. Severity-coded cards (critical / high / medium / manageable)
 *      sorted by severity so the founder reads the load-bearing
 *      bottleneck first.
 *
 * Anchor: id="two_x_tomorrow" — referenced from
 * SharranOperatingPrinciples principle #7 CTA.
 */

import { useMemo, useState } from 'react';
import { Activity, AlertOctagon, AlertTriangle, ArrowRight, type LucideIcon } from 'lucide-react';
import {
  STRESS_TEST_INPUTS,
  STRESS_TEST_BOTTLENECKS,
  type StressTestBottleneck,
} from './data/sharran-principles';

const SEVERITY_META: Record<
  StressTestBottleneck['severity'],
  { label: string; color: string; bg: string; border: string; icon: LucideIcon; rank: number }
> = {
  critical: {
    label: 'CRITICAL',
    color: 'var(--error)',
    bg: 'color-mix(in srgb, var(--error) 8%, transparent)',
    border: 'color-mix(in srgb, var(--error) 35%, var(--border-color))',
    icon: AlertOctagon,
    rank: 4,
  },
  high: {
    label: 'HIGH',
    color: 'var(--severity-high, var(--error))',
    bg: 'color-mix(in srgb, var(--severity-high) 8%, transparent)',
    border: 'color-mix(in srgb, var(--severity-high) 30%, var(--border-color))',
    icon: AlertTriangle,
    rank: 3,
  },
  medium: {
    label: 'MEDIUM',
    color: 'var(--warning)',
    bg: 'color-mix(in srgb, var(--warning) 8%, transparent)',
    border: 'color-mix(in srgb, var(--warning) 30%, var(--border-color))',
    icon: AlertTriangle,
    rank: 2,
  },
  manageable: {
    label: 'MANAGEABLE',
    color: 'var(--info)',
    bg: 'color-mix(in srgb, var(--info) 8%, transparent)',
    border: 'color-mix(in srgb, var(--info) 30%, var(--border-color))',
    icon: Activity,
    rank: 1,
  },
};

export function TwoXTomorrowStressTest() {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const input of STRESS_TEST_INPUTS) {
      initial[input.id] = input.defaultValue;
    }
    return initial;
  });

  const updateValue = (id: string, raw: string) => {
    const parsed = Number.parseFloat(raw);
    setValues(prev => ({ ...prev, [id]: Number.isFinite(parsed) ? parsed : 0 }));
  };

  const sortedBottlenecks = useMemo(
    () =>
      [...STRESS_TEST_BOTTLENECKS].sort(
        (a, b) => SEVERITY_META[b.severity].rank - SEVERITY_META[a.severity].rank
      ),
    []
  );

  return (
    <div id="two_x_tomorrow" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <InputsBlock values={values} onUpdate={updateValue} />
      <BottleneckList values={values} bottlenecks={sortedBottlenecks} />
    </div>
  );
}

/* ───────── Inputs block ───────── */

function InputsBlock({
  values,
  onUpdate,
}: {
  values: Record<string, number>;
  onUpdate: (id: string, raw: string) => void;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        Current state · today
      </div>
      <p
        style={{
          margin: '0 0 14px',
          fontSize: 12.5,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
        }}
      >
        Adjust the sliders to your actual numbers. The bottleneck table below auto-doubles each
        metric and surfaces what breaks at 2× scale. Defaults reflect May 2026 baseline.
      </p>

      <div
        className="stress-test-inputs"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 10,
        }}
      >
        {STRESS_TEST_INPUTS.map(input => {
          const today = values[input.id] ?? 0;
          const doubled = today * 2;
          return (
            <div
              key={input.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm, 6px)',
                padding: '10px 12px',
              }}
            >
              <label
                htmlFor={`stress-${input.id}`}
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {input.label}
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <input
                  id={`stress-${input.id}`}
                  type="number"
                  min={0}
                  step={1}
                  value={today}
                  onChange={e => onUpdate(input.id, e.target.value)}
                  style={{
                    width: 96,
                    padding: '6px 8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <span
                  style={{
                    fontSize: 11.5,
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {input.unit}
                </span>
                <ArrowRight
                  size={12}
                  strokeWidth={2.25}
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                  aria-hidden
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  2× = {doubled} {input.unit}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: 'var(--text-muted)',
                }}
              >
                {input.hint}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Bottleneck list ───────── */

function BottleneckList({
  values,
  bottlenecks,
}: {
  values: Record<string, number>;
  bottlenecks: StressTestBottleneck[];
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-muted)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        <AlertTriangle size={12} strokeWidth={2.5} aria-hidden />
        Where it breaks at 2× · sorted by severity
      </div>
      {bottlenecks.map(b => {
        const input = STRESS_TEST_INPUTS.find(i => i.id === b.inputId);
        const today = values[b.inputId] ?? 0;
        const doubled = today * 2;
        return (
          <BottleneckCard
            key={b.inputId}
            bottleneck={b}
            today={today}
            doubled={doubled}
            unit={input?.unit ?? ''}
            inputLabel={input?.label ?? b.inputId}
          />
        );
      })}
    </div>
  );
}

function BottleneckCard({
  bottleneck,
  today,
  doubled,
  unit,
  inputLabel,
}: {
  bottleneck: StressTestBottleneck;
  today: number;
  doubled: number;
  unit: string;
  inputLabel: string;
}) {
  const meta = SEVERITY_META[bottleneck.severity];
  const SeverityIcon = meta.icon;
  return (
    <div
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        borderLeft: `3px solid ${meta.color}`,
        borderRadius: 'var(--radius-md, 8px)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: meta.color,
            background: 'var(--bg-card)',
            border: `1px solid ${meta.border}`,
            padding: '2px 8px',
            borderRadius: 999,
            flexShrink: 0,
          }}
        >
          <SeverityIcon size={10} strokeWidth={2.5} aria-hidden />
          {meta.label}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 2,
            }}
          >
            {inputLabel}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11.5,
              color: 'var(--text-muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            today · {today} {unit}
            <ArrowRight size={11} strokeWidth={2.25} aria-hidden />
            2× · {doubled} {unit}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: meta.color,
              marginBottom: 3,
            }}
          >
            Where it breaks
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-primary)' }}>
            {bottleneck.bottleneck}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              marginBottom: 3,
            }}
          >
            Pre-emptive build
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-primary)' }}>
            {bottleneck.preEmptiveBuild}
          </div>
        </div>
      </div>
    </div>
  );
}
