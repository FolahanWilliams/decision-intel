'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics/track';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { RoleRouter } from '@/components/marketing/RoleRouter';
import { Reveal } from '@/components/ui/Reveal';

/* Below-fold heavy components: split into async JS chunks via
 * next/dynamic (LCP optimization 2026-05-27, Tier-A #3 ship). All
 * keep ssr: true (default) so the SERVER-rendered HTML still carries
 * the content for crawlers + ChatGPT ingestion — only the JS bundle
 * is split. The hero (above-fold) stays synchronous: H1, sub-head,
 * 3 mini-cards, HeroCredibilityStrip. Everything below the hero —
 * ProblemScenes through CompetitorComparisonCard — moves to async
 * chunks. ScrollRevealGraph is a desktop-only floating overlay that
 * doesn't render until scrollProgress > 0.04, so it's safe to
 * ssr: false (saves the HTML payload entirely on cold paint).
 *
 * Visual output IS BYTE-IDENTICAL once hydrated — same components,
 * same props, same hero shape (locked 2026-05-07), same
 * Kahneman-Klein beat, same constellation overlay. */
const CaseStudyCarousel = dynamic(() =>
  import('@/components/marketing/CaseStudyCarousel').then(m => ({ default: m.CaseStudyCarousel }))
);
const CredibilityTrio = dynamic(() =>
  import('@/components/marketing/CredibilityTrio').then(m => ({ default: m.CredibilityTrio }))
);
const CompetitorComparisonCard = dynamic(() =>
  import('@/components/marketing/CompetitorComparisonCard').then(m => ({
    default: m.CompetitorComparisonCard,
  }))
);
const LandingFaq = dynamic(() =>
  import('@/components/marketing/LandingFaq').then(m => ({ default: m.LandingFaq }))
);
const ProblemScenes = dynamic(() =>
  import('@/components/marketing/ProblemScenes').then(m => ({ default: m.ProblemScenes }))
);
const CategoryTurn = dynamic(() =>
  import('@/components/marketing/CategoryTurn').then(m => ({ default: m.CategoryTurn }))
);
const KahnemanKleinSynthesis = dynamic(() =>
  import('@/components/marketing/KahnemanKleinSynthesis').then(m => ({
    default: m.KahnemanKleinSynthesis,
  }))
);
const MomentsPyramid = dynamic(() =>
  import('@/components/marketing/MomentsPyramid').then(m => ({ default: m.MomentsPyramid }))
);
const SecurityLifecycleStrip = dynamic(() =>
  import('@/components/marketing/SecurityLifecycleStrip').then(m => ({
    default: m.SecurityLifecycleStrip,
  }))
);
const ScrollRevealGraph = dynamic(
  () =>
    import('@/components/marketing/ScrollRevealGraph').then(m => ({
      default: m.ScrollRevealGraph,
    })),
  {
    // Desktop-only floating overlay that doesn't render until
    // scrollProgress > 0.04 + checks window.matchMedia for desktop +
    // respects prefers-reduced-motion. Skipping SSR is safe (server
    // would render nothing anyway given the desktop + scroll gates).
    ssr: false,
  }
);
import { ArrowRight, Check, ShieldCheck, GraduationCap, AlertCircle, Search } from 'lucide-react';
import { DESIGN_PARTNER_SEATS_AVAILABLE } from '@/lib/constants/company-info';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import {
  SOC2_LANDING_STRIP_LABEL,
  SOC2_LANDING_STRIP_NOTE,
  AI_VERIFY_DISCLAIMER_SHORT,
} from '@/lib/constants/trust-copy';

// PLATFORM_BASELINE_SNAPSHOT is a tiny no-dep mirror of the live
// computePlatformCalibrationBaseline(). Importing the live function on
// this `'use client'` page would pull the 750KB case library into the
// client bundle. Drift between the snapshot and the live function is
// caught by platform-baseline-snapshot.test.ts.

/* ─── Color Tokens ──────────────────────────────────────────────────────── */

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenDark: '#15803D',
  teal: '#0D9488',
  tealBg: '#E0F2F1',
} as const;

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.15, margin: '0px 0px -8% 0px' },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

// ── Newsletter Form (shared by newsletter section + footer) ─────────────

