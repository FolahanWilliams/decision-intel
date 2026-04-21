'use client';

import { motion } from 'framer-motion';

/**
 * NorthStarHero — top-of-page strip. Sets the ambition frame before
 * the reader drops into the memo + dashboards below.
 */
export function NorthStarHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        padding: '36px 36px 34px',
        borderRadius: 18,
        marginBottom: 28,
        background:
          'linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(14,165,233,0.06) 100%), var(--bg-card)',
        border: '1px solid var(--border-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Soft diagonal grid */}
      <svg
        aria-hidden
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none' }}
      >
        <defs>
          <pattern id="north-star-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="var(--border-primary)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#north-star-grid)" />
      </svg>

      <div style={{ position: 'relative' }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontFamily: 'var(--font-mono, monospace)',
            marginBottom: 14,
          }}
        >
          Unicorn roadmap &middot; north star
        </div>
        <h1
          style={{
            fontSize: 'clamp(26px, 3.8vw, 40px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            margin: 0,
            marginBottom: 18,
            maxWidth: 920,
          }}
        >
          Decision Intel becomes the reasoning infrastructure every board buys by 2030.
        </h1>
        <p
          style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            margin: 0,
            maxWidth: 760,
          }}
        >
          Category infrastructure, not a tool. Kahneman × Klein synthesis is the moat. Design
          Partner #1 by week 16. Pre-seed by Q4 2026. Series A at $2–5M ARR. Unicorn mark 2029–2030
          on the honest path — $5–10B ceiling if regulation triggers mandatory decision audit and
          you extend into clinical, litigation, and policy.
        </p>

        <div
          style={{
            marginTop: 26,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            maxWidth: 960,
          }}
        >
          <StatBlock label="Ceiling" value="$1–10B" sub="by 2030–2032" />
          <StatBlock label="Next 12w" value="DP #1" sub="paid pilot, advisor-sourced" />
          <StatBlock label="Moat" value="Kahneman × Klein" sub="only pipeline with both" />
          <StatBlock label="Failure mode #1" value="Staying solo" sub="co-founder by month 6" />
        </div>
      </div>
    </motion.div>
  );
}

function StatBlock({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontFamily: 'var(--font-mono, monospace)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.015em',
          lineHeight: 1.15,
          marginBottom: 2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '0.04em',
        }}
      >
        {sub}
      </div>
    </div>
  );
}
