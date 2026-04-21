'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar,
  Building2,
  Target,
  Layers,
  ShieldCheck,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  INCUMBENTS,
  MARKET_GAPS,
  CATEGORY_PATH,
  LEADING_EDGES,
  BUILD_OUT,
  CATEGORY_THESIS,
  type Incumbent,
  type MarketGap,
  type CategoryMilestone,
} from '@/lib/data/category-position';

// ─── Landscape SVG constants ────────────────────────────────────────────
// 2D positioning: x = horizontal scope → strategic specificity,
//                 y = correlation → causal + outcome loop.
const GRID_W = 640;
const GRID_H = 440;
const GRID_PAD = 56;
const GRID_INNER_W = GRID_W - GRID_PAD * 2;
const GRID_INNER_H = GRID_H - GRID_PAD * 2;

function gridX(x: number): number {
  return GRID_PAD + (x / 100) * GRID_INNER_W;
}
function gridY(y: number): number {
  // SVG y grows downward; data y grows upward (0 = bottom).
  return GRID_PAD + ((100 - y) / 100) * GRID_INNER_H;
}

const MILESTONE_TYPE_META: Record<
  CategoryMilestone['type'],
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  outreach: {
    label: 'Outreach',
    color: '#16A34A',
    bg: 'rgba(22, 163, 74, 0.14)',
    icon: <Target size={12} />,
  },
  product: {
    label: 'Product',
    color: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.14)',
    icon: <Layers size={12} />,
  },
  content: {
    label: 'Content',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.14)',
    icon: <Sparkles size={12} />,
  },
  analyst: {
    label: 'Analyst',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.14)',
    icon: <Radar size={12} />,
  },
  funding: {
    label: 'Funding',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.14)',
    icon: <TrendingUp size={12} />,
  },
};

export function CategoryPositionTab() {
  const [selectedIncumbentId, setSelectedIncumbentId] = useState<string>('decision-intel');
  const [activeGapId, setActiveGapId] = useState<string>('causal');
  const [hoveredMilestoneId, setHoveredMilestoneId] = useState<string | null>(null);

  const selectedIncumbent = useMemo(
    () => INCUMBENTS.find(i => i.id === selectedIncumbentId) ?? INCUMBENTS[0],
    [selectedIncumbentId]
  );
  const activeGap = useMemo(
    () => MARKET_GAPS.find(g => g.id === activeGapId) ?? MARKET_GAPS[0],
    [activeGapId]
  );

  return (
    <div>
      {renderHero()}
      {renderThesis()}
      {renderLandscape(selectedIncumbent, setSelectedIncumbentId)}
      {renderIncumbentDetail(selectedIncumbent)}
      {renderGaps(activeGap, activeGapId, setActiveGapId)}
      {renderCategoryPath(hoveredMilestoneId, setHoveredMilestoneId)}
      {renderScorecard()}
      {renderSources()}
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────

function renderHero() {
  return (
    <div
      style={{
        padding: 18,
        background: 'linear-gradient(135deg, rgba(22,163,74,0.09), rgba(14,165,233,0.06))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#16A34A',
          marginBottom: 6,
        }}
      >
        Category Position
      </div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        The open lane: Causal Governance DI for strategic memos.
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginTop: 8,
          marginBottom: 0,
          lineHeight: 1.55,
          maxWidth: 760,
        }}
      >
        Quantexa owns contextual graphs. Aera owns supply-chain automation. Pyramid owns BI. Nobody
        owns causal audit + closed outcome loop + board-ready governance for strategic decisions.
        That&rsquo;s the category we&rsquo;re creating — grounded in what&rsquo;s already shipped,
        honest about what still has to be built.
      </p>
    </div>
  );
}

// ─── Thesis section ──────────────────────────────────────────────────────

