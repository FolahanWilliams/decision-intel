'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Minus, X } from 'lucide-react';

/**
 * "How We Compare" card for the landing page.
 *
 * Design constraints:
 *   - 8 capability dimensions (not 6) — covers more surface area so the chart
 *     reads at a glance and the table doesn't feel like a cherry-pick.
 *   - Each competitor gets 2–3 "full" wins in the areas where they are
 *     genuinely strong (workflow, enterprise integrations, change
 *     management, industry expertise). Pretending they have zero strengths
 *     reads as marketing dishonesty and undermines our actual wins.
 *   - A dynamic 8-axis radar chart visualises the two profiles overlaid so
 *     the shape difference is immediately obvious, before the viewer reads
 *     a single row.
 */

type Rating = 'full' | 'partial' | 'none';

interface ComparisonRow {
  dimension: string;
  themLabel: string;
  themRating: Rating;
  usLabel: string;
  usRating: Rating;
}

interface CompetitorProfile {
  key: string;
  name: string;
  tagline: string;
  rows: ComparisonRow[];
}

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenBorder: '#86EFAC',
  amber: '#D97706',
  amberLight: '#FEF3C7',
  red: '#DC2626',
  redLight: '#FEE2E2',
} as const;

const PROFILES: CompetitorProfile[] = [
  {
    key: 'cloverpop',
    name: 'Cloverpop',
    tagline: 'Acquired 2023 · Enterprise decision workflow platform',
    rows: [
      {
        dimension: 'Bias detection',
        themLabel: 'Not offered',
        themRating: 'none',
        usLabel: '30+ types, automated',
        usRating: 'full',
      },
      {
        dimension: 'Decision workflow (RAPID / DACI)',
        themLabel: 'Native, mature',
        themRating: 'full',
        usLabel: 'Decision Room (lighter)',
        usRating: 'partial',
      },
      {
        dimension: 'Outcome flywheel',
        themLabel: 'Tracking only',
        themRating: 'partial',
        usLabel: '3-channel passive detection',
        usRating: 'full',
      },
      {
        dimension: 'Compliance mapping',
        themLabel: 'Not offered',
        themRating: 'none',
        usLabel: '7 frameworks + audit packet',
        usRating: 'full',
      },
      {
        dimension: 'Time per analysis',
        themLabel: 'Manual entry',
        themRating: 'partial',
        usLabel: 'Under 60 seconds',
        usRating: 'full',
      },
      {
        dimension: 'Enterprise integrations',
        themLabel: 'Slack, Outlook, Okta',
        themRating: 'full',
        usLabel: 'Slack, Drive, growing',
        usRating: 'partial',
      },
      {
        dimension: 'Compound bias scoring',
        themLabel: 'Not offered',
        themRating: 'none',
        usLabel: '20×20 interaction matrix',
        usRating: 'full',
      },
      {
        dimension: 'Change management support',
        themLabel: 'Enterprise services',
        themRating: 'full',
        usLabel: 'Product-led (self-serve)',
        usRating: 'partial',
      },
    ],
  },
  {
    key: 'mckinsey',
    name: 'McKinsey / BCG',
    tagline: 'Management consulting · $500K–$2M per engagement',
    rows: [
      {
        dimension: 'Bias detection methodology',
        themLabel: 'Wrote the research',
        themRating: 'full',
        usLabel: 'Operationalises same research',
        usRating: 'full',
      },
      {
        dimension: 'Industry-specific expertise',
        themLabel: 'Sector specialists',
        themRating: 'full',
        usLabel: 'Cross-industry',
        usRating: 'partial',
      },
      {
        dimension: 'Change management',
        themLabel: 'Runs the implementation',
        themRating: 'full',
        usLabel: 'Out of scope',
        usRating: 'none',
      },
      {
        dimension: 'Cost per decision',
        themLabel: '$500K–$2M per engagement',
        themRating: 'none',
        usLabel: '$249–$2,499 / month',
        usRating: 'full',
      },
      {
        dimension: 'Speed to insight',
        themLabel: '6–12 weeks',
        themRating: 'none',
        usLabel: 'Minutes per document',
        usRating: 'full',
      },
      {
        dimension: 'Continuous rigor',
        themLabel: 'Point-in-time',
        themRating: 'none',
        usLabel: 'Always-on audit',
        usRating: 'full',
      },
      {
        dimension: 'Auditor objectivity',
        themLabel: 'Human auditors have biases',
        themRating: 'partial',
        usLabel: 'AI has no social cost',
        usRating: 'full',
      },
      {
        dimension: 'Outcome feedback loop',
        themLabel: 'No post-engagement loop',
        themRating: 'none',
        usLabel: 'Learns from every decision',
        usRating: 'full',
      },
    ],
  },
];

