'use client';

/**
 * CredibilityTrio — beat 06 (Security + Governance) on the landing page.
 *
 * Destinations (2026-04-21 refactor):
 *   - /security      — encryption, DPA, procurement posture
 *   - /bias-genome   — open taxonomy with failure-lift rankings
 *   - /how-it-works  — the pipeline, DQI components, counterfactuals
 *
 * Light theme. Zero external data deps — thumbnails are self-contained
 * SVG sketches. Case-library coverage stays on CaseStudyCarousel in beat 07;
 * this component is now the procurement-bar beat, not a generic "go deeper" rail.
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
    href: '/security',
    eyebrow: 'Security posture',
    title: 'Built for the procurement bar.',
    body: 'AES-256-GCM at rest, TLS 1.2+ in transit, key rotation with version stamps, a signed DPA on every paid tier — and no training on your content, by contract, not by promise.',
    cta: 'See security posture',
    thumb: 'security' as const,
  },
  {
    href: '/bias-genome',
    eyebrow: 'The taxonomy, openly published',
    title: 'Which biases most often precede failure.',
    body: '143 audited corporate decisions across thirteen industries / regions. 30+ cognitive biases ranked by failure lift. Every number traceable to the underlying case — methodology and data are open.',
    cta: 'Explore the Bias Genome',
    thumb: 'genome' as const,
  },
  {
    href: '/how-it-works',
    eyebrow: 'The reasoning, not a black box',
    title: 'Every model, every weight, every trace.',
    body: 'Every model, every weight, every trace — documented on one page. No black box, no mystery scoring, no vendored prompts. Check exactly what runs on your memo before a single line goes to the board.',
    cta: 'See how it works',
    thumb: 'howItWorks' as const,
  },
];

export function CredibilityTrio({ embedded = false }: { embedded?: boolean } = {}) {
  const Wrapper = embedded ? 'div' : 'section';
  return (
    <Wrapper
      style={
        embedded
          ? { margin: 0 }
          : {
              maxWidth: 1200,
              margin: '0 auto',
              padding: '80px 24px',
            }
      }
    >
      {!embedded && (
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
            The procurement bar
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800,
              color: C.slate900,
              marginBottom: 14,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Everything a Fortune 500 general counsel needs to sign off.
          </h2>
          <p style={{ fontSize: 17, color: C.slate600, margin: 0, maxWidth: 720, lineHeight: 1.6 }}>
            Security, open methodology, and a system that shows its work. Three pages &mdash; no
            login, no gate &mdash; covering every question your audit committee, general counsel,
            and CISO will bring to the first procurement call.
          </p>
        </div>
      )}

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
    </Wrapper>
  );
}

function Thumbnail({ variant }: { variant: 'security' | 'genome' | 'howItWorks' }) {
  return (
    <div
      style={{
        height: 132,
        background:
          variant === 'security'
            ? `linear-gradient(135deg, ${C.greenSoft} 0%, ${C.white} 100%)`
            : variant === 'genome'
              ? `linear-gradient(135deg, ${C.violetSoft} 0%, ${C.white} 100%)`
              : `linear-gradient(135deg, ${C.slate50} 0%, ${C.white} 100%)`,
        borderBottom: `1px solid ${C.slate200}`,
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      aria-hidden
    >
      {variant === 'security' && <SecurityThumb />}
      {variant === 'genome' && <GenomeThumb />}
      {variant === 'howItWorks' && <HowItWorksThumb />}
    </div>
  );
}

/** Security thumbnail: 3 lifecycle chips → locked vault at the end, AES-256-GCM
 *  badge anchoring the bottom row. Unchanged from the previous /privacy tile
 *  — the visual semantics are right for /security too. */
function SecurityThumb() {
  const chips = [
    { label: 'upload', x: 12 },
    { label: 'anon.', x: 62 },
    { label: 'analyze', x: 112 },
  ];
  return (
    <svg viewBox="0 0 240 96" width="100%" height="100%" style={{ maxHeight: 96 }}>
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
          <text x="16" y="10" fontSize="8" fill={C.slate700} fontWeight="600">
            {r.label}
          </text>
          <rect x="92" y="4" width="120" height="8" rx="4" fill={C.slate100} />
          <rect x="92" y="4" width={r.w * 1.4} height="8" rx="4" fill={r.tier} />
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

/** How-It-Works thumbnail: a compact 6-node pipeline with one node highlighted
 *  green (active), the rest in slate. Small "INSIDE THE SYSTEM" badge anchors
 *  the bottom. Abstracts the full /how-it-works PipelineFlowDiagram without
 *  copying its density. */
function HowItWorksThumb() {
  const nodes = [
    { x: 20, color: C.slate300 },
    { x: 54, color: C.slate300 },
    { x: 88, color: C.slate300 },
    { x: 122, color: C.green },
    { x: 156, color: C.slate300 },
    { x: 190, color: C.slate300 },
  ];
  return (
    <svg viewBox="0 0 240 96" width="100%" height="100%" style={{ maxHeight: 96 }}>
      {/* Flow rail */}
      <line x1="28" y1="40" x2="198" y2="40" stroke={C.slate200} strokeWidth="1.2" />
      {/* Arrows between nodes */}
      {nodes.slice(0, -1).map((n, i) => (
        <path
          key={`arrow-${i}`}
          d={`M ${n.x + 10} 40 L ${nodes[i + 1].x - 2} 40`}
          stroke={C.slate300}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      ))}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x + 6}
            cy="40"
            r={n.color === C.green ? 7 : 5.5}
            fill={n.color === C.green ? C.green : C.white}
            stroke={n.color === C.green ? C.green : C.slate400}
            strokeWidth="1.2"
          />
          {n.color === C.green && (
            <circle cx={n.x + 6} cy="40" r="11" fill="none" stroke={C.green} strokeOpacity="0.3" />
          )}
        </g>
      ))}
      {/* Input / output labels */}
      <text
        x="26"
        y="62"
        fontSize="7.5"
        fontWeight="700"
        fill={C.slate500}
        textAnchor="middle"
        fontFamily="var(--font-mono, monospace)"
        letterSpacing="0.04em"
      >
        MEMO
      </text>
      <text
        x="196"
        y="62"
        fontSize="7.5"
        fontWeight="700"
        fill={C.slate500}
        textAnchor="middle"
        fontFamily="var(--font-mono, monospace)"
        letterSpacing="0.04em"
      >
        DQI
      </text>
      {/* Badge */}
      <g transform="translate(79, 74)">
        <rect
          x="0"
          y="0"
          width="82"
          height="14"
          rx="7"
          fill={C.slate100}
          stroke={C.slate200}
          strokeWidth="1"
        />
        <text
          x="41"
          y="10"
          fontSize="7.5"
          fontWeight="700"
          fill={C.slate700}
          textAnchor="middle"
          fontFamily="var(--font-mono, monospace)"
          letterSpacing="0.04em"
        >
          INSIDE THE SYSTEM
        </text>
      </g>
    </svg>
  );
}
