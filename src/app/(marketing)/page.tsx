'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics/track';
import { CaseStudyCarousel } from '@/components/marketing/CaseStudyCarousel';
import { LossAversionChart } from '@/components/marketing/LossAversionChart';
import {
  Brain,
  FileSearch,
  TrendingUp,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  BarChart3,
  Users,
  Shield,
  Zap,
  Target,
  Network,
  AlertTriangle,
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
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenDark: '#15803D',
  teal: '#0D9488',
  tealBg: '#E0F2F1',
} as const;

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
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

// ── Competitor Comparison Card (FAQ right panel) ──────────────────────────

type CompetitorTab = 'cloverpop' | 'mckinsey';

const COMPETITOR_DATA: Record<
  CompetitorTab,
  {
    name: string;
    tagline: string;
    rows: Array<{ dimension: string; them: string; us: string; usWins: boolean }>;
  }
> = {
  cloverpop: {
    name: 'Cloverpop',
    tagline: 'Acquired 2023 · Decision tracking, no bias detection',
    rows: [
      {
        dimension: 'What they do',
        them: 'Decision tracking & workflow',
        us: 'AI bias detection + calibration',
        usWins: true,
      },
      { dimension: 'Bias detection', them: 'None', us: '20 types, automated', usWins: true },
      {
        dimension: 'Outcome flywheel',
        them: 'Partial (tracking only)',
        us: 'Full (3-channel passive)',
        usWins: true,
      },
      {
        dimension: 'Compliance mapping',
        them: 'None',
        us: '7 frameworks + audit packet',
        usWins: true,
      },
      { dimension: 'Speed', them: 'N/A', us: '<60s per document', usWins: true },
      { dimension: 'Toxic combinations', them: 'None', us: '18 named patterns', usWins: true },
    ],
  },
  mckinsey: {
    name: 'McKinsey / BCG',
    tagline: 'Management consulting · $500K–$2M per engagement',
    rows: [
      {
        dimension: 'What they do',
        them: 'Manual decision review',
        us: 'AI bias detection + calibration',
        usWins: true,
      },
      { dimension: 'Cost', them: '$500K–$2M / engagement', us: '$129/mo Pro', usWins: true },
      { dimension: 'Speed', them: '6–12 weeks', us: 'Minutes per document', usWins: true },
      { dimension: 'Continuous', them: 'No (point-in-time)', us: 'Yes (always-on)', usWins: true },
      { dimension: 'Auditor has biases?', them: 'Yes', us: 'No — AI has zero ego', usWins: true },
      { dimension: 'Outcome flywheel', them: 'No', us: 'Yes — improves with data', usWins: true },
    ],
  },
};

