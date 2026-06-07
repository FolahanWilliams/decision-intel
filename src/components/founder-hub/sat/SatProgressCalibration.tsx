'use client';

import { useMemo } from 'react';
import { TrendingUp, Gauge, Flame, ListChecks, Map } from 'lucide-react';
import {
  SAT_GOAL,
  SAT_SECTIONS,
  scoreTier,
  SAT_PLAN,
  SAT_STRATEGIC_NOTES,
  SAT_SKILL_BY_ID,
  SAT_ROOT_CAUSES,
} from './sat-content';
import {
  computeProjectedScore,
  computeCalibration,
  computeCalibrationBySkill,
  computeCalibrationTrend,
  computeWeakAreas,
  rootCauseBreakdown,
  overconfidentMisses,
  computeStreak,
} from './sat-calibration';
import type { SatErrorEntry, SatSession, SatTest } from './sat-types';

interface Props {
  errors: SatErrorEntry[];
  sessions: SatSession[];
  tests: SatTest[];
  today: string;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
};
const toneColor: Record<string, string> = {
  success: 'var(--success)',
  info: 'var(--info)',
  warning: 'var(--warning)',
  muted: 'var(--text-muted)',
};
const CALIBRATION_BAND_COPY: Record<string, { label: string; tone: string }> = {
  well_calibrated: { label: 'Well calibrated', tone: 'success' },
  overconfident: { label: 'Overconfident — your highest-ROI fix', tone: 'warning' },
  underconfident: { label: 'Underconfident — trust your read more', tone: 'info' },
  too_few: { label: 'Tag confidence on more questions to unlock', tone: 'muted' },
};

