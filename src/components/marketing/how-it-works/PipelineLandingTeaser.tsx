'use client';

/**
 * PipelineLandingTeaser
 *
 * Compact horizontal version of the 12-node pipeline, designed to drop
 * into the landing page's "How It Works" section. Shares visual DNA
 * with PipelineFlowDiagram (same zones, same icons, same zone-cycling
 * pulse) but runs at ~280px tall with a light-theme background to fit
 * inline in a longer scroll surface.
 *
 * Not interactive — this is a teaser. Clicking anywhere links to the
 * full /how-it-works page.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import {
  Shield,
  Layers,
  Radar,
  Brain,
  Scale,
  CheckCircle2,
  Microscope,
  Users,
  Eye,
  HelpCircle,
  Gavel,
  Calculator,
  type LucideIcon,
} from 'lucide-react';
import {
  PIPELINE_NODES,
  type PipelineNode,
  type PipelineZone,
} from '@/lib/data/pipeline-nodes';
import { useReducedMotion } from './useReducedMotion';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  violet: '#7C3AED',
};

const ICONS: Record<PipelineNode['iconName'], LucideIcon> = {
  Shield,
  Layers,
  Radar,
  Brain,
  Scale,
  CheckCircle2,
  Microscope,
  Users,
  Eye,
  HelpCircle,
  Gavel,
  Calculator,
};

const ZONE_ACCENT: Record<PipelineZone, string> = {
  preprocessing: C.violet,
  analysis: C.green,
  synthesis: C.slate900,
};

const ZONES_ORDER: PipelineZone[] = ['preprocessing', 'analysis', 'synthesis'];

export function PipelineLandingTeaser() {
  const [activeZone, setActiveZone] = useState<PipelineZone>('preprocessing');
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % ZONES_ORDER.length;
      setActiveZone(ZONES_ORDER[i]);
    }, 1800);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const preprocessing = PIPELINE_NODES.filter(n => n.zone === 'preprocessing');
  const analysis = PIPELINE_NODES.filter(n => n.zone === 'analysis');
  const synthesis = PIPELINE_NODES.filter(n => n.zone === 'synthesis');

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 20,
        padding: '26px 28px 20px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              marginBottom: 4,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            Under the hood · 12-node pipeline
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.slate900,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            Three zones. Seven parallel agents. Under sixty seconds.
          </div>
        </div>
        {!reducedMotion && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 999,
              background: 'rgba(22, 163, 74, 0.08)',
              border: `1px solid rgba(22, 163, 74, 0.2)`,
              color: C.green,
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: C.green,
              }}
              aria-hidden
            />
            live
          </motion.div>
        )}
      </div>

      {/* Zones row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto 1fr auto auto',
          alignItems: 'center',
          gap: 18,
          marginBottom: 16,
        }}
        className="pipeline-teaser-row"
      >
        {/* Preprocessing — 3 nodes stacked vertically */}
        <ZoneGroup
          nodes={preprocessing}
          zone="preprocessing"
          activeZone={activeZone}
          reducedMotion={reducedMotion}
          layout="column"
        />

        <Arrow active={activeZone === 'preprocessing' || activeZone === 'analysis'} />

        {/* Analysis — 7 nodes in a 4x2 grid */}
        <ZoneGroup
          nodes={analysis}
          zone="analysis"
          activeZone={activeZone}
          reducedMotion={reducedMotion}
          layout="grid"
        />

        <Arrow active={activeZone === 'analysis' || activeZone === 'synthesis'} />

        {/* Synthesis — 2 nodes + DQI output */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ZoneGroup
            nodes={synthesis}
            zone="synthesis"
            activeZone={activeZone}
            reducedMotion={reducedMotion}
            layout="column"
          />
          <div
            style={{
              padding: '14px 12px',
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.slate900} 0%, ${C.slate700} 100%)`,
              color: C.white,
              textAlign: 'center',
              minWidth: 76,
              border: `1.5px solid ${C.green}`,
              boxShadow: activeZone === 'synthesis' && !reducedMotion ? `0 0 0 4px rgba(22,163,74,0.14)` : 'none',
              transition: 'box-shadow 0.4s',
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: C.green,
                marginBottom: 2,
              }}
            >
              output
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '-0.01em',
              }}
            >
              DQI
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 500,
                color: C.slate400,
                marginTop: 1,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              0–100 · A–F
            </div>
          </div>
        </div>
      </div>

      {/* Zone labels underneath */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto 1fr auto auto',
          alignItems: 'start',
          gap: 18,
          marginBottom: 18,
        }}
        className="pipeline-teaser-row"
      >
        <ZoneLabel
          number="01"
          title="Preprocessing"
          body="Redact · Structure · Contextualize"
          accent={ZONE_ACCENT.preprocessing}
          active={activeZone === 'preprocessing'}
        />
        <div />
        <ZoneLabel
          number="02"
          title="Analysis (parallel)"
          body="Seven specialized agents reason over the same shared context"
          accent={ZONE_ACCENT.analysis}
          active={activeZone === 'analysis'}
        />
        <div />
        <ZoneLabel
          number="03"
          title="Synthesis"
          body="Reconcile · Score deterministically"
          accent={ZONE_ACCENT.synthesis}
          active={activeZone === 'synthesis'}
        />
      </div>

      {/* Footer link */}
      <div
        style={{
          paddingTop: 14,
          borderTop: `1px dashed ${C.slate200}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 12, color: C.slate500 }}>
          Click any node on the full page to see what it does, what it produces, and which paper it cites.
        </span>
        <Link
          href="/how-it-works"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 999,
            background: C.slate900,
            color: C.white,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          See the full diagram <ArrowRight size={12} />
        </Link>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .pipeline-teaser-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