function NewsletterForm({ source = 'footer' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('submitting');
    trackEvent('newsletter_subscribe', { source });
    try {
      const res = await fetch('/api/pilot-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: `newsletter_${source}` }),
      });
      if (!res.ok) throw new Error();
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <p style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>
        You&apos;re in. First brief arrives this week.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto' }}
    >
      <input
        type="email"
        value={email}
        onChange={e => {
          setEmail(e.target.value);
          if (status === 'error') setStatus('idle');
        }}
        placeholder="your@email.com"
        required
        disabled={status === 'submitting'}
        style={{
          flex: 1,
          padding: '12px 16px',
          fontSize: 14,
          borderRadius: 8,
          border: '1px solid #334155',
          background: '#1E293B',
          color: C.white,
          outline: 'none',
        }}
        aria-label="Email address"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          padding: '12px 20px',
          borderRadius: 8,
          border: 'none',
          background: C.green,
          color: C.white,
          fontSize: 14,
          fontWeight: 600,
          cursor: status === 'submitting' ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
        {status !== 'submitting' && <ArrowRight size={14} />}
      </button>
      {status === 'error' && (
        <p style={{ fontSize: 12, color: '#FCA5A5', margin: '8px 0 0', width: '100%' }}>
          Something went wrong. Try again.
        </p>
      )}
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Competitor Comparison + FAQ (extracted to components/marketing/ for
//    maintainability — the landing page file was already 1500+ lines).

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      {/* h3 (not h4) so the footer heading doesn't skip a level after the
          body's h2 sections (axe heading-order). */}
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#FFFFFF',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 16,
        }}
      >
        {heading}
      </h3>
      {links.map(l => (
        <a
          key={l.label}
          href={l.href}
          style={{
            display: 'block',
            fontSize: 14,
            color: '#94A3B8',
            textDecoration: 'none',
            marginBottom: 10,
          }}
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: C.white, color: C.slate900, overflowX: 'hidden' }}>
      {/* Floating Decision Knowledge Graph overlay — desktop only, accumulates
          nodes beat-by-beat as the reader scrolls. See ScrollRevealGraph for
          stage thresholds and node topology. */}
      <ScrollRevealGraph />

      {/* ── Navigation — shared mega-menu across all marketing surfaces ── */}
      <MarketingNav />

      {/* ── Hero (beat 01) ──────────────────────────────────────────────
          Single-column centered structure (locked 2026-05-07 founder
          refactor). Replaces the prior 55/45 two-column hero with the
          WeWorkProofPanel right card. Founder feedback: "even on YC-funded
          startup pages, clarity is always what triumphs over everything
          else" — the WeWork panel + asymmetric-tail body paragraph + DPR
          tertiary link were ALL competing for the reader's attention
          before the H1 had landed. The WeWork sample now lives on /demo
          with the DPR link surfaced there. The hero stack is now: pain
          stat → eyebrow → H1 → contrast sub-head → CTAs → 2-card
          PROBLEM/SOLUTION row → credibility strip. Single eye-pass to
          the H1; the McKinsey-anchored data still lands via the
          PROBLEM/SOLUTION mini-cards as the visual rhythm break. */}
      <section
        className="hero-grid-section"
        style={{ maxWidth: 880, margin: '0 auto', padding: '96px 24px 64px' }}
      >
        <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
          <div className="hero-claim" style={{ textAlign: 'center' }}>
            {/* Pain-stat tag — McKinsey "Strategy Beyond the Hockey Stick"
                  (Bradley/Hirt/Smit, 2018). The 8% finding is the most
                  defensible broad-pain framing we can ship: covers strategy
                  + corp dev + funds in one breath, not narrow to M&A or
                  to board-presented decisions. Source verified before ship;
                  the prior "$1.3T McKinsey" claim could not be sourced and
                  was rejected. */}
            <p
              style={{
                fontSize: 13,
                color: C.slate500,
                fontStyle: 'italic',
                lineHeight: 1.5,
                marginBottom: 16,
                maxWidth: 640,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Only 8% of strategic moves break out of the middle (McKinsey). The other 92% looked
              just as convincing in the memo.
            </p>
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginBottom: 18,
              }}
            >
              For decisions worth defending
            </p>
            <h1
              className="marketing-display"
              style={{
                fontSize: 'clamp(36px, 5.2vw, 60px)',
                color: C.slate900,
                lineHeight: 1.04,
                marginBottom: 22,
              }}
            >
              Attack your own thesis{' '}
              <span style={{ color: C.green, fontStyle: 'italic' }}>
                before you commit the capital.
              </span>
            </h1>
            <p
              style={{
                fontSize: 18,
                color: C.slate600,
                lineHeight: 1.6,
                marginBottom: 32,
                maxWidth: 680,
                marginLeft: 'auto',
                marginRight: 'auto',
                fontWeight: 500,
              }}
            >
              Institutional investors never bet on one person&rsquo;s conviction. Decision Intel
              gives you that same discipline, solo: it surfaces the blind spot you&rsquo;re standing
              too close to see in your own memo, in 60 seconds.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 40,
              }}
            >
              <Link
                href="/login?mode=signup&redirect=/dashboard%3Fonboarding%3D1"
                onClick={() => trackEvent('hero_signup_clicked')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.white,
                  background: C.green,
                  padding: '14px 28px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(22,163,74,0.28)',
                }}
              >
                Pressure-test a decision <ArrowRight size={16} />
              </Link>
              <Link
                href="/how-it-works"
                onClick={() => trackEvent('hero_how_it_works_clicked')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.slate600,
                  textDecoration: 'none',
                  padding: '14px 10px',
                }}
              >
                How it works <ArrowRight size={14} />
              </Link>
            </div>
            {/* Tertiary specimen link — for the cold reader who wants to
                see what an audit looks like before committing to sign up.
                Locked 2026-05-07 alongside the sign-in-first hero CTA so
                we keep the cold-evidence door open while routing primary
                intent through auth. */}
            <p style={{ marginTop: -28, marginBottom: 32, textAlign: 'center' }}>
              <Link
                href="/demo"
                onClick={() => trackEvent('hero_specimen_link_clicked')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.slate500,
                  textDecoration: 'none',
                }}
              >
                See an audit we already ran <ArrowRight size={12} />
              </Link>
            </p>
            {/* PROBLEM / SOLUTION mini-cards — the McKinsey-anchored
                  visual rhythm break that anchors the hero in real data
                  + the product framing without competing with the H1.
                  Refactored 2026-05-07 (twice): was a stacked column to
                  the right of WeWorkProofPanel; then a centered 2-card
                  horizontal row; NOW a 3-card pain → mechanism →
                  solution flow. PROBLEM re-framed 2026-06-18 OFF the
                  "70-90% of deals fail" attribution stat (indefensible +
                  M&A-narrow) ONTO the spend-asymmetry insight (firms
                  audit the information, almost nothing audits the
                  judgment) — more defensible, more novel, and it travels
                  to banks / any capital-commitment buyer. Canonical
                  concept lives in icp.ts POSITIONING_SPEND_ASYMMETRY
                  (rendered em-dash-free here per the landing cap).
                  PATTERN bridges to the SOLUTION
                  by naming the failure mechanic (the four bias families)
                  so the reader sees pain → cause → fix in one row. */}
            <div
              className="hero-mini-cards"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16,
                maxWidth: 880,
                marginLeft: 'auto',
                marginRight: 'auto',
                textAlign: 'left',
              }}
            >
              {/* PROBLEM — red */}
              <div
                className="hero-mini-card"
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderTop: '3px solid #DC2626',
                  borderRadius: 12,
                  padding: '16px 18px',
                  boxShadow: '0 4px 16px -8px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#DC2626',
                    margin: '0 0 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertCircle size={11} strokeWidth={2.6} />
                  The problem
                </p>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.slate900,
                    margin: '0 0 8px',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  The numbers get audited. The reasoning doesn&rsquo;t.
                </p>
                <p
                  style={{
                    fontSize: 12.5,
                    color: C.slate700,
                    lineHeight: 1.5,
                    margin: '0 0 6px',
                  }}
                >
                  Millions go to the data, the bankers, the diligence. The judgment that actually
                  commits the capital, the part that decides whether the money was well spent, never
                  gets a second look.
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: C.slate500,
                    fontStyle: 'italic',
                    margin: 0,
                    letterSpacing: '0.02em',
                  }}
                >
                  The judgment gap, not the data gap.
                </p>
              </div>
              {/* PATTERN — amber. The bridge card: surfaces the three
                  canonical M&A toxic combinations DI catches by name
                  (Synergy Mirage / Conglomerate Fallacy / Winner's
                  Curse) — the patterns a Damien-class mid-market corp
                  dev head or PE-backed founder recognises in a 5-second
                  scan. Locked 2026-05-10 (audit follow-through, item 2).
                  Static — no rotator/animation per DESIGN.md motion
                  budget. Pattern names + descriptions sourced canonically
                  from src/lib/data/bias-genome-seed.ts TOXIC_PAIR_DEFS.
                  Generic 4-bias framing was the prior copy; loses the
                  M&A-buyer recognition moment cold prospects need before
                  they'll keep reading. Uses the Search icon to suggest
                  "we identify what others miss" rather than the warning
                  iconography of the PROBLEM card. */}
              <div
                className="hero-mini-card"
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderTop: '3px solid #D97706',
                  borderRadius: 12,
                  padding: '16px 18px',
                  boxShadow: '0 4px 16px -8px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#D97706',
                    margin: '0 0 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Search size={11} strokeWidth={2.6} />
                  The pattern
                </p>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.slate900,
                    margin: '0 0 10px',
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Invisible from the inside.
                </p>
                <p
                  style={{
                    fontSize: 12.5,
                    color: C.slate700,
                    lineHeight: 1.5,
                    margin: '0 0 10px',
                  }}
                >
                  The fatal assumption looks like conviction to the person who wrote it. You
                  can&rsquo;t pressure-test the reasoning you&rsquo;re standing inside, so the flaw
                  survives every read until the outcome names it. An outside view catches it first.
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: C.slate500,
                    lineHeight: 1.4,
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  Hard to spot from inside the decision. Easy to surface from outside.
                </p>
              </div>
              {/* SOLUTION — green */}
              <div
                className="hero-mini-card"
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderTop: `3px solid ${C.green}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  boxShadow: '0 4px 16px -8px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: C.green,
                    margin: '0 0 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ShieldCheck size={11} strokeWidth={2.6} />
                  The solution
                </p>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.slate900,
                    margin: '0 0 8px',
                    lineHeight: 1.05,
                    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  60
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: C.slate700,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  second reasoning audit. The blind spot named, the counterfactual quantified, the
                  record signed and shareable before you commit.
                </p>
              </div>
            </div>
          </div>

          {/* Credibility strip — full-width below the centered hero stack,
              static (no rotation). All five signals visible at once so the
              reader sees the full posture in one pass instead of waiting
              for a carousel cycle. */}
          <div style={{ marginTop: 56 }}>
            <HeroCredibilityStrip />
          </div>
        </motion.div>

        {/* Mobile: shrink padding + stack the PROBLEM/SOLUTION mini-cards.
            The hero is the highest-traffic surface on mobile (LinkedIn
            outbound), and the 2-column mini-cards otherwise crush at
            narrow viewports. */}
        <style>{`
          .hero-mini-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 28px -8px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.05);
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-mini-card,
            .hero-mini-card:hover { transform: none; transition: none; }
          }
          @media (max-width: 900px) {
            .hero-mini-cards {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 700px) {
            .hero-grid-section { padding: 64px 20px 48px !important; }
          }
        `}</style>
      </section>

      {/* ── Role router — the 4 wedge personas → their /use workflow.
          Solves "one homepage, five buyers" without touching the locked
          hero / sign-in-first / category-claim. ─────────────────────── */}
      <Reveal repeat>
        <RoleRouter />
      </Reveal>

      {/* ── Beat 02 — The Problem ─────────────────────────────────────── */}
      <Reveal repeat>
        <ProblemScenes />
      </Reveal>

      {/* ── Beat 03 — The Turn ────────────────────────────────────────── */}
      <CategoryTurn />

      {/* ── Beat 04 — Kahneman × Klein Synthesis (the IP moat) ──────── */}
      <Reveal repeat>
        <KahnemanKleinSynthesis />
      </Reveal>

      {/* ── Beat 05 — The Moments (Pyramid-style vertical alternation) ─ */}
      <MomentsPyramid />

      {/* ── What we replace — before/after framing ──────────────────── */}
      <Reveal repeat>
        <section
          id="what-we-replace"
          style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}` }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '96px 24px',
            }}
          >
            <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.green,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: 10,
                }}
              >
                What we replace
              </p>
              <h2
                style={{
                  fontSize: 'clamp(30px, 4.2vw, 42px)',
                  fontWeight: 800,
                  color: C.slate900,
                  marginBottom: 18,
                  letterSpacing: '-0.02em',
                  maxWidth: 820,
                  lineHeight: 1.1,
                }}
              >
                One system of record in place of the four-tool graveyard.
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: C.slate600,
                  lineHeight: 1.6,
                  maxWidth: 720,
                  marginBottom: 48,
                }}
              >
                Decision Intel doesn&rsquo;t add a fifth tool to your stack. It retires the
                four-tool graveyard your strategy team uses to compensate for the fact that
                reasoning has never had a system of record. Every quarter this lives across Docs,
                Slack, Confluence, and the deck is another quarter of decision archaeology.
              </p>
            </motion.div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 56px 1fr',
                gap: 16,
                alignItems: 'stretch',
              }}
              className="replace-grid"
            >
              {/* Before panel */}
              <motion.div
                {...fadeIn}
                transition={{ duration: 0.5 }}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 16,
                  padding: '28px 28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: C.slate500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 2,
                  }}
                >
                  Before &middot; decision archaeology
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: C.slate900,
                    margin: 0,
                    letterSpacing: '-0.015em',
                    lineHeight: 1.3,
                  }}
                >
                  Four tools, zero governance.
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {[
                    {
                      label: 'Google Docs drafts',
                      sub: 'The reasoning exists, but only in a draft nobody revisits.',
                    },
                    {
                      label: 'Slack threads of feedback',
                      sub: 'Six months later, the context is buried in 400 messages.',
                    },
                    {
                      label: 'Confluence writeups',
                      sub: 'The what, but never the why it was the right call.',
                    },
                    {
                      label: 'The board deck',
                      sub: 'The presentation, not the thinking that produced it.',
                    },
                  ].map(item => (
                    <li
                      key={item.label}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          background: '#FEE2E2',
                          color: '#DC2626',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontWeight: 800,
                          fontSize: 12,
                          marginTop: 1,
                        }}
                      >
                        ×
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14.5,
                            fontWeight: 700,
                            color: C.slate900,
                            lineHeight: 1.35,
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: C.slate500,
                            marginTop: 2,
                            lineHeight: 1.5,
                          }}
                          dangerouslySetInnerHTML={{ __html: item.sub }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Arrow */}
              <div
                className="replace-arrow"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    background: C.green,
                    color: C.white,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 22px rgba(22,163,74,0.32)',
                  }}
                >
                  <ArrowRight size={22} />
                </div>
              </div>

              {/* After panel */}
              <motion.div
                {...fadeIn}
                transition={{ duration: 0.5, delay: 0.08 }}
                style={{
                  background: C.white,
                  border: `2px solid ${C.green}`,
                  borderRadius: 16,
                  padding: '28px 28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 14px 40px rgba(22,163,74,0.12)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: C.green,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 2,
                  }}
                >
                  After &middot; with Decision Intel
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: C.slate900,
                    margin: 0,
                    letterSpacing: '-0.015em',
                    lineHeight: 1.3,
                  }}
                >
                  The system of record that scores, simulates, and compounds.
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {[
                    {
                      label: 'Every memo scored and auditable',
                      sub: 'DQI + evidence trail for your CEO, board, or parent company.',
                    },
                    {
                      label: 'Consulting-grade rigour, in 60 seconds',
                      sub: 'A fraction of a single engagement, and it gets sharper every quarter.',
                    },
                    {
                      label: 'Lessons compound in the Decision Knowledge Graph',
                      sub: 'Every call connects to its closest historical analog. Nothing leaks.',
                    },
                    {
                      label: 'One system of record for the reasoning itself',
                      sub: 'DQI, what-ifs, AI boardroom, outcome loop. All on the memo itself.',
                    },
                  ].map(item => (
                    <li
                      key={item.label}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          background: C.greenLight,
                          color: C.green,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14.5,
                            fontWeight: 700,
                            color: C.slate900,
                            lineHeight: 1.35,
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: C.slate500,
                            marginTop: 2,
                            lineHeight: 1.5,
                          }}
                          dangerouslySetInnerHTML={{ __html: item.sub }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Mobile: stack vertically and rotate the arrow */}
            <style>{`
              @media (max-width: 880px) {
                .replace-grid {
                  grid-template-columns: 1fr !important;
                  gap: 12px !important;
                }
                .replace-arrow {
                  justify-self: center;
                  transform: rotate(90deg);
                  padding: 4px 0;
                }
              }
            `}</style>
          </div>
        </section>
      </Reveal>

      {/* ── Beat 07 — Security + Governance (the procurement bar) ─────
          Dark-navy section wrapper gives the Security beat weight and
          narrates the palette progression (white moments → navy security).
          CredibilityTrio runs in un-embedded mode so it owns its own
          heading and sits as a full beat, not a trailing "go deeper" rail. */}
      <Reveal repeat>
        <section
          id="security"
          style={{
            background: C.navy,
            borderTop: `1px solid ${C.slate200}`,
            color: C.white,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(135deg, rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(45deg, rgba(148,163,184,0.04) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', paddingTop: 16, paddingBottom: 16 }}>
            {/* Inline overrides so the trio's default light styling lands
                as a light card surface on a dark page. The component
                itself stays theme-agnostic. */}
            <style>{`
              #security h2 { color: ${C.white} !important; }
              #security h2 + p { color: #CBD5E1 !important; }
            `}</style>
            {/* Dynamic in-flow lifecycle — sits above the three cards so
                the Security beat opens with motion, not a static grid. */}
            <SecurityLifecycleStrip />
            <CredibilityTrio />

            {/* AI Verify alignment — one-line chip below the CredibilityTrio.
                Deliberately low-key so it doesn't dilute the three-card
                narrative; the procurement conversation that needs this lands
                on /regulatory/ai-verify for the full mapping. */}
            <div
              style={{
                maxWidth: 1080,
                margin: '-8px auto 0',
                padding: '14px 20px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 260 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#86EFAC',
                    marginBottom: 3,
                  }}
                >
                  AI Verify Foundation &middot; Singapore IMDA
                </div>
                <div style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.5 }}>
                  Aligned with the 11 internationally-recognised AI governance principles:
                  cross-aligned with the EU AI Act and OECD AI Principles.
                </div>
                {/* Self-assessment disclaimer (locked 2026-05-02 from persona-audit
                    item 7). Without this inline, a cold reviewer who doesn't click
                    through to /regulatory/ai-verify reads "AI Verify certified" —
                    which is misrepresentation territory. AI Verify Foundation does
                    not certify products; alignment is self-attested. */}
                <div
                  style={{
                    fontSize: 11,
                    color: '#94A3B8',
                    fontStyle: 'italic',
                    marginTop: 4,
                    letterSpacing: '0.01em',
                  }}
                >
                  {AI_VERIFY_DISCLAIMER_SHORT}
                </div>
              </div>
              <Link
                href="/regulatory/ai-verify"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'transparent',
                  color: C.white,
                  border: '1px solid rgba(255,255,255,0.24)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 8,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                View the principle mapping <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Beat 08 — Proof (case library carousel) ───────────────────── */}
      <Reveal repeat>
        <section id="proof" style={{ background: C.white, borderTop: `1px solid ${C.slate200}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px 72px' }}>
            <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.green,
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  marginBottom: 12,
                }}
              >
                Open proof
              </p>
              <h2
                style={{
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontWeight: 800,
                  color: C.slate900,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  marginBottom: 16,
                  maxWidth: 860,
                }}
              >
                {HISTORICAL_CASE_COUNT} decisions, audited in hindsight. The case library is open.
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: C.slate600,
                  lineHeight: 1.6,
                  maxWidth: 760,
                  marginBottom: 36,
                }}
              >
                Every famous corporate decision, scored against the same bias taxonomy your memo
                would be scored against. Every conclusion traces back to a public source. No login,
                no gate.
              </p>
            </motion.div>

            <CaseStudyCarousel embedded />
          </div>
        </section>
      </Reveal>

      {/* ── FAQ + Competitor Comparison ───────────────────────────────── */}
      <Reveal repeat>
        <section id="faq" style={{ maxWidth: 1320, margin: '0 auto', padding: '96px 24px' }}>
          <motion.div
            {...fadeIn}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <div
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: C.green,
                marginBottom: 12,
              }}
            >
              Before you sign
            </div>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: C.slate900,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                marginBottom: 12,
              }}
            >
              The questions strategy teams actually bring.
            </h2>
            <p
              style={{
                fontSize: 17,
                color: C.slate600,
                maxWidth: 640,
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Plus an honest side-by-side against what we replace.
            </p>
          </motion.div>

          <div
            className="faq-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
              gap: 48,
              alignItems: 'start',
            }}
          >
            {/* Left column — FAQ accordion with category chips */}
            <div style={{ minWidth: 0 }}>
              <LandingFaq />
            </div>

            {/* Right column — Competitor Comparison Card */}
            <div style={{ minWidth: 0, position: 'sticky', top: 24 }}>
              <CompetitorComparisonCard />
            </div>
          </div>
        </section>
      </Reveal>

      {/* Responsive override for the 2-column FAQ layout on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .faq-grid {
            grid-template-columns: 1fr !important;
          }
          .faq-grid > div:last-child {
            position: static !important;
          }
        }
      `}</style>

      {/* ── Final CTA + Newsletter (unified closing panel) ──────────── */}
      <section style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}` }}>
        <div
          style={{
            maxWidth: 680,
            margin: '0 auto',
            padding: '88px 24px 40px',
            textAlign: 'center',
          }}
        >
          <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
            <h2
              style={{
                fontSize: 'clamp(30px, 4.2vw, 42px)',
                fontWeight: 800,
                color: C.slate900,
                marginBottom: 14,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Ready to compound your team&rsquo;s judgment?
            </h2>
            <p
              style={{
                fontSize: 18,
                color: C.slate600,
                marginBottom: 32,
                lineHeight: 1.6,
              }}
            >
              Paste your next strategic memo for one free audit, no signup. Or spend 30 minutes with
              the founder on a call.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/demo"
                onClick={() => trackEvent('final_cta_clicked', { target: 'demo' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.white,
                  background: C.green,
                  padding: '14px 32px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(22,163,74,0.28)',
                }}
              >
                Audit a memo free <ArrowRight size={18} />
              </Link>
              {(() => {
                const bookingUrl = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL;
                const bookingHref = bookingUrl || '/pricing#design-partner';
                const bookingExternal = !!bookingUrl;
                return (
                  <Link
                    href={bookingHref}
                    {...(bookingExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    onClick={() =>
                      trackEvent('final_cta_clicked', { target: 'design_partner_call' })
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      color: C.slate900,
                      background: C.white,
                      border: `1px solid ${C.slate200}`,
                      padding: '14px 32px',
                      borderRadius: 10,
                      textDecoration: 'none',
                    }}
                  >
                    Book a design partner call <ArrowRight size={18} />
                  </Link>
                );
              })()}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 22,
                marginTop: 22,
                flexWrap: 'wrap',
              }}
            >
              {[
                'Full 60-second audit',
                'No signup · no card',
                `${DESIGN_PARTNER_SEATS_AVAILABLE} design-partner seats open`,
              ].map(t => (
                <span
                  key={t}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: C.slate500,
                  }}
                >
                  <Check size={14} style={{ color: C.green }} /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quiet secondary: newsletter for the not-ready-yet segment */}
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ borderTop: `1px solid ${C.slate200}` }} />
        </div>
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            padding: '36px 24px 72px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.slate500,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              margin: '0 0 8px',
            }}
          >
            Not ready to audit a memo?
          </p>
          <p
            style={{
              fontSize: 14,
              color: C.slate600,
              lineHeight: 1.6,
              margin: '0 auto 16px',
              maxWidth: 460,
            }}
          >
            One real corporate decision, broken down weekly with the biases detectable before the
            outcome was known.
          </p>
          <NewsletterForm source="landing_newsletter" />
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer style={{ background: C.navy, color: '#CBD5E1' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '64px 24px 32px',
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1.5fr',
            gap: 40,
          }}
          className="footer-grid"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Image
                src="/logo.png"
                alt="Decision Intel"
                width={24}
                height={24}
                style={{ borderRadius: 6, objectFit: 'cover' }}
              />
              <span style={{ fontSize: 18, fontWeight: 700, color: C.white }}>Decision Intel</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#94A3B8', maxWidth: 280 }}>
              Decision intelligence for corporate strategy and M&amp;A teams. Audit the reasoning in
              every strategic memo, see the questions the board will ask, and compound your
              team&rsquo;s judgment over time.
            </p>
          </div>

          <FooterColumn
            heading="Platform"
            links={[
              { label: 'How It Works', href: '/how-it-works' },
              { label: 'R²F Standard', href: '/r2f-standard' },
              { label: 'Bias Genome', href: '/bias-genome' },
              { label: 'Glossary', href: '/glossary' },
              { label: 'Pricing', href: '/pricing' },
            ]}
          />

          <FooterColumn
            heading="Proof"
            links={[
              { label: 'Case Studies', href: '/case-studies' },
              { label: 'Proof', href: '/proof' },
              { label: 'Track record', href: '/track-record' },
              { label: 'FAQ', href: '/faq' },
              { label: 'Compare', href: '/compare' },
              { label: 'Workflows', href: '/use' },
              { label: 'One-pager', href: '/onepager' },
              { label: 'Demo', href: '/demo' },
            ]}
          />

          <FooterColumn
            heading="Trust"
            links={[
              { label: 'Security', href: '/security' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Trust center', href: '/trust' },
              { label: 'Calibration', href: '/calibration' },
            ]}
          />

          <div>
            <h4
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.white,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 16,
              }}
            >
              Contact Us
            </h4>
            <a
              href="tel:+447539443572"
              style={{
                display: 'block',
                fontSize: 14,
                color: '#94A3B8',
                textDecoration: 'none',
                marginBottom: 10,
              }}
            >
              +44 7539 443572
            </a>
            <a
              href="mailto:team@decision-intel.com"
              style={{
                display: 'block',
                fontSize: 14,
                color: '#94A3B8',
                textDecoration: 'none',
                marginBottom: 10,
              }}
            >
              team@decision-intel.com
            </a>
            <a
              href="https://www.linkedin.com/in/folahan-williams-13a7b03a2/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                color: '#94A3B8',
                textDecoration: 'none',
                marginBottom: 10,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
              </svg>
              LinkedIn
            </a>
          </div>

          <div>
            <h4
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.white,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 16,
              }}
            >
              Stay Updated
            </h4>
            <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 12 }}>
              Weekly case study with cognitive biases
            </p>
            <NewsletterForm source="footer" />
          </div>
        </div>

        {/* Enterprise nod — a quiet seed for the Fortune 500 ceiling (12-24mo
            out, per the locked revenue-ceiling lock). Deliberately a text
            link, NEVER a competing CTA: it signals the individual buyer is
            buying on enterprise-grade institutional logic, and gives a future
            corporate buyer a way in without distracting the wedge buyer.
            "Fortune 500" is a persona-class noun (allowed); no named prospect.
            "infrastructure" not "certified" per the SOC-2 vocabulary lock. */}
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '20px 24px',
            borderTop: `1px solid ${C.navyLight}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: 13.5,
            color: C.slate400,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          <span>
            Built on governance-grade reasoning-audit infrastructure. Operating at Fortune 500
            scale?
          </span>
          <Link
            href="/pricing"
            style={{
              color: C.white,
              textDecoration: 'none',
              fontWeight: 600,
              borderBottom: `1px solid ${C.green}`,
              paddingBottom: 1,
            }}
          >
            Explore Decision Intel for enterprise →
          </Link>
        </div>

        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '24px',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 13,
            color: '#64748B',
          }}
        >
          <span>© {new Date().getFullYear()} Decision Intel. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/about" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              About
            </Link>
            <Link href="/terms" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              Terms of Service
            </Link>
            <Link href="/privacy" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <a
              href="https://folahanwilliams.com"
              target="_blank"
              rel="noopener"
              style={{ color: '#94A3B8', textDecoration: 'none' }}
            >
              Folahan Williams
            </a>
          </div>
        </div>
      </footer>

      {/* ── Responsive Styles ───────────────────────────────────────── */}
      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile-only { display: none; }

        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile-only { display: block !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .faq-grid { gap: 32px !important; }
          h1 { font-size: 32px !important; }
          h2 { font-size: 26px !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          h1 { font-size: 28px !important; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── HeroCredibilityStrip ──────────────────────────────────────────────
   Static row of trust signals below the hero grid. All five signals
   visible at once. Persona audit (Marcus, Elena, Richard) flagged the
   prior 4.2s rotating ticker as reading "indecision" / "desperation" /
   "rationing your good credentials" — Bloomberg, S&P Capital IQ,
   McKinsey marketing pages list credentials static. R²F is the
   framework name we coined and own by usage; AI Verify alignment is
   a real principle-mapping exercise (not a certification claim);
   SOC 2 refers to the infrastructure stack (Vercel + Supabase);
   The case count is constant-derived (HISTORICAL_CASE_COUNT) so it never
   drifts as the case library grows. The Brier
   calibration item (added F1 lock 2026-04-29) reads from the bundle-
   safe PLATFORM_BASELINE_SNAPSHOT — no fabricated logos. */

function HeroCredibilityStrip() {
  // Tightened 2026-05-01: reduced from 5 items + methodology footnote to
  // 3 items, no footnote. The hero close was over-loaded — too many
  // sub-headings competing for attention. Kept the three strongest
  // credibility signals (universal SOC 2 infra, the audited case
  // corpus, R²F brand claim). Dropped: AI Verify (its disclaimer line
  // crowded the strip and the framework is less-recognised) and Brier
  // 0.258 (per GTM v3.3 lock — the Brier number stays in technical
  // surfaces + DPR cover, not in cold-context credibility chips).
  // Methodology footnote also dropped — the strip's chip-level claims
  // are sufficient; the dense footnote read as defensive over-disclosure.
  const items = [
    {
      icon: ShieldCheck,
      // SOC 2 chip pulls from trust-copy SSOT — never hardcode here.
      label: SOC2_LANDING_STRIP_LABEL,
      note: SOC2_LANDING_STRIP_NOTE,
    },
    {
      icon: Search,
      label: `${HISTORICAL_CASE_COUNT} audited decisions`,
      note: 'real outcomes behind every score',
    },
    {
      icon: GraduationCap,
      label: 'Recognition-Rigor Framework',
      note: 'Kahneman and Klein, one pipeline',
    },
  ];

  return (
    <div
      style={{
        paddingTop: 28,
        borderTop: `1px solid ${C.slate200}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px 32px',
        }}
      >
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: 'rgba(22,163,74,0.08)',
                  border: '1px solid rgba(22,163,74,0.22)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={11} color={C.green} strokeWidth={2.5} />
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: C.slate900,
                  letterSpacing: '-0.005em',
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: C.slate500,
                  fontWeight: 500,
                }}
              >
                · {item.note}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
