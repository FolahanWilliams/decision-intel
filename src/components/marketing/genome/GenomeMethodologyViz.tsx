'use client';

/**
 * GenomeMethodologyViz
 *
 * Four-step horizontal visualization of how the Bias Genome is derived —
 * from source documents through taxonomy extraction, pair-scoring via the
 * 20×20 interaction matrix, and per-pattern mitigation. A dashed return
 * arrow from step 4 back to step 1 shows the outcome-feedback loop that
 * recalibrates weights as real outcomes come back.
 *
 * Light theme, SVG + Framer Motion, respects prefers-reduced-motion.
 * Everything traces back to real methodology; no fabricated numbers.
 */

import { motion } from 'framer-motion';
import { FileText, Tag, Shield } from 'lucide-react';
import { useReducedMotion } from '@/components/marketing/how-it-works/useReducedMotion';

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
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245, 158, 11, 0.12)',
  red: '#DC2626',
  redSoft: 'rgba(220, 38, 38, 0.1)',
  violet: '#7C3AED',
  violetSoft: 'rgba(124, 58, 237, 0.1)',
};

interface StepProps {
  index: number;
  title: string;
  descriptor: string;
  children: React.ReactNode;
  reduced: boolean;
}

function Step({ index, title, descriptor, children, reduced }: StepProps) {
  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 14,
        padding: '20px 20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: 999,
            background: C.greenSoft,
            color: C.green,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          }}
        >
          {index + 1}
        </span>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: C.slate900,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
      </div>

      {/* Inline mini-viz */}
      <div
        style={{
          background: C.slate50,
          borderRadius: 10,
          padding: 14,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>

      <p
        style={{
          fontSize: 12.5,
          lineHeight: 1.55,
          color: C.slate600,
          margin: 0,
        }}
      >
        {descriptor}
      </p>
    </motion.div>
  );
}