function renderThesis() {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(22, 163, 74, 0.18)',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            The category thesis
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            One sentence. Four moments. Why now.
          </div>
        </div>
      </div>

      <div
        style={{
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #16A34A',
          borderRadius: 'var(--radius-md)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          marginBottom: 14,
        }}
      >
        {CATEGORY_THESIS.sentence}
      </div>

      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        The four moments
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {CATEGORY_THESIS.theFourMoments.map((m, i) => (
          <div
            key={m.label}
            style={{
              padding: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'rgba(22, 163, 74, 0.18)',
                color: '#16A34A',
                fontSize: 10,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 4,
                paddingRight: 28,
              }}
            >
              {m.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {m.body}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #F59E0B',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#F59E0B',
            marginBottom: 4,
          }}
        >
          Why now
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>
          {CATEGORY_THESIS.whyNow}
        </div>
      </div>
    </section>
  );
}

// ─── Landscape SVG ───────────────────────────────────────────────────────

function renderLandscape(selected: Incumbent, setSelectedId: (id: string) => void) {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(14, 165, 233, 0.18)',
            color: '#0EA5E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Radar size={16} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            DI landscape
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Six players positioned by strategic specificity (x) and causal depth (y). Click any dot.
          </div>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${GRID_W} ${GRID_H}`}
          style={{
            width: '100%',
            minWidth: 560,
            height: 'auto',
            display: 'block',
          }}
          role="img"
          aria-label="DI competitive landscape"
        >
          {/* Grid background + quadrant tint */}
          <rect
            x={GRID_PAD}
            y={GRID_PAD}
            width={GRID_INNER_W}
            height={GRID_INNER_H}
            fill="transparent"
            stroke="var(--border-color)"
            strokeWidth={1}
          />
          {/* Top-right quadrant — the open lane */}
          <rect
            x={GRID_PAD + GRID_INNER_W / 2}
            y={GRID_PAD}
            width={GRID_INNER_W / 2}
            height={GRID_INNER_H / 2}
            fill="rgba(22, 163, 74, 0.06)"
          />
          <text
            x={GRID_PAD + (GRID_INNER_W * 3) / 4}
            y={GRID_PAD + 18}
            textAnchor="middle"
            fontSize={10}
            fontWeight={800}
            fill="#16A34A"
            style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Open lane · Causal + Strategic
          </text>

          {/* Mid-grid lines */}
          <line
            x1={GRID_PAD + GRID_INNER_W / 2}
            y1={GRID_PAD}
            x2={GRID_PAD + GRID_INNER_W / 2}
            y2={GRID_PAD + GRID_INNER_H}
            stroke="var(--border-color)"
            strokeDasharray="3 4"
            strokeWidth={1}
            opacity={0.5}
          />
          <line
            x1={GRID_PAD}
            y1={GRID_PAD + GRID_INNER_H / 2}
            x2={GRID_PAD + GRID_INNER_W}
            y2={GRID_PAD + GRID_INNER_H / 2}
            stroke="var(--border-color)"
            strokeDasharray="3 4"
            strokeWidth={1}
            opacity={0.5}
          />

          {/* Axis labels */}
          <text
            x={GRID_W / 2}
            y={GRID_H - 14}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill="var(--text-secondary)"
          >
            Horizontal BI →→ Strategic-decision-specific
          </text>
          <text
            x={16}
            y={GRID_H / 2}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill="var(--text-secondary)"
            transform={`rotate(-90, 16, ${GRID_H / 2})`}
          >
            Correlation →→ Causal + Outcome loop
          </text>

          {/* Incumbent dots */}
          {INCUMBENTS.map(inc => {
            const cx = gridX(inc.x);
            const cy = gridY(inc.y);
            const isSelected = inc.id === selected.id;
            const color = inc.isDI ? '#16A34A' : '#64748B';
            const fillColor = inc.isDI ? '#16A34A' : 'var(--bg-card)';
            return (
              <g
                key={inc.id}
                onClick={() => setSelectedId(inc.id)}
                style={{ cursor: 'pointer' }}
                role="button"
                aria-label={inc.name}
              >
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={20}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeOpacity={0.4}
                  >
                    <animate
                      attributeName="r"
                      values="20;26;20"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-opacity"
                      values="0.4;0.1;0.4"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={inc.isDI ? 13 : 10}
                  fill={fillColor}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                {inc.isDI && (
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={800}
                    fill="#fff"
                  >
                    DI
                  </text>
                )}
                {/* Label — position above or below to avoid overlap with the axes. */}
                <text
                  x={cx}
                  y={cy - 18}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={isSelected || inc.isDI ? 700 : 600}
                  fill={isSelected || inc.isDI ? color : 'var(--text-primary)'}
                >
                  {inc.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: 'var(--text-muted)',
          fontStyle: 'italic',
        }}
      >
        Incumbent x/y coordinates are the founder&rsquo;s judgment on public product positioning —
        not analyst data. Funding and valuation figures cited in the detail card are from public
        reports.
      </div>
    </section>
  );
}

// ─── Incumbent detail card ──────────────────────────────────────────────

function renderIncumbentDetail(inc: Incumbent) {
  const accent = inc.isDI ? '#16A34A' : '#64748B';
  const accentBg = inc.isDI ? 'rgba(22,163,74,0.12)' : 'rgba(100,116,139,0.12)';

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={inc.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        style={{
          padding: 18,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${accent}`,
          borderRadius: 'var(--radius-lg)',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: accent,
              padding: '3px 8px',
              background: accentBg,
              borderRadius: 4,
            }}
          >
            {inc.focus}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Founded {inc.founded} · {inc.hq}
          </span>
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 4px',
          }}
        >
          {inc.name}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '0 0 12px',
            lineHeight: 1.55,
          }}
        >
          {inc.oneLiner}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <StatPill label="Total funding" value={inc.totalFunding} accent={accent} />
          <StatPill label="Valuation / traction" value={inc.valuationNote} accent={accent} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          <DetailBlock
            label="Strength"
            body={inc.strength}
            icon={<CheckCircle2 size={14} />}
            color="#16A34A"
          />
          <DetailBlock
            label={inc.isDI ? 'Build-out required' : 'Gap vs. causal governance DI'}
            body={inc.gap}
            icon={<AlertTriangle size={14} />}
            color="#EF4444"
          />
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        background: 'var(--bg-card)',
        border: `1px solid ${accent}33`,
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function DetailBlock({
  label,
  body,
  icon,
  color,
}: {
  label: string;
  body: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
        }}
      >
        <span style={{ color, display: 'flex' }}>{icon}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}

