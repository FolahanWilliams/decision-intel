'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Minus, X } from 'lucide-react';
import {
  DI_GAPS,
  DI_INCUMBENTS,
  GAP_RATING_COLOR,
  GAP_RATING_LABEL,
  type DiGap,
  type DiIncumbent,
  type GapId,
  type GapRating,
} from '@/lib/data/competitive-positioning';

/**
 * Landing-page "category-creator" card.
 *
 * Three gaps in the DI space (causal reasoning, closed-loop execution,
 * governance) — tabbed, interactive, with a per-gap micro-viz on the left
 * and a 4-row incumbent rating strip on the right. Decision Intel renders
 * last in the strip and is the only row with `full` on every gap.
 *
 * Visual grammar mirrors CompetitorComparisonCard.tsx: light-theme C
 * palette, 20px radius, 1px slate200 border, tab underline in C.green.
 * Pure SVG micro-vizzes; no charting dependency. Framer Motion handles
 * the tab-swap transition and respects `prefers-reduced-motion` via the
 * `initial={false}` guard on AnimatePresence.
 */

const C = {
  navy: '#0F172A',
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

// ─── Rating icon ─────────────────────────────────────────────────────────

function RatingIcon({ rating, size = 18 }: { rating: GapRating; size?: number }) {
  const color = GAP_RATING_COLOR[rating];
  const bg =
    rating === 'full' ? C.greenLight : rating === 'partial' ? C.amberLight : C.redLight;
  const Icon = rating === 'full' ? Check : rating === 'partial' ? Minus : X;
  return (
    <span
      role="img"
      aria-label={GAP_RATING_LABEL[rating]}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color,
        flexShrink: 0,
      }}
    >
      <Icon size={size * 0.65} strokeWidth={2.5} />
    </span>
  );
}

// ─── Per-gap micro-vizzes ────────────────────────────────────────────────

