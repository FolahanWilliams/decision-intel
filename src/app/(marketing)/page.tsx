'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics/track';
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
import { ArrowRight, Check, ShieldCheck, Scale, GraduationCap, Globe2, FileText } from 'lucide-react';
import { DESIGN_PARTNER_SEATS_AVAILABLE } from '@/lib/constants/company-info';

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
          Asymmetric 55/45 grid: claim column left, sample audit card right,
          static credibility strip full-width below. Replaces the prior
          centered single-column stack — the persona audit (CSO + GC + M&A
          partner + design lead + board director) flagged the centered
          stack as the visual signature of a Series-A SaaS template, and
          the buried sample card as a confidence tell. The card now sits
          beside the claim so claim + proof land in one eye-pass. */}
      <section
        className="hero-grid-section"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 24px 64px' }}
      >
        <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
          <div
            className="hero-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
              gap: 64,
              alignItems: 'start',
            }}
          >
            {/* LEFT — claim column */}
            <div className="hero-claim" style={{ textAlign: 'left' }}>
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
                  maxWidth: 520,
                }}
              >
                Only 8% of strategic moves break out of the middle &mdash; the other 92% carry
                biases nobody named in the memo (McKinsey).
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
                Decisions worth defending
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
                The native reasoning layer for every{' '}
                <span style={{ color: C.green, fontStyle: 'italic' }}>
                  boardroom strategic decision.
                </span>
              </h1>
              <p
                style={{
                  fontSize: 18,
                  color: C.slate600,
                  lineHeight: 1.6,
                  marginBottom: 28,
                  maxWidth: 540,
                }}
              >
                Every strategic memo runs through a cognitive-bias audit grounded in 30+ biases
                from Kahneman and Klein, calibrated against 135 historical corporate decisions.
                Decision Intel scores the reasoning, names the biases the board will catch first,
                and shows exactly what shifts when you remove them.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginBottom: 14,
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
              {/* The standalone "Or see a real audit on a public S-1 (PDF)"
                  link that previously sat here was removed: the entire
                  WeWork proof panel on the right is now the clickable
                  artifact pointing at the same PDF, so the small text
                  link became redundant and added noise to the left column. */}
            </div>

            {/* RIGHT — proof column. Was a synthetic SampleAuditCard with
                DQI / biases / what-if / compound analysis stacked. Replaced
                2026-04-26 with WeWorkProofPanel — a clickable panel anchored
                to the public WeWork S-1 audit. Three rounds of persona +
                blind reads (8 readers total) all converged: the synthetic
                card asked the cold reader to parse domain vocabulary (DQI
                / Knowledge Graph / EU AI Act Art 14) before the trust to
                do that work had been earned. The WeWork case is a real
                public document with a famous outcome, eliminates the
                "synthetic sample" disclaimer, and naturally elevates the
                already-published DPR sample PDF as the validation path. */}
            <div
              className="hero-proof"
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
              }}
            >
              <div
                className="hero-proof-stack"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  width: '100%',
                  maxWidth: 520,
                }}
              >
                <WeWorkProofPanel />
                {/* Two mini-cards below the WeWork panel: PAIN ($250M
                    McKinsey Global Decision-Making Survey, 2017 — verified
                    primary source) + VALUE (what the user walks away
                    with — closes the "what's the output?" gap that 8
                    readers across 3 rounds plus 2 final blind readers
                    flagged). Both single-sentence. PAIN is sourced;
                    VALUE describes the actual deliverable. The two cards
                    sit side-by-side at desktop, stack on mobile. */}
                <div
                  className="hero-mini-cards"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      background: C.white,
                      border: `1px solid ${C.slate200}`,
                      borderRadius: 12,
                      padding: '14px 16px',
                      boxShadow:
                        '0 4px 16px -8px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: C.green,
                        marginBottom: 8,
                        marginTop: 0,
                      }}
                    >
                      The cost of slow decisions
                    </p>
                    <p
                      style={{
                        fontSize: 12.5,
                        color: C.slate700,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      McKinsey: inefficient decision-making costs the typical Fortune 500 company
                      $250M a year.
                    </p>
                  </div>
                  <div
                    style={{
                      background: C.white,
                      border: `1px solid ${C.slate200}`,
                      borderRadius: 12,
                      padding: '14px 16px',
                      boxShadow:
                        '0 4px 16px -8px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: C.green,
                        marginBottom: 10,
                        marginTop: 0,
                      }}
                    >
                      What you get
                    </p>
                    {/* Reader α's trust move: instead of describing the
                        artifact in prose, show 3 lines of what the actual
                        DPR header looks like. Monospace, tinted background,
                        reads as machine-output rather than marketing copy.
                        Numbers match the WeWork panel above for coherence. */}
                    <pre
                      style={{
                        fontSize: 11,
                        lineHeight: 1.55,
                        color: C.slate700,
                        background: C.slate50,
                        border: `1px solid ${C.slate200}`,
                        borderRadius: 8,
                        padding: '10px 12px',
                        margin: 0,
                        marginBottom: 8,
                        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflow: 'hidden',
                      }}
                    >
                      {`DPR · WeWork S-1 · 2019 IPO prospectus
DQI 41 → 70 if mitigated · 3 biases · 7 frameworks
SHA-256 a4f7e2…d83 · hashed + tamper-evident`}
                    </pre>
                    <p
                      style={{
                        fontSize: 11,
                        color: C.slate500,
                        margin: 0,
                        lineHeight: 1.45,
                      }}
                    >
                      A real DPR header. Click the WeWork panel above to read the full record.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credibility strip — full-width below both columns, static
              (no rotation). All four signals visible at once so the
              reader sees the full posture in one pass instead of waiting
              for a 4.2s carousel cycle. */}
          <div style={{ marginTop: 56 }}>
            <HeroCredibilityStrip />
          </div>
        </motion.div>

        {/* Mobile: collapse to single column, restore stacking, scale the
            sample card down to fit the narrower viewport. The hero is the
            highest-traffic surface on mobile (LinkedIn outbound), and the
            inline-style asymmetric grid otherwise crushes at <900px. */}
        <style>{`
          @media (max-width: 900px) {
            .hero-grid-section { padding: 64px 20px 48px !important; }
            .hero-grid {
              grid-template-columns: 1fr !important;
              gap: 40px !important;
            }
            .hero-proof {
              justify-content: center !important;
            }
            .hero-mini-cards {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
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
              {[
                'Full 60-second audit',
                'No signup · no card',
                `${DESIGN_PARTNER_SEATS_AVAILABLE} design-partner seats open`,
              ].map(
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
            <Link href="/about" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              About
            </Link>
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
   Static row of trust signals below the hero grid. All four signals
   visible at once. Persona audit (Marcus, Elena, Richard) flagged the
   prior 4.2s rotating ticker as reading "indecision" / "desperation" /
   "rationing your good credentials" — Bloomberg, S&P Capital IQ,
   McKinsey marketing pages list credentials static. R²F is the
   framework name we coined and own by usage; AI Verify alignment is
   a real principle-mapping exercise (not a certification claim);
   SOC 2 refers to the infrastructure stack (Vercel + Supabase);
   17 frameworks is the registry-derived count. No fabricated logos. */

function HeroCredibilityStrip() {
  const items = [
    {
      icon: GraduationCap,
      label: 'Recognition-Rigor Framework',
      note: 'Kahneman and Klein, one pipeline',
    },
    {
      icon: Scale,
      label: 'Aligned with AI Verify',
      note: '11 governance principles',
    },
    {
      icon: ShieldCheck,
      label: 'SOC 2 Type II infrastructure',
      note: 'Vercel + Supabase, Type I Q4 2026',
    },
    {
      icon: Globe2,
      label: '17 regulatory frameworks',
      note: 'G7, EU, GCC, African markets',
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

/* ─── WeWorkProofPanel ─────────────────────────────────────────────────
   Replaces the prior SampleAuditCard (synthetic DQI + biases + what-if
   stack). The synthetic card asked cold readers to parse domain
   vocabulary (DQI score / Knowledge Graph / EU AI Act Art 14) before
   the trust to do that work had been earned — three rounds of persona +
   blind reads (8 readers total) all flagged it as proof-of-concept
   theater rather than evidence. This panel anchors the proof to the
   public WeWork S-1 (2019), a famous outcome every buyer recognises
   without being primed. The whole panel is a clickable card that
   opens the existing DPR sample PDF in a new tab — the validation
   path Elena, Sarah, David, and the blind readers explicitly asked
   for. No "ILLUSTRATIVE" or "synthetic sample" disclaimer needed.
   Em-dash discipline: the page's one allowed em-dash lives in the
   pain-stat tag in the left column, so this panel uses colons +
   middle-dots throughout. */

function WeWorkProofPanel() {
  const biases = [
    {
      name: 'Overconfidence',
      finding:
        'adjusted EBITDA excluded standard operating costs (marketing, design, member acquisition) and was presented as the headline metric.',
      sev: '#DC2626',
    },
    {
      name: 'Anchoring',
      finding:
        'every projection tethered to the $47B private valuation set by SoftBank, not to market comparables.',
      sev: '#D97706',
    },
    {
      name: 'Sunk cost',
      finding:
        '$4B+ of prior funding shaped the IPO as the only path forward, narrowing the alternatives the document considered.',
      sev: '#D97706',
    },
  ];

  return (
    <a
      className="wework-proof-panel"
      href="/dpr-sample-wework.pdf"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('hero_dpr_sample_clicked')}
      style={{
        width: '100%',
        maxWidth: 520,
        borderRadius: 18,
        background: C.white,
        border: `1px solid ${C.slate200}`,
        boxShadow:
          '0 32px 64px -20px rgba(15,23,42,0.22), 0 16px 36px -16px rgba(15,23,42,0.12), 0 2px 4px rgba(15,23,42,0.04)',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        transform: 'perspective(1600px) rotateY(-1.4deg)',
        transformOrigin: 'left center',
        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s',
        display: 'block',
      }}
    >
      {/* Reduced-motion: drop the perspective rotation + hover transform.
          Mobile: drop both perspective and the rightward shadow bias so
          the card sits flat in the stacked column. */}
      <style>{`
        .wework-proof-panel:hover {
          transform: perspective(1600px) rotateY(-1.4deg) translateY(-3px) !important;
          box-shadow: 0 38px 72px -20px rgba(15,23,42,0.26), 0 18px 40px -16px rgba(15,23,42,0.14), 0 2px 4px rgba(15,23,42,0.04) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .wework-proof-panel,
          .wework-proof-panel:hover {
            transform: none !important;
            transition: none !important;
          }
        }
        @media (max-width: 900px) {
          .wework-proof-panel,
          .wework-proof-panel:hover {
            transform: none !important;
          }
          .wework-proof-panel {
            max-width: 560px !important;
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>

      {/* Title bar */}
      <div
        style={{
          padding: '16px 22px',
          borderBottom: `1px solid ${C.slate200}`,
          background: C.slate50,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.green,
            marginBottom: 6,
          }}
        >
          What we&apos;d have flagged in the WeWork S-1
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.slate500,
            fontWeight: 500,
          }}
        >
          Public document &middot; 2019 IPO prospectus &middot; 60-second audit
        </div>
      </div>

      {/* Body — three biases */}
      <div style={{ padding: '20px 22px 18px' }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.slate500,
            marginBottom: 14,
          }}
        >
          Three biases the prospectus carried
        </div>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 13,
          }}
        >
          {biases.map(b => (
            <li
              key={b.name}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: b.sev,
                  flexShrink: 0,
                  marginTop: 7,
                }}
              />
              <div style={{ fontSize: 13.5, color: C.slate900, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>{b.name}:</span>
                <span style={{ color: C.slate700 }}> {b.finding}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA footer — visible affordance for the clickable panel */}
      <div
        style={{
          padding: '14px 22px',
          borderTop: `1px solid ${C.slate200}`,
          background: C.slate50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            color: C.green,
          }}
        >
          <FileText size={14} />
          Read the full Decision Provenance Record
          <ArrowRight size={14} />
        </span>
        <span
          style={{
            fontSize: 11,
            color: C.slate500,
            fontWeight: 600,
          }}
        >
          PDF &middot; opens in new tab
        </span>
      </div>
    </a>
  );
}
