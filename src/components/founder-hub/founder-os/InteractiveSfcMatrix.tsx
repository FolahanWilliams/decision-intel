'use client';

/**
 * InteractiveSfcMatrix — dynamic SFC consequence visualization.
 *
 * Transforms the static WHY_SFC_IS_BAD cards and sabotage tables into:
 *   - Animated "threat cascade" flowchart (SFC → cognitive failure → business failure)
 *   - Severity-scored consequence cards with expandable detail
 *   - Visual "neural pathway" showing the chain: SFC consumption → dopamine hijack →
 *     executive dysfunction → specific Phase 1 / Stanford failure
 *   - Interactive toggle between DI impact and Stanford impact views
 *
 * All content from content.ts — no new copy, just dynamic presentation.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingDown,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import {
  WHY_SFC_IS_BAD,
  HOW_SFC_SABOTAGES_DI,
  HOW_SFC_SABOTAGES_STANFORD,
  type SfcConsequenceRow,
} from './content';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type ImpactView = 'di' | 'stanford';

/** Assign severity based on keyword analysis of the consequence text. */
function scoreSeverity(text: string): number {
  const criticalTerms = ['fails', 'collapse', 'shutdown', 'impossible', 'permanent', 'cannot'];
  const highTerms = ['degrades', 'weakens', 'stalls', 'burns', 'atrophying', 'fragments'];
  const critCount = criticalTerms.filter(t => text.toLowerCase().includes(t)).length;
  const highCount = highTerms.filter(t => text.toLowerCase().includes(t)).length;
  if (critCount >= 2) return 5;
  if (critCount >= 1) return 4;
  if (highCount >= 2) return 3;
  if (highCount >= 1) return 2;
  return 1;
}

function severityColor(score: number): string {
  if (score >= 4) return 'var(--error)';
  if (score >= 3) return 'var(--severity-high)';
  return 'var(--warning)';
}