const RATING_VALUE: Record<Rating, number> = { full: 1, partial: 0.55, none: 0.15 };

function RatingIcon({ rating }: { rating: Rating }) {
  if (rating === 'full') {
    return (
      <span
        aria-label="Full capability"
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          background: C.greenLight,
          color: C.green,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Check size={11} strokeWidth={3} />
      </span>
    );
  }
  if (rating === 'partial') {
    return (
      <span
        aria-label="Partial capability"
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          background: C.amberLight,
          color: C.amber,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Minus size={11} strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      aria-label="Not offered"
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        background: C.redLight,
        color: C.red,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <X size={11} strokeWidth={3} />
    </span>
  );
}

/** 8-axis radar comparing the two profiles. Pure SVG so it scales and prints
 *  cleanly. Uses the same RATING_VALUE scale as the table so the chart and
 *  the rows can never drift out of sync. */
function RadarChart({ profile }: { profile: CompetitorProfile }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 110;

  // Axes go clockwise starting from 12 o'clock.
  const axes = profile.rows.map((row, i) => {
    const theta = -Math.PI / 2 + (i * 2 * Math.PI) / profile.rows.length;
    return {
      row,
      theta,
      labelX: cx + Math.cos(theta) * (maxRadius + 24),
      labelY: cy + Math.sin(theta) * (maxRadius + 24),
    };
  });

  const pointFor = (rating: Rating, theta: number) => {
    const r = maxRadius * RATING_VALUE[rating];
    return [cx + Math.cos(theta) * r, cy + Math.sin(theta) * r] as const;
  };

  const themPath = useMemo(
    () =>
      axes
        .map(({ row, theta }) => {
          const [x, y] = pointFor(row.themRating, theta);
          return `${x},${y}`;
        })
        .join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.key],
  );

  const usPath = useMemo(
    () =>
      axes
        .map(({ row, theta }) => {
          const [x, y] = pointFor(row.usRating, theta);
          return `${x},${y}`;
        })
        .join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.key],
  );

  // Background rings at 0.25, 0.5, 0.75, 1.0
  const rings = [0.25, 0.5, 0.75, 1].map(f => {
    const pts = axes.map(({ theta }) => {
      const r = maxRadius * f;
      return `${cx + Math.cos(theta) * r},${cy + Math.sin(theta) * r}`;
    });
    return pts.join(' ');
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ maxWidth: size, display: 'block', margin: '0 auto' }}
      role="img"
      aria-label={`Radar chart comparing Decision Intel with ${profile.name} across 8 capability dimensions`}
    >
      {/* Background rings */}
      {rings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke={C.slate200}
          strokeWidth={i === 3 ? 1.25 : 0.75}
          strokeDasharray={i === 3 ? '0' : '2 3'}
        />
      ))}

      {/* Axes */}
      {axes.map(({ theta }, i) => {
        const x = cx + Math.cos(theta) * maxRadius;
        const y = cy + Math.sin(theta) * maxRadius;
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.slate200} strokeWidth={0.75} />;
      })}

      {/* Them polygon (navy) */}
      <polygon
        points={themPath}
        fill={C.navy}
        fillOpacity={0.18}
        stroke={C.navy}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {axes.map(({ row, theta }, i) => {
        const [x, y] = pointFor(row.themRating, theta);
        return <circle key={`t-${i}`} cx={x} cy={y} r={3} fill={C.navy} />;
      })}

      {/* Us polygon (green) */}
      <polygon
        points={usPath}
        fill={C.green}
        fillOpacity={0.28}
        stroke={C.green}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      {axes.map(({ row, theta }, i) => {
        const [x, y] = pointFor(row.usRating, theta);
        return <circle key={`u-${i}`} cx={x} cy={y} r={3.5} fill={C.green} />;
      })}

      {/* Axis labels */}
      {axes.map(({ row, labelX, labelY, theta }, i) => {
        // Anchor based on which side of center the label is on, so labels
        // don't overlap the chart body.
        const cos = Math.cos(theta);
        const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
        return (
          <text
            key={`label-${i}`}
            x={labelX}
            y={labelY}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={9.5}
            fontWeight={600}
            fill={C.slate600}
            style={{ pointerEvents: 'none' }}
          >
            {shortenDimension(row.dimension)}
          </text>
        );
      })}
    </svg>
  );
}