function CompetitorComparisonCard() {
  const [activeTab, setActiveTab] = useState<CompetitorTab>('cloverpop');
  const data = COMPETITOR_DATA[activeTab];

  return (
    <div
      style={{
        border: `1px solid ${C.slate200}`,
        borderRadius: 16,
        background: C.white,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${C.slate200}` }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.green,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 8,
          }}
        >
          How We Compare
        </p>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.slate900, marginBottom: 16 }}>
          Decision Intel vs
        </h3>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0 }}>
          {(Object.keys(COMPETITOR_DATA) as CompetitorTab[]).map(tab => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${C.green}` : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? C.green : C.slate400,
                  transition: 'all 0.15s',
                }}
              >
                {COMPETITOR_DATA[tab].name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Competitor tagline */}
      <div
        style={{
          padding: '12px 24px',
          background: C.slate50,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <p style={{ fontSize: 12, color: C.slate400, margin: 0, fontStyle: 'italic' }}>
          {data.tagline}
        </p>
      </div>

      {/* Comparison rows */}
      <div style={{ padding: '0 24px' }}>
        {data.rows.map((row, i) => (
          <div
            key={row.dimension}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
              padding: '14px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${C.slate100}`,
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: C.slate600 }}>{row.dimension}</div>
            <div
              style={{
                fontSize: 13,
                color: C.slate400,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  background: '#FEE2E2',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: '#EF4444',
                  flexShrink: 0,
                }}
              >
                ✕
              </span>
              {row.them}
            </div>
            <div
              style={{
                fontSize: 13,
                color: C.slate900,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: row.usWins ? '#F0FDF4' : 'transparent',
                padding: '4px 8px',
                borderRadius: 6,
                margin: '-4px -8px',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  background: '#DCFCE7',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: C.green,
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              {row.us}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: `1px solid ${C.slate200}`,
          background: C.slate50,
          textAlign: 'center',
        }}
      >
        <a
          href="/demo"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.green,
            textDecoration: 'none',
          }}
        >
          See it in action →
        </a>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

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
            maxWidth: 1200,
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
            {['Features', 'How It Works', 'Case Studies', 'Pricing'].map(item => {
              const href =
                item === 'Case Studies'
                  ? '/case-studies'
                  : `#${item.toLowerCase().replace(/\s+/g, '-')}`;
              return (
                <a
                  key={item}
                  href={href}
                  style={{
                    fontSize: 14,
                    color: '#CBD5E1',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  {item}
                </a>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="hidden-mobile">
            <Link
              href="/login"
              style={{ fontSize: 14, color: '#CBD5E1', textDecoration: 'none', fontWeight: 500 }}
            >
              Sign In
            </Link>
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
            {['Features', 'How It Works', 'Case Studies', 'Pricing'].map(item => {
              const href =
                item === 'Case Studies'
                  ? '/case-studies'
                  : `#${item.toLowerCase().replace(/\s+/g, '-')}`;
              return (
                <a
                  key={item}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  style={{
                    fontSize: 15,
                    color: '#CBD5E1',
                    textDecoration: 'none',
                    padding: '8px 0',
                  }}
                >
                  {item}
                </a>
              );
            })}
            <Link
              href="/login"
              style={{ fontSize: 15, color: '#CBD5E1', textDecoration: 'none', padding: '8px 0' }}
            >
              Sign In
            </Link>
            <Link
              href="/demo"
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
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 60px' }}>
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.5 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.green,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}
            >
              Grammarly for strategic decisions
            </p>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: C.slate900,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                marginBottom: 20,
              }}
            >
              Every memo has biases.
              <br />
              <span style={{ color: C.green }}>We find them in 60 seconds.</span>
            </h1>
            <p
              style={{
                fontSize: 18,
                color: C.slate600,
                lineHeight: 1.7,
                marginBottom: 32,
                maxWidth: 520,
              }}
            >
              Grammarly catches grammar errors before you hit send. Decision Intel catches cognitive
              biases before you sign the deal. Upload any strategic document &mdash; board memo,
              deal thesis, strategy proposal &mdash; and get a comprehensive bias audit with
              compliance mapping, noise measurement, and a calibrated risk score in under a minute.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/demo"
                onClick={() => trackEvent('hero_try_demo_clicked')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: C.white,
                  background: C.green,
                  padding: '12px 24px',
                  borderRadius: 10,
                  textDecoration: 'none',
                }}
              >
                Find what your team missed <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: C.slate900,
                  background: C.white,
                  padding: '12px 24px',
                  borderRadius: 10,
                  border: `1px solid ${C.slate200}`,
                  textDecoration: 'none',
                }}
              >
                See your hidden risk &mdash; free
              </Link>
            </div>
            <div
              style={{
                marginTop: 28,
                padding: '16px 20px',
                borderLeft: `3px solid ${C.green}`,
                background: C.greenLight,
                borderRadius: 6,
                maxWidth: 520,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.green,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 6,
                }}
              >
                The job you&rsquo;re hiring us for
              </div>
              <p style={{ fontSize: 14, color: C.slate600, lineHeight: 1.6, margin: 0 }}>
                When my team is about to commit on a decision that looks right, help me know whether
                our conviction survives a blind, unbiased stress test &mdash; so we can move forward
                with confidence or pause before it&rsquo;s irreversible.
              </p>
            </div>
          </div>
          {/* Loss Aversion Chart — shows hidden decision costs */}
          <LossAversionChart />
        </motion.div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────────── */}
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
            padding: '48px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 24,
            textAlign: 'center',
          }}
          className="stats-grid"
        >
          {[
            {
              icon: BarChart3,
              value: '55%',
              label: 'Of your decision risk is invisible to your team',
              sub: 'Kahneman, "Noise" (2021)',
              href: null as string | null,
            },
            {
              icon: AlertTriangle,
              value: '$1.3T',
              label: 'Lost annually to decisions nobody audits',
              sub: 'McKinsey, Malmendier & Tate',
              href: null as string | null,
            },
            {
              icon: TrendingUp,
              value: '146',
              label: 'Preventable failures we reverse-engineered',
              sub: '8 industries, SEC filings & NTSB reports',
              href: '/case-studies' as string | null,
            },
            {
              icon: Zap,
              value: '<60s',
              label: 'To find what your team missed',
              sub: '11-agent pipeline, 20+ biases',
              href: null as string | null,
            },
          ].map(({ icon: Icon, value, label, sub, href }) => {
            const content = (
              <>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: C.tealBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} style={{ color: C.teal }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: C.slate900, lineHeight: 1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 13, color: C.slate600, marginTop: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, color: C.slate400, marginTop: 1 }}>{sub}</div>
                </div>
              </>
            );
            const baseStyle = {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            } as const;
            if (href) {
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => trackEvent('stats_chip_click', { href })}
                  style={{ ...baseStyle, textDecoration: 'none', color: 'inherit' }}
                >
                  {content}
                </Link>
              );
            }
            return (
              <div key={label} style={baseStyle}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Case Study Carousel ─────────────────────────────────────── */}
      <CaseStudyCarousel />

      {/* ── How It Works ────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
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
          <p style={{ fontSize: 18, color: C.slate600, marginBottom: 48, maxWidth: 560 }}>
            From strategic document to verified outcome &mdash; for any decision-critical team.
          </p>
        </motion.div>

        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
          className="cards-grid"
        >
          {[
            {
              icon: FileSearch,
              phase: 'PHASE_01',
              num: '01',
              title: 'Upload the document',
              desc: 'Drop in board memos, deal theses, strategy proposals, diligence reports, or any decision document. Capture each stakeholder\u2019s prior belief privately, before the room starts reinforcing itself.',
              bullets: [
                'PDF, DOCX, Excel, CSV support',
                'Decision framing with success/failure criteria',
                'Blind prior collection before group discussion',
                'Slack integration for real-time capture',
              ],
              color: '#3B82F6',
              colorBg: '#EFF6FF',
            },
            {
              icon: Brain,
              phase: 'PHASE_02',
              num: '02',
              title: 'Get the blind second opinion',
              desc: 'An 11-agent pipeline stress-tests the document: 20+ biases detected, a three-judge statistical jury measures noise, and a simulated boardroom argues against your proposal before your real one does.',
              bullets: [
                '20+ cognitive biases with confidence scores',
                '3 independent noise judges (Kahneman)',
                'Boardroom simulation with custom personas',
                'Fact-checking via Google Search grounding',
              ],
              color: '#8B5CF6',
              colorBg: '#F5F3FF',
            },
            {
              icon: TrendingUp,
              phase: 'PHASE_03',
              num: '03',
              title: 'Know why your team believed what they believed',
              desc: 'Outcomes are detected automatically from follow-up documents, Slack, and web intelligence. Every deal closes the feedback loop, so your next conviction is measurably more trustworthy than your last.',
              bullets: [
                'Autonomous outcome detection',
                'Calibration dashboards',
                'Bias cost estimates',
                'Toxic combination alerts with mitigation playbooks',
              ],
              color: C.green,
              colorBg: C.greenLight,
            },
          ].map((card, i) => {
            const Icon = card.icon;
            const isOpen = expandedCard === i;
            return (
              <motion.div
                key={card.title}
                {...fadeIn}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{
                  background: C.white,
                  border: `1px solid ${isOpen ? card.color : C.slate200}`,
                  borderRadius: 16,
                  padding: 32,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: isOpen ? `0 4px 12px rgba(0,0,0,0.08)` : '0 1px 3px rgba(0,0,0,0.06)',
                }}
                onClick={() => setExpandedCard(isOpen ? null : i)}
              >
                {/* Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: card.colorBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} style={{ color: card.color }} />
                  </div>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      background: isOpen ? C.slate900 : C.green,
                      color: C.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 600,
                      transition: 'background 0.2s',
                    }}
                  >
                    {isOpen ? '−' : '+'}
                  </div>
                </div>

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.slate400,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: 8,
                    }}
                  >
                    {card.phase}
                  </p>
                  <h3
                    style={{ fontSize: 22, fontWeight: 700, color: C.slate900, marginBottom: 12 }}
                  >
                    {card.title}
                  </h3>
                  <p style={{ fontSize: 15, color: C.slate600, lineHeight: 1.6 }}>{card.desc}</p>

                  {/* Expanded Content */}
                  {isOpen && (
                    <div
                      style={{
                        marginTop: 20,
                        paddingTop: 20,
                        borderTop: `1px solid ${C.slate200}`,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.slate400,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          marginBottom: 12,
                        }}
                      >
                        Key Capabilities
                      </p>
                      <ul
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        {card.bullets.map(b => (
                          <li
                            key={b}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              fontSize: 14,
                              color: C.slate600,
                            }}
                          >
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                background: C.green,
                                marginTop: 7,
                                flexShrink: 0,
                              }}
                            />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 13, color: C.slate400, fontFamily: 'monospace' }}>
            ── Fully automated pipeline ──
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
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
              desc: '20+ biases detected with confidence scores, excerpts, and research-backed explanations. 11 additional investment-specific biases for PE/VC.',
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
              icon: Network,
              title: 'Decision Knowledge Graph',
              desc: 'Every decision becomes a node. Edges reveal influence chains, shared biases, and cascading risks across your portfolio.',
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

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
          <motion.div
            {...fadeIn}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
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
              Pricing
            </p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.slate900, marginBottom: 12 }}>
              Simple, Transparent Pricing
            </h2>
            <p
              style={{
                fontSize: 15,
                color: C.slate500,
                margin: '0 auto 24px',
                maxWidth: 520,
                lineHeight: 1.5,
              }}
            >
              The average bad deal costs <span style={{ fontWeight: 700, color: C.slate900 }}>$8.2M</span>.
              {' '}Your team&apos;s decision audit costs <span style={{ fontWeight: 700, color: C.green }}>$349/month</span>.
            </p>

            {/* Annual/Monthly Toggle */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 999,
                padding: 4,
              }}
            >
              <button
                onClick={() => setIsAnnual(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: !isAnnual ? C.green : 'transparent',
                  color: !isAnnual ? C.white : C.slate600,
                  transition: 'all 0.2s',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isAnnual ? C.green : 'transparent',
                  color: isAnnual ? C.white : C.slate600,
                  transition: 'all 0.2s',
                }}
              >
                Annual <span style={{ fontSize: 11, opacity: 0.8 }}>Save 20%</span>
              </button>
            </div>
          </motion.div>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
            className="pricing-grid"
          >
            {[
              {
                name: 'Starter',
                price: 0,
                priceAnnual: 0,
                desc: 'Try the bias engine on 3 strategic documents',
                features: [
                  '3 analyses/month',
                  '5 bias types',
                  '10 pages per doc',
                  '3 team seats',
                  'Community support',
                ],
                cta: 'Get Started',
                action: () => {
                  window.location.href =
                    '/login?redirect=' + encodeURIComponent('/?scrollTo=pricing');
                },
                outline: true,
                popular: false,
              },
              {
                name: 'Professional',
                price: 349,
                priceAnnual: 279,
                desc: 'For decision-makers running strategic documents through the gauntlet',
                features: [
                  '50 analyses/month',
                  '20+ bias types',
                  '100 pages per doc',
                  '10 team seats',
                  'Outcome tracking',
                  'Decision Twin',
                ],
                cta: 'Start Free Trial',
                action: () => handleCheckout('pro'),
                loading: checkoutLoading === 'pro',
                outline: false,
                popular: false,
              },
              {
                name: 'Team',
                price: 999,
                priceAnnual: 799,
                desc: 'For decision committees with document pipeline + Slack',
                features: [
                  '250 analyses/month',
                  'Everything in Pro',
                  '50 team seats',
                  'Slack integration',
                  'Decision Rooms',
                  'Compliance mapping',
                  'Team calibration',
                ],
                cta: 'Start Free Trial',
                action: () => handleCheckout('team'),
                loading: checkoutLoading === 'team',
                outline: false,
                popular: true,
              },
              {
                name: 'Enterprise',
                price: -1,
                priceAnnual: -1,
                desc: 'For enterprise teams with dedicated support and custom workflows',
                features: [
                  'Unlimited analyses',
                  'Everything in Team',
                  'Unlimited team seats',
                  'SSO & custom taxonomy',
                  'Dedicated support',
                  'Custom playbooks',
                  'SLA guarantee',
                ],
                cta: 'Contact Sales',
                action: () => {
                  window.location.href =
                    'mailto:folahanwilliams@gmail.com?subject=Enterprise%20Inquiry';
                },
                outline: true,
                popular: false,
              },
            ].map((tier, i) => {
              const displayPrice = isAnnual ? tier.priceAnnual : tier.price;
              return (
                <motion.div
                  key={tier.name}
                  {...fadeIn}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  style={{
                    background: C.white,
                    border: tier.popular ? `2px solid ${C.green}` : `1px solid ${C.slate200}`,
                    borderRadius: 16,
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: tier.popular
                      ? '0 4px 12px rgba(22,163,74,0.12)'
                      : '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {tier.popular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: C.green,
                        color: C.white,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 14px',
                        borderRadius: 999,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Most Popular
                    </div>
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.slate900, marginBottom: 4 }}>
                    {tier.name}
                  </h3>
                  <div style={{ marginBottom: 12 }}>
                    {displayPrice === -1 ? (
                      <span style={{ fontSize: 32, fontWeight: 800, color: C.slate900 }}>
                        Custom
                      </span>
                    ) : displayPrice === 0 ? (
                      <span style={{ fontSize: 32, fontWeight: 800, color: C.slate900 }}>
                        $0
                        <span style={{ fontSize: 14, fontWeight: 500, color: C.slate400 }}>
                          /mo
                        </span>
                      </span>
                    ) : (
                      <span style={{ fontSize: 32, fontWeight: 800, color: C.slate900 }}>
                        ${displayPrice}
                        <span style={{ fontSize: 14, fontWeight: 500, color: C.slate400 }}>
                          /mo
                        </span>
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: C.slate600, marginBottom: 20, lineHeight: 1.5 }}>
                    {tier.desc}
                  </p>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      flex: 1,
                    }}
                  >
                    {tier.features.map(f => (
                      <li
                        key={f}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          color: C.slate600,
                        }}
                      >
                        <Check size={14} style={{ color: C.green, flexShrink: 0 }} /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={tier.action}
                    disabled={tier.loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 10,
                      border: tier.outline ? `1px solid ${C.slate200}` : 'none',
                      background: tier.outline ? C.white : C.green,
                      color: tier.outline ? C.slate900 : C.white,
                      cursor: tier.loading ? 'wait' : 'pointer',
                      opacity: tier.loading ? 0.7 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {tier.loading ? 'Redirecting...' : tier.cta}
                  </button>
                </motion.div>
              );
            })}
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: C.slate400, marginTop: 24 }}>
            All paid plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </section>

      {/* ── FAQ + Competitor Comparison (quarter-point centered layout) ── */}
      <section id="faq" style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 24px' }}>
        {/* Two-column grid: each column centered at the page quarter-points
            (25% and 75% of the full width). The grid uses equal 1fr columns
            with generous internal padding so content sits at the visual
            center of each half-space. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
          }}
          className="faq-grid"
        >
          {/* Left quarter — FAQ heading + accordion */}
          <div
            style={{ display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}
          >
            <motion.div {...fadeIn} transition={{ duration: 0.5 }} style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: C.slate900, lineHeight: 1.2 }}>
                Frequently Asked
                <br />
                Questions
              </h2>
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  q: 'How is sensitive data protected?',
                  a: 'All documents are encrypted with AES-256-GCM at rest and TLS 1.3 in transit. A GDPR anonymization layer removes PII before any AI processing. Your data never leaves our SOC 2 certified infrastructure.',
                },
                {
                  q: 'How long does integration take?',
                  a: 'Less than 30 minutes. Upload documents directly, connect via OAuth for Slack, or use our REST API for bulk processing.',
                },
                {
                  q: 'How does outcome tracking work?',
                  a: 'Outcomes are detected automatically from follow-up documents, Slack messages, and web intelligence. You confirm with one click. Each reported outcome makes your future analyses more accurate.',
                },
                {
                  q: 'How is this different from ChatGPT?',
                  a: 'ChatGPT gives one opinion from one model. We use 3 independent judges for noise measurement, a 20×20 bias interaction matrix for compound scoring, 31 domain-specific biases, and an outcome flywheel that gets smarter with every decision.',
                },
              ].map(({ q, a }, i) => {
                const isOpen = openFAQ === i;
                return (
                  <div
                    key={q}
                    style={{
                      border: `1px solid ${C.slate200}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: C.white,
                    }}
                  >
                    <button
                      onClick={() => setOpenFAQ(isOpen ? null : i)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '18px 24px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: 16,
                        fontWeight: 600,
                        color: C.slate900,
                        textAlign: 'left',
                      }}
                    >
                      {q}
                      {isOpen ? (
                        <ChevronUp size={18} style={{ color: C.slate400, flexShrink: 0 }} />
                      ) : (
                        <ChevronDown size={18} style={{ color: C.slate400, flexShrink: 0 }} />
                      )}
                    </button>
                    {isOpen && (
                      <div
                        style={{
                          padding: '0 24px 18px',
                          fontSize: 15,
                          color: C.slate600,
                          lineHeight: 1.7,
                        }}
                      >
                        {a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right quarter — Competitor Comparison Card */}
          <div style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
            <CompetitorComparisonCard />
          </div>
        </div>
      </section>

      {/* Responsive override for the 2-column FAQ layout on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .faq-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}` }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.slate900, marginBottom: 16 }}>
              Ready to Audit Your Decision Process?
            </h2>
            <p style={{ fontSize: 18, color: C.slate600, marginBottom: 32 }}>
              Start with a free analysis. No credit card needed.
            </p>
            <Link
              href="/login"
              onClick={() => trackEvent('final_cta_clicked')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 16,
                fontWeight: 600,
                color: C.white,
                background: C.green,
                padding: '14px 32px',
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                marginTop: 24,
                flexWrap: 'wrap',
              }}
            >
              {['No credit card required', '14-day free trial', 'SOC 2 infrastructure'].map(t => (
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
      </section>

      {/* ── Newsletter ─────────────────────────────────────────────── */}
      <section style={{ background: '#0B1120', borderTop: '1px solid #1E293B' }}>
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '64px 24px',
            textAlign: 'center',
          }}
        >
          <h3
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: C.white,
              marginBottom: 8,
            }}
          >
            The Decision Intelligence Brief
          </h3>
          <p
            style={{
              fontSize: 15,
              color: '#94A3B8',
              lineHeight: 1.7,
              marginBottom: 24,
              maxWidth: 520,
              marginLeft: 'auto',
              marginRight: 'auto',
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
              The Decision Performance OS for M&A and investment teams. Audit cognitive bias,
              measure decision noise, and track outcomes.
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
            {['Features', 'How It Works', 'Case Studies', 'Pricing', 'Resources'].map(l => {
              const href =
                l === 'Case Studies' ? '/case-studies' : `#${l.toLowerCase().replace(/\s+/g, '-')}`;
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
              href="mailto:folahanwilliams@gmail.com"
              style={{
                display: 'block',
                fontSize: 14,
                color: '#94A3B8',
                textDecoration: 'none',
                marginBottom: 10,
              }}
            >
              folahanwilliams@gmail.com
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
            fontSize: 13,
            color: '#64748B',
          }}
        >
          <span>Flat. Resolution. Desktop Landing page UI</span>
          <span>All rights reserved</span>
        </div>
      </footer>

      {/* ── Responsive Styles ───────────────────────────────────────── */}
      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile-only { display: none; }

        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile-only { display: block !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .cards-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          h1 { font-size: 36px !important; }
          h2 { font-size: 28px !important; }
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
