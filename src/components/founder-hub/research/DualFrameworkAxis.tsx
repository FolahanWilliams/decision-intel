'use client';

import { motion } from 'framer-motion';
import { Scale, CheckCircle2 } from 'lucide-react';
import { DUAL_FRAMEWORK } from '@/lib/data/research-foundations';

// Visualizes the Kahneman ↔ Klein axis with Decision Intel as the synthesis.
// Left pole: structured debiasing (Kahneman). Right pole: expert intuition
// amplification (Klein). DI node sits in the middle with lines to both.

const VIEW_W = 720;
const VIEW_H = 260;

export function DualFrameworkAxis() {
  const k = DUAL_FRAMEWORK.kahneman;
  const g = DUAL_FRAMEWORK.klein;
  const syn = DUAL_FRAMEWORK.synthesis;

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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
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
          <Scale size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Kahneman ↔ Klein: the synthesis axis
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Two giants of decision science. Decision Intel sits where they agreed, not where they
            disagreed.
          </div>
        </div>
      </div>

      {/* Axis SVG */}
      <div style={{ width: '100%', overflowX: 'auto', marginBottom: 14 }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          style={{ width: '100%', minWidth: 520, height: 'auto', display: 'block' }}
        >
          <defs>
            <linearGradient id="axis-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="50%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          {/* Horizontal gradient bar */}
          <rect x={60} y={VIEW_H / 2 - 3} width={VIEW_W - 120} height={6} rx={3} fill="url(#axis-grad)" />

          {/* Left pole (Kahneman) */}
          <motion.g initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <circle cx={80} cy={VIEW_H / 2} r={34} fill="#0EA5E9" stroke="#fff" strokeWidth={2} />
            <text x={80} y={VIEW_H / 2 - 6} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">
              KAHNEMAN
            </text>
            <text x={80} y={VIEW_H / 2 + 8} textAnchor="middle" fontSize={9} fontWeight={600} fill="#fff" opacity={0.9}>
              1934–2024
            </text>
            <text
              x={80}
              y={VIEW_H / 2 - 58}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="#0EA5E9"
            >
              Structured debiasing
            </text>
            <text
              x={80}
              y={VIEW_H / 2 - 44}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-secondary)"
            >
              suppress the noise
            </text>
          </motion.g>

          {/* Right pole (Klein) */}
          <motion.g initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <circle cx={VIEW_W - 80} cy={VIEW_H / 2} r={34} fill="#F59E0B" stroke="#fff" strokeWidth={2} />
            <text x={VIEW_W - 80} y={VIEW_H / 2 - 6} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">
              KLEIN
            </text>
            <text
              x={VIEW_W - 80}
              y={VIEW_H / 2 + 8}
              textAnchor="middle"
              fontSize={9}
              fontWeight={600}
              fill="#fff"
              opacity={0.9}
            >
              RPD
            </text>
            <text
              x={VIEW_W - 80}
              y={VIEW_H / 2 - 58}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="#F59E0B"
            >
              Expert intuition
            </text>
            <text
              x={VIEW_W - 80}
              y={VIEW_H / 2 - 44}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-secondary)"
            >
              amplify the signal
            </text>
          </motion.g>

          {/* Center DI node */}
          <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <circle cx={VIEW_W / 2} cy={VIEW_H / 2} r={48} fill="#16A34A" stroke="#fff" strokeWidth={3} />
            <text
              x={VIEW_W / 2}
              y={VIEW_H / 2 - 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={800}
              fill="#fff"
            >
              DECISION
            </text>
            <text
              x={VIEW_W / 2}
              y={VIEW_H / 2 + 12}
              textAnchor="middle"
              fontSize={11}
              fontWeight={800}
              fill="#fff"
            >
              INTEL
            </text>
            <text
              x={VIEW_W / 2}
              y={VIEW_H / 2 - 72}
              textAnchor="middle"
              fontSize={12}
              fontWeight={800}
              fill="#16A34A"
            >
              Both, not either
            </text>
            <text
              x={VIEW_W / 2}
              y={VIEW_H / 2 - 56}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-secondary)"
            >
              the 2009 &ldquo;Failure to Disagree&rdquo; paper
            </text>
          </motion.g>

          {/* Quote band at bottom */}
          <text
            x={VIEW_W / 2}
            y={VIEW_H - 20}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-muted)"
            fontStyle="italic"
          >
            &ldquo;Suppress bias AND amplify intuition&rdquo; — the dual-framework sales line
          </text>
        </svg>
      </div>

      {/* Two detail columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <PoleCard
          label="KAHNEMAN POLE"
          pole={k.pole}
          book={k.book}
          thesis={k.thesis}
          items={k.diProduct}
          color="#0EA5E9"
        />
        <PoleCard
          label="KLEIN POLE"
          pole={g.pole}
          book={g.book}
          thesis={g.thesis}
          items={g.diProduct}
          color="#F59E0B"
        />
      </div>

      {/* Synthesis */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #16A34A',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#16A34A',
            marginBottom: 4,
          }}
        >
          {syn.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>{syn.body}</div>
      </div>
    </section>
  );
}

function PoleCard({
  label,
  pole,
  book,
  thesis,
  items,
  color,
}: {
  label: string;
  pole: string;
  book: string;
  thesis: string;
  items: string[];
  color: string;
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
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color,
          marginBottom: 4,
        }}
      >
        {label} · {pole}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 6 }}>
        {book}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          marginBottom: 8,
        }}
      >
        {thesis}
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        In Decision Intel
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(item => (
          <li
            key={item}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              fontSize: 11,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}
          >
            <CheckCircle2 size={12} style={{ color, flexShrink: 0, marginTop: 3 }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