function ZoneGroup({
  nodes,
  zone,
  activeZone,
  reducedMotion,
  layout,
}: {
  nodes: PipelineNode[];
  zone: PipelineZone;
  activeZone: PipelineZone;
  reducedMotion: boolean;
  layout: 'column' | 'grid';
}) {
  const active = zone === activeZone;
  const accent = ZONE_ACCENT[zone];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          layout === 'grid'
            ? 'repeat(4, auto)'
            : '1fr',
        gap: 6,
        padding: 8,
        borderRadius: 12,
        background: active ? `${accent}0A` : 'transparent',
        border: `1px solid ${active ? `${accent}40` : 'transparent'}`,
        transition: 'background 0.4s, border-color 0.4s',
      }}
    >
      {nodes.map((n, i) => {
        const Icon = ICONS[n.iconName];
        return (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.3, delay: 0.05 + i * 0.035 }}
            title={`${n.label} — ${n.tagline}`}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: active ? accent : C.white,
              border: `1.4px solid ${active ? accent : C.slate200}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'background 0.4s, border-color 0.4s',
            }}
          >
            <Icon
              size={18}
              color={active ? C.white : accent}
              strokeWidth={2}
            />
            {active && !reducedMotion && (
              <motion.span
                aria-hidden
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: 12,
                  border: `1.5px solid ${accent}`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function Arrow({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="12"
      viewBox="0 0 22 12"
      aria-hidden
      style={{ opacity: active ? 1 : 0.55, transition: 'opacity 0.4s' }}
    >
      <path
        d="M 0 6 L 18 6 M 14 2 L 18 6 L 14 10"
        fill="none"
        stroke={active ? C.green : C.slate400}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZoneLabel({
  number,
  title,
  body,
  accent,
  active,
}: {
  number: string;
  title: string;
  body: string;
  accent: string;
  active: boolean;
}) {
  return (
    <div style={{ maxWidth: 220 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '0.12em',
          color: active ? accent : C.slate400,
          textTransform: 'uppercase',
          transition: 'color 0.4s',
        }}
      >
        {number} · {title}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: C.slate500,
          lineHeight: 1.45,
          marginTop: 2,
        }}
      >
        {body}
      </div>
    </div>
  );
}