// ─── Three gaps ──────────────────────────────────────────────────────────

function renderGaps(activeGap: MarketGap, activeId: string, setActiveId: (id: string) => void) {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(139, 92, 246, 0.18)',
            color: '#8B5CF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Target size={16} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            The three gaps we close
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Each gap is anchored to an analyst-reported market claim and a shipped feature file.
          </div>
        </div>
      </div>

      {/* Gap selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {MARKET_GAPS.map(g => {
          const isActive = g.id === activeId;
          return (
            <button
              key={g.id}
              onClick={() => setActiveId(g.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-primary)',
                background: isActive ? g.accentColor : 'var(--bg-card)',
                border: isActive ? `1.5px solid ${g.accentColor}` : '1px solid var(--border-color)',
                borderLeft: `3px solid ${g.accentColor}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {g.title}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeGap.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {/* Market claim */}
          <div
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: `3px solid ${activeGap.accentColor}`,
              borderRadius: 'var(--radius-md)',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: activeGap.accentColor,
                marginBottom: 4,
              }}
            >
              Market claim
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
                lineHeight: 1.4,
              }}
            >
              {activeGap.marketClaim}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}
            >
              Source: {activeGap.sourceNote}
            </div>
          </div>

          {/* Flow: incumbent behavior → what's missing → what we ship */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <GapColumn
              label="Incumbent behavior"
              body={activeGap.incumbentBehavior}
              color="#64748B"
              icon={<Building2 size={14} />}
            />
            <GapColumn
              label="What's missing"
              body={activeGap.whatsMissing}
              color="#EF4444"
              icon={<AlertTriangle size={14} />}
            />
            <GapColumn
              label="What we ship"
              body={activeGap.whatWeShip.summary}
              color={activeGap.accentColor}
              icon={<ShieldCheck size={14} />}
            />
          </div>

          {/* Evidence — file paths */}
          <div
            style={{
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
              }}
            >
              <FileCode2 size={14} style={{ color: activeGap.accentColor }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: activeGap.accentColor,
                }}
              >
                Evidence — shipped files
              </span>
            </div>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 6,
              }}
            >
              {activeGap.whatWeShip.evidence.map(e => (
                <li
                  key={e.path}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: 8,
                    background: 'var(--bg-elevated, var(--bg-secondary))',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm, 4px)',
                  }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: activeGap.accentColor,
                      flexShrink: 0,
                      marginTop: 7,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                    >
                      {e.label}
                    </div>
                    <code
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {e.path}
                    </code>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function GapColumn({
  label,
  body,
  color,
  icon,
}: {
  label: string;
  body: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ color, display: 'flex' }}>{icon}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}