export function SatProgressCalibration({ errors, sessions, tests, today }: Props) {
  const projected = useMemo(() => computeProjectedScore(tests), [tests]);
  const calibration = useMemo(() => computeCalibration(errors), [errors]);
  const weak = useMemo(() => computeWeakAreas(errors, 6), [errors]);
  const rootCauses = useMemo(() => rootCauseBreakdown(errors), [errors]);
  const ocMisses = useMemo(() => overconfidentMisses(errors).slice(0, 5), [errors]);
  const bySkill = useMemo(
    () =>
      computeCalibrationBySkill(errors)
        .filter(s => s.band !== 'too_few')
        .slice(0, 5),
    [errors]
  );
  const trend = useMemo(() => computeCalibrationTrend(errors), [errors]);
  const streak = useMemo(() => computeStreak(sessions, today), [sessions, today]);
  const totalXp = useMemo(() => sessions.reduce((a, s) => a + (s.xpAwarded || 0), 0), [sessions]);

  const total = projected.projectedTotal;
  const tier = total != null ? scoreTier(total) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Projected score */}
      <div style={{ ...cardStyle, borderTop: '3px solid var(--accent-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>Projected score</strong>
          <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
            (official tests only · target {SAT_GOAL.targetTotal})
          </span>
        </div>
        {total == null ? (
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Log an official test (with both section scores) to project a total. Baseline PSAT:{' '}
            {SAT_GOAL.baselinePsat}.
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: tier ? toneColor[tier.tone] : 'var(--text-primary)',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {total}
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}> / 1600</span>
            </div>
            {tier && <Pill tone={tier.tone}>{tier.label}</Pill>}
            <SectionBar
              label="R&W"
              value={projected.rwAvg}
              target={SAT_GOAL.rwTarget}
              max={SAT_SECTIONS.rw.max}
            />
            <SectionBar
              label="Math"
              value={projected.mathAvg}
              target={SAT_GOAL.mathCeilingTarget}
              max={SAT_SECTIONS.math.max}
            />
          </div>
        )}
        <p
          style={{
            fontSize: 'var(--fs-3xs)',
            color: 'var(--text-muted)',
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          Strategy: lock Math toward {SAT_GOAL.mathCeilingTarget}+ first (trainable + your edge),
          then grind R&amp;W to {SAT_GOAL.rwTarget}+.
        </p>
      </div>

      {/* Calibration */}
      <div style={{ ...cardStyle, borderTop: '3px solid var(--info)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Gauge size={16} style={{ color: 'var(--info)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>Calibration</strong>
          <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
            confidence vs correctness · Brier
          </span>
        </div>
        <Pill tone={CALIBRATION_BAND_COPY[calibration.band].tone}>
          {CALIBRATION_BAND_COPY[calibration.band].label}
        </Pill>
        {calibration.brier != null && (
          <div
            style={{
              display: 'flex',
              gap: 18,
              marginTop: 10,
              flexWrap: 'wrap',
              fontSize: 'var(--fs-sm)',
            }}
          >
            <Stat label="Brier" value={calibration.brier.toFixed(3)} hint="lower is better" />
            <Stat
              label="Confidence"
              value={`${Math.round((calibration.meanConfidenceProb ?? 0) * 100)}%`}
            />
            <Stat
              label="Actual accuracy"
              value={`${Math.round((calibration.accuracy ?? 0) * 100)}%`}
            />
            <Stat
              label="Gap"
              value={`${calibration.gap! > 0 ? '+' : ''}${Math.round(calibration.gap! * 100)}pp`}
            />
          </div>
        )}
        {ocMisses.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
              Overconfident-and-wrong — drill these first (a baited System-1 pattern):
            </span>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {ocMisses.map((m, i) => (
                <li key={i} style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-secondary)' }}>
                  {SAT_SKILL_BY_ID[m.skill]?.label ?? m.skill}
                  {m.note ? ` — ${m.note.slice(0, 80)}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {bySkill.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
              Calibration by skill (most overconfident first):
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
              {bySkill.map(s => (
                <div
                  key={s.skill}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--fs-2xs)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {SAT_SKILL_BY_ID[s.skill]?.label ?? s.skill}
                  </span>
                  <span style={{ color: toneColor[CALIBRATION_BAND_COPY[s.band].tone] }}>
                    {s.gap != null ? `${s.gap > 0 ? '+' : ''}${Math.round(s.gap * 100)}pp` : '—'} ·{' '}
                    {CALIBRATION_BAND_COPY[s.band].label.split(' —')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {trend.length >= 2 && (
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
              Brier trend (lower = better calibrated; {trend.length} weeks):
            </span>
            <Sparkline points={trend.map(t => t.brier ?? 0)} />
          </div>
        )}
      </div>

      {/* Weak areas + root causes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        <div style={{ ...cardStyle, borderTop: '3px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ListChecks size={16} style={{ color: 'var(--warning)' }} />
            <strong style={{ color: 'var(--text-primary)' }}>Weakest skills</strong>
          </div>
          {weak.length === 0 ? (
            <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', margin: 0 }}>
              No data yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {weak.map(w => (
                <div
                  key={w.skill}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--fs-2xs)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {SAT_SKILL_BY_ID[w.skill]?.label ?? w.skill}
                  </span>
                  <span style={{ color: 'var(--error)' }}>
                    {w.wrong}/{w.attempted} ({Math.round(w.errorRate * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={cardStyle}>
          <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-sm)' }}>
            Why you miss
          </strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {SAT_ROOT_CAUSES.map(rc => (
              <div
                key={rc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--fs-2xs)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }} title={rc.fix}>
                  {rc.label}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{rootCauses[rc.id] ?? 0}</span>
              </div>
            ))}
            {rootCauses.untagged ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--fs-2xs)',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Untagged</span>
                <span style={{ color: 'var(--text-muted)' }}>{rootCauses.untagged}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Streak */}
      <div
        style={{ ...cardStyle, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={18} style={{ color: 'var(--warning)' }} />
          <Stat label="Current streak" value={`${streak.current}d`} />
        </div>
        <Stat label="Longest" value={`${streak.longest}d`} />
        <Stat label="Reps logged" value={String(errors.length)} />
        <Stat
          label="XP (input)"
          value={String(totalXp)}
          hint="rewards showing up, never the score"
        />
      </div>

      {/* Study plan */}
      <div style={{ ...cardStyle, borderTop: '3px solid var(--accent-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Map size={16} style={{ color: 'var(--accent-secondary)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>The plan</strong>
          <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
            {SAT_GOAL.dailyMinutes} min/day · {SAT_GOAL.benchmarkMonth} benchmark →{' '}
            {SAT_GOAL.targetMonth} target
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SAT_PLAN.map(p => (
            <div
              key={p.id}
              style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: 12 }}
            >
              <div
                style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', fontWeight: 600 }}
              >
                {p.title}{' '}
                <span
                  style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 'var(--fs-2xs)' }}
                >
                  · {p.window}
                </span>
              </div>
              <p
                style={{
                  fontSize: 'var(--fs-2xs)',
                  color: 'var(--text-secondary)',
                  margin: '4px 0',
                }}
              >
                {p.focus}
              </p>
              <p style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)', margin: 0 }}>
                Exit: {p.exit}
              </p>
            </div>
          ))}
        </div>
        <ul style={{ margin: '14px 0 0', paddingLeft: 18 }}>
          {SAT_STRATEGIC_NOTES.map((n, i) => (
            <li
              key={i}
              style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-secondary)', marginBottom: 4 }}
            >
              {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 'var(--fs-2xs)',
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        color: toneColor[tone] ?? 'var(--text-secondary)',
        background: `color-mix(in srgb, ${toneColor[tone] ?? 'var(--text-muted)'} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${toneColor[tone] ?? 'var(--text-muted)'} 30%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }} title={hint}>
        {label}
      </div>
    </div>
  );
}

function SectionBar({
  label,
  value,
  target,
  max,
}: {
  label: string;
  value: number | null;
  target: number;
  max: number;
}) {
  const pct = value != null ? Math.min(100, (value / max) * 100) : 0;
  const targetPct = Math.min(100, (target / max) * 100);
  return (
    <div style={{ minWidth: 130 }}>
      <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-secondary)', marginBottom: 3 }}>
        {label} <strong style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</strong>
        <span style={{ color: 'var(--text-muted)' }}> / target {target}</span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 6,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-full)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${pct}%`,
            background: 'var(--accent-primary)',
            borderRadius: 'var(--radius-full)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -2,
            bottom: -2,
            left: `${targetPct}%`,
            width: 2,
            background: 'var(--text-muted)',
          }}
        />
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 200;
  const h = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((p - min) / range) * (h - 6); // lower Brier → higher on chart
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = points[points.length - 1];
  const first = points[0];
  const improving = last <= first; // lower Brier is better
  return (
    <svg width={w} height={h} style={{ marginTop: 6, display: 'block' }} aria-label="Brier trend">
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke={improving ? 'var(--success)' : 'var(--warning)'}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {coords.map((c, i) => {
        const [x, y] = c.split(',');
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2}
            fill={improving ? 'var(--success)' : 'var(--warning)'}
          />
        );
      })}
    </svg>
  );
}
