'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  useSpring,
} from 'framer-motion';
import { LiquidGlassEffect } from '@/components/ui/LiquidGlassEffect';
import { LiquidGlassAdvanced } from '@/components/ui/LiquidGlassAdvanced';
import { GlassRipple, GlassHover } from '@/components/ui/GlassMicroInteractions';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics/track';
import {
  Brain,
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  BarChart3,
  FileSearch,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Target,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Menu,
  X,
  ChevronDown,
  Lock,
  RefreshCw,
  Fingerprint,
  Network,
} from 'lucide-react';

// Scroll Progress
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-50"
      style={{
        scaleX: scrollYProgress,
        background: 'linear-gradient(90deg, #FFFFFF, #d4d4d8, #a1a1aa)',
        boxShadow: '0 0 12px rgba(255, 255, 255, 0.2)',
      }}
    />
  );
}

// Animated counter for social proof stats
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => {
    if (target >= 1000) return `${Math.round(v / 1000)}K`;
    if (target >= 100) return Math.round(v).toString();
    return v.toFixed(target < 10 ? 1 : 0);
  });
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      const controls = animate(count, target, { duration: 2, ease: 'easeOut' });
      return () => controls.stop();
    }
    return undefined;
  }, [inView, count, target]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

// Typewriter lines for the hero terminal
const terminalLines = [
  { time: '14:02:41', tag: 'SYS', tagColor: '#FFFFFF', text: 'Ingesting document stream...' },
  { time: '14:02:42', tag: 'AI', tagColor: '#FFFFFF', text: 'Scanning for cognitive anomalies...' },
  {
    time: '',
    tag: '',
    tagColor: '',
    text: '',
    isWarning: true,
    warnings: [
      'Warning: Confirmatory Bias detected (94% confidence)',
      'Warning: Groupthink indicators in Section 3',
    ],
  },
  { time: '14:02:43', tag: 'SYS', tagColor: '#FFFFFF', text: 'Calculating noise baseline...' },
  {
    time: '14:02:43',
    tag: 'RES',
    tagColor: '#22c55e',
    text: 'Overall Decision Quality: ',
    highlight: '42/100',
  },
];

function TypewriterTerminal() {
  const [visibleLines, setVisibleLines] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= terminalLines.length) clearInterval(interval);
    }, 700);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <div
      ref={ref}
      style={{
        padding: '24px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: '200px',
      }}
    >
      {terminalLines.slice(0, visibleLines).map((line, idx) => {
        if (line.isWarning) {
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                padding: '10px 14px',
                margin: '4px 0',
                borderLeft: '2px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0 10px 10px 0',
              }}
            >
              {line.warnings?.map((w, wi) => (
                <span key={wi}>
                  <span style={{ color: '#FFFFFF' }}>{w}</span>
                  {wi < (line.warnings?.length ?? 0) - 1 && <br />}
                </span>
              ))}
            </motion.div>
          );
        }
        return (
          <motion.p
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>{line.time}</span>{' '}
            <span style={{ color: line.tagColor }}>{line.tag}</span> {line.text}
            {line.highlight && (
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {line.highlight}
              </span>
            )}
          </motion.p>
        );
      })}
      {visibleLines < terminalLines.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          style={{ color: '#FFFFFF' }}
        >
          ▊
        </motion.span>
      )}
    </div>
  );
}

// Glass card style helper - now using liquid glass classes
const glassCard = {
  background: 'rgba(8, 11, 20, 0.58)',
  borderRadius: '20px',
  boxShadow: '0 12px 48px rgba(0,0,0,0.38), 0 1px 0 rgba(255,255,255,0.07) inset',
} as const;

const glassCardLight = {
  background: 'rgba(8, 11, 20, 0.55)',
  borderRadius: '20px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.06) inset',
} as const;

// Liquid glass class names to use with these styles
const glassCardClasses = 'liquid-glass-premium border border-white/12 rounded-[20px]';
const glassCardLightClasses = 'liquid-glass border border-white/10 rounded-[20px]';

// Mobile nav overlay
function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const links = [
    { label: 'The Problem', href: '#problem' },
    { label: 'How It Works', href: '#solution' },
    { label: 'Features', href: '#features' },
    { label: 'Why Us', href: '#why-us' },
    { label: 'ROI', href: '#roi' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Try Demo', href: '/demo' },
  ];

  // Body scroll lock + ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="mobile-nav-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 liquid-glass"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />
          <motion.div
            key="mobile-nav-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed top-0 right-0 bottom-0 z-50 w-72',
              'liquid-glass-premium',
              'border-l border-white/10'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            style={{
              background: 'rgba(8, 11, 20, 0.95)',
            }}
          >
            <div className="flex justify-end p-4">
              <button
                onClick={onClose}
                aria-label="Close menu"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-2 px-6">
              {links.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="hover:text-white transition-colors"
                  style={{
                    padding: '12px 16px',
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  {link.label}
                </a>
              ))}
              <div
                style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '12px 0' }}
              />
              <GlassRipple>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="btn btn-primary glow"
                  style={{ textAlign: 'center', padding: '14px', fontSize: '0.9rem' }}
                >
                  Get Started
                </Link>
              </GlassRipple>
              <Link
                href="/login"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ textAlign: 'center', padding: '14px', fontSize: '0.9rem' }}
              >
                Sign In
              </Link>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// SVG section divider
