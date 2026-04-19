'use client';

/**
 * CredibilityTrio
 *
 * Landing-page "go deeper" rail surfacing the three most integral
 * exploration destinations as a clean horizontal trio, each with a
 * purpose-built SVG thumbnail and a CTA to the full sub-page:
 *   - /case-studies  — the 135-case library
 *   - /bias-genome   — which biases most often precede failure
 *   - /security      — enterprise security posture
 *
 * Light theme. Zero external data deps — thumbnails are self-contained
 * SVG sketches.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

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
  greenLight: '#DCFCE7',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
  red: '#DC2626',
  amber: '#F59E0B',
  violet: '#7C3AED',
  violetSoft: 'rgba(124, 58, 237, 0.08)',
};

const CARDS = [
  {
    href: '/case-studies',
    eyebrow: 'Case library',
    title: '135 audited corporate decisions, open for review.',
    body: 'Thirteen industries of strategic calls \u2014 successful and failed \u2014 each scored against the same bias taxonomy. The source documents are public, so every conclusion is checkable.',
    cta: 'Browse the library',
    thumb: 'proof' as const,
  },
  {
    href: '/bias-genome',
    eyebrow: 'Across 135 decisions',
    title: 'Which biases most often precede failure.',
    body: 'Every bias in the taxonomy is ranked by how often it appears in failed strategic decisions, across the full case library and thirteen industries. Methodology and data are open.',
    cta: 'See the rankings',
    thumb: 'genome' as const,
  },
  {
    href: '/security',
    eyebrow: 'Security posture',
    title: 'Enterprise-grade protection on every strategic memo.',
    body: 'SOC 2 ready, AES-256-GCM at rest, TLS 1.3 in transit, GDPR anonymization before any model sees your text, EU AI Act mapped, and no training on your content \u2014 ever, by contract.',
    cta: 'See the posture',
    thumb: 'privacy' as const,
  },
];

export function CredibilityTrio() {
  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 24px',
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: C.green,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            marginBottom: 10,
          }}
        >
          Go deeper
        </div>
        <h2
          style={{
            fontSize: 'clamp(26px, 3.6vw, 34px)',
            fontWeight: 800,
            color: C.slate900,
            marginBottom: 12,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Three pages. Everything this site claims, checkable.
        </h2>
        <p style={{ fontSize: 16, color: C.slate600, margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
          The full case library, the bias-failure rankings, and the security posture on your
          documents. Every claim on this site traces back to one of these pages.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
        }}
        className="credibility-trio-grid"
      >
        {CARDS.map((card, i) => (
          <motion.div
            key={card.href}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: 0.05 + i * 0.08 }}
          >
            <Link
              href={card.href}
              className="credibility-trio-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 20,
                padding: 0,
                overflow: 'hidden',
                textDecoration: 'none',
                color: C.slate900,
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.03)',
                height: '100%',
              }}
            >
              <Thumbnail variant={card.thumb} />
              <div
                style={{
                  padding: '24px 24px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: C.green,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {card.eyebrow}
                </div>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    color: C.slate900,
                    lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: C.slate600,
                    lineHeight: 1.55,
                    flex: 1,
                  }}
                >
                  {card.body}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: C.green,
                    fontSize: 13,
                    fontWeight: 700,
                    marginTop: 6,
                  }}
                >
                  {card.cta} <ArrowUpRight size={14} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <style>{`
        .credibility-trio-card:hover {
          transform: translateY(-3px);
          border-color: ${C.greenBorder} !important;
          box-shadow: 0 4px 12px rgba(15,23,42,0.06), 0 16px 32px rgba(15,23,42,0.05) !important;
        }
        @media (max-width: 900px) {
          .credibility-trio-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function Thumbnail({ variant }: { variant: 'proof' | 'genome' | 'privacy' }) {
  return (
    <div
      style={{
        height: 132,
        background:
          variant === 'proof'
            ? `linear-gradient(135deg, ${C.slate50} 0%, ${C.white} 100%)`
            : variant === 'genome'
              ? `linear-gradient(135deg, ${C.violetSoft} 0%, ${C.white} 100%)`
              : `linear-gradient(135deg, ${C.greenSoft} 0%, ${C.white} 100%)`,
        borderBottom: `1px solid ${C.slate200}`,
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      aria-hidden
    >
      {variant === 'proof' && <ProofThumb />}
      {variant === 'genome' && <GenomeThumb />}
      {variant === 'privacy' && <PrivacyThumb />}
    </div>
  );
}

/** Proof thumbnail: stylized memo with 3 numbered red flags and an outcome
 *  tick — all inline INSIDE the memo bounds so nothing reads as bleeding
 *  off the page. Memo widened to x=30..210 to give the flag column and the
 *  tick room to sit in the left/top-right margins without overlapping copy. */