/** Step 1 — Source documents. Stacked memo tiles with source-type chips. */
function SourceViz({ reduced }: { reduced: boolean }) {
  const chips = ['SEC', 'NTSB', 'FDA', 'Post-mortem'];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        width: '100%',
      }}
    >
      <div style={{ position: 'relative', width: 72, height: 56 }}>
        {[2, 1, 0].map(i => (
          <motion.div
            key={i}
            initial={reduced ? undefined : { opacity: 0, y: 6 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.12 * i }}
            style={{
              position: 'absolute',
              left: i * 6,
              top: i * 4,
              width: 56,
              height: 48,
              background: C.white,
              border: `1px solid ${C.slate300}`,
              borderRadius: 6,
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3 - i,
            }}
          >
            {i === 0 && <FileText size={18} color={C.slate500} />}
          </motion.div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        {chips.map(c => (
          <span
            key={c}
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: C.slate600,
              background: C.white,
              border: `1px solid ${C.slate200}`,
              padding: '2px 6px',
              borderRadius: 4,
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              letterSpacing: '0.04em',
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Step 2 — Extract biases. Funnel with tag chips emerging. */
function ExtractViz({ reduced }: { reduced: boolean }) {
  const tags = ['DI-B-003', 'DI-B-007', 'DI-B-012'];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        justifyContent: 'center',
      }}
    >
      <FileText size={20} color={C.slate400} style={{ flexShrink: 0 }} />
      <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden>
        <path
          d="M0 2 L16 2 M11 -2 L16 2 L11 6"
          transform="translate(0 5)"
          stroke={C.green}
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        {tags.map((t, i) => (
          <motion.span
            key={t}
            initial={reduced ? undefined : { opacity: 0, x: -8 }}
            whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              color: C.violet,
              background: C.violetSoft,
              border: `1px solid rgba(124, 58, 237, 0.22)`,
              padding: '2px 8px',
              borderRadius: 999,
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              letterSpacing: '0.02em',
            }}
          >
            <Tag size={9} />
            {t}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/** Step 3 — Interaction matrix. 8×8 grid with a handful of cells colored. */
function MatrixViz({ reduced }: { reduced: boolean }) {
  const gridSize = 8;
  const cell = 11;
  const gap = 2;
  // Deterministic "toxic" cell positions (mirrored — matrix is symmetric)
  const toxicCells = new Set([
    '1-3',
    '3-1',
    '2-5',
    '5-2',
    '4-6',
    '6-4',
    '0-7',
    '7-0',
    '3-4',
    '4-3',
  ]);
  const warmCells = new Set(['1-4', '4-1', '2-6', '6-2', '0-3', '3-0', '5-6', '6-5']);
  const cells: React.ReactElement[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const key = `${r}-${c}`;
      const isDiag = r === c;
      let fill = C.slate100;
      if (isDiag) fill = C.slate200;
      else if (toxicCells.has(key)) fill = C.red;
      else if (warmCells.has(key)) fill = C.amber;
      cells.push(
        <motion.rect
          key={key}
          x={c * (cell + gap)}
          y={r * (cell + gap)}
          width={cell}
          height={cell}
          rx={2}
          initial={reduced ? undefined : { opacity: 0 }}
          whileInView={reduced ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.3,
            delay: 0.02 * (r + c),
          }}
          fill={fill}
        />
      );
    }
  }
  const size = gridSize * cell + (gridSize - 1) * gap;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label="Interaction matrix"
      >
        {cells}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <LegendDot color={C.red} label="toxic" />
        <LegendDot color={C.amber} label="warm" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 9.5,
          color: C.slate600,
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
    </span>
  );
}

/** Step 4 — Mitigation. Pattern rows with shield checks. */
function MitigationViz({ reduced }: { reduced: boolean }) {
  const rows = [
    { name: 'Echo Chamber', color: C.red },
    { name: 'Sunk Ship', color: '#EA580C' },
    { name: 'Yes Committee', color: C.violet },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
      {rows.map((r, i) => (
        <motion.div
          key={r.name}
          initial={reduced ? undefined : { opacity: 0, x: 8 }}
          whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 6,
            padding: '5px 8px',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: r.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: C.slate700,
              flex: 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {r.name}
          </span>
          <Shield size={10} color={C.green} />
        </motion.div>
      ))}
    </div>
  );
}

export function GenomeMethodologyViz() {
  const reduced = useReducedMotion();

  const steps = [
    {
      title: '135 strategic decisions',
      descriptor:
        'Real, documented calls drawn from SEC filings, NTSB reports, FDA actions, and academic post-mortems. Every case cites its primary source.',
      viz: <SourceViz reduced={reduced} />,
    },
    {
      title: '30+ biases per case, mapped',
      descriptor:
        'The Decision Intel taxonomy (DI-B-001 through DI-B-020, plus eleven strategy-specific patterns) assigns biases to each case with an excerpt and an academic citation.',
      viz: <ExtractViz reduced={reduced} />,
    },
    {
      title: '20×20 interaction matrix',
      descriptor:
        'Every bias pair is scored against the others. Context amplifiers (stakes, dissent, time pressure) multiply the score; false-positive damping kicks in when a pattern fires but the outcome succeeds.',
      viz: <MatrixViz reduced={reduced} />,
    },
    {
      title: 'Targeted mitigation per pattern',
      descriptor:
        'Each toxic pattern gets a named playbook (a devil\u2019s advocate, a pre-mortem, a forced counterfactual). When real outcomes come back, the weights recalibrate on your own data.',
      viz: <MitigationViz reduced={reduced} />,
    },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <div className="genome-methodology-grid">
        {steps.map((s, i) => (
          <Step key={s.title} index={i} title={s.title} descriptor={s.descriptor} reduced={reduced}>
            {s.viz}
          </Step>
        ))}
      </div>

      {/* Feedback-loop footnote */}
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontSize: 12,
          color: C.slate500,
        }}
      >
        <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden>
          <path
            d="M2 7 C 2 2, 20 2, 20 7"
            stroke={C.green}
            strokeWidth="1.4"
            fill="none"
            strokeDasharray="3 3"
            strokeLinecap="round"
          />
          <path
            d="M5 5 L2 7 L5 9"
            stroke={C.green}
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          <strong style={{ color: C.slate700, fontWeight: 600 }}>Outcome loop.</strong> When a
          decision lands, its result flows back into step 3 — the interaction weights recalibrate on
          real data, not just the seed set.
        </span>
      </div>

      <style>{`
        .genome-methodology-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 1100px) {
          .genome-methodology-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 600px) {
          .genome-methodology-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
