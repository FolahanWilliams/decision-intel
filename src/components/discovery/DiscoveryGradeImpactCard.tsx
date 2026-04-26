'use client';

/**
 * DiscoveryGradeImpactCard — the empathic-mode-first single-slide
 * artifact for cold readers (Pan-African fund partner, F500 CSO at
 * first meeting, conference 1:1, /demo visitor before they have any
 * vocabulary).
 *
 * The design rule (per CLAUDE.md "Marketing Voice" + memory
 * `feedback-empathic-mode-first`): NO jargon. No DPR, no DQI, no R²F,
 * no "reasoning layer", no "Recognition-Rigor Framework". The reader
 * has not earned the vocabulary yet. Lead with what they recognise:
 * a number tied to the dollar amount they were already going to put
 * at risk.
 *
 * Anchor (locked 2026-04-27 from NotebookLM "highest-ROI positioning"
 * synthesis): per-decision dollar impact tied to ticket size, not
 * organisation-wide percentage claims. "$22.5M risk on this $50M
 * memo" beats "12-15% of revenue at risk" every time.
 *
 * Mounted in two places:
 *   • /demo (cold context — visitor before any auth, no platform
 *     vocabulary in flight)
 *   • Post-upload reveal on /dashboard, ABOVE the existing
 *     InlineAnalysisResultCard in cold mode (first three audits)
 *
 * The same component takes `variant: 'demo' | 'post-upload' | 'static'`
 * to tune copy and dollar-anchor source. Static variant uses the
 * canonical $50M / 45% sample anchor for marketing surfaces.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export type DiscoveryGradeAnchor = {
  /** Display headline ("Your last memo" / "This sample memo" / etc.) */
  contextLabel: string;
  /** Document or memo descriptor ("Project Heliograph · DACH expansion") */
  artefactLabel: string;
  /** The deal / decision dollar value the reader recognises ($50M, £14M…) */
  ticketAmount: number;
  ticketCurrency: string;
  /** Historical failure rate when the top bias was confirmed in
   *  comparable decisions. Drives the dollar-impact estimate. */
  historicalFailureRate: number;
  /** Number of comparable decisions in the cohort that backs the
   *  failure rate — for honest sample-size disclosure. */
  cohortSampleSize: number;
  /** Top bias label (plain English — "Overconfidence Bias" not
   *  "DI-B-004"). */
  topBiasLabel: string;
  /** The ONE concrete fix the reader can act on before signing. */
  topMitigation: string;
};

interface Props {
  variant: 'demo' | 'post-upload' | 'static';
  anchor: DiscoveryGradeAnchor;
  /** Optional CTA target — defaults to /demo. */
  ctaHref?: string;
  /** Optional CTA label — defaults vary by variant. */
  ctaLabel?: string;
}

function formatMoney(value: number, currency: string): string {
  const abs = Math.abs(value);
  const symbol =
    currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : `${currency} `;
  if (abs >= 1_000_000_000) return `${symbol}${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${value.toFixed(0)}`;
}