function ProofThumb() {
  const memoX = 30;
  const memoY = 8;
  const memoW = 180;
  const flagX = memoX + 12; // flag column sits inside the memo's left margin
  const textX = memoX + 28; // text copy starts after the flag column
  return (
    <svg viewBox="0 0 240 96" width="100%" height="100%" style={{ maxHeight: 96 }}>
      {/* Memo card */}
      <rect
        x={memoX}
        y={memoY}
        width={memoW}
        height="80"
        rx="6"
        fill={C.white}
        stroke={C.slate300}
        strokeWidth="1"
      />
      {/* Memo header line */}
      <rect x={textX} y="18" width="72" height="4" rx="2" fill={C.slate700} />
      {/* Text lines */}
      {[30, 40, 50, 60, 70].map((y, i) => (
        <rect
          key={i}
          x={textX}
          y={y}
          width={i === 2 ? 118 : i === 4 ? 86 : 126}
          height="3"
          rx="1.5"
          fill={C.slate200}
        />
      ))}
      {/* Red-flag markers — INSIDE the memo's left margin */}
      {[
        { cx: flagX, cy: 32, n: '1' },
        { cx: flagX, cy: 50, n: '2' },
        { cx: flagX, cy: 66, n: '3' },
      ].map(f => (
        <g key={f.n}>
          <circle cx={f.cx} cy={f.cy} r="7" fill={C.red} />
          <text
            x={f.cx}
            y={f.cy + 2.5}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill={C.white}
            fontFamily="var(--font-mono, monospace)"
          >
            {f.n}
          </text>
        </g>
      ))}
      {/* Outcome tick — INSIDE the memo's top-right corner */}
      <g transform={`translate(${memoX + memoW - 20}, ${memoY + 12})`}>
        <circle cx="0" cy="0" r="7.5" fill={C.green} />
        <path
          d="M -3.2 0 L -0.6 2.5 L 3.4 -2.2"
          stroke={C.white}
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Genome thumbnail: mini leaderboard with 4 bars decreasing. */
function GenomeThumb() {
  const rows = [
    { label: 'Confirmation', w: 84, tier: C.red },
    { label: 'Optimism', w: 68, tier: C.amber },
    { label: 'Groupthink', w: 52, tier: C.amber },
    { label: 'Anchoring', w: 36, tier: C.slate400 },
  ];
  return (
    <svg viewBox="0 0 240 96" width="100%" height="100%" style={{ maxHeight: 96 }}>
      {rows.map((r, i) => (
        <g key={i} transform={`translate(14, ${10 + i * 20})`}>
          {/* Rank number */}
          <text
            x="0"
            y="10"
            fontSize="8"
            fontWeight="700"
            fill={C.slate500}
            fontFamily="var(--font-mono, monospace)"
          >
            0{i + 1}
          </text>
          {/* Label */}
          <text x="16" y="10" fontSize="8" fill={C.slate700} fontWeight="600">
            {r.label}
          </text>
          {/* Bar background */}
          <rect x="92" y="4" width="120" height="8" rx="4" fill={C.slate100} />
          {/* Bar fill */}
          <rect x="92" y="4" width={r.w * 1.4} height="8" rx="4" fill={r.tier} />
          {/* Value pill */}
          <text
            x="218"
            y="10"
            fontSize="8"
            fontWeight="700"
            fill={C.slate900}
            fontFamily="var(--font-mono, monospace)"
            textAnchor="end"
          >
            ×{(2.4 - i * 0.35).toFixed(1)}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Privacy thumbnail: 4 lifecycle chips → locked vault at the end. */
function PrivacyThumb() {
  const chips = [
    { label: 'upload', x: 12 },
    { label: 'anon.', x: 62 },
    { label: 'analyze', x: 112 },
  ];
  return (
    <svg viewBox="0 0 240 96" width="100%" height="100%" style={{ maxHeight: 96 }}>
      {/* Flow line */}
      <line
        x1="30"
        y1="48"
        x2="190"
        y2="48"
        stroke={C.green}
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      {chips.map((c, i) => (
        <g key={c.label}>
          <rect
            x={c.x}
            y="34"
            width="40"
            height="28"
            rx="6"
            fill={C.white}
            stroke={C.green}
            strokeWidth="1.2"
          />
          <text
            x={c.x + 20}
            y="51"
            fontSize="8"
            fontWeight="700"
            fill={C.slate900}
            textAnchor="middle"
            fontFamily="var(--font-mono, monospace)"
          >
            {c.label}
          </text>
          {/* Arrow between chips */}
          {i < chips.length - 1 && (
            <path
              d={`M ${c.x + 44} 48 L ${c.x + 50} 48`}
              stroke={C.green}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}
        </g>
      ))}
      {/* Vault lock (end) */}
      <g transform="translate(166, 28)">
        <rect
          x="0"
          y="8"
          width="40"
          height="40"
          rx="8"
          fill={C.green}
          stroke={C.green}
          strokeWidth="1"
        />
        {/* Lock icon */}
        <path
          d="M14 20 V16 Q14 12 20 12 Q26 12 26 16 V20"
          stroke={C.white}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="11" y="20" width="18" height="14" rx="2" fill={C.white} />
        <circle cx="20" cy="27" r="2.4" fill={C.green} />
      </g>
      {/* Badge: AES-256 */}
      <g transform="translate(112, 74)">
        <rect x="0" y="0" width="62" height="14" rx="7" fill={C.greenSoft} stroke={C.greenBorder} />
        <text
          x="31"
          y="10"
          fontSize="7.5"
          fontWeight="700"
          fill={C.green}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.04em"
        >
          AES-256-GCM
        </text>
      </g>
    </svg>
  );
}
