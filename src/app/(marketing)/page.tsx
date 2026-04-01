'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics/track';
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

const fadeIn = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

/* ═══════════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

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
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Brain size={24} style={{ color: C.green }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: '-0.02em' }}>
              Decision Intel
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden-mobile">
            {['Features', 'How It Works', 'Case Studies', 'Pricing'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                style={{ fontSize: 14, color: '#CBD5E1', textDecoration: 'none', fontWeight: 500 }}
              >
                {item}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="hidden-mobile">
            <Link href="/login" style={{ fontSize: 14, color: '#CBD5E1', textDecoration: 'none', fontWeight: 500 }}>
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
            style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer', padding: 4 }}
            className="show-mobile-only"
          >
            {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileNavOpen && (
          <div style={{ background: C.navyLight, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Features', 'How It Works', 'Case Studies', 'Pricing'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMobileNavOpen(false)}
                style={{ fontSize: 15, color: '#CBD5E1', textDecoration: 'none', padding: '8px 0' }}
              >
                {item}
              </a>
            ))}
            <Link href="/login" style={{ fontSize: 15, color: '#CBD5E1', textDecoration: 'none', padding: '8px 0' }}>
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
              The Decision
              <br />
              Performance OS
              <br />
              <span style={{ color: C.green }}>for M&A</span>
            </h1>
            <p style={{ fontSize: 18, color: C.slate600, lineHeight: 1.7, marginBottom: 32, maxWidth: 500 }}>
              M&A teams, corporate development groups, and investment committees
              make high-stakes decisions on incomplete information. Our platform
              audits the cognitive biases hiding in every deal memo — so you can
              swing with confidence.
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
                Try the Demo <ArrowRight size={16} />
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
                Try Free
              </Link>
            </div>
          </div>
          {/* 4-Panel Process Visualization */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {[
              {
                step: '01',
                label: 'Analyze',
                desc: 'Upload deal memos & IC notes',
                icon: '◎',
                color: '#3B82F6',
                bg: '#EFF6FF',
                borderColor: '#BFDBFE',
              },
              {
                step: '02',
                label: 'Graph',
                desc: 'Map decision relationships',
                icon: '⬡',
                color: '#8B5CF6',
                bg: '#F5F3FF',
                borderColor: '#DDD6FE',
              },
              {
                step: '03',
                label: 'Learn',
                desc: 'Track outcomes & calibrate',
                icon: '△',
                color: '#F59E0B',
                bg: '#FFFBEB',
                borderColor: '#FDE68A',
              },
              {
                step: '04',
                label: 'Act',
                desc: 'Mitigate bias & decide better',
                icon: '→',
                color: C.green,
                bg: C.greenLight,
                borderColor: '#BBF7D0',
              },
            ].map((panel, i) => (
              <motion.div
                key={panel.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                style={{
                  background: panel.bg,
                  border: `1px solid ${panel.borderColor}`,
                  borderRadius: 14,
                  padding: '24px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Large faded step number */}
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: 8,
                    fontSize: 64,
                    fontWeight: 800,
                    color: panel.borderColor,
                    lineHeight: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {panel.step}
                </div>
                {/* Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: C.white,
                    border: `1px solid ${panel.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: panel.color,
                    marginBottom: 12,
                    fontWeight: 700,
                  }}
                >
                  {panel.icon}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.slate900, marginBottom: 4, position: 'relative', zIndex: 1 }}>
                  {panel.label}
                </div>
                <div style={{ fontSize: 13, color: C.slate600, position: 'relative', zIndex: 1 }}>
                  {panel.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────────── */}
      <section style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}`, borderBottom: `1px solid ${C.slate200}` }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '48px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 32,
            textAlign: 'center',
          }}
          className="stats-grid"
        >
          {[
            { icon: BarChart3, value: '$36B+', label: 'Market to 2026' },
            { icon: TrendingUp, value: '28%', label: 'Improvement' },
            { icon: Zap, value: '4.5x', label: 'Faster Insights' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
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
                <div style={{ fontSize: 32, fontWeight: 800, color: C.slate900, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 13, color: C.slate600, marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            How it Works
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: C.slate900, marginBottom: 16, letterSpacing: '-0.01em' }}>
            Streamline Your M&A Process
          </h2>
          <p style={{ fontSize: 18, color: C.slate600, marginBottom: 48, maxWidth: 560 }}>
            From deal memo to verified outcome in three steps.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="cards-grid">
          {[
            {
              icon: FileSearch,
              phase: 'PHASE_01',
              num: '01',
              title: 'Capture & Frame',
              desc: 'Upload IC memos, deal theses, diligence reports, or CIMs. Define success criteria and your prior beliefs before the committee reviews.',
              bullets: ['PDF, DOCX, Excel, CSV support', 'Decision framing with success/failure criteria', 'Blind prior collection before group discussion', 'Slack integration for real-time capture'],
              color: '#3B82F6',
              colorBg: '#EFF6FF',
            },
            {
              icon: Brain,
              phase: 'PHASE_02',
              num: '02',
              title: 'AI Cognitive Audit',
              desc: '11-agent pipeline detects 20+ biases, runs a statistical jury for noise, and simulates a boardroom of Decision Twins to stress-test your deal thesis.',
              bullets: ['20+ cognitive biases with confidence scores', '3 independent noise judges (Kahneman)', 'Boardroom simulation with custom personas', 'Fact-checking via Google Search grounding'],
              color: '#8B5CF6',
              colorBg: '#F5F3FF',
            },
            {
              icon: TrendingUp,
              phase: 'PHASE_03',
              num: '03',
              title: 'Track & Improve',
              desc: 'Outcomes are detected automatically from follow-up documents, Slack, and web intelligence. Confirm with one click and watch your calibration sharpen.',
              bullets: ['Autonomous outcome detection', 'Calibration dashboards', 'Bias cost estimates', 'Toxic combination alerts with mitigation playbooks'],
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
                {/* Background Number */}
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 12,
                    fontSize: 120,
                    fontWeight: 800,
                    color: C.slate100,
                    lineHeight: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {card.num}
                </div>

                {/* Icon */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 1 }}>
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
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    {card.phase}
                  </p>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: C.slate900, marginBottom: 12 }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: 15, color: C.slate600, lineHeight: 1.6 }}>
                    {card.desc}
                  </p>

                  {/* Expanded Content */}
                  {isOpen && (
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.slate200}` }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                        Key Capabilities
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {card.bullets.map(b => (
                          <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: C.slate600 }}>
                            <div style={{ width: 6, height: 6, borderRadius: 3, background: C.green, marginTop: 7, flexShrink: 0 }} />
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

      {/* ── Case Studies ────────────────────────────────────────────── */}
      <section id="case-studies" style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
          <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Case Studies
            </p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.slate900, marginBottom: 48 }}>
              Proven Impact with Data Visualization
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }} className="cards-grid">
            {[
              {
                title: 'Microsoft-Nokia',
                desc: 'Decision quality scores revealing the cognitive biases that led to a $7.6B write-down, with market share projections the team overlooked.',
                score: 38,
              },
              {
                title: 'WeWork',
                desc: 'Analysis of the governance failures and overconfidence biases that drove a $47B valuation collapse before the failed IPO.',
                score: 24,
              },
            ].map((cs, i) => (
              <motion.div
                key={cs.title}
                {...fadeIn}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <h3 style={{ fontSize: 22, fontWeight: 700, color: C.slate900, marginBottom: 8 }}>
                  {cs.title}
                </h3>
                <p style={{ fontSize: 14, color: C.slate600, lineHeight: 1.6, marginBottom: 20 }}>
                  {cs.desc}
                </p>
                <div
                  style={{
                    background: C.slate100,
                    borderRadius: 12,
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    border: `1px solid ${C.slate200}`,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: cs.score < 40 ? '#EF4444' : C.slate900 }}>{cs.score}</div>
                    <div style={{ fontSize: 12, color: C.slate400 }}>DQI Score</div>
                  </div>
                </div>
                <Link
                  href="/demo"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: C.green, textDecoration: 'none' }}
                >
                  See the Full Analysis <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <motion.div {...fadeIn} transition={{ duration: 0.5 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Features
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: C.slate900, marginBottom: 48 }}>
            The Decision Performance OS
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="cards-grid">
          {[
            { icon: Brain, title: 'Cognitive Bias Detection', desc: '20+ biases detected with confidence scores, excerpts, and research-backed explanations. 11 additional investment-specific biases for PE/VC.', color: '#8B5CF6', bg: '#F5F3FF' },
            { icon: BarChart3, title: 'Noise Measurement', desc: '3 independent AI judges score your document — just like Kahneman\'s insurance underwriter study. Measures the variance your team doesn\'t see.', color: '#3B82F6', bg: '#EFF6FF' },
            { icon: Users, title: 'Decision Rooms', desc: 'Blind prior collection before group discussion. Consensus scoring reveals when agreement is genuine vs. groupthink.', color: C.teal, bg: C.tealBg },
            { icon: Target, title: 'Toxic Combinations', desc: '10 named compound risk patterns (Echo Chamber, Sunk Ship, etc.) with auto-generated mitigation playbooks and dollar impact estimates.', color: '#EF4444', bg: '#FEF2F2' },
            { icon: Network, title: 'Decision Knowledge Graph', desc: 'Every decision becomes a node. Edges reveal influence chains, shared biases, and cascading risks across your portfolio.', color: '#F59E0B', bg: '#FFFBEB' },
            { icon: Shield, title: 'Compliance Mapping', desc: 'SOX, GDPR, MiFID II, and FCA Consumer Duty frameworks. Cross-maps detected biases to regulatory risks with audit trails.', color: C.green, bg: C.greenLight },
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
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.slate900, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.slate600, lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
          <motion.div {...fadeIn} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Pricing
            </p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.slate900, marginBottom: 16 }}>
              Simple, Transparent Pricing
            </h2>

            {/* Annual/Monthly Toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: C.white, border: `1px solid ${C.slate200}`, borderRadius: 999, padding: 4 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="pricing-grid">
            {[
              {
                name: 'Starter',
                price: 0,
                priceAnnual: 0,
                desc: 'Try the bias engine on 3 deal documents',
                features: ['3 analyses/month', '5 bias types', '10 pages per doc', 'Community support'],
                cta: 'Get Started',
                action: () => { window.location.href = '/login'; },
                outline: true,
                popular: false,
              },
              {
                name: 'Professional',
                price: 349,
                priceAnnual: 279,
                desc: 'For deal teams running IC memos through the gauntlet',
                features: ['50 analyses/month', '20+ bias types', '100 pages per doc', 'Outcome tracking', 'Decision Twin'],
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
                desc: 'For investment committees with deal pipeline + Slack',
                features: ['250 analyses/month', 'Everything in Pro', 'Slack integration', 'Decision Rooms', 'Compliance mapping', 'Team calibration'],
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
                desc: 'For PE funds and M&A teams with dedicated support',
                features: ['Unlimited analyses', 'Everything in Team', 'SSO & custom taxonomy', 'Dedicated support', 'Custom playbooks', 'SLA guarantee'],
                cta: 'Contact Sales',
                action: () => { window.location.href = 'mailto:team@decision-intel.com?subject=Enterprise%20Inquiry'; },
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
                    boxShadow: tier.popular ? '0 4px 12px rgba(22,163,74,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
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
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.slate900, marginBottom: 4 }}>{tier.name}</h3>
                  <div style={{ marginBottom: 12 }}>
                    {displayPrice === -1 ? (
                      <span style={{ fontSize: 32, fontWeight: 800, color: C.slate900 }}>Custom</span>
                    ) : displayPrice === 0 ? (
                      <span style={{ fontSize: 32, fontWeight: 800, color: C.slate900 }}>$0<span style={{ fontSize: 14, fontWeight: 500, color: C.slate400 }}>/mo</span></span>
                    ) : (
                      <span style={{ fontSize: 32, fontWeight: 800, color: C.slate900 }}>${displayPrice}<span style={{ fontSize: 14, fontWeight: 500, color: C.slate400 }}>/mo</span></span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: C.slate600, marginBottom: 20, lineHeight: 1.5 }}>{tier.desc}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {tier.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.slate600 }}>
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

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <motion.div {...fadeIn} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: C.slate900 }}>Frequently Asked Questions</h2>
        </motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { q: 'How is sensitive data protected?', a: 'All documents are encrypted with AES-256-GCM at rest and TLS 1.3 in transit. A GDPR anonymization layer removes PII before any AI processing. Your data never leaves our SOC 2 certified infrastructure.' },
            { q: 'How long does integration take?', a: 'Less than 30 minutes. Upload documents directly, connect via OAuth for Slack, or use our REST API for bulk processing.' },
            { q: 'How does outcome tracking work?', a: 'Outcomes are detected automatically from follow-up documents, Slack messages, and web intelligence. You confirm with one click. Each reported outcome makes your future analyses more accurate.' },
            { q: 'How is this different from ChatGPT?', a: 'ChatGPT gives one opinion from one model. We use 3 independent judges for noise measurement, a 20×20 bias interaction matrix for compound scoring, 31 domain-specific biases, and an outcome flywheel that gets smarter with every decision.' },
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
                  {isOpen ? <ChevronUp size={18} style={{ color: C.slate400, flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: C.slate400, flexShrink: 0 }} />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 24px 18px', fontSize: 15, color: C.slate600, lineHeight: 1.7 }}>
                    {a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
              {['No credit card required', '14-day free trial', 'SOC 2 infrastructure'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.slate400 }}>
                  <Check size={14} style={{ color: C.green }} /> {t}
                </span>
              ))}
            </div>
          </motion.div>
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
              <Brain size={22} style={{ color: C.green }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: C.white }}>Decision Intel</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#94A3B8', maxWidth: 280 }}>
              The Decision Performance OS for M&A and investment teams. Audit cognitive bias, measure decision noise, and track outcomes.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: C.white, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Product</h4>
            {['Features', 'How It Works', 'Case Studies', 'Pricing', 'Resources'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} style={{ display: 'block', fontSize: 14, color: '#94A3B8', textDecoration: 'none', marginBottom: 10 }}>
                {l}
              </a>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: C.white, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Contact Us</h4>
            <a href="tel:+12673254830" style={{ display: 'block', fontSize: 14, color: '#94A3B8', textDecoration: 'none', marginBottom: 10 }}>
              (267) 325-4830
            </a>
            <a href="mailto:team@decision-intel.com" style={{ display: 'block', fontSize: 14, color: '#94A3B8', textDecoration: 'none', marginBottom: 10 }}>
              team@decision-intel.com
            </a>
          </div>

          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: C.white, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Stay Updated</h4>
            <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 12 }}>Subscribe to our email information</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                placeholder="Email address"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: '#1E293B',
                  color: C.white,
                  outline: 'none',
                }}
              />
              <button
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: C.green,
                  color: C.white,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ArrowRight size={16} />
              </button>
            </div>
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
