'use client';

/**
 * Three-tier ask hierarchy — visual ladder of asks (Tier 1 ideal, Tier 2
 * high-value, Tier 3 table stakes). Each tier carries the literal ask,
 * rationale, why-Ian-might-say-yes, why-Ian-might-say-no, and the
 * fallback if Ian declines that tier.
 *
 * The ladder pattern signals: don't lead with all three; pick the tier
 * that fits the meeting's energy. Tier 1 if Ian is leaning in. Tier 2
 * if he's curious but reserved. Tier 3 always.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Compass, ChevronRight } from 'lucide-react';
import { ASK_HIERARCHY, type AskTier } from './lrqa-brief-data';

const TIER_COLORS: Record<AskTier['tier'], string> = {
  1: '#16A34A', // green — ideal
  2: '#0EA5E9', // blue — high-value
  3: '#94A3B8', // slate — table stakes
};

const TIER_ICONS: Record<AskTier['tier'], typeof Trophy> = {
  1: Trophy,
  2: Users,
  3: Compass,
};

export function AskHierarchyLadder() {
  const [activeTier, setActiveTier] = useState<AskTier['tier']>(1);
  const active = ASK_HIERARCHY.find(a => a.tier === activeTier)!;

  return (
    <div>
      {/* Tier ladder — 3 buttons stacked vertically with visual hierarchy */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {ASK_HIERARCHY.map(t => {
          const isActive = t.tier === activeTier;
          const color = TIER_COLORS[t.tier];
          const Icon = TIER_ICONS[t.tier];
          return (
            <button
              key={t.tier}
              onClick={() => setActiveTier(t.tier)}
              style={{
                padding: '12px 14px',
                background: isActive ? `${color}10` : 'var(--bg-card)',
                border: `1px solid ${isActive ? color : 'var(--border-color)'}`,
                borderLeft: `4px solid ${color}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 2,
                  }}
                >
                  Tier {t.tier}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {t.label}
                </div>
              </div>
              <ChevronRight
                size={16}
                style={{
                  color: isActive ? color : 'var(--text-muted)',
                  transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Detail panel for the active tier */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.tier}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 18,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${TIER_COLORS[active.tier]}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Block
            label="The literal ask"
            color={TIER_COLORS[active.tier]}
            text={active.ask}
            quoteStyle
          />
          <Block label="Rationale" color="#94A3B8" text={active.rationale} />
          <Block
            label="Why Ian might say YES"
            color="#16A34A"
            text={active.whyIanMightSayYes}
          />
          <Block
            label="Why Ian might say NO"
            color="#DC2626"
            text={active.whyIanMightSayNo}
          />
          <Block
            label="Fallback position"
            color="#D97706"
            text={active.fallbackPosition}
          />
        </motion.div>
      </AnimatePresence>
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
          fontStyle: quoteStyle ? 'italic' : 'normal',
        }}
      >
        {text}
      </div>
    </div>
  );
}
