'use client';

/**
 * KahnemanKleinSynthesis — beat 04 of the landing-page narrative arc.
 *
 * Surfaces the IP moat: Decision Intel is the only platform that
 * operationalizes BOTH Kahneman's debiasing tradition AND Klein's
 * Recognition-Primed Decision tradition for the same decision-maker.
 * The 2009 Kahneman–Klein paper was famously titled "Conditions for
 * Intuitive Expertise: a failure to disagree." Decision Intel
 * settles that debate functionally.
 *
 * Voice: buyer-facing, not builder-facing. The viz centers the
 * decision-maker (the CSO/M&A lead/CorpStrategy head) — NOT the
 * internal pipeline nodes. Their blind spots get flagged on one side,
 * their expertise gets amplified on the other, and they still make
 * the call. No pipeline diagrams, no "metaJudge", no agent-speak.
 */

import { motion } from 'framer-motion';

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
  greenDark: '#15803D',
  greenLight: '#DCFCE7',
  greenSoft: 'rgba(22,163,74,0.12)',
  amber: '#D97706',
  amberSoft: 'rgba(217,119,6,0.08)',
  amberBorder: 'rgba(217,119,6,0.32)',
  blue: '#2563EB',
  blueSoft: 'rgba(37,99,235,0.08)',
  blueBorder: 'rgba(37,99,235,0.32)',
};