function CausalMicroViz() {
  return (
    <svg
      viewBox="0 0 220 160"
      width="100%"
      style={{ maxWidth: 260, display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="Correlation on top, causation on the bottom. Decision Intel ships the causal layer."
    >
      <defs>
        <marker
          id="arrow-dim"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={C.slate400} />
        </marker>
        <marker
          id="arrow-green"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={C.green} />
        </marker>
      </defs>

      {/* Correlation row (dim) */}
      <text
        x={20}
        y={22}
        fontSize={10}
        fontWeight={700}
        fill={C.slate400}
        letterSpacing="0.08em"
      >
        CORRELATION
      </text>
      <circle cx={30} cy={48} r={12} fill={C.slate100} stroke={C.slate300} />
      <text
        x={30}
        y={51}
        textAnchor="middle"
        fontSize={10}
        fill={C.slate600}
        fontWeight={600}
      >
        A
      </text>
      <line
        x1={44}
        y1={48}
        x2={176}
        y2={48}
        stroke={C.slate300}
        strokeWidth={1.5}
        strokeDasharray="3 4"
        markerEnd="url(#arrow-dim)"
      />
      <circle cx={190} cy={48} r={12} fill={C.slate100} stroke={C.slate300} />
      <text
        x={190}
        y={51}
        textAnchor="middle"
        fontSize={10}
        fill={C.slate600}
        fontWeight={600}
      >
        B
      </text>
      <text x={110} y={40} textAnchor="middle" fontSize={9} fill={C.slate400}>
        moves with
      </text>

      {/* Divider */}
      <line x1={0} y1={82} x2={220} y2={82} stroke={C.slate100} strokeWidth={1} />

      {/* Causation row (green) */}
      <text
        x={20}
        y={104}
        fontSize={10}
        fontWeight={800}
        fill={C.green}
        letterSpacing="0.08em"
      >
        CAUSATION
      </text>
      <circle cx={30} cy={130} r={13} fill={C.greenLight} stroke={C.green} strokeWidth={1.5} />
      <text
        x={30}
        y={133}
        textAnchor="middle"
        fontSize={10}
        fill={C.green}
        fontWeight={700}
      >
        A
      </text>
      <line
        x1={45}
        y1={130}
        x2={175}
        y2={130}
        stroke={C.green}
        strokeWidth={2}
        markerEnd="url(#arrow-green)"
      />
      <circle
        cx={190}
        cy={130}
        r={13}
        fill={C.greenLight}
        stroke={C.green}
        strokeWidth={1.5}
      />
      <text
        x={190}
        y={133}
        textAnchor="middle"
        fontSize={10}
        fill={C.green}
        fontWeight={700}
      >
        B
      </text>
      <text
        x={110}
        y={122}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fill={C.green}
      >
        causes
      </text>
      <rect
        x={75}
        y={138}
        width={70}
        height={16}
        rx={8}
        fill={C.white}
        stroke={C.green}
        strokeWidth={1}
      />
      <text
        x={110}
        y={149}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fill={C.green}
      >
        SCM · do-calc
      </text>
    </svg>
  );
}

function ExecutionMicroViz() {
  return (
    <svg
      viewBox="0 0 220 160"
      width="100%"
      style={{ maxWidth: 260, display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="Incumbents: broken recommendation loop. Decision Intel: closed outcome flywheel."
    >
      {/* Broken loop (top) */}
      <text
        x={20}
        y={20}
        fontSize={10}
        fontWeight={700}
        fill={C.slate400}
        letterSpacing="0.08em"
      >
        INCUMBENTS
      </text>
      <path
        d="M 60 52 A 28 28 0 1 0 160 52"
        fill="none"
        stroke={C.slate300}
        strokeWidth={1.75}
        strokeDasharray="4 4"
      />
      <circle cx={60} cy={52} r={7} fill={C.white} stroke={C.slate400} strokeWidth={1.5} />
      <circle cx={160} cy={52} r={7} fill={C.white} stroke={C.slate400} strokeWidth={1.5} />
      <text x={110} y={42} textAnchor="middle" fontSize={9} fill={C.slate500}>
        recommend
      </text>
      <line
        x1={95}
        y1={78}
        x2={125}
        y2={78}
        stroke={C.red}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <text
        x={110}
        y={95}
        textAnchor="middle"
        fontSize={9}
        fontWeight={600}
        fill={C.red}
      >
        loop breaks
      </text>

      {/* Divider */}
      <line x1={0} y1={108} x2={220} y2={108} stroke={C.slate100} strokeWidth={1} />

      {/* Closed loop (bottom) */}
      <text
        x={20}
        y={128}
        fontSize={10}
        fontWeight={800}
        fill={C.green}
        letterSpacing="0.08em"
      >
        DECISION INTEL
      </text>
      <circle
        cx={60}
        cy={146}
        r={8}
        fill={C.greenLight}
        stroke={C.green}
        strokeWidth={1.5}
      />
      <text
        x={60}
        y={149}
        textAnchor="middle"
        fontSize={8}
        fontWeight={700}
        fill={C.green}
      >
        D
      </text>
      <circle
        cx={110}
        cy={146}
        r={8}
        fill={C.greenLight}
        stroke={C.green}
        strokeWidth={1.5}
      />
      <text
        x={110}
        y={149}
        textAnchor="middle"
        fontSize={8}
        fontWeight={700}
        fill={C.green}
      >
        O
      </text>
      <circle
        cx={160}
        cy={146}
        r={8}
        fill={C.greenLight}
        stroke={C.green}
        strokeWidth={1.5}
      />
      <text
        x={160}
        y={149}
        textAnchor="middle"
        fontSize={8}
        fontWeight={700}
        fill={C.green}
      >
        ↻
      </text>
      <line x1={68} y1={146} x2={102} y2={146} stroke={C.green} strokeWidth={2} />
      <line x1={118} y1={146} x2={152} y2={146} stroke={C.green} strokeWidth={2} />
      <path
        d="M 160 138 Q 180 120 152 120 L 68 120 Q 40 120 60 138"
        fill="none"
        stroke={C.green}
        strokeWidth={2}
      />
    </svg>
  );
}

function GovernanceMicroViz() {
  const frameworks = ['SOX', 'GDPR', 'EU AI Act', 'Basel III', 'FCA', 'SEC', 'LPOA'];
  return (
    <svg
      viewBox="0 0 220 160"
      width="100%"
      style={{ maxWidth: 260, display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="Compliance shield with seven regulatory framework chips lit green under Decision Intel."
    >
      {/* Shield */}
      <path
        d="M 110 16 L 160 36 L 160 80 Q 160 116 110 140 Q 60 116 60 80 L 60 36 Z"
        fill={C.greenLight}
        stroke={C.green}
        strokeWidth={1.75}
      />
      <path
        d="M 90 82 L 105 96 L 135 66"
        fill="none"
        stroke={C.green}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Framework chips — arranged in a horizontal strip below the shield */}
      {frameworks.map((fw, i) => {
        const perRow = 4;
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const rowCount = Math.ceil(frameworks.length / perRow);
        const lastRowItems = frameworks.length - (rowCount - 1) * perRow;
        const itemsInRow = row === rowCount - 1 ? lastRowItems : perRow;
        const totalWidth = itemsInRow * 46 + (itemsInRow - 1) * 4;
        const startX = 110 - totalWidth / 2;
        const x = startX + col * 50;
        const y = 146 + row * 0;
        return (
          <g key={fw}>
            <rect
              x={x}
              y={y - 8}
              width={46}
              height={14}
              rx={7}
              fill={C.white}
              stroke={C.green}
              strokeWidth={1}
            />
            <text
              x={x + 23}
              y={y + 2}
              textAnchor="middle"
              fontSize={8}
              fontWeight={700}
              fill={C.green}
            >
              {fw}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Gap panel (per-tab body) ────────────────────────────────────────────

function GapPanel({ gap, incumbents }: { gap: DiGap; incumbents: DiIncumbent[] }) {
  const MicroViz =
    gap.id === 'causal'
      ? CausalMicroViz
      : gap.id === 'execution'
        ? ExecutionMicroViz
        : GovernanceMicroViz;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 340px) 1fr',
        gap: 28,
        padding: '24px 28px',
      }}
      className="category-gap-panel-grid"
    >
      {/* Left — micro-viz + narrative */}
      <div>
        <div style={{ marginBottom: 12 }}>
          <MicroViz />
        </div>
        <div style={{ fontSize: 13, color: C.slate600, lineHeight: 1.6, marginBottom: 10 }}>
          {gap.summary}
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.slate500,
            lineHeight: 1.55,
            fontStyle: 'italic',
            borderLeft: `2px solid ${C.slate200}`,
            paddingLeft: 10,
          }}
        >
          {gap.evidence}
        </div>
      </div>

      {/* Right — rating strip */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: C.slate500,
            marginBottom: 10,
          }}
        >
          Who covers {gap.name}?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {incumbents.map(inc => {
            const rating = inc.ratings[gap.id];
            const isUs = inc.key === 'decisionIntel';
            return (
              <div
                key={inc.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 28px 1fr',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  background: isUs ? C.greenLight : C.white,
                  border: `1px solid ${isUs ? C.greenBorder : C.slate200}`,
                  borderLeft: `3px solid ${inc.accent}`,
                  borderRadius: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.slate900,
                      lineHeight: 1.25,
                    }}
                  >
                    {inc.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.slate500,
                      marginTop: 2,
                      lineHeight: 1.35,
                    }}
                  >
                    {inc.tagline}
                  </div>
                </div>
                <div style={{ paddingTop: 1 }}>
                  <RatingIcon rating={rating} />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: isUs ? C.navy : C.slate600,
                    lineHeight: 1.5,
                    fontWeight: isUs ? 600 : 400,
                  }}
                >
                  {inc.blurb[gap.id]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main showcase ───────────────────────────────────────────────────────

export function CategoryGapShowcase() {
  const [activeId, setActiveId] = useState<GapId>(DI_GAPS[0].id);
  const activeGap = useMemo(
    () => DI_GAPS.find(g => g.id === activeId) ?? DI_GAPS[0],
    [activeId],
  );

  return (
    <section
      style={{
        background: C.slate50,
        padding: '72px 24px',
      }}
    >
      <style>{`
        @media (max-width: 899px) {
          .category-gap-panel-grid {
            grid-template-columns: 1fr !important;
            padding: 20px 18px !important;
          }
          .category-gap-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .category-gap-tabs::-webkit-scrollbar {
            display: none;
          }
          .category-gap-tab {
            flex: 0 0 auto !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        {/* Eyebrow + headline */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: C.green,
              marginBottom: 12,
            }}
          >
            Category-defining
          </div>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.4vw, 38px)',
              fontWeight: 800,
              color: C.slate900,
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
              margin: '0 auto 14px',
              maxWidth: 820,
            }}
          >
            Three gaps the DI space has left open. We close all three.
          </h2>
          <p
            style={{
              fontSize: 'clamp(14px, 1.4vw, 16px)',
              color: C.slate600,
              lineHeight: 1.6,
              maxWidth: 720,
              margin: '0 auto',
            }}
          >
            Quantexa unifies siloed data. Aera automates real-time recommendations. Pyramid
            augments analytics. None of them audit the reasoning that produced the memo —
            which is where the highest-value strategic decisions quietly fail.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Tab row */}
          <div
            role="tablist"
            aria-label="Decision-intelligence gaps"
            className="category-gap-tabs"
            style={{
              display: 'flex',
              borderBottom: `1px solid ${C.slate100}`,
              background: C.slate50,
            }}
          >
            {DI_GAPS.map(gap => {
              const isActive = gap.id === activeId;
              return (
                <button
                  key={gap.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`gap-panel-${gap.id}`}
                  id={`gap-tab-${gap.id}`}
                  onClick={() => setActiveId(gap.id)}
                  className="category-gap-tab"
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderBottom: isActive
                      ? `2px solid ${C.green}`
                      : '2px solid transparent',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: isActive ? C.green : C.slate500,
                      marginBottom: 3,
                    }}
                  >
                    Gap {DI_GAPS.findIndex(g => g.id === gap.id) + 1} · {gap.name}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? C.slate900 : C.slate600,
                      lineHeight: 1.3,
                    }}
                  >
                    {gap.fullName}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Panel (animated) */}
          <AnimatePresence mode="wait" initial={false}>
            <div
              key={activeGap.id}
              role="tabpanel"
              id={`gap-panel-${activeGap.id}`}
              aria-labelledby={`gap-tab-${activeGap.id}`}
            >
              <GapPanel gap={activeGap} incumbents={DI_INCUMBENTS} />
            </div>
          </AnimatePresence>

          {/* DI edge highlight band */}
          <div
            style={{
              background: C.greenLight,
              borderTop: `1px solid ${C.greenBorder}`,
              padding: '14px 28px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: C.green,
                background: C.white,
                border: `1px solid ${C.greenBorder}`,
                padding: '3px 8px',
                borderRadius: 6,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              DI edge
            </span>
            <p
              style={{
                fontSize: 13,
                color: C.navy,
                lineHeight: 1.55,
                margin: 0,
                fontWeight: 500,
              }}
            >
              {activeGap.diEdge}
            </p>
          </div>
        </div>

        {/* Summary chip + CTAs */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            marginTop: 28,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              background: C.white,
              border: `1.5px solid ${C.greenBorder}`,
              borderRadius: 999,
              boxShadow: '0 2px 10px rgba(22, 163, 74, 0.1)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: C.green,
                color: C.white,
                flexShrink: 0,
              }}
            >
              <Check size={13} strokeWidth={3} />
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>
              Decision Intel is the only platform that closes all three gaps.
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              href="/how-it-works"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.green,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              See the 12-node pipeline <ArrowRight size={13} />
            </Link>
            <Link
              href="/bias-genome"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.green,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              See the Bias Genome <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
