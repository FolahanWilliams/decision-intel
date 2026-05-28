'use client';

/**
 * Faith OS dynamic visualizations (2026-05-28).
 *
 * Pure SVG, CSS-variable themed, prefers-reduced-motion aware. Each consumes
 * a slice of the FaithProgress object (see progress.ts). No data fetching —
 * the parent computes progress once and passes it down.
 */

import type {
  FaithProgress,
  DisciplineDay,
  CadenceWeek,
} from '@/components/founder-hub/faith-os/progress';

const ACTS_LABEL: Record<string, string> = {
  adoration: 'Adoration',
  confession: 'Confession',
  thanksgiving: 'Thanksgiving',
  supplication: 'Supplication',
  reflection: 'Reflection',
};
const ACTS_COLOR: Record<string, string> = {
  adoration: 'var(--accent-primary)',
  confession: 'var(--warning)',
  thanksgiving: 'var(--success)',
  supplication: 'var(--info)',
  reflection: 'var(--text-muted)',
};

// ─── stat strip ─────────────────────────────────────────────────────────

export function FaithStatStrip({ progress }: { progress: FaithProgress }) {
  const readingDone = progress.readingCompletion.reduce((s, r) => s + r.done, 0);
  const readingTotal = progress.readingCompletion.reduce((s, r) => s + r.total, 0);
  const tiles = [
    {
      label: 'Journal entries',
      value: String(progress.totalEntries),
      accent: 'var(--accent-primary)',
    },
    {
      label: 'Prayers answered',
      value: `${progress.answeredCount}/${progress.supplicationCount}`,
      accent: 'var(--success)',
    },
    {
      label: 'Passages read',
      value: readingTotal === 0 ? '0' : `${readingDone}/${readingTotal}`,
      accent: 'var(--info)',
    },
    { label: 'Both-discipline streak', value: `${progress.bothStreak}d`, accent: 'var(--warning)' },
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 10,
      }}
      className="faith-stat-strip"
    >
      {tiles.map(t => (
        <div
          key={t.label}
          style={{
            border: '1px solid var(--border-color)',
            borderTop: `3px solid ${t.accent}`,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {t.value}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── discipline heatmap ─────────────────────────────────────────────────

export function DisciplineHeatmap({ days }: { days: DisciplineDay[] }) {
  const cell = 13;
  const gap = 3;
  const rows = 7;
  const cols = Math.ceil(days.length / rows);
  const w = cols * (cell + gap);
  const h = rows * (cell + gap);
  const colorFor = (level: 0 | 1 | 2) =>
    level === 2
      ? 'var(--accent-primary)'
      : level === 1
        ? 'color-mix(in srgb, var(--accent-primary) 40%, transparent)'
        : 'color-mix(in srgb, var(--text-muted) 12%, transparent)';

  return (
    <div>
      <div style={vizLabel}>Prayer + scripture · last {days.length} days</div>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMinYMid meet"
        style={{ maxWidth: w, display: 'block' }}
        role="img"
        aria-label="Daily prayer and scripture discipline heatmap"
      >
        {days.map((d, i) => {
          const col = Math.floor(i / rows);
          const row = i % rows;
          const both = d.level === 2;
          return (
            <rect
              key={d.date}
              x={col * (cell + gap)}
              y={row * (cell + gap)}
              width={cell}
              height={cell}
              rx={3}
              fill={colorFor(d.level)}
              className="faith-heat-cell"
            >
              <title>{`${d.date}: ${both ? 'prayer + scripture' : d.prayer ? 'prayer' : d.scripture ? 'scripture' : 'not logged'}`}</title>
            </rect>
          );
        })}
      </svg>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 8,
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <LegendDot color={colorFor(0)} label="none" />
        <LegendDot color={colorFor(1)} label="one" />
        <LegendDot color={colorFor(2)} label="both" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span
        style={{
          width: 11,
          height: 11,
          borderRadius: 3,
          background: color,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}

// ─── ACTS balance bars ──────────────────────────────────────────────────

export function ActsBalanceBars({ distribution }: { distribution: Record<string, number> }) {
  const entries = Object.entries(distribution);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div>
      <div style={vizLabel}>Where your prayers land (ACTS balance)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {entries.map(([kind, count]) => (
          <div key={kind} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{ width: 92, flexShrink: 0, fontSize: 12, color: 'var(--text-secondary)' }}
            >
              {ACTS_LABEL[kind] ?? kind}
            </span>
            <div
              style={{
                flex: 1,
                height: 16,
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                className="faith-bar-fill"
                style={{
                  width: `${(count / max) * 100}%`,
                  height: '100%',
                  background: ACTS_COLOR[kind] ?? 'var(--text-muted)',
                  borderRadius: 'var(--radius-full)',
                  minWidth: count > 0 ? 4 : 0,
                }}
              />
            </div>
            <span
              style={{
                width: 22,
                textAlign: 'right',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── answered-prayer ring ───────────────────────────────────────────────

export function AnsweredPrayerRing({ answered, total }: { answered: number; total: number }) {
  const size = 120;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : answered / total;
  const dash = circ * pct;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={vizLabel}>Answered prayers</div>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${answered} of ${total} prayers answered`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-secondary)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--success)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="faith-ring"
        />
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          fontSize={26}
          fontWeight={800}
          fill="var(--text-primary)"
        >
          {answered}
        </text>
        <text x="50%" y="62%" textAnchor="middle" fontSize={11} fill="var(--text-muted)">
          of {total}
        </text>
      </svg>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
        {total === 0
          ? 'Log a supplication to begin'
          : `${Math.round(pct * 100)}% of what you asked`}
      </div>
    </div>
  );
}

// ─── reading progress bars ──────────────────────────────────────────────

export function ReadingProgressBars({
  completion,
}: {
  completion: FaithProgress['readingCompletion'];
}) {
  return (
    <div>
      <div style={vizLabel}>Reading plan progress</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {completion.map(c => {
          const pct = c.total === 0 ? 0 : c.done / c.total;
          return (
            <div key={c.planId}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{c.title}</span>
                <span
                  style={{
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.done}/{c.total}
                </span>
              </div>
              <div
                style={{
                  height: 10,
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="faith-bar-fill"
                  style={{
                    width: `${pct * 100}%`,
                    height: '100%',
                    background: 'var(--info)',
                    borderRadius: 'var(--radius-full)',
                    minWidth: c.done > 0 ? 4 : 0,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── cadence sparkline ──────────────────────────────────────────────────

export function CadenceSparkline({ cadence }: { cadence: CadenceWeek[] }) {
  if (cadence.length === 0) return null;
  const w = 240;
  const h = 56;
  const pad = 4;
  const max = Math.max(1, ...cadence.map(c => c.count));
  const stepX = (w - pad * 2) / Math.max(1, cadence.length - 1);
  const points = cadence.map((c, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (c.count / max) * (h - pad * 2);
    return { x, y, count: c.count };
  });
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <div>
      <div style={vizLabel}>Journal cadence · last {cadence.length} weeks</div>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ maxWidth: w, display: 'block' }}
        role="img"
        aria-label="Journal entries per week"
      >
        <path
          d={line}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--accent-primary)">
            <title>{`${cadence[i].weekStart}: ${p.count} ${p.count === 1 ? 'entry' : 'entries'}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

// ─── recurring scripture chips ──────────────────────────────────────────

export function RecurringScriptureChips({
  recurring,
}: {
  recurring: FaithProgress['recurringScripture'];
}) {
  if (recurring.length === 0) return null;
  return (
    <div>
      <div style={vizLabel}>Scripture you keep returning to</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {recurring.map(r => (
          <span
            key={r.ref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--info)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid color-mix(in srgb, var(--info) 30%, transparent)',
              background: 'color-mix(in srgb, var(--info) 6%, transparent)',
            }}
          >
            {r.ref}
            <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-muted)' }}>
              ×{r.count}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── shared ─────────────────────────────────────────────────────────────

const vizLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: 'var(--text-muted)',
  marginBottom: 10,
};

/** Scoped animation styles — disabled under prefers-reduced-motion. */
export function FaithVizStyles() {
  return (
    <style>{`
      .faith-bar-fill { transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
      .faith-ring { transition: stroke-dasharray 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
      .faith-heat-cell { transition: fill 0.2s ease; }
      @media (prefers-reduced-motion: reduce) {
        .faith-bar-fill, .faith-ring, .faith-heat-cell { transition: none; }
      }
    `}</style>
  );
}
