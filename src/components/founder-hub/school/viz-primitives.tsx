'use client';

import type {
  ChainViz,
  QuadrantsViz,
  FlywheelViz,
  WeightBarsViz,
  FunnelViz,
  SwimlanesViz,
  TimelineViz,
  PyramidViz,
  CompoundViz,
  RadialNetworkViz,
  StepperViz,
  MatrixViz,
} from '@/lib/data/founder-school/visualizations';

const TONE: Record<string, { bg: string; border: string; accent: string }> = {
  good: { bg: 'rgba(22,163,74,0.10)', border: 'rgba(22,163,74,0.35)', accent: '#16A34A' },
  bad: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.32)', accent: '#EF4444' },
  warn: { bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.35)', accent: '#F59E0B' },
  neutral: { bg: 'var(--bg-tertiary)', border: 'var(--border-color)', accent: 'var(--text-muted)' },
};

// ─── Chain ───────────────────────────────────────────────────────────────────

export function ChainVizRender({ viz, accent }: { viz: ChainViz; accent: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${viz.steps.length}, 1fr)`,
        gap: 4,
        alignItems: 'stretch',
      }}
    >
      {viz.steps.map((step, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            padding: '10px 12px 10px 14px',
            background: step.emphasis ? `${accent}18` : 'var(--bg-card)',
            border: `1px solid ${step.emphasis ? accent + '55' : 'var(--border-color)'}`,
            borderLeft: `3px solid ${step.emphasis ? accent : accent + '55'}`,
            borderRadius: 6,
            minHeight: 64,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: accent,
              letterSpacing: '0.06em',
              marginBottom: 3,
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              marginBottom: step.detail ? 4 : 0,
            }}
          >
            {step.label}
          </div>
          {step.detail && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {step.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Quadrants ───────────────────────────────────────────────────────────────

export function QuadrantsVizRender({ viz, accent }: { viz: QuadrantsViz; accent: string }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        <span>↑ {viz.axes.y[1]}</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}
      >
        {viz.cells.map((cell, i) => {
          const tone = TONE[cell.tone ?? 'neutral'];
          const isHighlight = viz.highlight === i;
          return (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                background: isHighlight ? tone.bg : 'var(--bg-card)',
                border: `1px solid ${isHighlight ? tone.border : 'var(--border-color)'}`,
                borderRadius: 8,
                borderLeft: `3px solid ${isHighlight ? tone.accent : accent + '44'}`,
                minHeight: 78,
                boxShadow: isHighlight ? `0 0 0 1px ${tone.border}` : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isHighlight ? tone.accent : 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {cell.label}
              </div>
              {cell.detail && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {cell.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginTop: 6,
        }}
      >
        <span>← {viz.axes.x[0]}</span>
        <span>{viz.axes.x[1]} →</span>
      </div>
    </div>
  );
}

// ─── Flywheel ────────────────────────────────────────────────────────────────

export function FlywheelVizRender({ viz, accent }: { viz: FlywheelViz; accent: string }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const orbitR = 100;
  const n = viz.nodes.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={orbitR}
          fill="none"
          stroke={`${accent}33`}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {/* rotation arrows */}
        {Array.from({ length: n }).map((_, i) => {
          const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
          const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
          const am = (a0 + a1) / 2;
          const mx = cx + Math.cos(am) * orbitR;
          const my = cy + Math.sin(am) * orbitR;
          return (
            <polygon
              key={`arr${i}`}
              points={`${mx - 4},${my - 4} ${mx + 5},${my} ${mx - 4},${my + 4}`}
              transform={`rotate(${(am * 180) / Math.PI + 90} ${mx} ${my})`}
              fill={`${accent}88`}
            />
          );
        })}
        {/* center */}
        <circle cx={cx} cy={cy} r={42} fill={`${accent}18`} stroke={accent} strokeWidth={1.2} />
        <foreignObject x={cx - 40} y={cy - 26} width={80} height={52}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: accent,
              textAlign: 'center',
              lineHeight: 1.25,
              whiteSpace: 'pre-line',
            }}
          >
            {viz.centerLabel}
          </div>
        </foreignObject>
        {/* orbit nodes */}
        {viz.nodes.map((node, i) => {
          const a = (i / n) * 2 * Math.PI - Math.PI / 2;
          const x = cx + Math.cos(a) * orbitR;
          const y = cy + Math.sin(a) * orbitR;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={6} fill={accent} />
              <circle cx={x} cy={y} r={12} fill="none" stroke={`${accent}55`} strokeWidth={1} />
            </g>
          );
        })}
      </svg>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(n, 3)}, 1fr)`,
          gap: 6,
          marginTop: 10,
          width: '100%',
        }}
      >
        {viz.nodes.map((node, i) => (
          <div
            key={i}
            style={{
              padding: '8px 10px',
              background: 'var(--bg-card)',
              border: `1px solid ${accent}33`,
              borderLeft: `3px solid ${accent}`,
              borderRadius: 6,
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: accent, marginBottom: 2 }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
              {node.label}
            </div>
            {node.detail && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.35 }}>
                {node.detail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Weight Bars ─────────────────────────────────────────────────────────────

export function WeightBarsVizRender({ viz, accent }: { viz: WeightBarsViz; accent: string }) {
  const max = Math.max(...viz.bars.map(b => Math.abs(b.value)), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {viz.bars.map((bar, i) => {
        const w = Math.max(2, (Math.abs(bar.value) / max) * 100);
        const clr = bar.accent ?? accent;
        return (
          <div key={i}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 3,
              }}
            >
              <span
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}
              >
                {bar.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: clr }}>
                {bar.value}{bar.unit ? ` ${bar.unit}` : ''}
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: 'var(--bg-tertiary)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${w}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${clr}AA, ${clr})`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            {bar.detail && (
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  marginTop: 3,
                  lineHeight: 1.4,
                }}
              >
                {bar.detail}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Funnel ──────────────────────────────────────────────────────────────────

export function FunnelVizRender({ viz, accent }: { viz: FunnelViz; accent: string }) {
  const n = viz.stages.length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'stretch' }}>
      {viz.stages.map((stage, i) => {
        const w = 100 - (i / Math.max(1, n)) * 35;
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: `${w}%`,
                padding: '9px 14px',
                background: `${accent}${(18 - i * 2).toString(16).padStart(2, '0')}`,
                border: `1px solid ${accent}55`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {stage.label}
                </div>
                {stage.detail && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {stage.detail}
                  </div>
                )}
              </div>
              {stage.value && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: accent,
                    whiteSpace: 'nowrap',
                    padding: '2px 8px',
                    background: 'var(--bg-card)',
                    borderRadius: 10,
                    border: `1px solid ${accent}55`,
                  }}
                >
                  {stage.value}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Swimlanes ───────────────────────────────────────────────────────────────

export function SwimlanesVizRender({ viz, accent: _accent }: { viz: SwimlanesViz; accent: string }) {
  const col = (lane: SwimlanesViz['left'], key: string) => (
    <div
      key={key}
      style={{
        padding: '12px 14px',
        background: 'var(--bg-card)',
        border: `1px solid ${(lane.accent ?? '#94A3B8')}33`,
        borderLeft: `3px solid ${lane.accent ?? '#94A3B8'}`,
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: lane.accent ?? 'var(--text-secondary)',
          marginBottom: 8,
        }}
      >
        {lane.title}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {lane.points.map((p, i) => (
          <li
            key={i}
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              paddingLeft: 14,
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: 7,
                width: 6,
                height: 2,
                background: lane.accent ?? 'var(--text-muted)',
              }}
            />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {col(viz.left, 'left')}
      {col(viz.right, 'right')}
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export function TimelineVizRender({ viz, accent }: { viz: TimelineViz; accent: string }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 20 }}>
      <div
        style={{
          position: 'absolute',
          left: 6,
          top: 8,
          bottom: 8,
          width: 2,
          background: `${accent}44`,
        }}
      />
      {viz.events.map((e, i) => (
        <div key={i} style={{ position: 'relative', marginBottom: i === viz.events.length - 1 ? 0 : 12 }}>
          <div
            style={{
              position: 'absolute',
              left: -18,
              top: 4,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: e.emphasis ? accent : 'var(--bg-card)',
              border: `2px solid ${accent}`,
            }}
          />
          <div
            style={{
              padding: '8px 12px',
              background: e.emphasis ? `${accent}12` : 'var(--bg-card)',
              border: `1px solid ${e.emphasis ? accent + '55' : 'var(--border-color)'}`,
              borderRadius: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: accent,
                  letterSpacing: '0.04em',
                  minWidth: 50,
                }}
              >
                {e.when}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {e.label}
              </span>
            </div>
            {e.detail && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, paddingLeft: 58 }}>
                {e.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Pyramid ─────────────────────────────────────────────────────────────────

export function PyramidVizRender({ viz, accent }: { viz: PyramidViz; accent: string }) {
  const n = viz.tiers.length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'stretch' }}>
      {viz.tiers.map((tier, i) => {
        const w = 55 + (i / Math.max(1, n - 1)) * 45;
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: `${w}%`,
                padding: '9px 14px',
                background: `${accent}${(10 + i * 3).toString(16).padStart(2, '0')}`,
                border: `1px solid ${accent}55`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: accent,
                  background: 'var(--bg-card)',
                  padding: '2px 6px',
                  borderRadius: 9,
                  border: `1px solid ${accent}55`,
                  flexShrink: 0,
                }}
              >
                T{i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {tier.label}
                </div>
                {tier.detail && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.4 }}>
                    {tier.detail}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Compound (line chart) ───────────────────────────────────────────────────

export function CompoundVizRender({ viz, accent }: { viz: CompoundViz; accent: string }) {
  const w = 480;
  const h = 200;
  const pl = 36;
  const pr = 16;
  const pt = 14;
  const pb = 28;
  const iw = w - pl - pr;
  const ih = h - pt - pb;
  const maxT = Math.max(...viz.points.map(p => p.t));
  const minT = Math.min(...viz.points.map(p => p.t));
  const maxV = Math.max(...viz.points.map(p => p.v));
  const x = (t: number) => pl + ((t - minT) / (maxT - minT || 1)) * iw;
  const y = (v: number) => pt + ih - (v / (maxV || 1)) * ih;
  const path = viz.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t)},${y(p.v)}`)
    .join(' ');
  const areaPath = `${path} L${x(maxT)},${pt + ih} L${x(minT)},${pt + ih} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', minWidth: 320, height: 'auto' }}>
        {/* grid */}
        {[0.25, 0.5, 0.75].map(r => (
          <line
            key={r}
            x1={pl}
            x2={pl + iw}
            y1={pt + ih * r}
            y2={pt + ih * r}
            stroke="var(--border-color)"
            strokeWidth={0.5}
            strokeDasharray="2 3"
          />
        ))}
        {/* area */}
        <path d={areaPath} fill={`${accent}1A`} />
        {/* line */}
        <path d={path} fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" />
        {/* points + annotations */}
        {viz.points.map((p, i) => (
          <g key={i}>
            <circle cx={x(p.t)} cy={y(p.v)} r={3.5} fill={accent} stroke="#fff" strokeWidth={1.5} />
            {p.note && (
              <text
                x={x(p.t)}
                y={y(p.v) - 8}
                fontSize={9}
                fill="var(--text-muted)"
                textAnchor="middle"
              >
                {p.note}
              </text>
            )}
          </g>
        ))}
        {/* axes labels */}
        {viz.xLabel && (
          <text x={pl + iw / 2} y={h - 4} fontSize={10} fill="var(--text-muted)" textAnchor="middle">
            {viz.xLabel}
          </text>
        )}
        {viz.yLabel && (
          <text
            x={10}
            y={pt + ih / 2}
            fontSize={10}
            fill="var(--text-muted)"
            textAnchor="middle"
            transform={`rotate(-90 10 ${pt + ih / 2})`}
          >
            {viz.yLabel}
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── Radial Network ──────────────────────────────────────────────────────────

export function RadialNetworkVizRender({
  viz,
  accent,
}: {
  viz: RadialNetworkViz;
  accent: string;
}) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const orbitR = 118;
  const n = viz.nodes.length;

  const pos = (i: number) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + Math.cos(a) * orbitR, y: cy + Math.sin(a) * orbitR };
  };

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: 360, display: 'block', margin: '0 auto' }}>
        {/* spokes — from center to each node */}
        {viz.nodes.map((node, i) => {
          const { x, y } = pos(i);
          return (
            <line
              key={`sp${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={node.emphasis ? accent : `${accent}44`}
              strokeWidth={node.emphasis ? 1.5 : 1}
            />
          );
        })}
        {/* extra edges */}
        {viz.edges?.map(([a, b], i) => {
          const p1 = pos(a);
          const p2 = pos(b);
          return (
            <line
              key={`ed${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={`${accent}33`}
              strokeWidth={0.8}
              strokeDasharray="3 3"
            />
          );
        })}
        {/* center */}
        <circle cx={cx} cy={cy} r={44} fill={`${accent}22`} stroke={accent} strokeWidth={1.5} />
        <foreignObject x={cx - 42} y={cy - 28} width={84} height={56}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: accent,
              textAlign: 'center',
              lineHeight: 1.2,
              whiteSpace: 'pre-line',
            }}
          >
            {viz.center}
          </div>
        </foreignObject>
        {/* nodes */}
        {viz.nodes.map((node, i) => {
          const { x, y } = pos(i);
          return (
            <g key={`n${i}`}>
              <circle
                cx={x}
                cy={y}
                r={node.emphasis ? 9 : 7}
                fill={node.emphasis ? accent : 'var(--bg-card)'}
                stroke={accent}
                strokeWidth={1.4}
              />
              <foreignObject
                x={x - 55}
                y={y + 12}
                width={110}
                height={46}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: node.emphasis ? 700 : 600,
                    color: node.emphasis ? accent : 'var(--text-secondary)',
                    textAlign: 'center',
                    lineHeight: 1.25,
                  }}
                >
                  {node.label}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
      {viz.nodes.some(n => n.detail) && (
        <div
          style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 6,
          }}
        >
          {viz.nodes
            .map((node, i) => ({ node, i }))
            .filter(({ node }) => node.detail)
            .map(({ node, i }) => (
              <div
                key={i}
                style={{
                  padding: '7px 10px',
                  background: 'var(--bg-card)',
                  border: `1px solid ${accent}33`,
                  borderRadius: 5,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: accent, marginBottom: 1 }}>
                  {node.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  {node.detail}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

export function StepperVizRender({ viz, accent }: { viz: StepperViz; accent: string }) {
  const vertical = viz.orientation === 'vertical';
  return (
    <div
      style={{
        display: vertical ? 'flex' : 'grid',
        flexDirection: vertical ? 'column' : undefined,
        gridTemplateColumns: vertical ? undefined : `repeat(${viz.steps.length}, 1fr)`,
        gap: vertical ? 8 : 6,
      }}
    >
      {viz.steps.map((step, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 12px',
            background: step.wow ? `${accent}15` : 'var(--bg-card)',
            border: `1px solid ${step.wow ? accent + '55' : 'var(--border-color)'}`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: step.wow ? accent : `${accent}22`,
              color: step.wow ? '#fff' : accent,
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {step.num}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {step.label}
              {step.wow && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: accent,
                    background: `${accent}22`,
                    padding: '1px 6px',
                    borderRadius: 8,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  wow
                </span>
              )}
            </div>
            {step.detail && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {step.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Matrix (heatmap) ────────────────────────────────────────────────────────

export function MatrixVizRender({ viz, accent }: { viz: MatrixViz; accent: string }) {
  const heatBg = (h: 0 | 1 | 2 | 3) => {
    if (h === 0) return 'var(--bg-tertiary)';
    const op = [0, 0.18, 0.38, 0.62][h];
    return `rgba(22,163,74,${op})`;
  };
  const heatText = (h: 0 | 1 | 2 | 3) =>
    h === 0 ? 'var(--text-muted)' : h >= 2 ? '#0F172A' : 'var(--text-primary)';

  const cellAt = (r: number, c: number) => viz.cells.find(x => x.row === r && x.col === c);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          borderCollapse: 'separate',
          borderSpacing: 3,
          fontSize: 11,
          minWidth: 320,
        }}
      >
        <thead>
          <tr>
            <th />
            {viz.cols.map((c, i) => (
              <th
                key={i}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '4px 8px',
                  textAlign: 'center',
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {viz.rows.map((row, r) => (
            <tr key={r}>
              <th
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '6px 8px',
                  textAlign: 'right',
                }}
              >
                {row}
              </th>
              {viz.cols.map((_, c) => {
                const cell = cellAt(r, c);
                const h = (cell?.heat ?? 0) as 0 | 1 | 2 | 3;
                return (
                  <td
                    key={c}
                    style={{
                      background: heatBg(h),
                      border: `1px solid ${h === 0 ? 'var(--border-color)' : accent + '33'}`,
                      borderRadius: 4,
                      padding: '8px 10px',
                      color: heatText(h),
                      textAlign: 'center',
                      minWidth: 70,
                      fontWeight: 600,
                      fontSize: 10,
                    }}
                  >
                    {cell?.label ?? (h === 0 ? '—' : '●'.repeat(h))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
