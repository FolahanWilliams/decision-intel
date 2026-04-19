'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics/track';
import { CaseStudyCarousel } from '@/components/marketing/CaseStudyCarousel';
import { HeroDecisionGraph } from '@/components/marketing/HeroDecisionGraph';
import { HeroCounterfactualTease } from '@/components/marketing/HeroCounterfactualTease';
import { PipelineLandingTeaser } from '@/components/marketing/how-it-works/PipelineLandingTeaser';
import { OutcomeDetectionViz } from '@/components/marketing/how-it-works/OutcomeDetectionViz';
import { CategoryGapShowcase } from '@/components/marketing/CategoryGapShowcase';
import { BookDemoCTA } from '@/components/marketing/BookDemoCTA';
import { CompetitorComparisonCard } from '@/components/marketing/CompetitorComparisonCard';
import { LandingFaq } from '@/components/marketing/LandingFaq';
import { Reveal } from '@/components/ui/Reveal';
import {
  Brain,
  FileSearch,
  ArrowRight,
  Menu,
  X,
  Check,
  BarChart3,
  Users,
  Shield,
  Target,
  ShieldCheck,
  FileCheck2,
  Scale,
  BookOpen,
} from 'lucide-react';

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
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // After login redirects back to /?scrollTo=pricing, scroll to the
  // pricing section so the user picks up where they left off.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get('scrollTo');
    if (target) {
      // Small delay so the page has time to render the section
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Clean up the URL so refreshing doesn't re-scroll
        const clean = new URL(window.location.href);
        clean.searchParams.delete('scrollTo');
        window.history.replaceState({}, '', clean.pathname + clean.hash);
      }, 300);
    }
  }, []);

  const handleCheckout = async (plan: 'pro' | 'team') => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent('/?scrollTo=pricing')}`;
        return;
      }
      if (res.status === 503) {
        alert('Stripe is not configured yet. Please check back soon!');
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div style={{ background: C.white, color: C.slate900 }}>
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

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1400, margin: '0 auto', padding: '88px 24px 64px' }}>
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.5 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 48,
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginBottom: 14,
              }}
            >
              Decision Intelligence
            </p>
            <h1
              style={{
                fontSize: 'clamp(30px, 5.2vw, 52px)',
                fontWeight: 800,
                color: C.slate900,
                lineHeight: 1.08,
                letterSpacing: '-0.025em',
                marginBottom: 22,
              }}
            >
              The human-AI governance system for{' '}
              <span style={{ color: C.green }}>strategic decisions.</span>
            </h1>
            <p
              style={{
                fontSize: 18,
                color: C.slate600,
                lineHeight: 1.6,
                marginBottom: 28,
                maxWidth: 560,
              }}
            >
              Decision Intel audits every board memo, simulates steering-committee objections, runs
              what-if interventions, and compounds your team&rsquo;s judgment into a living Decision
              Knowledge Graph&nbsp;&mdash; so decision quality, scalability, and reliability improve
              quarter after quarter.
            </p>
            <div style={{ marginBottom: 22 }}>
              <HeroCounterfactualTease />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
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
                  padding: '13px 26px',
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
                  padding: '13px 8px',
                }}
              >
                How it works <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          {/* Single clean visual: 3D Decision Knowledge Graph (WeWork S-1 sample) */}
          <HeroDecisionGraph />
        </motion.div>
      </section>

      {/* ── Trust strip (compliance-only, no fabricated logos) ──────── */}
      <section
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
            padding: '20px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            rowGap: 12,
          }}
          className="trust-strip"
        >
          {[
            { Icon: ShieldCheck, label: 'SOC 2 ready' },
            { Icon: FileCheck2, label: 'GDPR + EU AI Act mapped' },
            { Icon: BookOpen, label: '135-case public reference library' },
            { Icon: Scale, label: 'Advised by operators who built Wiz to $32B' },
          ].map(({ Icon, label }) => (
            <div
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12.5,
                fontWeight: 600,
                color: C.slate600,
                letterSpacing: '0.01em',
              }}
            >
              <Icon size={14} style={{ color: C.green, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Four Moments (core value proposition) ───────────────────── */}
      <Reveal repeat>
        <section
          id="four-moments"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 24px' }}
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
              What you get
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
              The four moments that compound your team&rsquo;s judgment.
            </h2>
            <p
              style={{
                fontSize: 17,
                color: C.slate600,
                lineHeight: 1.6,
                maxWidth: 720,
                marginBottom: 56,
              }}
            >
              Every high-stakes call flows through the same four moments. Decision Intel governs
              each one, and the compounding happens automatically.
            </p>
          </motion.div>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}
            className="cards-grid"
          >
            {[
              {
                num: '01',
                eyebrow: 'Decision Knowledge Graph',
                title: 'Every strategic call, compounded into one living graph.',
                body: (
                  <>
                    Every board memo, market-entry recommendation, and M&amp;A paper your team
                    writes becomes a node in one navigable graph&nbsp;&mdash; connected by
                    assumption, bias, and outcome. Today&rsquo;s decision always inherits
                    yesterday&rsquo;s lessons.
                  </>
                ),
              },
              {
                num: '02',
                eyebrow: 'AI boardroom simulation',
                title: 'Walk in with every objection already answered.',
                body: (
                  <>
                    Every memo runs past a role-primed AI boardroom of CEO, CFO, board, and
                    division-lead personas. You see the questions your steering committee will raise
                    before the meeting&nbsp;&mdash; not on your third draft of the deck.
                  </>
                ),
              },
              {
                num: '03',
                eyebrow: 'Human-AI reasoning audit',
                title: 'Governance, not a black box.',
                body: (
                  <>
                    Your team keeps the judgment. The system keeps the receipts. Every
                    cognitive-bias signal, noise measurement, and evidence excerpt is traceable to
                    the exact line in your memo that triggered it&nbsp;&mdash; so every
                    recommendation is defensible, not just delivered.
                  </>
                ),
              },
              {
                num: '04',
                eyebrow: 'What-if + Decision Quality Index',
                title: 'Run what-if before the call, prove quality after.',
                body: (
                  <>
                    Before the decision: run what-if interventions to see how removing a bias or
                    reframing an assumption changes outcome probability. After: every call earns a
                    Decision Quality Index that{' '}
                    <em style={{ color: C.green, fontStyle: 'italic', fontWeight: 700 }}>
                      compounds
                    </em>{' '}
                    into proprietary proof your team&rsquo;s judgment is sharpening.
                  </>
                ),
              },
            ].map((m, i) => (
              <motion.div
                key={m.num}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 16,
                  padding: '36px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: C.green,
                      background: C.greenLight,
                      padding: '4px 10px',
                      borderRadius: 6,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {m.num}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.slate500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {m.eyebrow}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.slate900,
                    lineHeight: 1.25,
                    letterSpacing: '-0.015em',
                    margin: 0,
                  }}
                >
                  {m.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    color: C.slate600,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {m.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </Reveal>

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
                One governed system in place of four broken ones.
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
                Decision Intel doesn&rsquo;t add a tool to your stack &mdash; it retires the
                patchwork of workarounds your strategy team uses to compensate for the fact that
                judgment has never had a governance layer.
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
                  Before &middot; today&rsquo;s stack
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
                      label: 'Gut calls under deadline pressure',
                      sub: 'No record of the reasoning, no way to audit it later.',
                    },
                    {
                      label: '40-page consulting decks',
                      sub: 'Expensive, not repeatable, and gone the next quarter.',
                    },
                    {
                      label: 'Post-mortems that never compound',
                      sub: 'Lessons live in one analyst&rsquo;s laptop, then churn out.',
                    },
                    {
                      label: 'BI dashboards that ignore the memo',
                      sub: 'Data has governance; the reasoning on top of it does not.',
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
                  One governed system that scores, simulates, and compounds.
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
                      label: 'Governance on the reasoning, not just the data',
                      sub: 'Counterfactuals, AI boardroom, outcome loop &mdash; all on the memo itself.',
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

      {/* ── Category we're defining: three capability tabs ──────────── */}
      <Reveal repeat>
        <CategoryGapShowcase />
      </Reveal>

      {/* ── Proof: real failures, audited in hindsight ──────────────── */}
      <Reveal repeat>
        <section
          id="proof"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px 32px' }}
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
              Proof, not logos
            </p>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: C.slate900,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginBottom: 16,
                maxWidth: 820,
              }}
            >
              135 real corporate decisions, audited in hindsight &mdash; with the signals we
              would have caught before the outcome.
            </h2>
            <p
              style={{
                fontSize: 17,
                color: C.slate600,
                lineHeight: 1.6,
                maxWidth: 720,
                marginBottom: 24,
              }}
            >
              Pre-seed we have no pilot logos to paste on a page. What we do have is a
              reproducible library of failures &mdash; every one scored, every bias marked against
              the pre-decision evidence, every outcome matched to what we would have flagged. The
              evidence lives on the next two pages, not behind a login.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 8,
              }}
            >
              <Link
                href="/proof"
                onClick={() => trackEvent('proof_cta_clicked', { target: 'proof' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.white,
                  background: C.green,
                  padding: '11px 20px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(22,163,74,0.22)',
                }}
              >
                Explore the pre-decision evidence <ArrowRight size={14} />
              </Link>
              <Link
                href="/bias-genome"
                onClick={() => trackEvent('proof_cta_clicked', { target: 'bias-genome' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.slate900,
                  background: C.white,
                  padding: '11px 20px',
                  borderRadius: 10,
                  border: `1px solid ${C.slate200}`,
                  textDecoration: 'none',
                }}
              >
                See which biases predict failure <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </section>
      </Reveal>

      {/* ── Case study carousel — evidence strip below the proof header ── */}
      <CaseStudyCarousel />

      {/* ── How It Works ────────────────────────────────────────────── */}
      <Reveal repeat>
        <section
          id="how-it-works"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}
        >
          <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              How it Works
            </p>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: C.slate900,
                marginBottom: 16,
                letterSpacing: '-0.01em',
              }}
            >
              Decision Hygiene in Three Steps
            </h2>
            <p style={{ fontSize: 18, color: C.slate600, marginBottom: 32, maxWidth: 560 }}>
              From strategic document to verified outcome &mdash; for any decision-critical team.
            </p>
          </motion.div>

          {/* 12-node pipeline teaser — what happens INSIDE the 60-second audit */}
          <motion.div
            {...fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ marginBottom: 24 }}
          >
            <PipelineLandingTeaser />
          </motion.div>

          {/* Outcome loop viz — what happens AFTER the audit (complements the teaser) */}
          <motion.div {...fadeIn} transition={{ duration: 0.5, delay: 0.15 }}>
            <OutcomeDetectionViz />
          </motion.div>
        </section>
      </Reveal>

      {/* ── Features ────────────────────────────────────────────────── */}
      <Reveal repeat>
        <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
          <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              Features
            </p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.slate900, marginBottom: 48 }}>
              The Decision Performance OS
            </h2>
          </motion.div>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
            className="cards-grid"
          >
            {[
              {
                icon: Brain,
                title: 'Cognitive Bias Detection',
                desc: '30+ biases detected with confidence scores, excerpts, and research-backed explanations. Includes domain-specific biases for corporate strategy, M&A, and market-entry decisions.',
                color: '#8B5CF6',
                bg: '#F5F3FF',
              },
              {
                icon: BarChart3,
                title: 'Noise Measurement',
                desc: "3 independent AI judges score your document — just like Kahneman's insurance underwriter study. Measures the variance your team doesn't see.",
                color: '#3B82F6',
                bg: '#EFF6FF',
              },
              {
                icon: Users,
                title: 'Decision Rooms',
                desc: 'Blind prior collection before group discussion. Consensus scoring reveals when agreement is genuine vs. groupthink.',
                color: C.teal,
                bg: C.tealBg,
              },
              {
                icon: Target,
                title: 'Toxic Combinations',
                desc: '10 named compound risk patterns (Echo Chamber, Sunk Ship, etc.) with auto-generated mitigation playbooks and dollar impact estimates.',
                color: '#EF4444',
                bg: '#FEF2F2',
              },
              {
                icon: FileSearch,
                title: 'Forgotten Questions',
                desc: 'Surfaces the questions your memo never asks, drawn from the gap between your document and its closest historical analogs. Every question was answered (or fatally ignored) in a comparable real decision.',
                color: '#F59E0B',
                bg: '#FFFBEB',
              },
              {
                icon: Shield,
                title: 'Compliance Mapping',
                desc: 'SOX, GDPR, MiFID II, and FCA Consumer Duty frameworks. Cross-maps detected biases to regulatory risks with audit trails.',
                color: C.green,
                bg: C.greenLight,
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  {...fadeIn}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 16,
                    padding: 28,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: f.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Icon size={20} style={{ color: f.color }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.slate900, marginBottom: 8 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: C.slate600, lineHeight: 1.6 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </Reveal>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}` }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '96px 24px' }}>
          <motion.div
            {...fadeIn}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginBottom: 12,
              }}
            >
              Pricing
            </p>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: C.slate900,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginBottom: 14,
              }}
            >
              A fraction of what a single misjudged decision costs.
            </h2>
            <p
              style={{
                fontSize: 17,
                color: C.slate600,
                margin: '0 auto',
                maxWidth: 640,
                lineHeight: 1.6,
              }}
            >
              Every tier includes the full bias taxonomy, Decision Quality Index, and outcome
              flywheel. You&apos;re choosing the audit volume and the team surface — not a
              feature-gated product.
            </p>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 20,
              maxWidth: 1140,
              margin: '0 auto',
            }}
            className="pricing-grid"
          >
            {[
              {
                name: 'Individual',
                role: 'Solo strategy operator',
                price: 249,
                priceSuffix: '/mo',
                anchor: 'or $2,490/year (save ~16%)',
                desc: 'The career-defining edge for a Head of Strategy, CorpDev lead, or M&A operator who owns the memo.',
                features: [
                  { label: '15 audits per month', strong: true },
                  { label: 'Full DQI + 30+ biases', strong: false },
                  { label: 'Boardroom simulation', strong: false },
                  { label: 'Forgotten Questions engine', strong: false },
                  { label: 'Personal Decision History', strong: false },
                  { label: 'Calibration dashboard', strong: false },
                ],
                cta: 'Start Individual',
                action: () => handleCheckout('pro'),
                loading: checkoutLoading === 'pro',
                outline: true,
                popular: false,
              },
              {
                name: 'Strategy',
                role: 'Corporate strategy team',
                price: 2499,
                priceSuffix: '/mo',
                anchor: 'or $24,990/year · ~10× cheaper than one consulting week',
                desc: 'For teams producing multiple board-level memos a quarter. Built around the shared Decision Knowledge Graph.',
                features: [
                  { label: '250 audits per month · 15 seats', strong: true },
                  { label: 'Shared Decision Knowledge Graph', strong: true },
                  { label: 'Decision Rooms + blind priors', strong: false },
                  { label: 'Slack, Drive, Email integrations', strong: false },
                  { label: 'Compliance mapping + audit logs', strong: false },
                  { label: 'Everything in Individual', strong: false },
                ],
                cta: 'Start 30-day pilot',
                action: () => handleCheckout('team'),
                loading: checkoutLoading === 'team',
                outline: false,
                popular: true,
              },
              {
                name: 'Enterprise',
                role: 'Fortune 500 strategy function',
                price: -1,
                priceSuffix: '',
                anchor: 'Annual · negotiated per seat',
                desc: 'Multi-division workflows, compliance SLAs, and a dedicated deployment partner.',
                features: [
                  { label: 'Unlimited team seats', strong: true },
                  { label: 'SSO + SCIM + custom taxonomy', strong: false },
                  { label: 'Multi-division management', strong: false },
                  { label: 'Signed DPA + audit-log retention SLA', strong: false },
                  { label: 'EU-region hosting option', strong: false },
                  { label: 'Everything in Strategy', strong: false },
                ],
                cta: 'Contact sales',
                action: () => {
                  window.location.href =
                    'mailto:team@decision-intel.com?subject=Enterprise%20Inquiry';
                },
                outline: true,
                popular: false,
              },
            ].map((tier, i) => {
              const displayPrice = tier.price;
              return (
                <motion.div
                  key={tier.name}
                  {...fadeIn}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  style={{
                    background: C.white,
                    border: tier.popular ? `2px solid ${C.green}` : `1px solid ${C.slate200}`,
                    borderRadius: 20,
                    padding: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: tier.popular
                      ? '0 12px 36px rgba(22,163,74,0.14)'
                      : '0 4px 18px rgba(15,23,42,0.05)',
                  }}
                >
                  {tier.popular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -13,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: C.green,
                        color: C.white,
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '5px 14px',
                        borderRadius: 999,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
                      }}
                    >
                      Most popular
                    </div>
                  )}

                  {/* Role chip */}
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: tier.popular ? C.green : C.slate500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      marginBottom: 6,
                    }}
                  >
                    {tier.role}
                  </div>

                  <h3
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: C.slate900,
                      margin: 0,
                      marginBottom: 12,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {tier.name}
                  </h3>

                  <div style={{ marginBottom: 6 }}>
                    {displayPrice === -1 ? (
                      <span style={{ fontSize: 36, fontWeight: 800, color: C.slate900 }}>
                        Custom
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 40,
                          fontWeight: 800,
                          color: C.slate900,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        ${displayPrice.toLocaleString()}
                        <span style={{ fontSize: 15, fontWeight: 500, color: C.slate400 }}>
                          {tier.priceSuffix}
                        </span>
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: C.slate400, margin: 0, marginBottom: 16 }}>
                    {tier.anchor}
                  </p>

                  <p
                    style={{ fontSize: 14, color: C.slate600, marginBottom: 22, lineHeight: 1.55 }}
                  >
                    {tier.desc}
                  </p>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 26px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 11,
                      flex: 1,
                    }}
                  >
                    {tier.features.map(f => (
                      <li
                        key={f.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 13.5,
                          fontWeight: f.strong ? 600 : 500,
                          color: f.strong ? C.slate900 : C.slate600,
                        }}
                      >
                        <span
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
                          }}
                        >
                          <Check size={11} strokeWidth={3} />
                        </span>
                        {f.label}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={tier.action}
                    disabled={tier.loading}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 12,
                      border: tier.outline ? `1px solid ${C.slate200}` : 'none',
                      background: tier.outline ? C.white : C.green,
                      color: tier.outline ? C.slate900 : C.white,
                      cursor: tier.loading ? 'wait' : 'pointer',
                      opacity: tier.loading ? 0.7 : 1,
                      transition: 'all 0.2s',
                      boxShadow: tier.outline ? 'none' : '0 6px 20px rgba(22,163,74,0.28)',
                    }}
                  >
                    {tier.loading ? 'Redirecting…' : tier.cta}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Trust band below the cards — stops the pricing grid from hanging
              in space and gives a calm closing beat. */}
          <div
            style={{
              maxWidth: 1140,
              margin: '40px auto 0',
              padding: '20px 24px',
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 20,
              alignItems: 'center',
            }}
          >
            {[
              { label: 'SOC 2 ready', sub: 'AES-256-GCM + TLS 1.3' },
              { label: 'Signed DPA', sub: 'on any paid tier' },
              { label: 'No training on your data', sub: 'ever, by contract' },
              { label: '30-day pilot', sub: 'on Strategy tier' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: C.greenLight,
                    color: C.green,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: C.slate900, lineHeight: 1.3 }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{ fontSize: 11.5, color: C.slate500, lineHeight: 1.35, marginTop: 1 }}
                  >
                    {item.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <p style={{ fontSize: 13, color: C.slate600, margin: 0 }}>
              Just exploring?{' '}
              <Link
                href="/login"
                style={{ color: C.green, fontWeight: 600, textDecoration: 'none' }}
              >
                Start free
              </Link>{' '}
              with 4 audits a month, no card required.
            </p>
            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: C.slate900,
                textDecoration: 'none',
                padding: '8px 16px',
                border: `1px solid ${C.slate200}`,
                borderRadius: 8,
                background: C.white,
              }}
            >
              See full feature comparison <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

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
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: C.green,
                marginBottom: 12,
              }}
            >
              Answers & alternatives
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
              Everything a buyer asks before signing.
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
              The questions corporate strategy teams actually bring — plus an honest side-by-side
              against the alternatives we lose deals to.
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

      {/* ── Final CTA + Newsletter ──────────────────────────────────── */}
      <section style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}` }}>
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: '80px 24px 48px',
            textAlign: 'center',
          }}
        >
          <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.slate900, marginBottom: 16 }}>
              Ready to compound your team&rsquo;s judgment?
            </h2>
            <p style={{ fontSize: 18, color: C.slate600, marginBottom: 32 }}>
              Run your next strategic memo through Decision Intel in 60 seconds, or bring one
              to a 30-minute call with the founder.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {(() => {
                const bookingUrl = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL;
                const bookingHref = bookingUrl || '/pricing#design-partner';
                const bookingExternal = !!bookingUrl;
                return (
                  <Link
                    href={bookingHref}
                    {...(bookingExternal
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    onClick={() => trackEvent('book_demo_click', { source: 'final_cta' })}
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
                      boxShadow: '0 2px 12px rgba(22, 163, 74, 0.25)',
                    }}
                  >
                    Book a design partner call <ArrowRight size={18} />
                  </Link>
                );
              })()}
              <Link
                href="/login"
                onClick={() => trackEvent('final_cta_clicked')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  color: C.green,
                  background: C.white,
                  border: `1.5px solid #86EFAC`,
                  padding: '14px 32px',
                  borderRadius: 10,
                  textDecoration: 'none',
                }}
              >
                Try Decision Intel free <ArrowRight size={18} />
              </Link>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                marginTop: 24,
                flexWrap: 'wrap',
              }}
            >
              {['30 minutes · no slides', 'Live on your own memo', '4 design-partner seats open'].map(t => (
                <span
                  key={t}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: C.slate400,
                  }}
                >
                  <Check size={14} style={{ color: C.green }} /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Secondary: newsletter capture for the not-ready-yet segment */}
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ borderTop: `1px solid ${C.slate200}` }} />
        </div>
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: '48px 24px 80px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.slate500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 10px',
            }}
          >
            Not ready for a pilot?
          </p>
          <h3
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: C.slate900,
              margin: '0 0 10px',
              letterSpacing: '-0.01em',
            }}
          >
            Get one corporate-decision post-mortem a week.
          </h3>
          <p
            style={{
              fontSize: 14,
              color: C.slate600,
              lineHeight: 1.65,
              margin: '0 auto 20px',
              maxWidth: 480,
            }}
          >
            One real-world case study per week, broken down with the cognitive biases that were
            detectable before the outcome was known. Free, unsubscribe anytime.
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
          .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
          .cards-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .faq-grid { gap: 32px !important; }
          h1 { font-size: 32px !important; }
          h2 { font-size: 26px !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          h1 { font-size: 28px !important; }
        }

        @media (min-width: 769px) and (max-width: 1100px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .cards-grid { grid-template-columns: 1fr 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
