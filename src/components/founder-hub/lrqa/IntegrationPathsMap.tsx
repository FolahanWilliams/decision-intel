'use client';

/**
 * Integration Paths Map — interactive surface showing the 5 specific
 * fits between Decision Intel and LRQA's stack. Each card has a
 * fit-strength badge (critical / high / medium), where in LRQA's stack
 * it lives, what DI adds, the literal pitch positioning Folahan uses,
 * the proof artefact to demonstrate it, and a realistic timeline.
 *
 * Click any path to expand the detail panel. The 5 paths cover the full
 * spectrum: EiQ integration (critical), Partner Africa Pan-African
 * (critical), ESG / DPR-as-evidence (high), AI-IP partner-don't-build
 * (high), and the 2026-risk-trends thought-leadership (high).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Globe2, Leaf, BrainCircuit, Newspaper, ArrowRight } from 'lucide-react';
import { INTEGRATION_PATHS, type IntegrationPath } from './lrqa-brief-data';

const FIT_COLORS: Record<IntegrationPath['fitStrength'], string> = {
  critical: '#DC2626',
  high: '#16A34A',
  medium: '#0EA5E9',
};

const PATH_ICONS: Record<string, typeof Layers> = {
  eiq_reasoning_layer: Layers,
  pan_african_partner_africa: Globe2,
  esg_evidence_dpr: Leaf,
  mission_ai_external_ip: BrainCircuit,
  reuters_2026_risk_lens: Newspaper,
};

export function IntegrationPathsMap() {
  const [activeId, setActiveId] = useState<string>(INTEGRATION_PATHS[0].id);
  const active = INTEGRATION_PATHS.find(p => p.id === activeId)!;

  return (
    <div>
      {/* Card grid — 5 paths */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {INTEGRATION_PATHS.map(p => {
          const isActive = p.id === activeId;
          const color = FIT_COLORS[p.fitStrength];
          const Icon = PATH_ICONS[p.id] ?? Layers;
          return (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              style={{
                padding: 12,
                background: isActive ? `${color}10` : 'var(--bg-card)',
                border: `1px solid ${isActive ? color : 'var(--border-color)'}`,
                borderTop: `3px solid ${color}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} style={{ color }} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {p.fitStrength} fit
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.35,
                }}
              >
                {p.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 18,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${FIT_COLORS[active.fitStrength]}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            {active.title}
          </div>

          <DetailRow
            label="Where in LRQA's stack"
            color="#94A3B8"
            text={active.whereInLrqaStack}
          />
          <DetailRow
            label="What DI adds"
            color={FIT_COLORS[active.fitStrength]}
            text={active.diValueAdd}
          />
          <DetailRow
            label="Literal pitch positioning"
            color="#16A34A"
            text={active.pitchPositioning}
            italic
            quoteStyle
          />
          <DetailRow
            label="Proof artefact to demonstrate"
            color="#0EA5E9"
            text={active.proofArtefact}
          />
          <DetailRow
            label="Realistic timeline"
            color="#D97706"
            text={active.realisticTimeline}
            icon={<ArrowRight size={11} />}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DetailRow({
  label,
  color,
  text,
  italic = false,
  quoteStyle = false,
  icon,
}: {
  label: string;
  color: string;
  text: string;
  italic?: boolean;
  quoteStyle?: boolean;
  icon?: React.ReactNode;
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
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          fontStyle: italic ? 'italic' : 'normal',
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