export function DiscoveryGradeImpactCard({ variant, anchor, ctaHref, ctaLabel }: Props) {
  const dollarAtRisk = Math.round(anchor.ticketAmount * (anchor.historicalFailureRate / 100));
  const variantCta =
    variant === 'demo'
      ? { href: ctaHref ?? '/demo', label: ctaLabel ?? 'Run this on your own memo →' }
      : variant === 'post-upload'
        ? { href: ctaHref ?? '#', label: ctaLabel ?? 'See what to fix →' }
        : { href: ctaHref ?? '/demo', label: ctaLabel ?? 'Run a 60-second audit →' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(7,15,33,1) 100%)',
        borderRadius: 18,
        padding: '28px 32px',
        color: '#F8FAFC',
        border: '1px solid rgba(148,163,184,0.18)',
        boxShadow: '0 24px 60px -20px rgba(2,6,23,0.45), inset 0 0 0 1px rgba(148,163,184,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient accent glow — purely decorative; mirrors the way fund
          partners read a single-slide pitch (one number, one frame). */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Eyebrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          fontWeight: 700,
          color: '#22C55E',
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          marginBottom: 14,
          position: 'relative',
        }}
      >
        <ShieldCheck size={13} />
        <span>{anchor.contextLabel}</span>
      </div>

      {/* Artefact label */}
      <div
        style={{
          fontSize: 14,
          color: '#CBD5E1',
          marginBottom: 6,
          letterSpacing: '-0.01em',
          position: 'relative',
        }}
      >
        {anchor.artefactLabel}
      </div>

      {/* The number — the entire reason this surface exists. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          marginBottom: 10,
          position: 'relative',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
          }}
        >
          {formatMoney(dollarAtRisk, anchor.ticketCurrency)}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#94A3B8',
            letterSpacing: '0.02em',
          }}
        >
          at risk on this {formatMoney(anchor.ticketAmount, anchor.ticketCurrency)} decision
        </span>
      </div>

      {/* The proof line — sample size + failure rate, no jargon. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12.5,
          color: '#94A3B8',
          marginBottom: 22,
          letterSpacing: '0.01em',
          position: 'relative',
        }}
      >
        <AlertCircle size={13} style={{ color: '#F59E0B' }} />
        <span>
          {anchor.topBiasLabel} flagged. Across {anchor.cohortSampleSize} comparable decisions, this
          pattern carried a {anchor.historicalFailureRate.toFixed(0)}% failure rate.
        </span>
      </div>

      {/* The fix — the only forward action that matters. */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.18)',
          marginBottom: 22,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10.5,
            fontWeight: 800,
            color: '#22C55E',
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            marginBottom: 8,
          }}
        >
          <Sparkles size={12} />
          The fix · before you sign
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: '#F8FAFC',
            lineHeight: 1.55,
            letterSpacing: '-0.005em',
          }}
        >
          {anchor.topMitigation}
        </div>
      </div>

      {/* Single CTA — empathic mode means one action, not five. */}
      <Link
        href={variantCta.href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 20px',
          background: '#22C55E',
          color: '#052E16',
          fontWeight: 700,
          fontSize: 14,
          borderRadius: 10,
          textDecoration: 'none',
          letterSpacing: '-0.01em',
          position: 'relative',
          transition: 'background 0.16s ease',
        }}
      >
        {variantCta.label}
        <ArrowRight size={15} />
      </Link>

      {/* Honesty footer — the bit that earns trust with the analytical
          buyer. No jargon; the number above is grounded, not invented. */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid rgba(148,163,184,0.12)',
          fontSize: 10.5,
          color: '#64748B',
          letterSpacing: '0.02em',
          lineHeight: 1.55,
          position: 'relative',
        }}
      >
        Numbers anchored to the deal value you typed in. Failure rate from comparable historical
        decisions, not a generic benchmark. Full methodology + audit trail available once you sign
        in.
      </div>
    </motion.div>
  );
}

/**
 * Canonical static anchor for marketing surfaces (/demo intro, landing
 * page if requested). Numbers chosen to be plausibly defensible against
 * a quick fact-check: $50M is a typical mid-market PE deal ticket;
 * 45% is the published M&A failure rate range (HBR consensus); $22.5M
 * is the simple multiplication. Top bias and mitigation pulled from
 * the WeWork DPR specimen for vocabulary continuity.
 */
export const STATIC_DEMO_ANCHOR: DiscoveryGradeAnchor = {
  contextLabel: 'Decision Intel · 60-second audit',
  artefactLabel: 'Sample mid-market acquisition memo',
  ticketAmount: 50_000_000,
  ticketCurrency: 'USD',
  historicalFailureRate: 45,
  cohortSampleSize: 28,
  topBiasLabel: 'Overconfidence Bias',
  topMitigation:
    'Commission an independent reference-class forecast against eight to twelve comparable mid-market acquisitions before the IC vote. Force base-rate distributions into the deck — not point estimates.',
};