// ─── Category path (18 months) ──────────────────────────────────────────

function renderCategoryPath(hoveredId: string | null, setHoveredId: (id: string | null) => void) {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(236, 72, 153, 0.18)',
            color: '#EC4899',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <GitBranch size={16} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            18-month category-creation path
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Six quarters, each with an honest dependency. Hover a node for the gate behind it.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
        }}
      >
        {CATEGORY_PATH.map((m, i) => {
          const meta = MILESTONE_TYPE_META[m.type];
          const isHovered = hoveredId === m.id;
          return (
            <div
              key={m.id}
              onMouseEnter={() => setHoveredId(m.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${meta.color}`,
                borderRadius: 'var(--radius-md)',
                position: 'relative',
                transition: 'transform 0.15s, box-shadow 0.15s',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered ? `0 6px 18px ${meta.color}33` : 'none',
                cursor: 'default',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: meta.bg,
                  color: meta.color,
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  background: meta.bg,
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: meta.color, display: 'flex' }}>{meta.icon}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: meta.color,
                  }}
                >
                  {meta.label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginBottom: 4,
                  paddingRight: 32,
                }}
              >
                {m.quarterLabel}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                  lineHeight: 1.3,
                  paddingRight: 32,
                }}
              >
                {m.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}
              >
                {m.subtitle}
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        paddingTop: 8,
                        marginTop: 4,
                        borderTop: '1px dashed var(--border-color)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--text-muted)',
                          marginBottom: 3,
                        }}
                      >
                        Target output
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-primary)',
                          lineHeight: 1.5,
                          marginBottom: 6,
                        }}
                      >
                        {m.targetOutput}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--text-muted)',
                          marginBottom: 3,
                        }}
                      >
                        Depends on
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        {m.dependsOn}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Honest scorecard ───────────────────────────────────────────────────

function renderScorecard() {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(22, 163, 74, 0.18)',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ArrowRight size={16} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            Honest scorecard
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Where we lead today vs. what still needs to be built.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            padding: 14,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #16A34A',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 10,
            }}
          >
            <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
              }}
            >
              Where we lead today
            </span>
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {LEADING_EDGES.map(e => (
              <li key={e.label}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  {e.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {e.detail}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            padding: 14,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #F59E0B',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 10,
            }}
          >
            <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#F59E0B',
              }}
            >
              Where we need to build
            </span>
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {BUILD_OUT.map(e => (
              <li key={e.label}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  {e.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {e.detail}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Sources footer ─────────────────────────────────────────────────────

function renderSources() {
  return (
    <section
      style={{
        padding: 14,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        Sources &amp; source notes
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <SourceItem>
          <strong>Funding / valuation figures:</strong> Crunchbase, Reuters, Quantexa press releases
          (March 2025 Series F), Aera GetLatka revenue report (2024).
        </SourceItem>
        <SourceItem>
          <strong>Market size:</strong> Gartner DI Magic Quadrant 2026 commentary ($16–20B market in
          2025–2026); CAGR projections 15–24% to 2030–2035.
        </SourceItem>
        <SourceItem>
          <strong>74% faithfulness gap:</strong> theCUBE Research 2026 DI market trends, citing
          academic work on LLM explanation faithfulness. Treat as analyst-reported, not first-party
          measurement.
        </SourceItem>
        <SourceItem>
          <strong>85% decision regret:</strong> Deloitte 2025 Decision Making Survey.
        </SourceItem>
        <SourceItem>
          <strong>EU AI Act timing:</strong> Articles 13–15 (transparency / traceability), phased
          enforcement 2026–2027.
        </SourceItem>
        <SourceItem>
          <strong>Landscape x/y coordinates:</strong> Founder&rsquo;s positional judgment on public
          product positioning. Transparently opinionated, not analyst-derived.
        </SourceItem>
      </ul>
    </section>
  );
}

function SourceItem({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        fontSize: 11,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'var(--text-muted)',
          flexShrink: 0,
          marginTop: 7,
        }}
      />
      <span>{children}</span>
    </li>
  );
}
