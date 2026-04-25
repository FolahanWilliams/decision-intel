'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/lib/analytics/track';
import { HeroCounterfactualTease } from '@/components/marketing/HeroCounterfactualTease';
import { MarketingNav } from '@/components/marketing/MarketingNav';
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
import { ArrowRight, Check, ShieldCheck, Scale, GraduationCap, Globe2 } from 'lucide-react';

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
            className="marketing-display"
            style={{
              fontSize: 'clamp(40px, 6.6vw, 72px)',
              color: C.slate900,
              lineHeight: 1.02,
              marginBottom: 26,
              maxWidth: 920,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            The native reasoning layer for every{' '}
            <span style={{ color: C.green, fontStyle: 'italic' }}>
              boardroom strategic decision.
            </span>
          </h1>
          <p
            style={{
              fontSize: 19,
              color: C.slate600,
              lineHeight: 1.6,
              marginBottom: 32,
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Every strategic memo runs through a cognitive-bias audit grounded in 30+ biases from
            Kahneman and Klein, calibrated against 135 historical corporate decisions. Decision
            Intel scores the reasoning, names the biases the board will catch first, and shows
            exactly what shifts when you remove them.
          </p>
          <div
            style={{
              marginBottom: 28,
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
              marginBottom: 32,
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
              One free audit. Paste your memo. <ArrowRight size={16} />
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
          {/* Credibility strip — the legitimate signals we have today.
              Real credentials in enterprise procurement language, no
              fabricated logos. Sits below the CTAs so the hero closes
              with trust signal, not with a dangling what-if chip. */}
          <HeroCredibilityStrip />
          {/* Sample audit output — a static representation of what the
              reader will see after pasting a memo. Gives the hero visual
              weight so it stops reading as pure-text centered SaaS. */}
          <div style={{ marginTop: 44, display: 'flex', justifyContent: 'center' }}>
            <SampleAuditCard />
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
              'R²F Standard',
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
                  : l === 'R²F Standard'
                    ? '/r2f-standard'
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

/* ─── HeroCredibilityStrip ──────────────────────────────────────────────
   Single-line rotating ticker of trust signals below the hero CTAs.
   Each signal is defensible at the procurement bar: R²F is the framework
   name we coined and own by usage, AI Verify alignment is a real
   principle-mapping exercise (not a certification claim), and SOC 2
   refers to the infrastructure stack (Vercel + Supabase). The Wiz
   advisor line lives on the Founder slide of the pitch deck instead.
   One visible item at a time, rotates every 4s; reduced-motion readers
   see the first item without auto-advance. No fabricated customer logos. */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function HeroCredibilityStrip() {
  const items = [
    {
      icon: GraduationCap,
      label: 'Recognition-Rigor Framework',
      note: 'Kahneman and Klein, arbitrated in one pipeline',
    },
    {
      icon: Scale,
      label: 'Aligned with AI Verify',
      note: '11 internationally recognised AI governance principles',
    },
    {
      icon: ShieldCheck,
      label: 'SOC 2 Type II infrastructure (Vercel + Supabase)',
      note: 'Type I completion targeted for Q4 2026; Type II observation opens immediately after. In-flight controls already mirror Type II. Full posture at /security.',
    },
    {
      icon: Globe2,
      label: '17 frameworks · G7, EU, GCC, African markets',
      note: 'Every flag cross-linked to a regulatory provision — SOX, EU AI Act, Basel III, GDPR, NDPR, CBN, WAEMU, PoPIA, and ten more, mapped flag-by-flag for a Fortune-500 procurement bar.',
    },
  ];
  const [idx, setIdx] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  useEffect(() => {
    if (reducedMotion) return;
    const t = window.setInterval(() => setIdx(i => (i + 1) % items.length), 4200);
    return () => window.clearInterval(t);
  }, [reducedMotion, items.length]);

  const active = items[idx];
  const ActiveIcon = active.icon;

  return (
    <div
      style={{
        maxWidth: 980,
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingTop: 24,
        borderTop: `1px solid ${C.slate200}`,
      }}
    >
      <div
        aria-live="polite"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          minHeight: 42,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: 'rgba(22,163,74,0.08)',
                border: '1px solid rgba(22,163,74,0.22)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ActiveIcon size={13} color={C.green} strokeWidth={2.5} />
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.slate900,
                letterSpacing: '-0.005em',
              }}
            >
              {active.label}
            </span>
            <span
              style={{
                fontSize: 13,
                color: C.slate500,
                fontWeight: 500,
              }}
            >
              &middot; {active.note}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Progress dots — reads as a confident ticker, not a static strip. */}
      <div
        aria-hidden
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          marginTop: 10,
        }}
      >
        {items.map((it, i) => (
          <span
            key={it.label}
            style={{
              width: i === idx ? 18 : 5,
              height: 5,
              borderRadius: 5,
              background: i === idx ? C.green : C.slate200,
              transition: 'width 0.35s, background 0.35s',
              display: 'inline-block',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── SampleAuditCard ────────────────────────────────────────────────
   Static representation of what a reader sees after pasting a memo. Not
   live data, not a real analysis. Designed to give the hero visual
   weight without a customer-logo rail we do not have yet, and without
   embedding a 3D graph that would redirect attention away from the
   headline. Every number here maps onto the 135-case corpus at a
   plausible mid-range; the card reads as "product showroom piece"
   rather than "dashboard screenshot". */

function SampleAuditCard() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 720,
        borderRadius: 18,
        background: C.white,
        border: `1px solid ${C.slate200}`,
        boxShadow: '0 24px 60px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          padding: '14px 22px',
          borderBottom: `1px solid ${C.slate200}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: C.slate50,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.green,
            }}
          >
            Sample output · illustrative
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.slate900,
            }}
          >
            Q4 market-entry recommendation
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.slate500,
          }}
        >
          62 seconds
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: '22px 24px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 22,
          alignItems: 'center',
          textAlign: 'left',
        }}
      >
        {/* DQI score */}
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.slate500,
              marginBottom: 4,
            }}
          >
            Decision Quality Index
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: C.slate900,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-mono), monospace',
              }}
            >
              68
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: C.white,
                background: '#38BDF8',
                padding: '3px 10px',
                borderRadius: 6,
                letterSpacing: '0.03em',
              }}
            >
              B
            </div>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: C.slate500,
              marginTop: 4,
            }}
          >
            above sector median of 62
          </div>
        </div>

        {/* Biases flagged */}
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.slate500,
              marginBottom: 6,
            }}
          >
            Biases flagged
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { label: 'Overconfidence', sev: '#DC2626' },
              { label: 'Anchoring', sev: '#D97706' },
              { label: 'Availability heuristic', sev: '#D97706' },
              { label: 'Status quo', sev: '#64748B' },
            ].map(b => (
              <div
                key={b.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12.5,
                  color: C.slate700,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: b.sev,
                    flexShrink: 0,
                  }}
                />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* What-if */}
        <div
          style={{
            background: C.slate50,
            borderRadius: 10,
            border: `1px solid ${C.slate200}`,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.slate500,
              marginBottom: 6,
            }}
          >
            What-if
          </div>
          <div
            style={{
              fontSize: 13,
              color: C.slate900,
              lineHeight: 1.45,
              marginBottom: 6,
            }}
          >
            Remove <span style={{ fontWeight: 700 }}>overconfidence</span> from the revenue framing
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 800,
              color: C.green,
              background: C.greenLight,
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            +18pp outcome probability
          </div>
        </div>
      </div>

      {/* Compound analysis — the causal layer. Reads what the Decision
          Knowledge Graph has learned about this org's own prior decisions,
          ties the flagged bias stack to a measured historical failure rate,
          and quantifies what the counterfactual removes. This is the beat
          that separates Decision Intel from "LLM wrapper scoring a memo" —
          the numbers compound over time, they are the org's own data, and
          they arrive signed as part of the DPR. */}
      <div
        style={{
          margin: '0 22px 20px',
          padding: '14px 16px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.04), rgba(22,163,74,0.08))',
          border: '1px solid rgba(22,163,74,0.18)',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.green,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: C.green,
              display: 'inline-block',
            }}
          />
          Compound analysis
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: C.slate500,
              letterSpacing: '0.04em',
              textTransform: 'none',
            }}
          >
            · calibrated against 127 prior decisions in your Knowledge Graph
          </span>
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: C.slate900,
            lineHeight: 1.55,
          }}
        >
          Memos with this bias stack (
          <span style={{ fontWeight: 700 }}>overconfidence + anchoring</span>) failed{' '}
          <span style={{ fontWeight: 800, color: C.green }}>34% more often</span> than your
          portfolio baseline in M&amp;A and market-entry contexts. Removing overconfidence from the
          revenue framing narrows the gap to{' '}
          <span style={{ fontWeight: 800, color: C.green }}>12%</span>, a{' '}
          <span style={{ fontWeight: 700 }}>22-point reduction</span> in failure-rate exposure.
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 22px',
          borderTop: `1px solid ${C.slate200}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11.5,
          color: C.slate500,
          background: C.white,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>
          Every call signs a Decision Provenance Record, mapped onto EU AI Act Article 14.
        </span>
        <span
          style={{
            fontStyle: 'italic',
            color: C.slate500,
            fontSize: 11,
          }}
        >
          Synthetic sample · not a real audit
        </span>
      </div>
    </div>
  );
}