export function KahnemanKleinSynthesis() {
  return (
    <section
      id="synthesis"
      style={{
        background: C.slate50,
        borderTop: `1px solid ${C.slate200}`,
        borderBottom: `1px solid ${C.slate200}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '96px 24px',
        }}
      >
        <div
          className="synthesis-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 56,
            alignItems: 'center',
          }}
        >
          {/* Copy column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25, margin: '0px 0px -8% 0px' }}
            transition={{ duration: 0.55 }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                margin: 0,
                marginBottom: 14,
              }}
            >
              The Recognition-Rigor Framework &middot; R&sup2;F
            </p>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: C.slate900,
                letterSpacing: '-0.02em',
                lineHeight: 1.12,
                margin: 0,
                marginBottom: 22,
              }}
            >
              The only platform that runs both halves of the decision stack &mdash;{' '}
              <span style={{ color: C.green }}>debiasing</span> and{' '}
              <span style={{ color: C.green }}>Recognition-Primed Decision</span> &mdash; in one
              pipeline.
            </h2>
            <p
              style={{
                fontSize: 16.5,
                color: C.slate600,
                lineHeight: 1.7,
                margin: 0,
                marginBottom: 18,
                maxWidth: 520,
              }}
            >
              For fifteen years Daniel Kahneman and Gary Klein ran the two opposing traditions of
              decision science. One argued your intuition fools you; the other that it&rsquo;s your
              sharpest tool. Their 2009 paper was famously titled{' '}
              <em style={{ fontStyle: 'italic', color: C.slate700 }}>
                &ldquo;Conditions for Intuitive Expertise: a failure to disagree.&rdquo;
              </em>
            </p>
            <p
              style={{
                fontSize: 16.5,
                color: C.slate600,
                lineHeight: 1.7,
                margin: 0,
                marginBottom: 18,
                maxWidth: 520,
              }}
            >
              We call the synthesis the{' '}
              <strong style={{ color: C.slate900, fontWeight: 700 }}>
                Recognition-Rigor Framework
              </strong>
              &nbsp;&mdash;&nbsp;Klein&rsquo;s recognition plus Kahneman&rsquo;s rigor, arbitrated
              in a single pipeline. No other vendor in the decision-quality space combines both
              traditions.
            </p>
            <p
              style={{
                fontSize: 16.5,
                color: C.slate600,
                lineHeight: 1.7,
                margin: 0,
                maxWidth: 520,
              }}
            >
              Decision Intel settles the debate the way an operator would. The patterns you&rsquo;ve
              earned over twenty years of reps get amplified. The blind spots you can&rsquo;t see
              get flagged. Your judgment stays in the centre, now reinforced from both
              sides&nbsp;&mdash; never replaced.
            </p>
          </motion.div>

          {/* Viz column */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.25, margin: '0px 0px -8% 0px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ minWidth: 0 }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 540,
                aspectRatio: '480 / 340',
                margin: '0 auto',
              }}
            >
              <DualCardComposition />
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .synthesis-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DualCardComposition — refined enterprise-style composition.

   Replaces the earlier chip-converging-on-silhouette viz with two
   proper analysis panels (like real product cards) + a quiet central
   green pivot + one editorial line at the bottom.

   Design principles:
     · generous whitespace inside each card
     · tight mono for labels; clean sans for titles
     · single accent per card (amber left, blue right)
     · subtle shadow + 1px slate border — no heavy fills
     · the central pivot is a small glyph (halo + ring + dot), not a
       cartoon person; the reader is addressed in the bottom line only
     · no "FLAGGED / SURFACED" shouting tags overlapping names —
       each row gets a discreet right-edge pill with generous padding
   ═══════════════════════════════════════════════════════════════════ */

type RowItem = {
  name: string;
  status: string;
};

const KAHNEMAN_ITEMS: RowItem[] = [
  { name: 'Overconfidence', status: 'flagged' },
  { name: 'Sunk cost', status: 'flagged' },
  { name: 'Anchoring', status: 'flagged' },
];

const KLEIN_ITEMS: RowItem[] = [
  { name: 'Pattern match', status: 'surfaced' },
  { name: 'Prior reps', status: 'surfaced' },
  { name: 'Weak signal', status: 'surfaced' },
];

function DualCardComposition() {
  // Card geometry — two panels with a 96px central gap for the pivot
  const cardW = 176;
  const cardH = 224;
  const leftCardX = 16;
  const leftCardY = 48;
  const rightCardX = 288;
  const rightCardY = 48;
  const cardPadding = 14;
  const pivotX = 240;
  const pivotY = leftCardY + cardH / 2; // 160

  const rowYs = [126, 156, 186]; // inside cards, relative to viewBox y

  return (
    <svg
      viewBox="0 0 480 340"
      width="100%"
      height="100%"
      role="img"
      aria-label="Two analysis panels — Kahneman's debiasing on the left, Klein's Recognition-Primed Decision on the right — converge on a single central decision point"
    >
      <defs>
        <radialGradient id="pivot-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.24" />
          <stop offset="60%" stopColor={C.green} stopOpacity="0.08" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="edge-left-line" x1="0%" x2="100%" y1="50%" y2="50%">
          <stop offset="0%" stopColor={C.amber} stopOpacity="0.5" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="edge-right-line" x1="0%" x2="100%" y1="50%" y2="50%">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.9" />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0.5" />
        </linearGradient>
        {/* Soft card shadow via filter — renders once, references by url */}
        <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#0F172A" floodOpacity="0.04" />
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0F172A" floodOpacity="0.035" />
        </filter>
      </defs>

      {/* ───────── Left card (Kahneman) ───────── */}
      <motion.g
        initial={{ opacity: 0, x: -12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: false, amount: 0.25 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <rect
          x={leftCardX}
          y={leftCardY}
          width={cardW}
          height={cardH}
          rx="14"
          fill={C.white}
          stroke={C.slate200}
          strokeWidth="1"
          filter="url(#card-shadow)"
        />
        {/* Subtle amber accent strip on the outer (left) edge */}
        <rect
          x={leftCardX}
          y={leftCardY + 48}
          width="2.5"
          height={cardH - 96}
          rx="1.25"
          fill={C.amber}
          opacity="0.55"
        />

        {/* Eyebrow row: category label */}
        <g transform={`translate(${leftCardX + cardPadding}, ${leftCardY + 24})`}>
          <circle cx="4" cy="0" r="4" fill={C.amber} opacity="0.9" />
          <text
            x="14"
            y="3"
            fontSize="9.5"
            fontWeight="800"
            fill={C.slate600}
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="0.14em"
          >
            KAHNEMAN
          </text>
          {/* Divider dot and Bias Layer microlabel */}
          <text
            x={cardW - cardPadding * 2 - 8}
            y="3"
            fontSize="8.5"
            fontWeight="700"
            fill={C.slate400}
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="0.1em"
            textAnchor="end"
          >
            BIAS LAYER
          </text>
        </g>

        {/* Title */}
        <text
          x={leftCardX + cardPadding}
          y={leftCardY + 56}
          fontSize="15"
          fontWeight="800"
          fill={C.slate900}
          letterSpacing="-0.015em"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Intuition protected
        </text>

        {/* Divider */}
        <line
          x1={leftCardX + cardPadding}
          y1={leftCardY + 68}
          x2={leftCardX + cardW - cardPadding}
          y2={leftCardY + 68}
          stroke={C.slate200}
          strokeWidth="1"
        />

        {/* Item rows */}
        {KAHNEMAN_ITEMS.map((item, i) => (
          <motion.g
            key={item.name}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{
              duration: 0.4,
              delay: 0.35 + i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <RowEntry
              cardX={leftCardX}
              cardW={cardW}
              cardPadding={cardPadding}
              rowY={rowYs[i]}
              dotColor={C.amber}
              dotFill={C.amberSoft}
              name={item.name}
              status={item.status}
              statusColor={C.amber}
              statusBg={C.amberSoft}
            />
          </motion.g>
        ))}

        {/* Footer summary */}
        <text
          x={leftCardX + cardPadding}
          y={leftCardY + cardH - 18}
          fontSize="9.5"
          fontWeight="700"
          fill={C.slate400}
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.08em"
        >
          3 BIASES SUPPRESSED
        </text>
      </motion.g>

      {/* ───────── Right card (Klein) ───────── */}
      <motion.g
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: false, amount: 0.25 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <rect
          x={rightCardX}
          y={rightCardY}
          width={cardW}
          height={cardH}
          rx="14"
          fill={C.white}
          stroke={C.slate200}
          strokeWidth="1"
          filter="url(#card-shadow)"
        />
        {/* Blue accent strip on the outer (right) edge */}
        <rect
          x={rightCardX + cardW - 2.5}
          y={rightCardY + 48}
          width="2.5"
          height={cardH - 96}
          rx="1.25"
          fill={C.blue}
          opacity="0.55"
        />

        {/* Eyebrow row: category label */}
        <g transform={`translate(${rightCardX + cardPadding}, ${rightCardY + 24})`}>
          <text
            x="0"
            y="3"
            fontSize="8.5"
            fontWeight="700"
            fill={C.slate400}
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="0.1em"
          >
            EXPERTISE LAYER
          </text>
          <text
            x={cardW - cardPadding * 2 - 10}
            y="3"
            fontSize="9.5"
            fontWeight="800"
            fill={C.slate600}
            fontFamily="var(--font-mono, monospace)"
            letterSpacing="0.14em"
            textAnchor="end"
          >
            KLEIN
          </text>
          <circle cx={cardW - cardPadding * 2} cy="0" r="4" fill={C.blue} opacity="0.9" />
        </g>

        {/* Title */}
        <text
          x={rightCardX + cardPadding}
          y={rightCardY + 56}
          fontSize="15"
          fontWeight="800"
          fill={C.slate900}
          letterSpacing="-0.015em"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Intuition amplified
        </text>

        {/* Divider */}
        <line
          x1={rightCardX + cardPadding}
          y1={rightCardY + 68}
          x2={rightCardX + cardW - cardPadding}
          y2={rightCardY + 68}
          stroke={C.slate200}
          strokeWidth="1"
        />

        {/* Item rows */}
        {KLEIN_ITEMS.map((item, i) => (
          <motion.g
            key={item.name}
            initial={{ opacity: 0, x: 8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{
              duration: 0.4,
              delay: 0.42 + i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <RowEntry
              cardX={rightCardX}
              cardW={cardW}
              cardPadding={cardPadding}
              rowY={rowYs[i]}
              dotColor={C.blue}
              dotFill={C.blueSoft}
              name={item.name}
              status={item.status}
              statusColor={C.blue}
              statusBg={C.blueSoft}
              indicatorShape="arrow-up"
            />
          </motion.g>
        ))}

        {/* Footer summary */}
        <text
          x={rightCardX + cardW - cardPadding}
          y={rightCardY + cardH - 18}
          fontSize="9.5"
          fontWeight="700"
          fill={C.slate400}
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.08em"
          textAnchor="end"
        >
          3 PATTERNS AMPLIFIED
        </text>
      </motion.g>

      {/* ───────── Convergent lines into central pivot ───────── */}
      <motion.line
        x1={leftCardX + cardW}
        y1={pivotY}
        x2={pivotX - 22}
        y2={pivotY}
        stroke="url(#edge-left-line)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.line
        x1={pivotX + 22}
        y1={pivotY}
        x2={rightCardX}
        y2={pivotY}
        stroke="url(#edge-right-line)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.7, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* ───────── Central pivot (green halo + ring + dot) ─────────
         Deliberately minimal. No cartoon silhouette, no "YOU" label —
         the pivot is a visual anchor; the editorial line below names
         the reader. Pulse ring signals "live". */}
      <motion.g
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.55, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <circle cx={pivotX} cy={pivotY} r="34" fill="url(#pivot-glow)" />
        <circle
          cx={pivotX}
          cy={pivotY}
          r="22"
          fill={C.white}
          stroke={C.green}
          strokeWidth="1.5"
        />
        <circle cx={pivotX} cy={pivotY} r="6" fill={C.green} />
        <motion.circle
          cx={pivotX}
          cy={pivotY}
          r="22"
          fill="none"
          stroke={C.green}
          strokeWidth="1.4"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
        />
      </motion.g>

      {/* ───────── Bottom editorial line ───────── */}
      <motion.g
        initial={{ opacity: 0, y: 4 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 1.3 }}
      >
        <text
          x="240"
          y="312"
          fontSize="13"
          fontWeight="600"
          fill={C.slate600}
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontStyle="italic"
        >
          Your call &mdash; reinforced by both traditions.
        </text>
      </motion.g>
    </svg>
  );
}

/* ─── RowEntry: a single item row inside a card. Precisely laid out
   with a leading indicator (dot or tiny arrow), the item name in sans,
   and a small right-edge pill carrying the status. The pill has its
   own generous horizontal padding so "flagged" / "surfaced" can never
   collide with the item text — this was the collision bug in the prior
   design. */

function RowEntry({
  cardX,
  cardW,
  cardPadding,
  rowY,
  dotColor,
  dotFill,
  name,
  status,
  statusColor,
  statusBg,
  indicatorShape = 'dot',
}: {
  cardX: number;
  cardW: number;
  cardPadding: number;
  rowY: number;
  dotColor: string;
  dotFill: string;
  name: string;
  status: string;
  statusColor: string;
  statusBg: string;
  indicatorShape?: 'dot' | 'arrow-up';
}) {
  const indicatorX = cardX + cardPadding + 6;
  const nameX = cardX + cardPadding + 20;
  const pillW = 52;
  const pillH = 16;
  const pillX = cardX + cardW - cardPadding - pillW;
  const pillY = rowY - pillH / 2;

  return (
    <g>
      {/* Indicator */}
      {indicatorShape === 'dot' && (
        <>
          <circle cx={indicatorX} cy={rowY} r="6" fill={dotFill} />
          <circle cx={indicatorX} cy={rowY} r="3" fill={dotColor} />
        </>
      )}
      {indicatorShape === 'arrow-up' && (
        <g transform={`translate(${indicatorX}, ${rowY})`}>
          <circle cx="0" cy="0" r="6" fill={dotFill} />
          <path
            d="M -3 1.5 L 0 -2 L 3 1.5"
            stroke={dotColor}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Item name */}
      <text
        x={nameX}
        y={rowY + 3.5}
        fontSize="11.5"
        fontWeight="600"
        fill={C.slate700}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {name}
      </text>

      {/* Status pill — generous padding ensures no overlap with name */}
      <rect
        x={pillX}
        y={pillY}
        width={pillW}
        height={pillH}
        rx={pillH / 2}
        fill={statusBg}
        stroke={`${statusColor}`}
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />
      <text
        x={pillX + pillW / 2}
        y={pillY + pillH / 2 + 3}
        fontSize="8.5"
        fontWeight="800"
        fill={statusColor}
        textAnchor="middle"
        fontFamily="var(--font-mono, monospace)"
        letterSpacing="0.06em"
      >
        {status.toUpperCase()}
      </text>
    </g>
  );
}
