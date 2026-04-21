'use client';

/**
 * Moment 03 illustration — Human-AI reasoning audit.
 *
 * A strategic memo with three bias-annotation markers hanging off specific
 * lines. Each annotation is a small callout pointing at the memo text —
 * the "every flag traces to the exact line" proof point.
 */

import { motion } from 'framer-motion';

const C = {
  green: '#16A34A',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
  white: '#FFFFFF',
  amber: '#F59E0B',
  red: '#EF4444',
};

const LINES = [
  { y: 48, w: 190, flag: null as string | null },
  { y: 64, w: 220, flag: 'B1' },
  { y: 80, w: 170, flag: null },
  { y: 96, w: 210, flag: null },
  { y: 112, w: 200, flag: 'B2' },
  { y: 128, w: 180, flag: null },
  { y: 144, w: 160, flag: null },
  { y: 160, w: 190, flag: 'B3' },
  { y: 176, w: 200, flag: null },
  { y: 192, w: 150, flag: null },
];

const ANNOTATIONS = [
  { flag: 'B1', y: 64, title: 'Anchoring', severity: 'high', color: C.red },
  { flag: 'B2', y: 112, title: 'Confirmation', severity: 'med', color: C.amber },
  { flag: 'B3', y: 160, title: 'Overconfidence', severity: 'med', color: C.amber },
];

export function AuditTraceViz() {
  const memoX = 40;
  const memoW = 240;
  const memoY = 28;
  const memoH = 200;

  return (
    <svg
      viewBox="0 0 480 340"
      width="100%"
      height="100%"
      role="img"
      aria-label="Reasoning audit — three cognitive-bias flags traced to specific lines in a strategic memo"
    >
      {/* Memo card */}
      <rect
        x={memoX}
        y={memoY}
        width={memoW}
        height={memoH}
        rx="8"
        fill={C.white}
        stroke={C.slate200}
        strokeWidth="1.5"
      />
      {/* Memo header */}
      <rect x={memoX + 14} y={memoY + 12} width="82" height="4" rx="2" fill={C.slate700} />
      <rect x={memoX + 14} y={memoY + 20} width="46" height="2.5" rx="1.5" fill={C.slate400} />

      {/* Text lines */}
      {LINES.map((line, i) => {
        const isFlagged = !!line.flag;
        return (
          <motion.rect
            key={i}
            x={memoX + 14}
            y={memoY + line.y}
            width={line.w}
            height="3.5"
            rx="1.75"
            fill={isFlagged ? C.slate700 : C.slate200}
            initial={{ width: 0 }}
            whileInView={{ width: line.w }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.03 }}
          />
        );
      })}

      {/* Highlight bars over flagged lines */}
      {LINES.filter(l => l.flag).map(line => (
        <motion.rect
          key={`hi-${line.flag}`}
          x={memoX + 10}
          y={memoY + line.y - 3}
          width={line.w + 8}
          height="10"
          rx="2"
          fill="rgba(239,68,68,0.10)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        />
      ))}

      {/* Annotation callouts on the right */}
      {ANNOTATIONS.map((ann, i) => {
        const annX = 320;
        const annY = memoY + ann.y - 12;
        const lineEndX = memoX + memoW;
        const lineStartX = annX;
        return (
          <motion.g
            key={ann.flag}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.85 + i * 0.12 }}
          >
            {/* Connector line */}
            <line
              x1={lineEndX}
              y1={memoY + ann.y}
              x2={lineStartX}
              y2={annY + 16}
              stroke={ann.color}
              strokeWidth="1.2"
              strokeDasharray="2 3"
              strokeOpacity="0.6"
            />
            {/* Annotation card */}
            <rect
              x={annX}
              y={annY}
              width="120"
              height="32"
              rx="6"
              fill={C.white}
              stroke={ann.color}
              strokeWidth="1.4"
            />
            {/* Flag badge */}
            <rect x={annX + 6} y={annY + 6} width="22" height="12" rx="6" fill={ann.color} />
            <text
              x={annX + 17}
              y={annY + 15}
              fontSize="8"
              fontWeight="800"
              fill={C.white}
              textAnchor="middle"
              fontFamily="var(--font-mono, monospace)"
            >
              {ann.flag}
            </text>
            {/* Title */}
            <text
              x={annX + 34}
              y={annY + 15}
              fontSize="10"
              fontWeight="700"
              fill={C.slate900}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {ann.title}
            </text>
            {/* Severity label */}
            <text
              x={annX + 34}
              y={annY + 25}
              fontSize="7.5"
              fontWeight="700"
              fill={ann.color}
              fontFamily="var(--font-mono, monospace)"
              letterSpacing="0.04em"
            >
              {ann.severity === 'high' ? 'HIGH' : 'MEDIUM'} · TRACED
            </text>
          </motion.g>
        );
      })}

      {/* Footer badge: "every flag traces to a line" */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.4, delay: 1.3 }}
      >
        <rect x="140" y="260" width="200" height="24" rx="12" fill="rgba(22,163,74,0.1)" />
        <text
          x="240"
          y="276"
          fontSize="10"
          fontWeight="700"
          fill={C.green}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.06em"
        >
          EVERY FLAG TRACES TO A LINE
        </text>
      </motion.g>
    </svg>
  );
}
