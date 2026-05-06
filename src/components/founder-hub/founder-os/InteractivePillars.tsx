'use client';

/**
 * InteractivePillars — dynamic six-pillar system visualization.
 *
 * Replaces the static pillar card grid with:
 *   - Animated hexagonal ring layout with live adherence scores
 *   - Neural-connection SVG lines between pillars (showing interdependence)
 *   - Pulsing status indicators (green/amber/red) per pillar
 *   - Click-to-expand detail panels with contextual "why" + rule
 *   - Central "system health" score that aggregates all six
 *
 * Props are computed from checkin data in FounderOSTab and passed down.
 */

import { useState, useMemo, useCallback, type CSSProperties } from 'react';
import {
  Shield,
  BookOpen,
  Brain,
  Cpu,
  Activity,
  Target,
  ChevronDown,
  ChevronUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PillarAdherenceData {
  /** 0–1 fraction representing 30-day adherence for each pillar. */
  neuro: number;
  longform: number;
  recall: number;
  orchestrate: number;
  distress: number;
  agency: number;
}

interface PillarDef {
  id: keyof PillarAdherenceData;
  icon: LucideIcon;
  title: string;
  shortTitle: string;
  rule: string;
  why: string;
  /** Which other pillar IDs this pillar feeds into (directed dependency). */
  feedsInto: Array<keyof PillarAdherenceData>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PILLARS: PillarDef[] = [
  {
    id: 'neuro',
    icon: Shield,
    title: 'Neurobiological Protection',
    shortTitle: 'Neuro',
    rule: 'Zero short-form content. Period.',
    why: 'Algorithmic SFV suppresses prefrontal cortex activity, downregulates executive function, and wires the brain to reject sustained focus — the exact cognitive substrate Phase 1 motion requires.',
    feedsInto: ['longform', 'recall', 'distress'],
  },
  {
    id: 'longform',
    icon: BookOpen,
    title: 'Long-Form Information Diet',
    shortTitle: 'Long-form',
    rule: '30-minute minimum. Primary sources preferred.',
    why: 'YouTube interviews 30+ min only. Daily deep reading 30-60 min from books, papers, long-form articles. Primary sources (Kahneman, Klein, Roger Martin, Dalio) over derivative content.',
    feedsInto: ['recall', 'orchestrate'],
  },
  {
    id: 'recall',
    icon: Brain,
    title: 'Active Recall + Elaborative Encoding',
    shortTitle: 'Recall',
    rule: 'Pause + retrieve + connect. Abandon passive consumption.',
    why: 'After every long-form session: explain the core concept aloud OR write it from memory. The mental strain of retrieval IS the neural-architecture-building exercise.',
    feedsInto: ['orchestrate', 'agency'],
  },
  {
    id: 'orchestrate',
    icon: Cpu,
    title: 'AI Orchestration (NOT Offloading)',
    shortTitle: 'AI',
    rule: 'Direct AI; do not query it. Build neural architecture first.',
    why: 'Build foundational neural architecture FIRST, then leverage AI as the multiplier on top. The skill is orchestration + auditing, not prompt-engineering.',
    feedsInto: ['agency'],
  },
  {
    id: 'distress',
    icon: Activity,
    title: 'Distress Tolerance + Emotional Regulation',
    shortTitle: 'Distress',
    rule: 'Daily exercise. Daily mindfulness. Absorb rejection without fragmenting.',
    why: 'Chronic anxiety actively consumes working memory, reducing cognitive bandwidth for complex reasoning under pressure. The OS must absorb rejection without fragmenting.',
    feedsInto: ['agency', 'neuro'],
  },
  {
    id: 'agency',
    icon: Target,
    title: 'Internal Locus of Control',
    shortTitle: 'Locus',
    rule: 'Reject victimhood. Frame challenges as strategic problems.',
    why: 'Personal capacity to adapt, learn, and exert discipline remains entirely within control. The framing IS the neurological re-anchor.',
    feedsInto: ['neuro'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(value: number): string {
  if (value >= 0.7) return 'var(--accent-primary)';
  if (value >= 0.4) return 'var(--warning)';
  return 'var(--error)';
}

function statusLabel(value: number): string {
  if (value >= 0.8) return 'Strong';
  if (value >= 0.6) return 'Holding';
  if (value >= 0.3) return 'At risk';
  return 'Critical';
}

/** Compute positions for 6 items evenly around a circle, starting at top. */
function hexPosition(index: number, cx: number, cy: number, radius: number) {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InteractivePillarsProps {
  adherence: PillarAdherenceData;
}

export function InteractivePillars({ adherence }: InteractivePillarsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const overallHealth = useMemo(() => {
    const vals = Object.values(adherence);
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }, [adherence]);

  const toggle = useCallback((id: string) => setExpandedId(prev => (prev === id ? null : id)), []);

  // SVG dimensions for the connection diagram
  const svgW = 360;
  const svgH = 340;
  const centerX = svgW / 2;
  const centerY = svgH / 2;
  const orbitR = 120;
  const nodeR = 28;

  // Pre-compute positions
  const positions = useMemo(
    () => PILLARS.map((_, i) => hexPosition(i, centerX, centerY, orbitR)),
    [centerX, centerY]
  );

  // Find index by id
  const idxOf = useCallback(
    (id: keyof PillarAdherenceData) => PILLARS.findIndex(p => p.id === id),
    []
  );

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section header */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
          marginBottom: 10,
          marginTop: 8,
        }}
      >
        The six pillars · interactive system map (v3.5 §11)
      </div>

      {/* SVG Connection Map + Central Score */}
      <div
        className="card"
        style={{
          borderLeft: '3px solid var(--accent-primary)',
          marginBottom: 12,
        }}
      >
        <div className="card-body">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Zap size={15} style={{ color: 'var(--accent-primary)' }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
              }}
            >
              Cognitive system health · interdependencies
            </span>
          </div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
              color: 'var(--text-primary)',
              marginBottom: 14,
            }}
          >
            Each pillar feeds the others — one collapse cascades.
          </h3>

          <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
            <svg
              width={svgW}
              height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              style={{ display: 'block', maxWidth: '100%' }}
              role="img"
              aria-label="Six pillar interdependency map"
            >
              <defs>
                <filter id="glow-green">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-amber">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Connection lines between pillars */}
              {PILLARS.map((p, srcIdx) =>
                p.feedsInto.map(targetId => {
                  const tgtIdx = idxOf(targetId);
                  if (tgtIdx === -1) return null;
                  const src = positions[srcIdx];
                  const tgt = positions[tgtIdx];
                  const isHovered = hoveredId === p.id || hoveredId === targetId;
                  const avgAdherence = (adherence[p.id] + adherence[targetId]) / 2;
                  return (
                    <line
                      key={`${p.id}-${targetId}`}
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={statusColor(avgAdherence)}
                      strokeWidth={isHovered ? 2.5 : 1.2}
                      strokeOpacity={isHovered ? 0.7 : 0.2}
                      strokeDasharray={avgAdherence < 0.4 ? '4 3' : 'none'}
                      style={{
                        transition: 'stroke-opacity 0.3s, stroke-width 0.3s',
                      }}
                    />
                  );
                })
              )}

              {/* Central system health */}
              <circle
                cx={centerX}
                cy={centerY}
                r={36}
                fill="var(--bg-card)"
                stroke={statusColor(overallHealth)}
                strokeWidth={3}
                strokeOpacity={0.6}
              />
              <text
                x={centerX}
                y={centerY - 6}
                textAnchor="middle"
                fontSize={22}
                fontWeight={800}
                fill={statusColor(overallHealth)}
                fontFamily="'JetBrains Mono', monospace"
              >
                {Math.round(overallHealth * 100)}
              </text>
              <text
                x={centerX}
                y={centerY + 12}
                textAnchor="middle"
                fontSize={9}
                fontWeight={700}
                fill="var(--text-muted)"
              >
                SYSTEM %
              </text>

              {/* Pillar nodes */}
              {PILLARS.map((p, i) => {
                const pos = positions[i];
                const val = adherence[p.id];
                const color = statusColor(val);
                const isHovered = hoveredId === p.id;
                const isExpanded = expandedId === p.id;
                return (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => toggle(p.id)}
                  >
                    {/* Pulse ring for active/hovered */}
                    {(isHovered || isExpanded) && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={nodeR + 6}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.5}
                        strokeOpacity={0.4}
                        className="pillar-pulse-ring"
                      />
                    )}
                    {/* Adherence arc (background ring) */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeR}
                      fill="var(--bg-card)"
                      stroke="var(--border-color)"
                      strokeWidth={2}
                    />
                    {/* Adherence arc (progress) */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeR}
                      fill="none"
                      stroke={color}
                      strokeWidth={3}
                      strokeDasharray={`${val * Math.PI * 2 * nodeR} ${(1 - val) * Math.PI * 2 * nodeR}`}
                      strokeDashoffset={Math.PI * 2 * nodeR * 0.25}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }}
                      filter={val >= 0.7 ? 'url(#glow-green)' : undefined}
                    />
                    {/* Percentage */}
                    <text
                      x={pos.x}
                      y={pos.y - 4}
                      textAnchor="middle"
                      fontSize={13}
                      fontWeight={800}
                      fill={color}
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {Math.round(val * 100)}%
                    </text>
                    {/* Label */}
                    <text
                      x={pos.x}
                      y={pos.y + 10}
                      textAnchor="middle"
                      fontSize={8}
                      fontWeight={700}
                      fill="var(--text-muted)"
                    >
                      {p.shortTitle.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 18,
              marginTop: 10,
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>●</span> Strong
              (≥70%)
            </span>
            <span>
              <span style={{ color: 'var(--warning)', fontWeight: 700 }}>●</span> At risk (40-69%)
            </span>
            <span>
              <span style={{ color: 'var(--error)', fontWeight: 700 }}>●</span> Critical (&lt;40%)
            </span>
            <span style={{ fontStyle: 'italic' }}>Click a node to expand</span>
          </div>
        </div>
      </div>

      {/* Expandable detail cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {PILLARS.map(p => {
          const Icon = p.icon;
          const val = adherence[p.id];
          const color = statusColor(val);
          const label = statusLabel(val);
          const isExpanded = expandedId === p.id;
          const cardStyle: CSSProperties = {
            background: 'var(--bg-card)',
            border: `1px solid ${isExpanded ? color : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            padding: 0,
            overflow: 'hidden',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            boxShadow: isExpanded
              ? `0 0 12px color-mix(in srgb, ${color} 20%, transparent)`
              : 'none',
            cursor: 'pointer',
          };

          return (
            <div key={p.id} style={cardStyle}>
              {/* Header — always visible */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggle(p.id)}
                onKeyDown={e => e.key === 'Enter' && toggle(p.id)}
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {/* Status dot */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${color}`,
                  }}
                  className={val < 0.4 ? 'pillar-pulse-dot' : ''}
                />
                <Icon size={16} style={{ color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {p.rule}
                  </div>
                </div>
                {/* Score + chevron */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {Math.round(val * 100)}%
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color,
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                ) : (
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                )}
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div
                  style={{
                    padding: '0 16px 16px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  {/* Adherence bar */}
                  <div style={{ marginTop: 12, marginBottom: 12 }}>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: 'var(--bg-tertiary)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.round(val * 100)}%`,
                          background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 70%, white))`,
                          borderRadius: 3,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        marginTop: 4,
                      }}
                    >
                      <span>0%</span>
                      <span>30-day adherence</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Why it matters */}
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      marginBottom: 10,
                    }}
                  >
                    {p.why}
                  </div>

                  {/* Dependencies */}
                  {p.feedsInto.length > 0 && (
                    <div
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>Feeds into:</span>{' '}
                      {p.feedsInto
                        .map(id => PILLARS.find(pp => pp.id === id)?.shortTitle)
                        .filter(Boolean)
                        .join(' → ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CSS animations for pulse effects */}
      <style>{`
        @keyframes pillar-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.15); }
        }
        .pillar-pulse-ring {
          animation: pillar-pulse 2s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes dot-pulse {
          0%, 100% { box-shadow: 0 0 4px var(--error); }
          50% { box-shadow: 0 0 10px var(--error); }
        }
        .pillar-pulse-dot {
          animation: dot-pulse 1.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pillar-pulse-ring,
          .pillar-pulse-dot {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
