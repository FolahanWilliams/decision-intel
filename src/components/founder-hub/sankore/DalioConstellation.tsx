'use client';

import { useMemo, useState } from 'react';
import {
  CATEGORY_COLOURS,
  CATEGORY_LABELS,
  DALIO_BRIEF,
  type DeterminantBrief,
} from './sankore-brief-data';
import { SectionHeader } from './HoleClosureMatrix';

// Constellation viz: each Dalio determinant is a node placed on a ring sized
// by category. The 5 categories form 5 arcs around a centre labelled
// "Structural Audit · 18 determinants". Hovering a node surfaces its
// one-liner; clicking it expands a detail panel.

const RADIUS = 170;
const NODE_R = 18;
const SVG_SIZE = 460;

function categoryGroups() {
  const groups: Record<DeterminantBrief['category'], DeterminantBrief[]> = {
    cycles: [],
    power: [],
    fundamentals: [],
    internal: [],
    external: [],
  };
  for (const d of DALIO_BRIEF) groups[d.category].push(d);
  return groups;
}

interface NodePosition {
  d: DeterminantBrief;
  x: number;
  y: number;
}

export function DalioConstellation() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const positions = useMemo<NodePosition[]>(() => {
    const groups = categoryGroups();
    const order: DeterminantBrief['category'][] = [
      'cycles',
      'power',
      'fundamentals',
      'internal',
      'external',
    ];
    // Assign each category an arc segment around the circle.
    // Distribute determinants evenly across the full ring, but keep
    // category-mates adjacent.
    const ordered: DeterminantBrief[] = [];
    for (const cat of order) ordered.push(...groups[cat]);
    const total = ordered.length;
    return ordered.map((d, i) => {
      // Start at top (-90 deg) and walk clockwise.
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      return {
        d,
        x: SVG_SIZE / 2 + RADIUS * Math.cos(angle),
        y: SVG_SIZE / 2 + RADIUS * Math.sin(angle),
      };
    });
  }, []);

  const active = activeId ? DALIO_BRIEF.find(d => d.id === activeId) ?? null : null;
  const hover = hoverId ? DALIO_BRIEF.find(d => d.id === hoverId) ?? null : null;
  const focused = active ?? hover;

  return (
    <section style={{ marginBottom: 40 }}>
      <SectionHeader
        eyebrow="Dalio constellation"
        title="The 18 structural determinants now audited as a second lens"
        body="Hover any node for the audit prompt; click to lock the detail panel. This is what closes Titi's most strategic finding — the platform now reasons about debt cycles, FX, governance, and reserve-currency status alongside the Kahneman + Klein cognitive pass."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)',
          gap: 24,
          marginTop: 18,
          alignItems: 'flex-start',
        }}
        className="dalio-constellation-grid"
      >
        {/* SVG */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <svg
            width="100%"
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            style={{ maxWidth: 540 }}
            role="img"
            aria-label="Dalio 18 determinants constellation"
          >
            {/* Centre label */}
            <circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={56}
              fill="rgba(22,163,74,0.06)"
              stroke="rgba(22,163,74,0.30)"
            />
            <text
              x={SVG_SIZE / 2}
              y={SVG_SIZE / 2 - 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight={700}
              fill="var(--accent-primary)"
              style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}
            >
              Structural Audit
            </text>
            <text
              x={SVG_SIZE / 2}
              y={SVG_SIZE / 2 + 12}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-muted)"
            >
              18 determinants · Dalio
            </text>

            {/* Connections from centre */}
            {positions.map(({ d, x, y }) => (
              <line
                key={`${d.id}-line`}
                x1={SVG_SIZE / 2}
                y1={SVG_SIZE / 2}
                x2={x}
                y2={y}
                stroke={CATEGORY_COLOURS[d.category]}
                strokeOpacity={focused?.id === d.id ? 0.7 : 0.18}
                strokeWidth={focused?.id === d.id ? 2 : 1}
              />
            ))}

            {/* Nodes */}
            {positions.map(({ d, x, y }) => {
              const isFocused = focused?.id === d.id;
              return (
                <g
                  key={d.id}
                  onMouseEnter={() => setHoverId(d.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => setActiveId(activeId === d.id ? null : d.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isFocused ? NODE_R + 3 : NODE_R}
                    fill={CATEGORY_COLOURS[d.category]}
                    fillOpacity={isFocused ? 0.95 : 0.85}
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                    style={{ transition: 'r .15s' }}
                  />
                  <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight={700}
                    fill="white"
                  >
                    {d.label.split(/[ \/]/)[0].slice(0, 4)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail panel */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 18,
            minHeight: 360,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {focused ? (
            <>
              <div>
                <span
                  style={{
                    fontSize: 9.5,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    color: CATEGORY_COLOURS[focused.category],
                    background: `${CATEGORY_COLOURS[focused.category]}15`,
                    padding: '3px 8px',
                    borderRadius: 999,
                    border: `1px solid ${CATEGORY_COLOURS[focused.category]}40`,
                  }}
                >
                  {CATEGORY_LABELS[focused.category]}
                </span>
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.15,
                }}
              >
                {focused.label}
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {focused.oneLiner}
              </p>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 12,
                  borderTop: '1px dashed var(--border-color)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                Audit prompt + flag-conditions live in{' '}
                <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                  src/lib/constants/dalio-determinants.ts
                </code>
                . The structural-assumptions pipeline node injects all 18 prompts when a memo is
                analysed, and the panel renders flagged determinants only.
              </div>
            </>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: 0, marginBottom: 12, color: 'var(--text-secondary)' }}>
                Hover or click a node to see the determinant&apos;s scope.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {(
                  Object.entries(CATEGORY_LABELS) as Array<
                    [DeterminantBrief['category'], string]
                  >
                ).map(([key, label]) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        background: CATEGORY_COLOURS[key],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {label.split(' · ')[0]}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {label.split(' · ')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .dalio-constellation-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