function SectionDivider({
  color = 'rgba(255,255,255,0.06)',
  variant = 'wave',
}: {
  color?: string;
  variant?: 'wave' | 'angle' | 'glow';
}) {
  if (variant === 'glow') {
    return (
      <div className="relative" style={{ height: '2px' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40%',
            height: '18px',
            background: `radial-gradient(ellipse, ${color.replace('0.06', '0.12')}, transparent)`,
            filter: 'blur(6px)',
          }}
        />
      </div>
    );
  }
  if (variant === 'angle') {
    return (
      <svg
        viewBox="0 0 1440 24"
        fill="none"
        className="w-full"
        style={{ display: 'block' }}
        preserveAspectRatio="none"
      >
        <path d="M0 24L720 0L1440 24V24H0V24Z" fill="var(--bg-primary)" />
        <path
          d="M0 24L720 0L1440 24"
          stroke={color}
          vectorEffect="non-scaling-stroke"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 1440 40"
      fill="none"
      className="w-full"
      style={{ display: 'block' }}
      preserveAspectRatio="none"
    >
      <path d="M0 20C240 40 480 0 720 20C960 40 1200 0 1440 20V40H0V20Z" fill="var(--bg-primary)" />
      <path
        d="M0 20C240 40 480 0 720 20C960 40 1200 0 1440 20"
        stroke={color}
        vectorEffect="non-scaling-stroke"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

// FAQ Accordion item
function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setMeasuredHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, answer]);

  return (
    <div
      style={{
        ...glassCardLight,
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left"
        aria-expanded={isOpen}
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ flexShrink: 0 }}
        >
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="faq-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: measuredHeight || 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              ref={contentRef}
              style={{
                padding: '0 24px 20px 24px',
                fontSize: '0.88rem',
                color: 'var(--text-muted)',
                lineHeight: 1.7,
              }}
            >
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [annualDecisions, setAnnualDecisions] = useState(5000);
  const [avgDecisionValue, setAvgDecisionValue] = useState(10000);
  const [outcomeStats, setOutcomeStats] = useState<{
    totalOutcomes: number;
    noiseReductionRate: number;
    biasAffectedRate: number;
    isRealData: boolean;
    source: string;
  } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scrollTarget = params.get('scrollTo');
    if (scrollTarget) {
      const el = document.getElementById(scrollTarget);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Fetch real outcome stats for ROI calculator
  useEffect(() => {
    fetch('/api/public/outcome-stats')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) setOutcomeStats(data);
      })
      .catch(() => {
        /* use defaults */
      });
  }, []);

  const noiseTaxRate = outcomeStats?.noiseReductionRate ?? 0.12;
  const potentialLoss = annualDecisions * avgDecisionValue * noiseTaxRate;
  const potentialSavings = potentialLoss * 0.6;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const roiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heroRef = useRef(null);
  const problemRef = useRef(null);
  const solutionRef = useRef(null);
  const featuresRef = useRef(null);
  const moatRef = useRef(null);
  const socialRef = useRef(null);
  const roiRef = useRef(null);
  const faqRef = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, margin: '-100px' });
  const problemInView = useInView(problemRef, { once: true, margin: '-100px' });
  const solutionInView = useInView(solutionRef, { once: true, margin: '-100px' });
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });
  const moatInView = useInView(moatRef, { once: true, margin: '-100px' });
  const socialInView = useInView(socialRef, { once: true, margin: '-100px' });
  const roiInView = useInView(roiRef, { once: true, margin: '-100px' });
  const pricingInView = useInView(pricingRef, { once: true, margin: '-100px' });
  const faqInView = useInView(faqRef, { once: true, margin: '-100px' });
  const ctaInView = useInView(ctaRef, { once: true, margin: '-100px' });

  // Scroll-linked parallax for hero glows
  const { scrollY } = useScroll();
  const glowY1 = useSpring(useTransform(scrollY, [0, 800], [0, 120]), {
    stiffness: 50,
    damping: 20,
  });
  const glowY2 = useSpring(useTransform(scrollY, [0, 800], [0, -80]), {
    stiffness: 50,
    damping: 20,
  });
  const glowY3 = useSpring(useTransform(scrollY, [0, 800], [0, 60]), {
    stiffness: 50,
    damping: 20,
  });

  // Inline container styles to bypass all CSS class conflicts
  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '1280px',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: '2rem',
    paddingRight: '2rem',
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden selection:bg-white/20 selection:text-white"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <ScrollProgress />
      <LiquidGlassEffect />
      <LiquidGlassAdvanced />
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-40',
          'liquid-glass-premium',
          'border-b border-white/10'
        )}
        style={{
          background: 'rgba(8, 11, 20, 0.65)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset',
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ ...containerStyle, paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn('p-2 rounded-[14px]', 'liquid-glass', 'border border-white/15')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
              }}
            >
              <Brain className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Decision Intel
            </span>
          </div>
          <div
            className="hidden md:flex items-center gap-8"
            style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
          >
            <a href="#problem" className="hover:text-white transition-colors duration-300">
              The Problem
            </a>
            <a href="#solution" className="hover:text-white transition-colors duration-300">
              How It Works
            </a>
            <a href="#features" className="hover:text-white transition-colors duration-300">
              Features
            </a>
            <a href="#why-us" className="hover:text-white transition-colors duration-300">
              Why Us
            </a>
            <a href="#roi" className="hover:text-white transition-colors duration-300">
              ROI
            </a>
            <Link
              href="/demo"
              className="hover:text-white transition-colors duration-300 font-semibold"
            >
              Try Demo
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <GlassHover>
              <Link
                href="/login"
                className="btn btn-secondary hidden sm:inline-flex"
                style={{ fontSize: '0.85rem' }}
              >
                Sign In
              </Link>
            </GlassHover>
            <GlassRipple>
              <Link
                href="/login"
                className="btn btn-primary hidden sm:inline-flex"
                style={{ fontSize: '0.85rem' }}
              >
                Get Started
              </Link>
            </GlassRipple>
            <button
              className="md:hidden p-2"
              onClick={() => setMobileNavOpen(true)}
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center pt-24 relative overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}
      >
        <motion.div
          className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full blur-[140px] pointer-events-none"
          style={{ background: 'rgba(255, 255, 255, 0.04)', y: glowY1 }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'rgba(255, 255, 255, 0.03)', y: glowY2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[30vw] rounded-full blur-[160px] pointer-events-none"
          style={{ background: 'rgba(255, 255, 255, 0.02)', y: glowY3 }}
        />

        <div className="relative z-10" style={containerStyle}>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={heroInView ? { opacity: 1, x: 0 } : {}}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    marginBottom: '24px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(12px)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                    }}
                  />
                  <span>Built for Decision-Critical Teams</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1 }}
                  style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    marginBottom: '24px',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Your last IC memo had{' '}
                  <span
                    className="block"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF, #d4d4d8, #FFFFFF)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                    }}
                  >
                    3&ndash;5 cognitive biases in it.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: '1.1rem',
                    color: 'var(--text-muted)',
                    marginBottom: '32px',
                    lineHeight: 1.7,
                    maxWidth: '540px',
                  }}
                >
                  Your LPs just don&apos;t know yet. Decision Intel finds them automatically —
                  before they cost your fund $50M.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap items-center gap-4"
                >
                  <GlassRipple>
                    <Link
                      href="/login"
                      className="btn btn-primary glow"
                      style={{ padding: '14px 32px', fontSize: '0.9rem' }}
                      onClick={() => trackEvent('hero_cta_clicked', { target: 'start_free' })}
                    >
                      Start Free <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </Link>
                  </GlassRipple>
                  <GlassHover>
                    <Link
                      href="/demo"
                      className="btn btn-secondary"
                      style={{ padding: '14px 32px', fontSize: '0.9rem' }}
                      onClick={() => trackEvent('hero_cta_clicked', { target: 'see_demo' })}
                    >
                      See a Live Demo
                    </Link>
                  </GlassHover>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={heroInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex gap-6"
                  style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                >
                  <span>
                    Status: <span style={{ color: '#22c55e', fontWeight: 600 }}>Operational</span>
                  </span>
                  <span>
                    Latency:{' '}
                    <span
                      style={{
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      12ms
                    </span>
                  </span>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 }}
                className="mt-8 md:mt-0"
              >
                <div
                  style={{
                    ...glassCard,
                    overflow: 'hidden',
                    boxShadow:
                      '0 12px 48px rgba(0, 0, 0, 0.4), 0 0 100px rgba(255, 255, 255, 0.03), 0 1px 0 rgba(255,255,255,0.07) inset',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <div
                      className="flex items-center gap-2"
                      style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    >
                      <Activity className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                      Live Analysis Feed
                    </div>
                    <div className="flex gap-2">
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#ef4444',
                        }}
                      />
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#fbbf24',
                        }}
                      />
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                  <TypewriterTerminal />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider variant="glow" color="rgba(255, 255, 255, 0.06)" />

      {/* Market Stats Bar */}
      <section
        ref={socialRef}
        className="py-16 relative"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={socialInView ? { opacity: 1, y: 0 } : {}}
            className="max-w-4xl mx-auto"
            style={{
              ...glassCardLight,
              padding: '32px',
            }}
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16">
              {[
                {
                  value: 36,
                  suffix: 'B+',
                  prefix: '$',
                  label: 'Market by 2030',
                  cite: 'Grand View Research',
                  color: '#FFFFFF',
                },
                {
                  value: 28,
                  suffix: '%',
                  prefix: '',
                  label: 'Rate decisions "good"',
                  cite: 'McKinsey',
                  color: '#FFFFFF',
                },
                {
                  value: 6.9,
                  suffix: 'pp',
                  prefix: '',
                  label: 'ROI improvement from debiasing',
                  cite: 'McKinsey',
                  color: '#22c55e',
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={socialInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.15 }}
                  className="text-center"
                >
                  <div
                    style={{
                      fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                      fontWeight: 800,
                      color: stat.color,
                      fontFamily: "'JetBrains Mono', monospace",
                      lineHeight: 1,
                      marginBottom: '8px',
                    }}
                  >
                    {stat.prefix}
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      marginBottom: '4px',
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      opacity: 0.5,
                      fontStyle: 'italic',
                    }}
                  >
                    {stat.cite}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" color="rgba(239, 68, 68, 0.15)" />

      {/* Problem Section */}
      <section
        id="problem"
        ref={problemRef}
        className="py-32 relative"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={problemInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-6xl mx-auto"
            style={{ borderLeft: '3px solid #ef4444', paddingLeft: '24px' }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Feel the Real Cost of Cognitive Bias
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                maxWidth: '640px',
                fontSize: '0.95rem',
                lineHeight: 1.7,
              }}
            >
              These aren&apos;t hypotheticals. They&apos;re happening in your organization right
              now.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Card 1: The Anchoring Trap */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px',
              }}
            >
              <Target className="w-6 h-6 mb-4" style={{ color: '#fbbf24' }} />
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}
              >
                The Anchoring Trap
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  marginBottom: '16px',
                }}
              >
                Your M&amp;A team anchored on the seller&apos;s asking price instead of intrinsic
                value.
              </p>
              <div
                style={{
                  background: 'rgba(251, 191, 36, 0.06)',
                  border: '1px solid rgba(251, 191, 36, 0.12)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '12px',
                }}
              >
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  65% more likely to overpay
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Malmendier &amp; Tate, 2008 — CEO overconfidence and M&amp;A
                </p>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                &ldquo;Microsoft paid $7.2B for Nokia — later written off entirely as a &lsquo;case
                study in cognitive distortion.&rsquo;&rdquo;
              </p>
            </motion.div>

            {/* Card 2: The Sunk Cost Spiral */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px',
              }}
            >
              <RefreshCw className="w-6 h-6 mb-4" style={{ color: '#ef4444' }} />
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}
              >
                The Sunk Cost Spiral
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  marginBottom: '16px',
                }}
              >
                Your board kept funding a failing initiative because millions were already spent.
              </p>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.12)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '12px',
                }}
              >
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  189% average cost overrun
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Standish Group CHAOS Report — IT project failure statistics
                </p>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                &ldquo;German utility RWE lost &euro;10B — their CFO admitted they fell victim to
                status quo and confirmation biases in combination.&rdquo;
              </p>
            </motion.div>

            {/* Card 3: The Groupthink Effect */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px',
              }}
            >
              <AlertTriangle className="w-6 h-6 mb-4" style={{ color: '#ef4444' }} />
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}
              >
                The Groupthink Tax
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  marginBottom: '16px',
                }}
              >
                Your strategy team agreed with the loudest voice in the room — not the best
                analysis.
              </p>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.12)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '12px',
                }}
              >
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  Only 28% of executives rate strategic decision quality in their company as
                  &ldquo;generally good.&rdquo;
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  McKinsey survey of 2,207 executives
                </p>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 600 }}>
                Debiased decision processes improve ROI by 6.9 percentage points.
              </p>
            </motion.div>

            {/* Card 4: The Overconfidence Tax */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px',
              }}
            >
              <TrendingUp className="w-6 h-6 mb-4" style={{ color: '#fbbf24' }} />
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}
              >
                The Overconfidence Premium
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  marginBottom: '16px',
                }}
              >
                Your leadership team&apos;s revenue forecast was 30% too optimistic — again.
              </p>
              <div
                style={{
                  background: 'rgba(251, 191, 36, 0.06)',
                  border: '1px solid rgba(251, 191, 36, 0.12)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '12px',
                }}
              >
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  &ldquo;The most robust finding in psychology&rdquo;
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Daniel Kahneman — Nobel Prize in Economics
                </p>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 600 }}>
                Reference class forecasting reduces estimation errors by 70%.
              </p>
            </motion.div>
          </div>

          {/* Closing tagline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            style={{
              textAlign: 'center',
              marginTop: '48px',
              fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              textShadow: '0 0 40px rgba(255, 255, 255, 0.15)',
              maxWidth: '700px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Decision Intel catches all of this. Automatically. In minutes, not months.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            style={{ textAlign: 'center', marginTop: '16px' }}
          >
            <Link
              href="/login"
              style={{
                color: '#22c55e',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
              className="hover:underline"
            >
              Try Free &rarr;
            </Link>
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="angle" color="rgba(163, 230, 53, 0.2)" />

      {/* How It Works Section */}
      <section
        id="solution"
        ref={solutionRef}
        className="py-32 relative"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 30% 50%, rgba(163, 230, 53, 0.04) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={solutionInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-5xl mx-auto"
            style={{ borderLeft: '3px solid #A3E635', paddingLeft: '24px' }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              How It Works
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              From strategic document to verified outcome in three steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: FileSearch,
                title: 'Capture & Frame',
                description:
                  'Upload board papers, strategy proposals, risk assessments, or deal memos. Define success criteria and your prior beliefs before analysis begins.',
                color: '#FFFFFF',
                details: [
                  'Document intelligence',
                  'Decision Frame capture',
                  'Prior confidence recording',
                ],
              },
              {
                step: '02',
                icon: Brain,
                title: 'AI Cognitive Audit',
                description:
                  'Multi-agent pipeline detects 15+ biases, runs a statistical jury for noise scoring, and simulates a boardroom of Decision Twins to stress-test your thesis.',
                color: '#A3E635',
                details: [
                  'Bias detection engine',
                  'Decision Twin simulation',
                  'Pre-mortem analysis',
                ],
              },
              {
                step: '03',
                icon: TrendingUp,
                title: 'Track & Improve',
                description:
                  'Outcomes are detected automatically from follow-up documents, Slack messages, and web intelligence. Confirm with one click and watch your calibration curve sharpen over time.',
                color: '#22c55e',
                details: [
                  'Autonomous outcome detection',
                  'Calibration dashboards',
                  'Bias cost estimates',
                ],
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={solutionInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15 }}
                style={{
                  ...glassCardLight,
                  padding: '32px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-5px',
                    fontSize: '6rem',
                    fontWeight: 900,
                    color: item.color,
                    opacity: 0.06,
                    lineHeight: 1,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {item.step}
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: `${item.color}18`,
                    border: `1px solid ${item.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: item.color,
                    marginBottom: '8px',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.05em',
                  }}
                >
                  STEP {item.step}
                </div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    marginBottom: '12px',
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                    marginBottom: '20px',
                  }}
                >
                  {item.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {item.details.map((detail, di) => (
                    <div
                      key={di}
                      className="flex items-center gap-2"
                      style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    >
                      <CheckCircle2
                        className="w-3.5 h-3.5"
                        style={{ color: item.color, flexShrink: 0 }}
                      />
                      {detail}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Connection line between steps (desktop) */}
          <div
            className="hidden md:flex items-center justify-center mt-8 gap-4"
            style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
          >
            <div style={{ width: '120px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.5 }}>
              Fully automated pipeline
            </span>
            <div style={{ width: '120px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>
        </div>
      </section>

      <SectionDivider variant="glow" color="rgba(255, 255, 255, 0.06)" />

      {/* Case Study — What Decision Intel Would Have Caught */}
      <section className="py-28 relative" style={{ background: 'var(--bg-primary)' }}>
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2
              style={{
                fontSize: 'clamp(1.6rem, 2.8vw, 2.2rem)',
                color: 'var(--text-primary)',
                marginBottom: '12px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                textAlign: 'center',
              }}
            >
              What Decision Intel Would Have Caught
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                textAlign: 'center',
                marginBottom: '40px',
              }}
            >
              We ran our engine on one of the most infamous strategic decisions in tech history.
            </p>

            {/* Case Study Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgba(239, 68, 68, 0.8)',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      marginBottom: '6px',
                    }}
                  >
                    CASE STUDY
                  </div>
                  <h3
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                    }}
                  >
                    Microsoft-Nokia: The $7.6B Write-Down
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    In 2013, Microsoft acquired Nokia&apos;s Devices &amp; Services division for
                    $7.2B. Two years later, they wrote down $7.6B — more than the entire purchase
                    price.
                  </p>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: '2.8rem',
                      fontWeight: 800,
                      color: '#ef4444',
                      lineHeight: 1,
                    }}
                  >
                    38
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 100</div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#ef4444',
                      fontWeight: 600,
                      marginTop: '2px',
                    }}
                  >
                    Decision Quality
                  </div>
                </div>
              </div>

              {/* Key Findings */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                }}
              >
                {[
                  {
                    label: 'Anchoring Bias',
                    sev: 'critical',
                    detail: 'Price anchored to seller\u2019s ask',
                  },
                  { label: 'Confirmation Bias', sev: 'high', detail: 'Cherry-picked market data' },
                  {
                    label: 'Sunk Cost Fallacy',
                    sev: 'high',
                    detail: '$1B prior commitment framing',
                  },
                  { label: 'Overconfidence', sev: 'high', detail: '15% market share projection' },
                  { label: 'Groupthink', sev: 'medium', detail: 'Unanimous board, zero dissent' },
                  {
                    label: 'Status Quo Bias',
                    sev: 'medium',
                    detail: 'Windows Phone doubling down',
                  },
                ].map((bias, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>
                        {bias.label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background:
                            bias.sev === 'critical'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : bias.sev === 'high'
                                ? 'rgba(249, 115, 22, 0.1)'
                                : 'rgba(234, 179, 8, 0.1)',
                          color:
                            bias.sev === 'critical'
                              ? '#ef4444'
                              : bias.sev === 'high'
                                ? '#f97316'
                                : '#eab308',
                        }}
                      >
                        {bias.sev}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {bias.detail}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.3)',
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  Analysis based on publicly available strategic documents and press releases.
                </p>
                <Link
                  href="/demo"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    color: '#000000',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  See the Full Analysis <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="glow" color="rgba(255, 255, 255, 0.06)" />

      {/* Features - Bento Grid */}
      <section
        id="features"
        ref={featuresRef}
        className="py-32 relative"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255, 255, 255, 0.02) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-6xl mx-auto"
            style={{ borderLeft: '3px solid #FFFFFF', paddingLeft: '24px' }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              The Decision Performance OS
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Purpose-built for teams making high-stakes decisions — investment committees,
              corporate boards, strategy teams, and compliance officers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {/* Large Feature: Cognitive Bias Engine */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              className="col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2"
              style={{
                ...glassCard,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ padding: '32px', zIndex: 1 }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Brain className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                </div>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    marginBottom: '12px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Cognitive Bias Engine
                </h3>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    maxWidth: '400px',
                    lineHeight: 1.7,
                  }}
                >
                  Scans board papers, strategy proposals, risk assessments, and deal memos for 15+
                  cognitive biases including anchoring, confirmation bias in due diligence, and
                  groupthink in committee decisions.
                </p>
              </div>
              <div style={{ padding: '0 32px', paddingBottom: 0, zIndex: 1 }}>
                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '16px',
                    borderRadius: '12px 12px 0 0',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.75rem',
                    height: '128px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                      analysis_results.json
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#FFFFFF',
                      }}
                    >
                      Bias Detected
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    <span style={{ color: '#FFFFFF' }}>&quot;biasType&quot;</span>:{' '}
                    <span style={{ color: '#FFFFFF' }}>&quot;Confirmation Bias&quot;</span>,<br />
                    <span style={{ color: '#FFFFFF' }}>&quot;severity&quot;</span>:{' '}
                    <span style={{ color: '#FFFFFF' }}>&quot;HIGH&quot;</span>,<br />
                    <span style={{ color: '#FFFFFF' }}>&quot;confidence&quot;</span>:{' '}
                    <span style={{ color: '#22c55e' }}>0.94</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Statistical Jury */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1 }}
              className={cn('col-span-1 md:col-span-2 lg:col-span-2', glassCardLightClasses, 'p-8')}
              style={glassCardLight}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <Activity className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                  }}
                >
                  Noise Audit
                </span>
              </div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: 'var(--text-primary)',
                }}
              >
                Statistical Jury
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                Three independent AI judges score the same memo blind. Measures variance to quantify
                how much &ldquo;noise&rdquo; is in your IC process — the hidden tax on returns.
              </p>
            </motion.div>

            {/* Sub-second Analysis */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2 }}
              className={cn(
                'col-span-1 flex flex-col items-center text-center justify-center',
                glassCardLightClasses,
                'p-8'
              )}
              style={glassCardLight}
            >
              <Zap className="w-8 h-8 mb-4" style={{ color: '#fbbf24' }} />
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: 'var(--text-primary)',
                }}
              >
                Sub-second
                <br />
                Analysis
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                High-performance edge computing infrastructure.
              </p>
            </motion.div>

            {/* FCA & GDPR */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 }}
              className={cn(
                'col-span-1 flex flex-col items-center text-center justify-center',
                glassCardLightClasses,
                'p-8'
              )}
              style={glassCardLight}
            >
              <Shield className="w-8 h-8 mb-4" style={{ color: '#22c55e' }} />
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: 'var(--text-primary)',
                }}
              >
                FCA & GDPR
                <br />
                Ready
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Consumer Duty mapping and automated PII sanitization.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider variant="angle" color="rgba(255, 255, 255, 0.08)" />

      {/* Why Decision Intel — Moat Section */}
      <section
        id="why-us"
        ref={moatRef}
        className="py-32 relative"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.03) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={moatInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-6xl mx-auto"
            style={{ borderLeft: '3px solid #FFFFFF', paddingLeft: '24px' }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Why Decision Intel Compounds
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                maxWidth: '640px',
                fontSize: '0.95rem',
                lineHeight: 1.7,
              }}
            >
              Anyone can wire an LLM to scan documents. What they cannot replicate is the
              longitudinal dataset of audited decisions with verified outcomes that your
              organization builds inside Decision Intel over time.
            </p>
          </motion.div>

          {/* Flywheel Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={moatInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="max-w-6xl mx-auto mb-16"
          >
            <div
              style={{
                ...glassCard,
                padding: '32px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                className="absolute top-4 right-6"
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#22c55e',
                }}
              >
                Self-Improving
              </div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '24px',
                }}
              >
                The Decision Intelligence Stack
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    step: '1',
                    label: 'Analyze',
                    description:
                      'AI detects cognitive biases and quantifies decision noise across your decision-making teams',
                    color: '#FFFFFF',
                  },
                  {
                    step: '2',
                    label: 'Graph',
                    description:
                      'Maps relationships between decisions — which ones cascade, which biases compound, where echo chambers form',
                    color: '#60a5fa',
                  },
                  {
                    step: '3',
                    label: 'Learn',
                    description:
                      'Outcomes detected automatically from documents, Slack, and web intelligence. Over time, you see exactly which biases cost your organization money — your data, not generic warnings',
                    color: '#A3E635',
                  },
                  {
                    step: '4',
                    label: 'Act',
                    description:
                      'Pre-decision nudges and historical precedent recommendations prevent repeat failures before the vote',
                    color: '#22c55e',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={moatInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.15 + i * 0.1 }}
                    style={{
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: `${item.color}18`,
                        border: `1px solid ${item.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: item.color,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {item.step}
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '6px',
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}
                    >
                      {item.description}
                    </div>
                    {i < 3 && (
                      <div
                        className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2"
                        style={{
                          color: 'rgba(255, 255, 255, 0.15)',
                          fontSize: '1.2rem',
                          zIndex: 10,
                        }}
                      >
                        &rarr;
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              <div
                className="mt-6 text-center"
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                  opacity: 0.6,
                }}
              >
                Each layer feeds the next. The longer you use it, the wider your moat.
              </div>
            </div>
          </motion.div>

          {/* Moat Pillars */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 max-w-7xl mx-auto">
            {[
              {
                icon: Fingerprint,
                title: 'Autonomous Outcome Flywheel',
                description:
                  'Outcomes are detected automatically from follow-up documents, Slack messages, and web news — then confirmed with one click. Every outcome sharpens your bias detection and calibrates your Decision Twins.',
                stat: 'Compounding data advantage',
                color: '#FFFFFF',
              },
              {
                icon: RefreshCw,
                title: 'Auto-Recalibrating',
                description:
                  "Every outcome retrains bias weights, nudge thresholds, and Decision Twin accuracy for YOUR org. Not generic warnings — your organization's actual impact by bias type.",
                stat: 'Learns from every decision',
                color: '#A3E635',
              },
              {
                icon: Network,
                title: 'Decision Knowledge Graph',
                description:
                  'Every decision becomes a node. Every outcome, a validated edge. Your organization builds an irreplaceable map of how decisions cascade and where failure patterns hide.',
                stat: 'Organizational decision memory',
                color: '#60a5fa',
              },
              {
                icon: Lock,
                title: 'Pre-Decision Capture',
                description:
                  'Slack integration detects IC deliberation threads and delivers cognitive coaching nudges before the vote. Reply with your position to build your calibration curve — all without leaving Slack.',
                stat: 'Always-on decision OS',
                color: '#22c55e',
              },
              {
                icon: Shield,
                title: 'Regulator-Ready',
                description:
                  'Audit-grade decision logs with timestamped priors, outcomes, and calibration curves. SOX 302/404, SEC, FCA Consumer Duty, EU AI Act compliance built in.',
                stat: 'Compliance audit packs',
                color: '#FFFFFF',
              },
            ].map((pillar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={moatInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1 }}
                style={{
                  ...glassCardLight,
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${pillar.color}12`,
                    border: `1px solid ${pillar.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <pillar.icon className="w-5 h-5" style={{ color: pillar.color }} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}
                  >
                    {pillar.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    {pillar.description}
                  </p>
                </div>
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: pillar.color,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.02em',
                  }}
                >
                  {pillar.stat}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Competitor comparison callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={moatInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6 }}
            className="max-w-4xl mx-auto mt-16"
          >
            <div
              style={{
                ...glassCardLight,
                padding: '28px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: '3px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                The switching cost question every enterprise asks:
              </div>
              <div
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.8,
                }}
              >
                &ldquo;Why not use a generic bias scanner at half the price?&rdquo; Because Decision
                Intel is the only platform that{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  closes the loop between bias detection and actual outcomes
                </span>
                . Over time, it learns{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  which biases actually cost your organization money
                </span>
                , which Decision Twin personas are most accurate for your decision types, and{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  how your decisions cascade and compound through your Knowledge Graph
                </span>
                . A generic scanner gives the same output on day 1 and day 365. Decision Intel
                compounds from every outcome you track — building an organizational decision memory
                that no competitor can replicate.
              </div>
            </div>
          </motion.div>

          {/* Competitive Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={moatInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
            className="max-w-5xl mx-auto mt-20"
          >
            <h3
              style={{
                fontSize: 'clamp(1.3rem, 2.2vw, 1.8rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '24px',
                letterSpacing: '-0.01em',
              }}
            >
              Decision Intel vs. Traditional Consulting
            </h3>

            {/* Desktop Table */}
            <div
              className="hidden md:block"
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '14px 20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        width: '22%',
                      }}
                    >
                      Dimension
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '14px 20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        width: '39%',
                      }}
                    >
                      McKinsey/BCG
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '14px 20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        width: '39%',
                      }}
                    >
                      Decision Intel
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      dimension: 'Annual cost',
                      consulting: '$500K\u2013$2M per engagement',
                      di: 'From $1,548/yr \u2014 0.3% of one engagement',
                    },
                    {
                      dimension: 'Speed',
                      consulting: '6\u201312 week engagements',
                      di: 'Minutes per document',
                    },
                    {
                      dimension: 'Auditor bias',
                      consulting: 'Consultants have their own biases',
                      di: 'AI doesn\u2019t have ego or politics',
                    },
                    {
                      dimension: 'Continuity',
                      consulting: 'Point-in-time snapshot',
                      di: 'Continuous monitoring',
                    },
                    {
                      dimension: 'Scale',
                      consulting: 'One engagement at a time',
                      di: 'Every decision, every team',
                    },
                    {
                      dimension: 'Data flywheel',
                      consulting: 'Report sits in a drawer',
                      di: 'Outcomes improve accuracy over time',
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        background:
                          i % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        {row.dimension}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: '0.85rem',
                          color: 'rgba(161, 161, 170, 0.8)',
                          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        {row.consulting}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          fontSize: '0.85rem',
                          color: 'rgba(134, 239, 172, 0.9)',
                          fontWeight: 500,
                          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <CheckCircle2
                          style={{
                            width: '14px',
                            height: '14px',
                            flexShrink: 0,
                            color: 'rgba(34, 197, 94, 0.7)',
                          }}
                        />
                        {row.di}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div
              className="md:hidden"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {[
                {
                  dimension: 'Annual cost',
                  consulting: '$500K\u2013$2M per engagement',
                  di: 'From $1,548/yr \u2014 0.3% of one engagement',
                },
                {
                  dimension: 'Speed',
                  consulting: '6\u201312 week engagements',
                  di: 'Minutes per document',
                },
                {
                  dimension: 'Auditor bias',
                  consulting: 'Consultants have their own biases',
                  di: 'AI doesn\u2019t have ego or politics',
                },
                {
                  dimension: 'Continuity',
                  consulting: 'Point-in-time snapshot',
                  di: 'Continuous monitoring',
                },
                {
                  dimension: 'Scale',
                  consulting: 'One engagement at a time',
                  di: 'Every decision, every team',
                },
                {
                  dimension: 'Data flywheel',
                  consulting: 'Report sits in a drawer',
                  di: 'Outcomes improve accuracy over time',
                },
              ].map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={moatInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.9 + i * 0.08 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {row.dimension}
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'rgba(161, 161, 170, 0.8)',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Consulting:</span>{' '}
                    {row.consulting}
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'rgba(134, 239, 172, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2
                      style={{
                        width: '13px',
                        height: '13px',
                        flexShrink: 0,
                        color: 'rgba(34, 197, 94, 0.7)',
                      }}
                    />
                    <span>
                      <span style={{ fontWeight: 600 }}>Decision Intel:</span> {row.di}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" color="rgba(255, 255, 255, 0.06)" />

      {/* Anti-SaaS Positioning Section */}
      <section className="py-28 relative" style={{ background: 'var(--bg-primary)' }}>
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 max-w-3xl mx-auto text-center"
          >
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--text-primary)',
                marginBottom: '12px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              AI Is Replacing Commodity SaaS. We&apos;re the Opposite.
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Most software tools are being commoditized by AI. Decision Intel is fundamentally
              different — it doesn&apos;t get replaced by AI. It <em>is</em> the AI.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Zap,
                title: 'Most SaaS is being replaced by AI.',
                body: 'Generic dashboards, form builders, and workflow tools are commoditized by LLMs that build them on demand. Decision Intel is fundamentally different — every improvement in foundation models makes our bias detection more accurate, not more replaceable.',
              },
              {
                icon: TrendingUp,
                title: 'Our moat grows with every decision you track.',
                body: 'SaaS tools store your data but don\u2019t learn from it. Decision Intel builds a proprietary calibration dataset from your verified outcomes. After 6 months, your instance knows which biases cost YOUR organization the most. No competitor can replicate that.',
              },
              {
                icon: Brain,
                title: 'Cognitive bias detection requires AI. There is no manual alternative.',
                body: 'You can\u2019t detect anchoring bias by reading more carefully. You can\u2019t measure decision noise with a spreadsheet. The 188 documented biases operate below conscious awareness — only systematic AI analysis surfaces them reliably.',
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '28px 24px',
                }}
              >
                <card.icon
                  style={{
                    width: '28px',
                    height: '28px',
                    color: 'rgba(34, 197, 94, 0.7)',
                    marginBottom: '16px',
                  }}
                />
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '10px',
                    lineHeight: 1.4,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.7,
                  }}
                >
                  {card.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider variant="wave" color="rgba(255, 255, 255, 0.06)" />

      {/* ROI Calculator */}
      <section id="roi" ref={roiRef} className="py-32" style={{ background: 'var(--bg-primary)' }}>
        <div style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={roiInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-6xl mx-auto"
            style={{ borderLeft: '3px solid #FFFFFF', paddingLeft: '24px' }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              ROI Calculator
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Model the financial impact of unaudited strategic decisions.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-8">
            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={roiInView ? { opacity: 1, x: 0 } : {}}
              className={cn('md:col-span-2', glassCardClasses, 'p-8')}
              style={glassCard}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div
                  style={{
                    paddingBottom: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <h4
                    style={{
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                    }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Input Parameters
                  </h4>
                </div>
                <div>
                  <label
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginBottom: '16px',
                      fontWeight: 600,
                    }}
                  >
                    <span>Annual Decisions</span>
                    <span
                      style={{
                        color: 'var(--text-primary)',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.75rem',
                      }}
                    >
                      {annualDecisions.toLocaleString()}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="50000"
                    step="100"
                    value={annualDecisions}
                    onChange={e => {
                      setAnnualDecisions(Number(e.target.value));
                      if (roiTimerRef.current) clearTimeout(roiTimerRef.current);
                      roiTimerRef.current = setTimeout(() => trackEvent('roi_calculator_used'), 1000);
                    }}
                    aria-label="Annual Decisions"
                    className="w-full h-1 appearance-none cursor-pointer outline-none"
                    style={{
                      accentColor: '#FFFFFF',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginBottom: '16px',
                      fontWeight: 600,
                    }}
                  >
                    <span>Avg Decision Value</span>
                    <span
                      style={{
                        color: 'var(--text-primary)',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.75rem',
                      }}
                    >
                      {formatCurrency(avgDecisionValue)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={avgDecisionValue}
                    onChange={e => {
                      setAvgDecisionValue(Number(e.target.value));
                      if (roiTimerRef.current) clearTimeout(roiTimerRef.current);
                      roiTimerRef.current = setTimeout(() => trackEvent('roi_calculator_used'), 1000);
                    }}
                    aria-label="Average Decision Value"
                    className="w-full h-1 appearance-none cursor-pointer outline-none"
                    style={{
                      accentColor: '#FFFFFF',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div
                  style={{
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1.6,
                    opacity: 0.7,
                  }}
                >
                  {outcomeStats?.isRealData
                    ? `// Based on ${outcomeStats.totalOutcomes} real decisions tracked`
                    : `// Baseline noise tax derived from Kahneman et al.`}
                  <br />
                  const NOISE_TAX = {noiseTaxRate.toFixed(2)};
                  {outcomeStats?.isRealData && (
                    <>
                      <br />
                      {`// source: platform_data`}
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={roiInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="md:col-span-3 relative overflow-hidden flex flex-col justify-center"
              style={{
                ...glassCard,
                padding: '32px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow:
                  '0 12px 48px rgba(0, 0, 0, 0.38), 0 0 40px rgba(255, 255, 255, 0.04), 0 1px 0 rgba(255,255,255,0.07) inset',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  padding: '16px',
                  opacity: 0.03,
                  pointerEvents: 'none',
                  fontSize: '10rem',
                  fontWeight: 800,
                }}
              >
                $
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '32px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
                    }}
                  />
                  <span
                    style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    Projection Output
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#ef4444',
                        marginBottom: '8px',
                        fontWeight: 600,
                      }}
                    >
                      Estimated Annual Loss
                    </div>
                    <div
                      style={{
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {formatCurrency(potentialLoss)}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#22c55e',
                        marginBottom: '8px',
                        fontWeight: 600,
                      }}
                    >
                      Recoverable Value (60%)
                    </div>
                    <div
                      style={{
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: 800,
                        color: '#22c55e',
                        fontFamily: "'JetBrains Mono', monospace",
                        textShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      {formatCurrency(potentialSavings)}
                    </div>
                  </div>
                </div>

                <div
                  style={{ paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
                >
                  <Link
                    href="/login"
                    className="btn btn-primary w-full glow"
                    style={{
                      padding: '16px',
                      fontSize: '0.9rem',
                      background: '#FFFFFF',
                      color: '#080808',
                      border: '1px solid rgba(255, 255, 255, 0.9)',
                      boxShadow:
                        '0 4px 20px rgba(255, 255, 255, 0.1), 0 1px 0 rgba(255,255,255,0.12) inset',
                      display: 'block',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    Get Early Access
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider variant="angle" color="rgba(255, 255, 255, 0.06)" />

      {/* Pricing Section */}
      <section
        id="pricing"
        ref={pricingRef}
        className="py-32 relative"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.02) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={pricingInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-3xl mx-auto text-center"
          >
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              What Would You Pay to Avoid Your Next $10M Mistake?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              A single consulting engagement costs $500K–$2M. Decision Intel runs continuously for
              less than the cost of one junior analyst.
            </p>
          </motion.div>

          {/* Annual / Monthly Toggle */}
          <div className="flex justify-center mb-10">
            <div
              style={{
                display: 'inline-flex',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '4px',
              }}
            >
              <button
                onClick={() => setIsAnnual(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: !isAnnual ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: !isAnnual ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: isAnnual ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: isAnnual ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Annual
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'rgba(34, 197, 94, 0.9)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Tier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={pricingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                Starter
              </h3>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  $0
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/month</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '24px',
                  flex: 1,
                }}
              >
                {['3 deal analyses/month', '10 page max', '5 bias types', 'Docs support'].map(
                  (feature, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.84rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <CheckCircle2
                        style={{
                          width: '14px',
                          height: '14px',
                          flexShrink: 0,
                          color: 'rgba(255, 255, 255, 0.3)',
                        }}
                      />
                      {feature}
                    </div>
                  )
                )}
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginBottom: '12px',
                }}
              >
                For deal partners evaluating the platform.
              </p>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                Start Free
              </Link>
            </motion.div>

            {/* Pro Tier — Highlighted */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={pricingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#FFFFFF',
                  color: '#000000',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  letterSpacing: '0.02em',
                }}
              >
                Best for Deal Partners
              </div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                IC Pro
              </h3>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isAnnual ? '$103' : '$129'}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  /month{isAnnual ? ', billed annually' : ''}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '24px',
                  flex: 1,
                }}
              >
                {[
                  '50 deal analyses/month',
                  '100 page IC memos & CIMs',
                  'All PE/VC bias types',
                  'Noise analysis + IC simulation',
                  'Deal outcome tracking (IRR/MOIC)',
                  'Priority email support',
                ].map((feature, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.84rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <CheckCircle2
                      style={{
                        width: '14px',
                        height: '14px',
                        flexShrink: 0,
                        color: 'rgba(255, 255, 255, 0.3)',
                      }}
                    />
                    {feature}
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginBottom: '12px',
                }}
              >
                For deal partners and analysts running IC memos through the bias gauntlet.
              </p>
              <button
                onClick={() => handleCheckout('pro')}
                disabled={checkoutLoading === 'pro'}
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#FFFFFF',
                  color: '#000000',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: checkoutLoading === 'pro' ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.15)',
                  opacity: checkoutLoading === 'pro' ? 0.7 : 1,
                }}
              >
                {checkoutLoading === 'pro' ? 'Redirecting...' : 'Start Pro Trial'}
              </button>
            </motion.div>

            {/* Team Tier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={pricingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(34, 197, 94, 0.9)',
                  color: '#000000',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  letterSpacing: '0.02em',
                }}
              >
                Best for IC Teams
              </div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                Fund
              </h3>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isAnnual ? '$399' : '$499'}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  /month{isAnnual ? ', billed annually' : ''}
                </span>
              </div>
              <div
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '20px' }}
              >
                up to 10 seats
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '24px',
                  flex: 1,
                }}
              >
                {[
                  '250 deal analyses/month',
                  '200 page IC memos & CIMs',
                  'All PE/VC bias types',
                  'Deal pipeline + stage tracking',
                  'Blind IC voting + team profiles',
                  'Slack integration + API access',
                  'Dedicated support channel',
                ].map((feature, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.84rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <CheckCircle2
                      style={{
                        width: '14px',
                        height: '14px',
                        flexShrink: 0,
                        color: 'rgba(255, 255, 255, 0.3)',
                      }}
                    />
                    {feature}
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginBottom: '12px',
                }}
              >
                For PE/VC investment committees and deal teams managing full fund portfolios.
              </p>
              <button
                onClick={() => handleCheckout('team')}
                disabled={checkoutLoading === 'team'}
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: checkoutLoading === 'team' ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: checkoutLoading === 'team' ? 0.7 : 1,
                }}
              >
                {checkoutLoading === 'team' ? 'Redirecting...' : 'Start Team Trial'}
              </button>
            </motion.div>

            {/* Enterprise Tier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={pricingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                Multi-Fund
              </h3>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Custom
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '24px',
                  flex: 1,
                }}
              >
                {[
                  'Unlimited deals + documents',
                  'Multi-fund portfolio analytics',
                  'SSO + audit log + full API',
                  'Dedicated CSM',
                  'Custom bias taxonomies',
                  'On-premise deployment option',
                ].map((feature, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.84rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <CheckCircle2
                      style={{
                        width: '14px',
                        height: '14px',
                        flexShrink: 0,
                        color: 'rgba(255, 255, 255, 0.3)',
                      }}
                    />
                    {feature}
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginBottom: '12px',
                }}
              >
                For PE/VC platforms managing multiple funds with dedicated IC workflows.
              </p>
              <a
                href="mailto:hello@decisionintel.ai"
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                Contact Sales
              </a>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={pricingInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              marginTop: '24px',
            }}
          >
            All paid plans include a 14-day free trial. No credit card required to start. For
            context: a single McKinsey engagement costs more than 80 years of Decision Intel Team.
          </motion.p>
        </div>
      </section>

      <SectionDivider variant="angle" color="rgba(255, 255, 255, 0.06)" />

      {/* FAQ Section */}
      <section
        id="faq"
        ref={faqRef}
        className="py-32 relative"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-3xl mx-auto"
            style={{ borderLeft: '3px solid #FFFFFF', paddingLeft: '24px' }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Common questions about Decision Intel.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            className="max-w-3xl mx-auto"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {[
              {
                q: 'How is investment data protected?',
                a: 'All documents are encrypted at rest (AES-256) and in transit (TLS 1.3). We run on SOC 2 Type II audited infrastructure, and PII is automatically detected and redacted before analysis. Your data is never used to train models and is deleted upon request. We support on-prem deployment for organizations requiring full data sovereignty.',
              },
              {
                q: 'How long does integration take?',
                a: 'Most teams are up and running in under 30 minutes. Upload documents directly, connect your team Slack channel with a single OAuth flow, or use our REST API for programmatic ingestion. No infrastructure changes required.',
              },
              {
                q: 'How does outcome tracking work?',
                a: 'The platform autonomously detects outcomes from three channels: follow-up documents (via semantic matching), Slack messages (outcome language detection), and web intelligence (public news search for named entities). Detected outcomes appear as draft notifications you confirm or dismiss with one click. You can also manually report outcomes at configurable intervals. If you have 5+ analyses awaiting outcomes, new analyses are gated until you close the loop. Every tracked outcome sharpens your bias severity weights, Decision Twin accuracy, and org-specific causal models.',
              },
              {
                q: 'What is a Decision Twin?',
                a: 'Decision Twins are AI-simulated boardroom personas (e.g. Fiscal Conservative, Growth Advocate, Compliance Guard) that independently evaluate your proposal. Research shows that simulated dissent improves outcomes by 15-25%. The platform tracks which twin was most accurate over time.',
              },
              {
                q: 'What compliance standards do you support?',
                a: 'Built-in mapping for SOX Section 302/404, SEC disclosure requirements, FCA Consumer Duty, and EU AI Act governance. Exportable audit trails with full decision lineage, bias detection logs, and outcome verification for regulator-ready governance packs.',
              },
              {
                q: 'How is this different from a generic AI bias scanner?',
                a: 'Generic scanners analyze one document at a time with no memory. Decision Intel builds a longitudinal dataset of your audited decisions with verified outcomes. After 6 months, your platform knows which biases cost your organization the most, which Decision Twin is most accurate for your decision type, and how your calibration has improved. That dataset is your moat.',
              },
            ].map((item, i) => (
              <FAQItem
                key={i}
                question={item.q}
                answer={item.a}
                isOpen={openFAQ === i}
                onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="glow" color="rgba(255, 255, 255, 0.06)" />

      {/* Final CTA */}
      <section
        ref={ctaRef}
        className="py-32 relative overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.03) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            style={{
              maxWidth: '768px',
              marginLeft: 'auto',
              marginRight: 'auto',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                marginBottom: '24px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <Target className="w-3.5 h-3.5" />
              Built for decision-critical teams
            </div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
              }}
            >
              Your next critical decision
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF, #d4d4d8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                should be your best one yet.
              </span>
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '1.05rem',
                lineHeight: 1.7,
                marginBottom: '32px',
                maxWidth: '560px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Be among the first teams to audit decision quality with AI — from PE/VC funds and
              corporate boards to strategy teams and compliance officers.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
              }}
            >
              <Link
                href="/login"
                className="btn btn-primary glow"
                style={{
                  padding: '16px 40px',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Start Free <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Link>
              <a
                href="#solution"
                className="btn btn-secondary"
                style={{ padding: '16px 32px', fontSize: '0.95rem' }}
              >
                Learn More
              </a>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '32px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                Free during early access
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                SOC 2 compliant
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-16 relative z-10"
        style={{
          background: 'var(--bg-primary)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={containerStyle}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div
                  style={{
                    padding: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <Brain className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                </div>
                <span
                  style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}
                >
                  Decision Intel
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  maxWidth: '240px',
                }}
              >
                The Decision Performance OS for high-stakes teams. Track, score, and improve
                critical decisions with measurable ROI.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                  letterSpacing: '0.05em',
                }}
              >
                PRODUCT
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'ROI Calculator', href: '#roi' },
                  { label: 'How It Works', href: '#solution' },
                  { label: 'Early Access', href: '#cta' },
                ].map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                  letterSpacing: '0.05em',
                }}
              >
                RESOURCES
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Live Demo', href: '/demo' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'FAQ', href: '#faq' },
                  { label: 'Contact', href: 'mailto:hello@decisionintel.ai' },
                ].map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                  letterSpacing: '0.05em',
                }}
              >
                LEGAL
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                  { label: 'Cookie Policy', href: '#' },
                  { label: 'GDPR', href: '#' },
                ].map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              paddingTop: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              &copy; 2026 Decision Intel. All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              {[
                { icon: Github, href: 'https://github.com/FolahanWilliams', label: 'GitHub' },
                { icon: Twitter, href: 'https://x.com/decisionintelai', label: 'Twitter' },
                {
                  icon: Linkedin,
                  href: 'https://linkedin.com/company/decision-intel',
                  label: 'LinkedIn',
                },
                { icon: Mail, href: 'mailto:hello@decisionintel.ai', label: 'Email' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  title={social.label}
                  style={{ color: 'var(--text-muted)' }}
                  className="hover:text-white transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
