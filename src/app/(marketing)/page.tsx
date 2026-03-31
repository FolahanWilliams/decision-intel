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
import { TractionCounters } from '@/components/marketing/TractionCounters';
import { CaseStudyCard, type CaseStudy } from '@/components/marketing/CaseStudyCard';
import {
  Brain,
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
  Network,
  Users,
  Eye,
} from 'lucide-react';

// Scroll Progress
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-50"
      style={{
        scaleX: scrollYProgress,
        background: 'linear-gradient(90deg, #00D2FF, #0EA5E9, #6366F1)',
        boxShadow: '0 0 12px rgba(0, 210, 255, 0.3)',
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
  { time: '14:02:41', tag: 'SYS', tagColor: '#94A3B8', text: 'Ingesting document stream...' },
  { time: '14:02:42', tag: 'AI', tagColor: '#00D2FF', text: 'Scanning for cognitive anomalies...' },
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
  { time: '14:02:43', tag: 'SYS', tagColor: '#94A3B8', text: 'Calculating noise baseline...' },
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
                borderLeft: '2px solid rgba(0, 210, 255, 0.25)',
                background: 'rgba(0, 210, 255, 0.03)',
                borderRadius: '0 10px 10px 0',
              }}
            >
              {line.warnings?.map((w, wi) => (
                <span key={wi}>
                  <span style={{ color: '#FBBF24' }}>{w}</span>
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
          style={{ color: '#00D2FF' }}
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
  border: '1px solid rgba(0, 210, 255, 0.08)',
  boxShadow: '0 12px 48px rgba(0,0,0,0.38), 0 1px 0 rgba(0,210,255,0.06) inset',
} as const;

const glassCardLight = {
  background: 'rgba(8, 11, 20, 0.55)',
  borderRadius: '20px',
  border: '1px solid rgba(0, 210, 255, 0.06)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(0,210,255,0.05) inset',
} as const;

// Liquid glass class names to use with these styles
const glassCardClasses = 'liquid-glass-premium border border-white/12 rounded-[20px]';
const glassCardLightClasses = 'liquid-glass border border-white/10 rounded-[20px]';

// Mobile nav overlay
function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const links = [
    { label: 'How It Works', href: '#solution' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Demo', href: '/demo' },
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
                  href={process.env.NEXT_PUBLIC_DEMO_BOOKING_URL || '/demo'}
                  onClick={onClose}
                  className="btn btn-primary glow"
                  style={{ textAlign: 'center', padding: '14px', fontSize: '0.9rem' }}
                >
                  Book a Demo
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

function CaseStudiesSection() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/public/case-studies')
      .then(r => r.json())
      .then(d => {
        setCaseStudies(d.caseStudies || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (loaded && caseStudies.length === 0) {
    return (
      <section className="py-28 relative" style={{ background: 'var(--bg-primary)' }}>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '16px',
            }}
          >
            Case Studies
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7 }}>
            We&apos;re onboarding our first M&amp;A pilot cohort. Anonymized deal case studies with
            real bias detection results and outcome data will appear here as pilots complete.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="case-studies"
      className="py-28 relative"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 max-w-3xl mx-auto text-center"
        >
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '16px',
            }}
          >
            Real Results from Real Decisions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
            Retrospective analyses of landmark M&amp;A and investment failures, run through the
            Decision Intel pipeline. Every bias detection was validated against actual outcomes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map(study => (
            <motion.div
              key={study.token}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <CaseStudyCard study={study} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
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
  const proofRef = useRef(null);
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
  const proofInView = useInView(proofRef, { once: true, margin: '-100px' });
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
              <Brain className="w-5 h-5" style={{ color: '#00D2FF' }} />
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
            <a href="#features" className="hover:text-cyan-300 transition-colors duration-300">
              Features
            </a>
            <a href="#solution" className="hover:text-cyan-300 transition-colors duration-300">
              How It Works
            </a>
            <a href="#case-studies" className="hover:text-cyan-300 transition-colors duration-300">
              Case Studies
            </a>
            <a href="#pricing" className="hover:text-cyan-300 transition-colors duration-300">
              Pricing
            </a>
            <Link
              href="/demo"
              className="hover:text-cyan-300 transition-colors duration-300 font-semibold"
            >
              Demo
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
                href={process.env.NEXT_PUBLIC_DEMO_BOOKING_URL || '/demo'}
                className="btn btn-primary hidden sm:inline-flex"
                style={{ fontSize: '0.85rem' }}
              >
                Book a Demo
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
          style={{ background: 'rgba(0, 210, 255, 0.04)', y: glowY1 }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'rgba(99, 102, 241, 0.03)', y: glowY2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[30vw] rounded-full blur-[160px] pointer-events-none"
          style={{ background: 'rgba(14, 165, 233, 0.02)', y: glowY3 }}
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
                    background: 'rgba(0, 210, 255, 0.08)',
                    border: '1px solid rgba(0, 210, 255, 0.25)',
                    backdropFilter: 'blur(12px)',
                    color: '#00D2FF',
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
                  <span>The Decision Performance OS</span>
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
                  The Decision Performance OS{' '}
                  <span
                    className="block"
                    style={{
                      background: 'linear-gradient(135deg, #00D2FF, #38BDF8, #6366F1)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                    }}
                  >
                    for M&amp;A &amp; Investment Teams
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
                  Every deal thesis has hidden biases. We audit IC memos, diligence reports, and
                  strategic documents for 20+ cognitive biases and decision noise — before your
                  committee votes.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap items-center gap-4"
                >
                  <GlassRipple>
                    <Link
                      href={process.env.NEXT_PUBLIC_DEMO_BOOKING_URL || '/demo'}
                      className="btn btn-primary glow"
                      style={{ padding: '14px 32px', fontSize: '0.9rem' }}
                      onClick={() => trackEvent('hero_cta_clicked', { target: 'book_demo' })}
                    >
                      Book a Demo <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </Link>
                  </GlassRipple>
                  <GlassHover>
                    <Link
                      href="/login"
                      className="btn btn-secondary"
                      style={{ padding: '14px 32px', fontSize: '0.9rem' }}
                      onClick={() => trackEvent('hero_cta_clicked', { target: 'try_free' })}
                    >
                      Try Free
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
                        color: '#00D2FF',
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
                      '0 12px 48px rgba(0, 0, 0, 0.4), 0 0 100px rgba(0,210,255,0.04), 0 1px 0 rgba(255,255,255,0.07) inset',
                    border: '1px solid rgba(0, 210, 255, 0.12)',
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
                      <Activity className="w-4 h-4" style={{ color: '#00D2FF' }} />
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

      <SectionDivider variant="glow" color="rgba(0, 210, 255, 0.06)" />

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
                  color: '#00D2FF',
                },
                {
                  value: 28,
                  suffix: '%',
                  prefix: '',
                  label: 'Rate decisions "good"',
                  cite: 'McKinsey',
                  color: '#00D2FF',
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

      {/* Traction Counters */}
      <section className="py-16 relative" style={{ background: 'var(--bg-primary)' }}>
        <TractionCounters />
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
              The Hidden Tax on Every Deal Decision
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                maxWidth: '640px',
                fontSize: '0.95rem',
                lineHeight: 1.7,
              }}
            >
              It&apos;s not just bias. It&apos;s noise — the invisible variance that no one
              measures.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Card 1: The Noise Tax */}
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
              <Activity className="w-6 h-6 mb-4" style={{ color: '#ef4444' }} />
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}
              >
                The Noise Tax
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  marginBottom: '16px',
                }}
              >
                When Kahneman studied insurance underwriters, executives expected 10% variance
                between them. The actual number was 55%. The same pattern exists in your decision
                process — when two executives review the same proposal, their recommendations
                diverge by 40&ndash;60%. Not because of different information. Because of
                uncontrolled noise.
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
                  55% variance where executives expected 10%
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Kahneman, Sibony, Sunstein — &ldquo;Noise&rdquo; (2021)
                </p>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 600 }}>
                Decision noise is measurable, quantifiable, and reducible.
              </p>
            </motion.div>

            {/* Card 2: The Bias Multiplier */}
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
              <Brain className="w-6 h-6 mb-4" style={{ color: '#fbbf24' }} />
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}
              >
                The Bias Multiplier
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  marginBottom: '16px',
                }}
              >
                Noise is bad enough on its own. But cognitive biases make it directional —
                anchoring, confirmation bias, and groupthink don&apos;t just add randomness. They
                systematically push decisions in the wrong direction. The combination of noise +
                bias is what turns a strategic bet into a costly mistake.
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
                  Debiased decision processes improve ROI by 6.9 percentage points
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  McKinsey survey of 2,207 executives
                </p>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 600 }}>
                Bias detection + noise measurement = the full picture.
              </p>
            </motion.div>
          </div>

          {/* Closing tagline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
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
            Decision Intel measures the noise. Detects the bias. Tracks the outcomes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
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
              Run Your Noise Audit &rarr;
            </Link>
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="angle" color="rgba(0, 210, 255, 0.2)" />

      {/* Noise Audit CTA */}
      <section className="py-24 relative" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(0, 210, 255, 0.04) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                color: 'var(--text-primary)',
                marginBottom: '16px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              How Much Noise Is Hiding in Your Decision Process?
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                marginBottom: '28px',
              }}
            >
              Send us your last 3&ndash;5 strategic documents. We&apos;ll measure the variance
              between independent AI judges — the invisible tax on your outcomes that nobody
              quantifies. Most teams are shocked by the result.
            </p>
            <GlassRipple>
              <Link
                href="/login"
                className="btn btn-primary glow"
                style={{ padding: '14px 32px', fontSize: '0.95rem' }}
                onClick={() => trackEvent('noise_audit_cta_clicked')}
              >
                Run Your Free Noise Audit <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Link>
            </GlassRipple>
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="glow" color="rgba(0, 210, 255, 0.06)" />

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
              'radial-gradient(circle at 30% 50%, rgba(0, 210, 255, 0.04) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={solutionInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-5xl mx-auto"
            style={{ borderLeft: '3px solid #00D2FF', paddingLeft: '24px' }}
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
              From deal memo to verified outcome in three steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: FileSearch,
                title: 'Capture & Frame',
                description:
                  'Upload IC memos, deal theses, diligence reports, or CIMs. Define success criteria and your prior beliefs before the committee reviews.',
                color: '#00D2FF',
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
                  '11-agent pipeline detects 20+ biases (with 11 additional investment-specific overlays), runs a statistical jury for noise scoring, and simulates a boardroom of Decision Twins to stress-test your deal thesis.',
                color: '#6366F1',
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
            <div style={{ width: '120px', height: '1px', background: 'rgba(0,210,255,0.12)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.5 }}>
              Fully automated pipeline
            </span>
            <div style={{ width: '120px', height: '1px', background: 'rgba(0,210,255,0.12)' }} />
          </div>
        </div>
      </section>

      <SectionDivider variant="glow" color="rgba(0, 210, 255, 0.06)" />

      {/* Who Is This For? — Persona Section */}
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
              Who Is This For?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Decision Intel serves every layer of the investment decision stack.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Target,
                title: 'For M&A / Corp Dev',
                description:
                  'Run deal theses and diligence memos through the bias engine. Detect anchoring, overconfidence, and winner\'s curse before the board votes.',
                color: '#FFFFFF',
              },
              {
                icon: Users,
                title: 'For Investment Committees',
                description:
                  'Blind prior collection. Statistical Jury noise scoring. See exactly where your IC process leaks quality — from screening to post-exit.',
                color: '#A3E635',
              },
              {
                icon: Network,
                title: 'For PE / VC Funds',
                description:
                  'Portfolio-wide bias analytics. Deal-stage overlays. 11 investment-specific biases detected beyond the core 20.',
                color: '#22c55e',
              },
            ].map((persona, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                style={{
                  ...glassCardLight,
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: `${persona.color}12`,
                    border: `1px solid ${persona.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <persona.icon className="w-6 h-6" style={{ color: persona.color }} />
                </div>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {persona.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {persona.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider variant="angle" color="rgba(0, 210, 255, 0.06)" />

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
              We ran our engine on one of the most infamous acquisition decisions in tech history.
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

      {/* Additional Case Studies */}
      <section className="pb-28 relative" style={{ background: 'var(--bg-primary)' }}>
        <div className="relative z-10" style={containerStyle}>
          <div className="max-w-4xl mx-auto">
            <h3
              style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textAlign: 'center',
                marginBottom: '32px',
              }}
            >
              MORE RETROSPECTIVE ANALYSES ON PUBLIC DECISIONS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Case Study 2: WeWork IPO */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '28px 24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'rgba(249, 115, 22, 0.8)',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        marginBottom: '6px',
                      }}
                    >
                      CASE STUDY
                    </div>
                    <h3
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      WeWork IPO: The $39B Valuation Collapse
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      SoftBank&apos;s Vision Fund valued WeWork at $47B in early 2019. By September,
                      the failed IPO exposed governance failures and the valuation cratered to $8B.
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: '2.4rem',
                        fontWeight: 800,
                        color: '#f97316',
                        lineHeight: 1,
                      }}
                    >
                      29
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 100</div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: '#f97316',
                        fontWeight: 600,
                        marginTop: '2px',
                      }}
                    >
                      Decision Quality
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {[
                    {
                      label: 'Halo Effect',
                      sev: 'critical',
                      detail: 'Founder charisma over fundamentals',
                    },
                    {
                      label: 'Anchoring Bias',
                      sev: 'critical',
                      detail: 'Prior $47B round as anchor',
                    },
                    {
                      label: 'Herding Behavior',
                      sev: 'high',
                      detail: 'Follow-on investors mimicked SoftBank',
                    },
                    {
                      label: 'Overconfidence',
                      sev: 'high',
                      detail: '"Community-adjusted EBITDA" accepted',
                    },
                    {
                      label: 'Narrative Fallacy',
                      sev: 'high',
                      detail: '"Next Amazon" story vs. unit economics',
                    },
                    {
                      label: 'Authority Bias',
                      sev: 'medium',
                      detail: 'SoftBank brand suppressed dissent',
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
                            textTransform: 'uppercase' as const,
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
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {bias.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.3)',
                    margin: '16px 0 0 0',
                    fontStyle: 'italic',
                  }}
                >
                  Analysis based on publicly available S-1 filing, investor presentations, and press
                  coverage.
                </p>
              </motion.div>

              {/* Case Study 3: Quibi */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '28px 24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '20px',
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
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      Quibi: The $1.75B Streaming Bet That Lasted 6 Months
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      Investors including JPMorgan, Goldman Sachs, and major studios poured $1.75B
                      into Quibi. It shut down 6 months after launch with fewer than 500K paying
                      subscribers.
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: '2.4rem',
                        fontWeight: 800,
                        color: '#ef4444',
                        lineHeight: 1,
                      }}
                    >
                      31
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
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {[
                    {
                      label: 'Authority Bias',
                      sev: 'critical',
                      detail: 'Katzenberg + Whitman credentials = no pushback',
                    },
                    {
                      label: 'Survivorship Bias',
                      sev: 'critical',
                      detail: '"Mobile-first worked for TikTok"',
                    },
                    {
                      label: 'Confirmation Bias',
                      sev: 'high',
                      detail: 'Only positive focus group data cited',
                    },
                    {
                      label: 'Planning Fallacy',
                      sev: 'high',
                      detail: '7M subscribers in Y1 projection',
                    },
                    {
                      label: 'Sunk Cost Fallacy',
                      sev: 'medium',
                      detail: '$1B+ content spend pre-launch',
                    },
                    { label: 'Groupthink', sev: 'medium', detail: 'Zero dissent in $1.75B raise' },
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
                            textTransform: 'uppercase' as const,
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
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {bias.detail}
                      </div>
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.3)',
                    margin: '16px 0 0 0',
                    fontStyle: 'italic',
                  }}
                >
                  Analysis based on publicly available investor materials, press coverage, and
                  post-mortem reporting.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider variant="glow" color="rgba(0, 210, 255, 0.06)" />

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
              'radial-gradient(circle at center, rgba(0, 210, 255, 0.02) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-6xl mx-auto"
            style={{ borderLeft: '3px solid #00D2FF', paddingLeft: '24px' }}
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
              Purpose-built for M&amp;A teams, PE/VC investment committees, and corporate development
              — where a single biased decision costs millions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {/* Large Feature: Statistical Jury — Noise Measurement */}
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
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '24px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: 'rgba(0, 210, 255, 0.08)',
                      border: '1px solid rgba(0, 210, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Activity className="w-6 h-6" style={{ color: '#00D2FF' }} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      background: 'rgba(34, 197, 94, 0.12)',
                      color: '#22c55e',
                    }}
                  >
                    Most Differentiated
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    marginBottom: '12px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Statistical Jury — Noise Measurement
                </h3>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    maxWidth: '400px',
                    lineHeight: 1.7,
                  }}
                >
                  Three independent AI judges score every document blind. We measure the variance
                  between them to quantify how much &ldquo;noise&rdquo; — unwanted variability —
                  exists in your decision process. Every AI tool claims to detect bias. Almost
                  nobody measures decision noise with a triple-judge methodology.
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
                      noise_audit.json
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        color: '#22c55e',
                      }}
                    >
                      Noise Audit
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    <span style={{ color: '#FFFFFF' }}>Judge A</span>:{' '}
                    <span style={{ color: '#22c55e' }}>72</span> &nbsp;
                    <span style={{ color: '#FFFFFF' }}>Judge B</span>:{' '}
                    <span style={{ color: '#fbbf24' }}>58</span> &nbsp;
                    <span style={{ color: '#FFFFFF' }}>Judge C</span>:{' '}
                    <span style={{ color: '#22c55e' }}>69</span>
                    <br />
                    <span style={{ color: '#FFFFFF' }}>&quot;variance&quot;</span>:{' '}
                    <span style={{ color: '#ef4444' }}>14.2</span> &nbsp;
                    <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                      {'// high noise'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Cognitive Bias Engine */}
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
                    background: 'rgba(0, 210, 255, 0.08)',
                    border: '1px solid rgba(0, 210, 255, 0.15)',
                  }}
                >
                  <Brain className="w-5 h-5" style={{ color: '#00D2FF' }} />
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
                  20 Bias Types
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
                Cognitive Bias Engine
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                Scans board memos, strategy papers, and decision documents for anchoring,
                confirmation bias, groupthink, and 12+ other cognitive biases with confidence
                scoring and severity classification.
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
                Real-Time
                <br />
                Streaming
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                11-agent pipeline streams results as each stage completes. Quick scan in under 5
                seconds.
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

      <SectionDivider variant="angle" color="rgba(0, 210, 255, 0.08)" />

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
              'radial-gradient(circle at 70% 30%, rgba(0, 210, 255, 0.03) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={moatInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-6xl mx-auto"
            style={{ borderLeft: '3px solid #00D2FF', paddingLeft: '24px' }}
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
                    color: '#00D2FF',
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
                    color: '#6366F1',
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

          {/* Competitor comparison callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={moatInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div
              style={{
                ...glassCardLight,
                padding: '28px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: '3px solid rgba(0, 210, 255, 0.2)',
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
        </div>
      </section>

      <SectionDivider variant="wave" color="rgba(0, 210, 255, 0.06)" />

      {/* Pre-Decision Evidence — "We Don't Use Hindsight" */}
      <section ref={proofRef} className="py-32" style={{ background: 'var(--bg-primary)' }}>
        <div style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={proofInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 text-center max-w-3xl mx-auto"
          >
            <div
              style={{
                display: 'inline-block',
                padding: '4px 16px',
                borderRadius: 20,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#ef4444',
                marginBottom: '1.5rem',
              }}
            >
              Eliminating Hindsight Bias
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--text-primary)',
                marginBottom: '16px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              We Don&apos;t Use Hindsight.{' '}
              <span style={{ color: '#00D2FF' }}>We Prove It.</span>
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '1.05rem',
                lineHeight: 1.7,
                maxWidth: '640px',
                margin: '0 auto',
              }}
            >
              Our case study database includes original board memos, SEC filings, and strategy
              documents from <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>before outcomes were known</span> — proving every bias was detectable at decision time.
            </p>
          </motion.div>

          {/* Three before/after cards */}
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              {
                company: 'Boeing',
                year: '2011',
                document: '2011 Board Presentation: "Re-engining the 737 represents a $2.5B investment versus $20B+ for a clean-sheet design. MCAS software can bridge any aerodynamic gaps as a minor modification..."',
                docType: 'Board Memo',
                flags: ['$20B clean-sheet dismissed as too expensive', 'MCAS framed as "minor" software fix', 'Airbus A320neo timeline driving urgency'],
                biases: ['Sunk Cost', 'Anchoring', 'Time Pressure'],
                outcome: '346 lives lost. $20B+ in losses.',
                color: '#ef4444',
              },
              {
                company: 'Yahoo',
                year: '2008',
                document: 'Board Rejection Letter: "Yahoo\'s board unanimously believes that the Microsoft offer substantially undervalues Yahoo. The company is worth significantly more than $31 per share..."',
                docType: 'Public Statement',
                flags: ['62% premium over market price rejected', 'No alternative plan presented', 'Carl Icahn proxy fight ignored'],
                biases: ['Overconfidence', 'Anchoring', 'Status Quo'],
                outcome: 'Sold to Verizon for $4.5B (vs $44.6B offer).',
                color: '#f97316',
              },
              {
                company: 'Enron',
                year: '2001',
                document: 'Sherron Watkins Memo to CEO: "I am incredibly nervous that we will implode in a wave of accounting scandals. The Raptor and Condor SPE vehicles have no economic substance..."',
                docType: 'Internal Memo',
                flags: ['Off-balance-sheet SPEs hiding $38B debt', 'Mark-to-market on illiquid assets', 'CFO conflict: ran LJM partnerships'],
                biases: ['Groupthink', 'Authority Bias', 'Confirmation'],
                outcome: '$74B in shareholder value destroyed.',
                color: '#ef4444',
              },
            ].map((card, i) => (
              <motion.div
                key={card.company}
                initial={{ opacity: 0, y: 30 }}
                animate={proofInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid var(--border-primary, rgba(255,255,255,0.06))',
                  background: 'var(--bg-secondary, rgba(0,0,0,0.3))',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-primary, rgba(255,255,255,0.06))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {card.company}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {card.docType} — {card.year}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 600,
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    PRE-DECISION
                  </div>
                </div>

                {/* Document excerpt */}
                <div
                  style={{
                    padding: '16px 20px',
                    fontSize: 12,
                    lineHeight: 1.7,
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    borderBottom: '1px solid var(--border-primary, rgba(255,255,255,0.06))',
                    borderLeft: '3px solid rgba(99, 102, 241, 0.3)',
                    marginLeft: 20,
                    marginRight: 20,
                    marginTop: 0,
                    marginBottom: 0,
                    paddingLeft: 14,
                  }}
                >
                  &ldquo;{card.document.replace(/^.*?: "?/, '').replace(/"$/, '')}&rdquo;
                </div>

                {/* What DI would flag */}
                <div style={{ padding: '16px 20px' }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.08em',
                      color: '#ef4444',
                      marginBottom: 8,
                    }}
                  >
                    Red Flags Detectable at Decision Time
                  </div>
                  {card.flags.map(f => (
                    <div
                      key={f}
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary, #a1a1aa)',
                        lineHeight: 1.6,
                        paddingLeft: 12,
                        position: 'relative',
                      }}
                    >
                      <span style={{ position: 'absolute', left: 0, color: '#ef4444' }}>•</span>
                      {f}
                    </div>
                  ))}

                  {/* Bias badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                    {card.biases.map(b => (
                      <span
                        key={b}
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: 'rgba(245, 158, 11, 0.1)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  {/* Outcome */}
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border-primary, rgba(255,255,255,0.06))',
                      fontSize: 12,
                      fontWeight: 600,
                      color: card.color,
                    }}
                  >
                    What happened: {card.outcome}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={proofInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 }}
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              marginTop: '3rem',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
            }}
          >
            14 case studies in our database now include original pre-decision documents — with more added monthly.
            Every flaggable bias was visible{' '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              before the outcome was known
            </span>.
          </motion.p>
        </div>
      </section>

      <SectionDivider variant="wave" color="rgba(0, 210, 255, 0.06)" />

      {/* ROI Calculator */}
      <section id="roi" ref={roiRef} className="py-32" style={{ background: 'var(--bg-primary)' }}>
        <div style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={roiInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-6xl mx-auto"
            style={{ borderLeft: '3px solid #00D2FF', paddingLeft: '24px' }}
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
              What Noise Costs Your Organization
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Every major decision carries hidden variance. Calculate what it costs.
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
                      roiTimerRef.current = setTimeout(
                        () => trackEvent('roi_calculator_used'),
                        1000
                      );
                    }}
                    aria-label="Annual Decisions"
                    className="w-full h-1 appearance-none cursor-pointer outline-none"
                    style={{
                      accentColor: '#00D2FF',
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
                      roiTimerRef.current = setTimeout(
                        () => trackEvent('roi_calculator_used'),
                        1000
                      );
                    }}
                    aria-label="Average Decision Value"
                    className="w-full h-1 appearance-none cursor-pointer outline-none"
                    style={{
                      accentColor: '#00D2FF',
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
                border: '1px solid rgba(0, 210, 255, 0.12)',
                boxShadow:
                  '0 12px 48px rgba(0, 0, 0, 0.38), 0 0 40px rgba(0, 210, 255, 0.04), 0 1px 0 rgba(255,255,255,0.07) inset',
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
                      background: '#00D2FF',
                      boxShadow: '0 0 8px rgba(0, 210, 255, 0.3)',
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
                      Projected Recoverable Value
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

                <p
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    opacity: 0.6,
                    marginTop: '12px',
                    lineHeight: 1.5,
                  }}
                >
                  {outcomeStats?.isRealData
                    ? 'Based on real platform outcome data.'
                    : 'Organizations lose millions per year to bias-driven decisions. Estimates based on Kahneman et al., "Noise" (2021). Actual results vary by organization and decision type.'}
                </p>

                <div
                  style={{ paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
                >
                  <Link
                    href="/demo"
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
                    See Your Decision Noise Tax
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider variant="angle" color="rgba(0, 210, 255, 0.06)" />

      {/* Case Studies Section */}
      <CaseStudiesSection />

      <SectionDivider variant="angle" color="rgba(0, 210, 255, 0.06)" />

      {/* Security & Trust Section */}
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
              Enterprise-Grade Security for Sensitive Documents
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Your strategic documents contain sensitive information. We treat them accordingly.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                icon: Shield,
                title: 'AES-256 Encryption at Rest',
                description:
                  'Every document is encrypted using AES-256-GCM before it touches the database. Your content is never stored in plaintext.',
              },
              {
                icon: Lock,
                title: 'TLS 1.3 in Transit',
                description:
                  'All data is encrypted in transit with TLS 1.3 and HSTS enforcement. No exceptions, no downgrades.',
              },
              {
                icon: Eye,
                title: 'Automatic PII Redaction',
                description:
                  'Personally identifiable information is detected and redacted before analysis. Sensitive details never reach the AI pipeline.',
              },
              {
                icon: Brain,
                title: 'Your Data Never Trains Models',
                description:
                  'Document content is never used to train or fine-tune any AI model. Your proprietary intelligence stays yours.',
              },
              {
                icon: FileSearch,
                title: 'GDPR Right-to-Erasure',
                description:
                  'Full data deletion on request — documents, analyses, embeddings, and audit logs. Atomic transaction, no residual data.',
              },
              {
                icon: CheckCircle2,
                title: 'SOC 2 Certified Infrastructure',
                description:
                  'Hosted on SOC 2 Type II certified infrastructure (Vercel + Supabase). Row-level access controls and audit logging.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{
                  ...glassCardLight,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.icon className="w-5 h-5" style={{ color: '#22c55e' }} />
                </div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider variant="glow" color="rgba(0, 210, 255, 0.06)" />

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
              'radial-gradient(circle at 50% 40%, rgba(0, 210, 255, 0.02) 0%, transparent 60%)',
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
              What Would You Pay to Avoid Your Next Bad Deal?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              A single due diligence engagement costs $500K–$2M. Decision Intel audits every deal
              thesis continuously for less than the cost of one junior analyst.
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
                  background: !isAnnual ? 'rgba(0, 210, 255, 0.12)' : 'transparent',
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
                  background: isAnnual ? 'rgba(0, 210, 255, 0.12)' : 'transparent',
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
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> one-time</span>
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
                {['3 decision analyses', '10 page max', '5 bias types', 'Docs support'].map(
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
                See how much hidden bias and noise lives in your strategic documents.
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
                Try Free
              </Link>
            </motion.div>

            {/* Pro Tier — Highlighted */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={pricingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(0, 210, 255, 0.3)',
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
                Best for Deal Teams
              </div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                Professional
              </h3>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isAnnual ? '$279' : '$349'}
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
                  '50 decision analyses/month',
                  'All 20 bias types',
                  'Decision twins + boardroom simulation',
                  'Noise analysis + knowledge graph',
                  'Project outcome tracking',
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
                For analysts and leaders running strategic documents through the bias gauntlet.
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
                Most Popular
              </div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                Team
              </h3>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isAnnual ? '$799' : '$999'}
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
                  '250 decision analyses/month',
                  'All 20 bias types',
                  'Project pipeline + stage tracking',
                  'Team calibration + blind voting',
                  'Slack integration + API access',
                  'Decision nudges + experiments',
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
                For executive teams and committees managing high-stakes decisions across the
                organization.
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
                Enterprise
              </h3>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Custom
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> pricing</span>
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
                  'Unlimited decisions + documents',
                  'Multi-team analytics + reporting',
                  'SSO + audit log + full API',
                  'Dedicated CSM',
                  'Custom bias taxonomies + personas',
                  'Private cloud deployment available',
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
                For PE funds and M&amp;A teams embedding decision quality into every deal.
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
            All paid plans include a 14-day free trial. No credit card required to start.
            Organizations lose millions per year to bias-driven decisions. Decision Intel costs a
            fraction of what one bad decision costs.
          </motion.p>
        </div>
      </section>

      <SectionDivider variant="angle" color="rgba(0, 210, 255, 0.06)" />

      {/* Pilot Program Section */}
      <section className="py-28 relative" style={{ background: 'var(--bg-primary)' }}>
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px',
              }}
            >
              Start With a 30-Day Pilot
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1.1rem',
                lineHeight: 1.7,
                marginBottom: '40px',
              }}
            >
              For M&amp;A teams and investment committees. See the bias engine in action on your
              real deal documents before committing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-10">
              {[
                {
                  title: 'Guided Onboarding',
                  desc: 'We configure deal-specific taxonomies, investment bias profiles, and noise benchmarks for your committee.',
                },
                {
                  title: '50 Decision Analyses',
                  desc: 'Run your actual documents through the 11-agent pipeline. See real DQI scores and bias detection.',
                },
                {
                  title: 'Outcome Tracking Setup',
                  desc: 'Connect your deal pipeline so the system starts learning from your investment outcomes immediately.',
                },
                {
                  title: 'Calibration Report',
                  desc: 'At 30 days, receive a full calibration report: bias patterns, noise levels, and ROI projections.',
                },
              ].map(item => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <h3
                    className="font-semibold mb-2"
                    style={{ color: 'var(--text-primary)', fontSize: '1rem' }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href={process.env.NEXT_PUBLIC_DEMO_BOOKING_URL || '/demo'}
              className="btn btn-primary glow"
              style={{ padding: '14px 32px', fontSize: '0.95rem' }}
              onClick={() => trackEvent('pilot_cta_clicked')}
            >
              Apply for Pilot <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Link>
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="angle" color="rgba(0, 210, 255, 0.06)" />

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
            style={{ borderLeft: '3px solid #00D2FF', paddingLeft: '24px' }}
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
                q: 'How is sensitive data protected?',
                a: 'All documents are encrypted at rest (AES-256) and in transit (TLS 1.3). We are hosted on SOC 2 Type II certified infrastructure (Vercel and Supabase), and PII is automatically detected and redacted before analysis. Your data is never used to train models and is deleted upon request.',
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

      <SectionDivider variant="glow" color="rgba(0, 210, 255, 0.06)" />

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
              'radial-gradient(ellipse at center, rgba(0, 210, 255, 0.03) 0%, transparent 60%)',
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
                background: 'rgba(0, 210, 255, 0.08)',
                border: '1px solid rgba(0, 210, 255, 0.2)',
                color: '#00D2FF',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <Target className="w-3.5 h-3.5" />
              Built for Teams That Make Decisions That Matter
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
                  background: 'linear-gradient(135deg, #00D2FF, #38BDF8, #6366F1)',
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
              Be among the first teams to audit decision quality with AI — from executive committees
              and M&amp;A teams to strategy groups and risk officers.
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
                href={process.env.NEXT_PUBLIC_DEMO_BOOKING_URL || '/demo'}
                className="btn btn-primary glow"
                style={{
                  padding: '16px 40px',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Book a Demo <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Link>
              <Link
                href="/login"
                className="btn btn-secondary"
                style={{ padding: '16px 32px', fontSize: '0.95rem' }}
              >
                Try Free
              </Link>
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
                14-day free trial on all plans
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                Hosted on SOC 2 certified infra
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
          borderTop: '1px solid transparent',
          borderImage: 'linear-gradient(90deg, transparent, rgba(0,210,255,0.2), transparent) 1',
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
                  <Brain className="w-4 h-4" style={{ color: '#00D2FF' }} />
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
                The Decision Performance OS for M&amp;A and investment teams. Audit every deal
                thesis for cognitive bias and decision noise.
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
                  { label: 'Contact', href: 'mailto:folahanwilliams@gmail.com' },
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
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Cookie Policy', href: '/privacy#cookies' },
                  { label: 'GDPR', href: '/privacy#gdpr' },
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
                { icon: Mail, href: 'mailto:folahanwilliams@gmail.com', label: 'Email' },
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
