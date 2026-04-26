'use client';

/**
 * Three-Gaps Differentiator — the top 3 systemic gaps in the current
 * decision intelligence space (Cloverpop, Aera, Quantexa, Pyramid
 * Analytics, Quantellia, Peak.ai, IBM watsonx) that Decision Intel
 * uniquely fixes. Synthesised from external research (CubeResearch,
 * Deloitte, LinkedIn, G2, OpenPR) integrated 2026-04-26.
 *
 * Use this surface in:
 *   - Cold outbound (cite the gap, the stat, then the product surface)
 *   - Investor decks (proves DI isn't "another DI tool" — it's the layer
 *     that makes DI tools defensible)
 *   - Active prospect conversations (LRQA, future warm intros)
 *   - Procurement responses (when buyers ask "why you over Cloverpop / Aera")
 *
 * Source data: src/lib/data/competitive-positioning.ts TOP_3_DI_GAPS +
 * DI_MARKET_CONTEXT.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Sparkles, Target, ShieldCheck } from 'lucide-react';
import { TOP_3_DI_GAPS, DI_MARKET_CONTEXT, type DiSpaceGap } from '@/lib/data/competitive-positioning';

const GAP_ACCENTS: Record<DiSpaceGap['rank'], string> = {
  1: '#DC2626', // red — highest impact, biggest white space
  2: '#D97706', // amber — high impact, structural
  3: '#16A34A', // green — high impact, regulatory tailwind
};

const GAP_ICONS: Record<DiSpaceGap['rank'], typeof Target> = {
  1: Sparkles,  // causal reasoning
  2: Target,    // execution
  3: ShieldCheck, // governance
};

export function ThreeGapsDifferentiator() {
  const [activeRank, setActiveRank] = useState<DiSpaceGap['rank']>(1);
  const active = TOP_3_DI_GAPS.find(g => g.rank === activeRank)!;

  return (
    <div>
      {/* Market context strip — establishes why these gaps matter */}
      <div
        style={{
          padding: 14,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(14,165,233,0.04))',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#16A34A',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <TrendingUp size={11} />
          Decision intelligence market context · 2026
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
          <Stat label="Market size 2026" value={DI_MARKET_CONTEXT.size2026} />
          <Stat label="Projection" value={DI_MARKET_CONTEXT.projection} />
          <Stat label="CAGR" value={DI_MARKET_CONTEXT.cagr} />
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          {DI_MARKET_CONTEXT.framing}
        </div>
      </div>

      {/* 3 gap cards — selectable */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {TOP_3_DI_GAPS.map(gap => {
          const isActive = gap.rank === activeRank;
          const color = GAP_ACCENTS[gap.rank];
          const Icon = GAP_ICONS[gap.rank];
          return (
            <button
              key={gap.id}
              onClick={() => setActiveRank(gap.rank)}
              style={{
                padding: 14,
                background: isActive ? `${color}10` : 'var(--bg-card)',
                border: `1px solid ${isActive ? color : 'var(--border-color)'}`,
                borderTop: `3px solid ${color}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: color,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} />
                </span>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Gap #{gap.rank}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.35,
                }}
              >
                {gap.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel for the active gap */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.rank}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 18,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${GAP_ACCENTS[active.rank]}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          {/* Industry stat — the punch */}
          <div
            style={{
              padding: 12,
              background: `${GAP_ACCENTS[active.rank]}0d`,
              border: `1px solid ${GAP_ACCENTS[active.rank]}30`,
              borderRadius: 4,
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
              marginBottom: 14,
              fontStyle: 'italic',
            }}
          >
            <strong style={{ color: GAP_ACCENTS[active.rank], fontStyle: 'normal' }}>
              Industry stat:
            </strong>{' '}
            {active.industryStat}
          </div>

          <Block label="What it is" color="#94A3B8" text={active.whatItIs} />
          <Block
            label="Why competitors fail"
            color="#DC2626"
            text={active.whyCompetitorsFail}
          />
          <Block
            label="Why it blocks value"
            color="#D97706"
            text={active.whyItBlocksValue}
          />
          <Block
            label="How Decision Intel solves it"
            color={GAP_ACCENTS[active.rank]}
            text={active.howDiSolves}
            quoteStyle
          />

          {/* DI product surfaces — what to cite when challenged */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: '#16A34A',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              Product surfaces · cite these when challenged
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 11,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
              }}
            >
              {active.diProductSurfaces.map((s, i) => (
                <li key={i}>
                  <code style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{s}</code>
                </li>
              ))}
            </ul>
          </div>

          {/* External citations — for credibility in cold outreach */}
          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              External citations
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {active.citationSources.map(c => (
                <span
                  key={c}
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    padding: '3px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: '#16A34A',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Block({
  label,
  color,
  text,
  quoteStyle = false,
}: {
  label: string;
  color: string;
  text: string;
  quoteStyle?: boolean;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          padding: quoteStyle ? '10px 12px' : 0,
          background: quoteStyle ? 'var(--bg-secondary)' : 'transparent',
          borderLeft: quoteStyle ? `2px solid ${color}` : 'none',
          borderRadius: quoteStyle ? 4 : 0,
        }}
      >
        {text}
      </div>
    </div>
  );
}