// Radar chart labels need to fit. Keep them terse.
function shortenDimension(d: string): string {
  return d
    .replace(' (RAPID / DACI)', '')
    .replace(' methodology', '')
    .replace(' support', '')
    .replace(' per decision', '')
    .replace('Enterprise ', '')
    .replace('Compound ', 'Compound')
    .replace('Outcome feedback loop', 'Feedback loop');
}

export function CompetitorComparisonCard() {
  const [activeKey, setActiveKey] = useState<string>(PROFILES[0].key);
  const profile = PROFILES.find(p => p.key === activeKey) ?? PROFILES[0];

  return (
    <div
      style={{
        border: `1px solid ${C.slate200}`,
        borderRadius: 20,
        background: C.white,
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '22px 24px 0',
          background: `linear-gradient(180deg, ${C.slate50} 0%, ${C.white} 100%)`,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.green,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 8,
          }}
        >
          How We Compare
        </p>
        <h3
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: C.slate900,
            margin: 0,
            marginBottom: 4,
            letterSpacing: '-0.01em',
          }}
        >
          Decision Intel vs {profile.name}
        </h3>
        <p style={{ fontSize: 12, color: C.slate500, margin: 0, marginBottom: 18, fontStyle: 'italic' }}>
          {profile.tagline}
        </p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, borderTop: `1px solid ${C.slate100}` }}>
          {PROFILES.map(p => {
            const isActive = p.key === activeKey;
            return (
              <button
                key={p.key}
                onClick={() => setActiveKey(p.key)}
                style={{
                  padding: '12px 0',
                  flex: 1,
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${C.green}` : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? C.slate900 : C.slate400,
                  transition: 'all 0.15s',
                }}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart band */}
      <div
        style={{
          padding: '24px 16px 8px',
          background: C.white,
          borderBottom: `1px solid ${C.slate100}`,
        }}
      >
        <RadarChart profile={profile} />
        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginTop: 4,
            fontSize: 11,
            fontWeight: 600,
            color: C.slate600,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: C.green,
                opacity: 0.85,
              }}
            />
            Decision Intel
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: C.navy,
                opacity: 0.6,
              }}
            />
            {profile.name}
          </span>
        </div>
      </div>

      {/* Comparison rows */}
      <div style={{ padding: '4px 20px' }}>
        {profile.rows.map((row, i) => {
          const usAdvantage = RATING_VALUE[row.usRating] > RATING_VALUE[row.themRating];
          return (
            <div
              key={row.dimension}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.35fr 1fr 1fr',
                gap: 12,
                padding: '12px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${C.slate100}`,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.slate900,
                  lineHeight: 1.35,
                }}
              >
                {row.dimension}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.slate500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  lineHeight: 1.4,
                }}
              >
                <RatingIcon rating={row.themRating} />
                <span>{row.themLabel}</span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.slate900,
                  fontWeight: usAdvantage ? 600 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  lineHeight: 1.4,
                  background: usAdvantage ? C.greenLight : 'transparent',
                  padding: '4px 8px',
                  borderRadius: 6,
                  margin: '-4px -8px',
                }}
              >
                <RatingIcon rating={row.usRating} />
                <span>{row.usLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: `1px solid ${C.slate200}`,
          background: C.slate50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 11, color: C.slate500 }}>
          8 capabilities · honest ratings · updated monthly
        </span>
        <Link
          href="/case-studies"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: C.green,
            textDecoration: 'none',
          }}
        >
          See it in action
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
