'use client';

import { motion } from 'framer-motion';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  amber: '#F59E0B',
  amberLight: 'rgba(245, 158, 11, 0.12)',
  red: '#DC2626',
  redLight: 'rgba(220, 38, 38, 0.08)',
};

interface Persona {
  initials: string;
  role: string;
  priming: string;
  vote: 'APPROVE' | 'REJECT' | 'REVISE';
  rationale: string;
}

const PERSONAS: Persona[] = [
  {
    initials: 'CF',
    role: 'Skeptical CFO',
    priming: 'Capital discipline',
    vote: 'REVISE',
    rationale: 'Counter-case not stress-tested.',
  },
  {
    initials: 'CE',
    role: 'Ambitious CEO',
    priming: 'Growth bias',
    vote: 'APPROVE',
    rationale: 'Timing fits the cycle.',
  },
  {
    initials: 'BC',
    role: 'Board Chair',
    priming: 'Governance',
    vote: 'REVISE',
    rationale: 'Dissent absent from the memo.',
  },
  {
    initials: 'OP',
    role: 'Operator',
    priming: 'Execution risk',
    vote: 'REJECT',
    rationale: 'Delivery path undefined.',
  },
  {
    initials: 'CO',
    role: 'Compliance Officer',
    priming: 'Regulatory exposure',
    vote: 'APPROVE',
    rationale: 'Frameworks handled.',
  },
];

const VOTE_STYLE: Record<Persona['vote'], { color: string; bg: string }> = {
  APPROVE: { color: C.green, bg: C.greenLight },
  REJECT: { color: C.red, bg: C.redLight },
  REVISE: { color: C.amber, bg: C.amberLight },
};

export function BoardroomSimViz() {
  const votes = PERSONAS.reduce(
    (acc, p) => {
      acc[p.vote] = (acc[p.vote] ?? 0) + 1;
      return acc;
    },
    {} as Record<Persona['vote'], number>
  );
  const total = PERSONAS.length;
  const dissenters = total - (votes.APPROVE ?? 0);

  const verdict =
    (votes.APPROVE ?? 0) > total / 2
      ? 'APPROVED'
      : (votes.REJECT ?? 0) > total / 2
        ? 'REJECTED'
        : 'MIXED';
  const verdictColor =
    verdict === 'APPROVED' ? C.green : verdict === 'REJECTED' ? C.red : C.amber;

  return (
    <div
      style={{
        background: C.slate100,
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        padding: '24px 24px 22px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: C.slate400,
          marginBottom: 4,
        }}
      >
        Boardroom simulation · five role-primed personas
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: C.slate900,
          marginBottom: 16,
          letterSpacing: '-0.01em',
        }}
      >
        Would this memo survive the room?
      </div>

      {/* Personas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PERSONAS.map((p, i) => {
          const vStyle = VOTE_STYLE[p.vote];
          return (
            <motion.div
              key={p.role}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: 0.05 + i * 0.08, ease: 'easeOut' }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: 14,
                padding: '10px 14px',
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${C.slate900} 0%, ${C.slate700} 100%)`,
                  color: C.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.02em',
                  flexShrink: 0,
                }}
              >
                {p.initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.slate900 }}>{p.role}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    · {p.priming}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.slate500, marginTop: 2 }}>{p.rationale}</div>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: vStyle.bg,
                  color: vStyle.color,
                  letterSpacing: '0.05em',
                }}
              >
                {p.vote}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Consensus strip */}
      <div
        style={{
          marginTop: 16,
          padding: '14px 18px',
          background: C.white,
          border: `1px solid ${C.slate200}`,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.slate400,
            }}
          >
            Overall verdict
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: verdictColor,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.02em',
            }}
          >
            {verdict}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.slate600 }}>
          <span>
            <strong style={{ color: C.green, fontFamily: 'var(--font-mono, monospace)' }}>
              {votes.APPROVE ?? 0}
            </strong>
            <span style={{ marginLeft: 4 }}>approve</span>
          </span>
          <span>
            <strong style={{ color: C.amber, fontFamily: 'var(--font-mono, monospace)' }}>
              {votes.REVISE ?? 0}
            </strong>
            <span style={{ marginLeft: 4 }}>revise</span>
          </span>
          <span>
            <strong style={{ color: C.red, fontFamily: 'var(--font-mono, monospace)' }}>
              {votes.REJECT ?? 0}
            </strong>
            <span style={{ marginLeft: 4 }}>reject</span>
          </span>
          <span>
            <strong style={{ color: C.slate900, fontFamily: 'var(--font-mono, monospace)' }}>
              {dissenters}
            </strong>
            <span style={{ marginLeft: 4 }}>dissent tracked</span>
          </span>
        </div>
      </div>
    </div>
  );
}
