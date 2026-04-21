'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics/track';
import { HeroCounterfactualTease } from '@/components/marketing/HeroCounterfactualTease';
import { BookDemoCTA } from '@/components/marketing/BookDemoCTA';
import { Reveal } from '@/components/ui/Reveal';
import { CaseStudyCarousel } from '@/components/marketing/CaseStudyCarousel';
import { CredibilityTrio } from '@/components/marketing/CredibilityTrio';
import { CompetitorComparisonCard } from '@/components/marketing/CompetitorComparisonCard';
import { LandingFaq } from '@/components/marketing/LandingFaq';
import { ProblemScenes } from '@/components/marketing/ProblemScenes';
import { CategoryTurn } from '@/components/marketing/CategoryTurn';
import { KahnemanKleinSynthesis } from '@/components/marketing/KahnemanKleinSynthesis';
import { MomentsPyramid } from '@/components/marketing/MomentsPyramid';
import { SecurityLifecycleStrip } from '@/components/marketing/SecurityLifecycleStrip';
import { ScrollRevealGraph } from '@/components/marketing/ScrollRevealGraph';
import { ArrowRight, Menu, X, Check } from 'lucide-react';

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

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div style={{ background: C.white, color: C.slate900, overflowX: 'hidden' }}>
      {/* Floating Decision Knowledge Graph overlay — desktop only, accumulates
          nodes beat-by-beat as the reader scrolls. See ScrollRevealGraph for
          stage thresholds and node topology. */}
      <ScrollRevealGraph />

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: C.navy,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            <Image
              src="/logo.png"
              alt="Decision Intel"
              width={28}
              height={28}
              style={{ borderRadius: 6, objectFit: 'cover' }}
            />
            <span
              style={{ fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: '-0.02em' }}
            >
              Decision Intel
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden-mobile">
            {[
              { label: 'How It Works', href: '/how-it-works' },
              { label: 'Proof', href: '/proof' },
              { label: 'Bias Genome', href: '/bias-genome' },
              { label: 'Pricing', href: '/pricing' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  fontSize: 14,
                  color: '#CBD5E1',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden-mobile">
            <Link
              href="/login"
              style={{ fontSize: 14, color: '#CBD5E1', textDecoration: 'none', fontWeight: 500 }}
            >
              Sign In
            </Link>
            <BookDemoCTA variant="nav" source="landing_nav" />
            <Link
              href="/demo"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.white,
                background: C.green,
                padding: '8px 20px',
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Try the Demo
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: C.white,
              cursor: 'pointer',
              padding: 4,
            }}
            className="show-mobile-only"
          >
            {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileNavOpen && (
          <div
            style={{
              background: C.navyLight,
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {[
              { label: 'How It Works', href: '/how-it-works' },
              { label: 'Proof', href: '/proof' },
              { label: 'Bias Genome', href: '/bias-genome' },
              { label: 'Pricing', href: '/pricing' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  fontSize: 15,
                  color: '#CBD5E1',
                  textDecoration: 'none',
                  padding: '8px 0',
                }}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              style={{ fontSize: 15, color: '#CBD5E1', textDecoration: 'none', padding: '8px 0' }}
            >
              Sign In
            </Link>
            <div onClick={() => setMobileNavOpen(false)} style={{ marginTop: 4 }}>
              <BookDemoCTA variant="nav" source="landing_nav_mobile" />
            </div>
            <Link
              href="/demo"
              onClick={() => setMobileNavOpen(false)}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.white,
                background: C.green,
                padding: '10px 20px',
                borderRadius: 8,
                textDecoration: 'none',
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Try the Demo
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero (beat 01) ──────────────────────────────────────────────
          Tight typography, no inline graph. The full Decision Knowledge
          Graph accumulates in <ScrollRevealGraph /> as the reader scrolls,
          arriving populated precisely when the narrative has earned it. */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '112px 24px 88px' }}>
        <motion.div {...fadeIn} transition={{ duration: 0.5 }} style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: C.green,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 18,
            }}
          >
            For strategy teams who answer to the board
          </p>
          <h1
            style={{
              fontSize: 'clamp(34px, 6vw, 64px)',
              fontWeight: 800,
              color: C.slate900,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              marginBottom: 26,
              maxWidth: 880,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            The native system of record for{' '}
            <span style={{ color: C.green }}>strategic reasoning.</span>
          </h1>
          <p
            style={{
              fontSize: 19,
              color: C.slate600,
              lineHeight: 1.6,
              marginBottom: 30,
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Write, audit, compound &mdash; in one place, not four. Decision Intel replaces the
            Google Doc / Slack thread / Confluence page / board deck graveyard with a single
            governed surface where every strategic memo is scored, every objection is simulated,
            and every decision joins a living Decision Knowledge Graph that compounds quarter
            after quarter.
          </p>
          <div
            style={{
              marginBottom: 26,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <HeroCounterfactualTease />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Link
              href="/demo"
              onClick={() => trackEvent('hero_try_demo_clicked')}
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
              One free audit &mdash; paste your memo <ArrowRight size={16} />
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
        </motion.div>
      </section>

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
                Decision Intel doesn&rsquo;t add a fifth tool to your stack &mdash; it retires the
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
                      sub: 'DQI, what-ifs, AI boardroom, outcome loop &mdash; all on the memo itself.',
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
                135 decisions, audited in hindsight. The case library is open.
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
              {['Full 60-second audit', 'No signup · no card', '4 design-partner seats open'].map(
                t => (
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
                )
              )}
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
            gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
            gap: 48,
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
              Product
            </h4>
            {[
              'Privacy',
              'Security',
              'How It Works',
              'Case Studies',
              'Proof',
              'Bias Genome',
              'Decision Alpha',
              'Pricing',
              'Resources',
            ].map(l => {
              const href =
                l === 'How It Works'
                  ? '/how-it-works'
                  : l === 'Case Studies'
                    ? '/case-studies'
                    : l === 'Proof'
                      ? '/proof'
                      : l === 'Bias Genome'
                        ? '/bias-genome'
                        : l === 'Decision Alpha'
                          ? '/decision-alpha'
                          : l === 'Pricing'
                            ? '/pricing'
                            : l === 'Privacy'
                              ? '/privacy'
                              : l === 'Security'
                                ? '/security'
                                : `#${l.toLowerCase().replace(/\s+/g, '-')}`;
              return (
                <a
                  key={l}
                  href={href}
                  style={{
                    display: 'block',
                    fontSize: 14,
                    color: '#94A3B8',
                    textDecoration: 'none',
                    marginBottom: 10,
                  }}
                >
                  {l}
                </a>
              );
            })}
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
            <Link href="/terms" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              Terms of Service
            </Link>
            <Link href="/privacy" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
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
