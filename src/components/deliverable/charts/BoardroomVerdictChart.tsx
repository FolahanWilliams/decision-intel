/**
 * BoardroomVerdictChart — donut visualization of the simulated
 * boardroom's APPROVE / REJECT / REVISE distribution + red-team load.
 * Locked 2026-05-20 (visual-deliverable rebuild).
 *
 * The headline visual for the Stress Test page. Donut chart with the
 * verdict ratio at center; legend with absolute counts on the side.
 * Red-team objections show as a separate side-card (they're not a
 * vote, they're additional adversarial pressure).
 */

'use client';

import { useId } from 'react';
import { Gavel } from 'lucide-react';

interface BoardroomVerdictChartProps {
  counts: {
    approve: number;
    reject: number;
    revise: number;
    redTeam: number;
  };
  overallVerdict?: 'APPROVED' | 'REJECTED' | 'MIXED';
}

const VOTE_COLORS = {
  approve: '#16a34a',
  reject: '#b91c1c',
  revise: '#d97706',
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number) {
  const so = polar(cx, cy, rOuter, end);
  const eo = polar(cx, cy, rOuter, start);
  const si = polar(cx, cy, rInner, start);
  const ei = polar(cx, cy, rInner, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${so.x} ${so.y} A ${rOuter} ${rOuter} 0 ${large} 0 ${eo.x} ${eo.y} L ${si.x} ${si.y} A ${rInner} ${rInner} 0 ${large} 1 ${ei.x} ${ei.y} Z`;
}

export function BoardroomVerdictChart({ counts, overallVerdict }: BoardroomVerdictChartProps) {
  const id = useId();
  const total = counts.approve + counts.reject + counts.revise;

  if (total === 0 && counts.redTeam === 0) {
    return (
      <div
        style={{
          padding: '32px',
          border: '1px dashed var(--border-color, #E2E8F0)',
          borderRadius: 12,
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-muted, #64748B)',
        }}
      >
        No boardroom or red-team objections produced for this memo.
      </div>
    );
  }

  // Donut math
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 90;
  const rInner = 56;

  let cursor = 0;
  const segments: Array<{ key: string; color: string; count: number; path: string }> = [];

  const slices = [
    { key: 'approve', color: VOTE_COLORS.approve, count: counts.approve },
    { key: 'revise', color: VOTE_COLORS.revise, count: counts.revise },
    { key: 'reject', color: VOTE_COLORS.reject, count: counts.reject },
  ];

  for (const slice of slices) {
    if (slice.count === 0 || total === 0) continue;
    const sweep = (slice.count / total) * 360;
    const start = cursor;
    const end = cursor + sweep - (slices.length > 1 ? 1.5 : 0); // small gap between slices
    segments.push({
      key: slice.key,
      color: slice.color,
      count: slice.count,
      path: arc(cx, cy, rOuter, rInner, start, end),
    });
    cursor += sweep;
  }

  const verdictLabel = overallVerdict ?? (total > 0 ? 'PENDING' : '');
  const verdictColor =
    overallVerdict === 'APPROVED'
      ? VOTE_COLORS.approve
      : overallVerdict === 'REJECTED'
        ? VOTE_COLORS.reject
        : overallVerdict === 'MIXED'
          ? VOTE_COLORS.revise
          : 'var(--text-muted, #64748B)';

  return (
    <div
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 12,
        padding: '16px 18px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 24,
        alignItems: 'center',
      }}
      className="boardroom-verdict-chart"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ display: 'block', flexShrink: 0 }}
        role="img"
        aria-label={`Boardroom verdict donut — ${counts.approve} approve, ${counts.reject} reject, ${counts.revise} revise`}
      >
        {/* Slices */}
        {segments.map(seg => (
          <path key={`${seg.key}-${id}`} d={seg.path} fill={seg.color} opacity={0.92} />
        ))}
        {/* Empty-state ring when total === 0 but red team present */}
        {total === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={(rOuter + rInner) / 2}
            stroke="var(--border-color, #E2E8F0)"
            strokeWidth={rOuter - rInner}
            fill="none"
          />
        ) : null}
        {/* Center verdict */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: 11,
            fontWeight: 800,
            fill: 'var(--text-muted, #64748B)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          Verdict
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: 16,
            fontWeight: 800,
            fill: verdictColor,
            letterSpacing: '-0.01em',
          }}
        >
          {verdictLabel}
        </text>
      </svg>

      {/* Legend / counts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <LegendRow
          color={VOTE_COLORS.approve}
          label="Approve"
          count={counts.approve}
          total={total}
        />
        <LegendRow color={VOTE_COLORS.revise} label="Revise" count={counts.revise} total={total} />
        <LegendRow color={VOTE_COLORS.reject} label="Reject" count={counts.reject} total={total} />
        {counts.redTeam > 0 ? (
          <div
            style={{
              marginTop: 4,
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12.5,
              color: 'var(--severity-high, #ef4444)',
              fontWeight: 700,
            }}
          >
            <Gavel size={13} />
            {counts.redTeam} red-team objection{counts.redTeam === 1 ? '' : 's'} alongside the
            verdict
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  count,
  total,
}: {
  color: string;
  label: string;
  count: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontWeight: 700, color: 'var(--text-primary, #0F172A)', flex: 1 }}>
        {label}
      </span>
      <span
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 800,
          color: 'var(--text-primary, #0F172A)',
          minWidth: 24,
          textAlign: 'right',
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          color: 'var(--text-muted, #64748B)',
          fontSize: 11.5,
          minWidth: 38,
          textAlign: 'right',
        }}
      >
        {pct}%
      </span>
    </div>
  );
}