function severityLabel(score: number): string {
  if (score >= 4) return 'CRITICAL';
  if (score >= 3) return 'HIGH';
  return 'MEDIUM';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CascadeFlowDiagram() {
  /**
   * Minimal SVG flow: SFC Consumption → 3 cognitive failure modes → business failure.
   * Animated path drawing on mount.
   */
  const w = 520;
  const h = 140;
  const nodeH = 32;
  const nodeR = 8;

  const stages = [
    { label: 'SFC Consumption', x: 30, color: 'var(--error)' },
    { label: 'Dopamine Hijack', x: 170, color: 'var(--severity-high)' },
    { label: 'Executive Dysfunction', x: 310, color: 'var(--warning)' },
    { label: 'Phase Failure', x: 440, color: 'var(--text-muted)' },
  ];

  return (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', minWidth: w }}
        role="img"
        aria-label="SFC cascade flow diagram"
      >
        {/* Connecting arrows */}
        {stages.slice(0, -1).map((s, i) => {
          const next = stages[i + 1];
          const startX = s.x + 70;
          const endX = next.x;
          const y = h / 2;
          return (
            <g key={i}>
              <line
                x1={startX}
                y1={y}
                x2={endX}
                y2={y}
                stroke={s.color}
                strokeWidth={2}
                strokeOpacity={0.5}
                markerEnd="url(#arrow)"
                className="cascade-line"
                style={{
                  strokeDasharray: 200,
                  strokeDashoffset: 200,
                  animation: `cascade-draw 0.8s ease ${i * 0.3}s forwards`,
                }}
              />
            </g>
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" fillOpacity={0.5} />
          </marker>
        </defs>

        {/* Stage nodes */}
        {stages.map((s, i) => {
          const y = h / 2;
          const boxW = 120;
          return (
            <g
              key={s.label}
              className="cascade-node"
              style={{ animation: `cascade-fade 0.5s ease ${i * 0.25}s both` }}
            >
              <rect
                x={s.x}
                y={y - nodeH / 2}
                width={boxW}
                height={nodeH}
                rx={nodeR}
                fill="var(--bg-card)"
                stroke={s.color}
                strokeWidth={1.5}
              />
              <text
                x={s.x + boxW / 2}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fontWeight={700}
                fill={s.color}
              >
                {s.label}
              </text>
              {/* Step number */}
              <circle cx={s.x + 10} cy={y - nodeH / 2 - 6} r={8} fill={s.color} />
              <text
                x={s.x + 10}
                y={y - nodeH / 2 - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fontWeight={800}
                fill="white"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* Sub-labels */}
        <text x={95} y={h / 2 + 30} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          Variable-reward
        </text>
        <text x={95} y={h / 2 + 40} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          dopamine cycle
        </text>
        <text x={230} y={h / 2 + 30} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          DLPFC + ACC
        </text>
        <text x={230} y={h / 2 + 40} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          suppression
        </text>
        <text x={370} y={h / 2 + 30} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          System 2 atrophy
        </text>
        <text x={370} y={h / 2 + 40} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          theta-power loss
        </text>
        <text x={500} y={h / 2 + 30} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          £10M→£0 / Stanford
        </text>
        <text x={500} y={h / 2 + 40} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          rejection
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function InteractiveSfcMatrix() {
  const [view, setView] = useState<ImpactView>('di');
  const [expandedResearch, setExpandedResearch] = useState<number | null>(null);
  const [expandedConseq, setExpandedConseq] = useState<number | null>(null);

  const rows: readonly SfcConsequenceRow[] =
    view === 'di' ? HOW_SFC_SABOTAGES_DI : HOW_SFC_SABOTAGES_STANFORD;

  const scored = useMemo(
    () =>
      rows.map(r => ({
        ...r,
        severity: scoreSeverity(r.v35BusinessConsequence),
      })),
    [rows]
  );

  const avgSeverity = useMemo(
    () => scored.reduce((s, r) => s + r.severity, 0) / scored.length,
    [scored]
  );

  const toggleResearch = useCallback(
    (i: number) => setExpandedResearch(prev => (prev === i ? null : i)),
    []
  );
  const toggleConseq = useCallback(
    (i: number) => setExpandedConseq(prev => (prev === i ? null : i)),
    []
  );

  return (
    <div
      style={{
        marginTop: 28,
        padding: '20px 22px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--severity-high)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <AlertTriangle size={16} style={{ color: 'var(--severity-high)' }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          Threat matrix · come back here when unmotivated
        </span>
      </div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          margin: 0,
          color: 'var(--text-primary)',
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}
      >
        The cascade from scroll to shutdown.
      </h3>
      <p
        style={{
          fontSize: 13.5,
          color: 'var(--text-secondary)',
          margin: '6px 0 18px',
          lineHeight: 1.55,
        }}
      >
        Every consequence below maps a cognitive failure mode caused by SFC to a specific failure.
        The mechanism is concrete and physical — not abstract willpower talk.
      </p>

      {/* Cascade Flow Diagram */}
      <CascadeFlowDiagram />

      {/* Research-backed reasons — interactive accordion */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 10,
        }}
      >
        <Zap size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        The neuroscience · {WHY_SFC_IS_BAD.length} mechanisms
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
        {WHY_SFC_IS_BAD.map((item, i) => {
          const isOpen = expandedResearch === i;
          return (
            <div
              key={i}
              style={{
                background: 'var(--bg-secondary)',
                border: `1px solid ${isOpen ? 'var(--severity-high)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                transition: 'border-color 0.3s',
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleResearch(i)}
                onKeyDown={e => e.key === 'Enter' && toggleResearch(i)}
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--severity-high) 15%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'var(--severity-high)',
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.35,
                  }}
                >
                  {item.heading}
                </span>
                {isOpen ? (
                  <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              {isOpen && (
                <div
                  style={{
                    padding: '0 14px 14px',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: 12,
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {item.body}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Impact view toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <h4
          style={{
            fontSize: 15,
            fontWeight: 700,
            margin: 0,
            color: 'var(--text-primary)',
          }}
        >
          Consequence map
        </h4>
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            padding: 2,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setView('di');
              setExpandedConseq(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 14px',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: view === 'di' ? 'var(--accent-primary)' : 'transparent',
              color: view === 'di' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            <Briefcase size={12} />
            Decision Intel
          </button>
          <button
            type="button"
            onClick={() => {
              setView('stanford');
              setExpandedConseq(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 14px',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: view === 'stanford' ? 'var(--accent-primary)' : 'transparent',
              color: view === 'stanford' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            <GraduationCap size={12} />
            Stanford
          </button>
        </div>
      </div>

      {/* Severity summary bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: 'color-mix(in srgb, var(--error) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 14,
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        <TrendingDown size={14} style={{ color: 'var(--error)' }} />
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {scored.filter(r => r.severity >= 4).length} critical
          </strong>
          {' · '}
          {scored.filter(r => r.severity === 3).length} high
          {' · '}
          {scored.filter(r => r.severity <= 2).length} medium
          {' · '}
          Average severity:{' '}
          <strong style={{ color: severityColor(avgSeverity) }}>{avgSeverity.toFixed(1)}/5</strong>
        </span>
      </div>

      {/* Consequence cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {scored.map((row, idx) => {
          const isOpen = expandedConseq === idx;
          const color = severityColor(row.severity);
          return (
            <div
              key={idx}
              style={{
                border: `1px solid ${isOpen ? color : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                transition: 'border-color 0.3s',
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleConseq(idx)}
                onKeyDown={e => e.key === 'Enter' && toggleConseq(idx)}
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  background: isOpen
                    ? `color-mix(in srgb, ${color} 4%, transparent)`
                    : 'transparent',
                }}
              >
                {/* Severity badge */}
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: `color-mix(in srgb, ${color} 15%, transparent)`,
                    fontSize: 9,
                    fontWeight: 800,
                    color,
                    letterSpacing: '0.06em',
                    flexShrink: 0,
                  }}
                >
                  {severityLabel(row.severity)}
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                  }}
                >
                  {row.cognitiveFailureMode}
                </span>
                {isOpen ? (
                  <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              {isOpen && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    {view === 'di'
                      ? 'v3.5 Business consequence'
                      : 'Stanford application consequence'}
                  </div>
                  {row.v35BusinessConsequence}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes cascade-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes cascade-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cascade-line { animation: none !important; stroke-dashoffset: 0 !important; }
          .cascade-node { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
    </div>
  );
}
