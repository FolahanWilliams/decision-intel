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
  const [activeDemo, setActiveDemo] = useState<'chaos' | 'order'>('chaos');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [annualDecisions, setAnnualDecisions] = useState(5000);
  const [avgDecisionValue, setAvgDecisionValue] = useState(10000);

  const noiseTaxRate = 0.12;
  const potentialLoss = annualDecisions * avgDecisionValue * noiseTaxRate;
  const potentialSavings = potentialLoss * 0.6;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const heroRef = useRef(null);
  const problemRef = useRef(null);
  const solutionRef = useRef(null);
  const featuresRef = useRef(null);
  const moatRef = useRef(null);
  const socialRef = useRef(null);
  const roiRef = useRef(null);
  const faqRef = useRef(null);
  const ctaRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, margin: '-100px' });
  const problemInView = useInView(problemRef, { once: true, margin: '-100px' });
  const solutionInView = useInView(solutionRef, { once: true, margin: '-100px' });
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });
  const moatInView = useInView(moatRef, { once: true, margin: '-100px' });
  const socialInView = useInView(socialRef, { once: true, margin: '-100px' });
  const roiInView = useInView(roiRef, { once: true, margin: '-100px' });
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
                  <span>Built for Capital Allocators</span>
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
                  The only system that tracks, scores, and
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
                    improves executive decision performance over time
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
                  Every decision your team makes generates proprietary data that makes your next
                  analysis more accurate. After 90 days, your org-specific bias detection is{' '}
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>3x more precise</span> than
                  any generic tool.
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
                    >
                      Get Early Access <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </Link>
                  </GlassRipple>
                  <GlassHover>
                    <a
                      href="#solution"
                      className="btn btn-secondary"
                      style={{ padding: '14px 32px', fontSize: '0.9rem' }}
                    >
                      See How It Works
                    </a>
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

      {/* Social Proof Stats */}
      <section
        ref={socialRef}
        className="py-16 relative"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="relative z-10" style={containerStyle}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={socialInView ? { opacity: 1, y: 0 } : {}}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              {
                value: 15,
                suffix: '',
                label: 'Cognitive Biases Detected',
                color: '#FFFFFF',
              },
              { value: 3, suffix: 'x', label: 'Independent AI Judges', color: '#22c55e' },
              { value: 10, suffix: '', label: 'Agent Analysis Pipeline', color: '#FFFFFF' },
              { value: 60, suffix: 's', label: 'Full Audit Turnaround', color: '#FFFFFF' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={socialInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
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
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
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
              The Hidden Tax on Investment Returns
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                maxWidth: '640px',
                fontSize: '0.95rem',
                lineHeight: 1.7,
              }}
            >
              Investment committees evaluating identical deals produce wildly varying
              recommendations. Cognitive bias and decision noise silently erode fund performance —
              and nobody is measuring it.
            </p>
          </motion.div>

          {/* Mobile tab switcher */}
          <div className="flex md:hidden gap-2 mb-6 max-w-6xl mx-auto">
            <button
              onClick={() => setActiveDemo('chaos')}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background:
                  activeDemo === 'chaos' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255,255,255,0.04)',
                color: activeDemo === 'chaos' ? '#ef4444' : 'var(--text-muted)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor:
                  activeDemo === 'chaos' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Without
            </button>
            <button
              onClick={() => setActiveDemo('order')}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background:
                  activeDemo === 'order' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.04)',
                color: activeDemo === 'order' ? '#22c55e' : 'var(--text-muted)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor:
                  activeDemo === 'order' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              With
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Without Decision Intel */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              className={`cursor-pointer transition-all duration-300 ${activeDemo !== 'chaos' ? 'hidden md:block' : ''}`}
              onClick={() => setActiveDemo('chaos')}
              style={{
                background:
                  activeDemo === 'chaos' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(8, 11, 20, 0.55)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                border:
                  activeDemo === 'chaos'
                    ? '1px solid rgba(239, 68, 68, 0.25)'
                    : '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: '20px',
                boxShadow:
                  activeDemo === 'chaos'
                    ? '0 12px 40px rgba(239, 68, 68, 0.12), 0 1px 0 rgba(255,255,255,0.06) inset'
                    : '0 8px 32px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255,255,255,0.05) inset',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid rgba(239, 68, 68, 0.12)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444' }} />
                  <h3 style={{ fontSize: '1.1rem', color: '#ef4444', fontWeight: 700 }}>
                    Without Decision Intel
                  </h3>
                </div>
                {activeDemo === 'chaos' && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    Active
                  </span>
                )}
              </div>

              <div
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {[
                  'IC members score identical deals 30-40% apart (Kahneman, Noise)',
                  'Anchoring to entry multiples distorts exit analysis',
                  'No longitudinal tracking of decision accuracy',
                  'Estimated 8-15% of returns lost to unaudited cognitive errors',
                ].map((text, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px',
                      background: 'rgba(239, 68, 68, 0.04)',
                      borderRadius: '10px',
                      border: '1px solid rgba(239, 68, 68, 0.08)',
                    }}
                  >
                    <span
                      style={{
                        color: '#ef4444',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        flexShrink: 0,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {i === 3 ? 'FTL' : 'ERR'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.9rem',
                        color: i === 3 ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* With Decision Intel */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 }}
              className={`cursor-pointer transition-all duration-300 ${activeDemo !== 'order' ? 'hidden md:block' : ''}`}
              onClick={() => setActiveDemo('order')}
              style={{
                background:
                  activeDemo === 'order' ? 'rgba(34, 197, 94, 0.06)' : 'rgba(8, 11, 20, 0.55)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                border:
                  activeDemo === 'order'
                    ? '1px solid rgba(34, 197, 94, 0.25)'
                    : '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: '20px',
                boxShadow:
                  activeDemo === 'order'
                    ? '0 12px 40px rgba(34, 197, 94, 0.12), 0 1px 0 rgba(255,255,255,0.06) inset'
                    : '0 8px 32px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255,255,255,0.05) inset',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid rgba(34, 197, 94, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" style={{ color: '#22c55e' }} />
                  <h3 style={{ fontSize: '1.1rem', color: '#22c55e', fontWeight: 700 }}>
                    With Decision Intel
                  </h3>
                </div>
                {activeDemo === 'order' && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: 'rgba(34, 197, 94, 0.12)',
                      color: '#22c55e',
                    }}
                  >
                    Active
                  </span>
                )}
              </div>

              <div
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {[
                  'Every IC memo scored against calibrated baselines',
                  '15+ investment-specific bias signatures detected',
                  'Mandatory outcome tracking proves decision ROI',
                  'Decision Twin boardroom simulates dissent before you vote',
                ].map((text, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px',
                      background: 'rgba(34, 197, 94, 0.04)',
                      borderRadius: '10px',
                      border: '1px solid rgba(34, 197, 94, 0.08)',
                    }}
                  >
                    <span
                      style={{
                        color: '#22c55e',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        flexShrink: 0,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {i === 3 ? 'OPT' : 'SYS'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.9rem',
                        color: i === 3 ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
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
              From investment memo to verified outcome in three steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: FileSearch,
                title: 'Capture & Frame',
                description:
                  'Upload investment memos, board papers, or IC transcripts. Define success criteria and your prior beliefs before analysis begins.',
                color: '#FFFFFF',
                details: [
                  'Investment memo parsing',
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
                  'Log actual outcomes. See your Confidence vs Reality calibration curve. Watch "This bias cost you X" calculations compound your advantage over time.',
                color: '#22c55e',
                details: [
                  'Mandatory outcome tracking',
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
              Purpose-built for investment committees, PE/VC partners, and capital allocators.
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
                  Scans investment memos, IC transcripts, and board papers for 15+ cognitive biases
                  including anchoring to entry multiples, confirmation bias in due diligence, and
                  groupthink in committee votes.
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
              longitudinal dataset of audited investment decisions with verified outcomes that your
              fund builds inside Decision Intel over time.
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
                      'AI detects cognitive biases and quantifies decision noise across your investment committee',
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
                      'Every outcome retrains the system. Over time, you see exactly which biases cost your fund money — your data, not generic warnings',
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
                title: 'Mandatory Outcome Flywheel',
                description:
                  'The platform enforces outcome reporting — you cannot run new analyses until prior decisions are closed out. Every outcome sharpens your bias detection and calibrates your Decision Twins.',
                stat: 'Compounding data advantage',
                color: '#FFFFFF',
              },
              {
                icon: RefreshCw,
                title: 'Auto-Recalibrating',
                description:
                  "Every outcome retrains bias weights, nudge thresholds, and Decision Twin accuracy for YOUR org. Not generic warnings — your fund's actual P&L impact by bias type.",
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
                  which biases actually cost your fund money
                </span>
                , which Decision Twin personas are most accurate for your deal types, and{' '}
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
              Model the financial impact of unaudited investment decisions.
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
                    onChange={e => setAnnualDecisions(Number(e.target.value))}
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
                    onChange={e => setAvgDecisionValue(Number(e.target.value))}
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
                  {`// Baseline noise tax derived from Kahneman et al.`}
                  <br />
                  const NOISE_TAX = 0.12;
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
                a: 'All documents are encrypted at rest (AES-256) and in transit (TLS 1.3). We run on SOC 2 Type II audited infrastructure, and PII is automatically detected and redacted before analysis. Your data is never used to train models and is deleted upon request. We support on-prem deployment for funds requiring full data sovereignty.',
              },
              {
                q: 'How long does integration take?',
                a: 'Most investment teams are up and running in under 30 minutes. Upload investment memos directly, connect your IC Slack channel with a single OAuth flow, or use our REST API for programmatic ingestion. No infrastructure changes required.',
              },
              {
                q: 'How does outcome tracking work?',
                a: 'After each decision analysis, the platform prompts you to report the actual outcome (success, partial, failure) at configurable intervals (30/60/90 days, 6 months, 1 year). Outcome reporting is enforced — if you have 5+ analyses awaiting outcomes, new analyses are gated until you close the loop. This deliberate friction ensures the calibration flywheel keeps spinning: your bias severity weights, Decision Twin accuracy, and org-specific causal models all improve with every tracked outcome.',
              },
              {
                q: 'What is a Decision Twin?',
                a: 'Decision Twins are AI-simulated boardroom personas (e.g. Fiscal Conservative, Growth Advocate, Compliance Guard) that independently vote on your investment thesis. Research shows that simulated dissent improves outcomes by 15-25%. The platform tracks which twin was most accurate over time.',
              },
              {
                q: 'What compliance standards do you support?',
                a: 'Built-in mapping for SOX Section 302/404, SEC disclosure requirements, FCA Consumer Duty, and EU AI Act governance. Exportable audit trails with full decision lineage, bias detection logs, and outcome verification for regulator-ready governance packs.',
              },
              {
                q: 'How is this different from a generic AI bias scanner?',
                a: 'Generic scanners analyze one document at a time with no memory. Decision Intel builds a longitudinal dataset of your audited decisions with verified outcomes. After 6 months, your platform knows which biases cost your fund the most, which Decision Twin is most accurate for your deal type, and how your calibration has improved. That dataset is your moat.',
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
              Built for capital allocators
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
              Your next investment decision
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
              Be among the first PE/VC funds and investment committees to audit decision quality
              with AI — track biases, measure noise, and build organizational decision memory.
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
                Get Early Access <ArrowRight className="w-4 h-4 ml-2 inline" />
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
                The Decision Performance OS for capital allocators. Track, score, and improve
                investment decisions with measurable ROI.
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
                  { label: 'API Documentation', href: '#' },
                  { label: 'Research Papers', href: '#' },
                  { label: 'Blog', href: '#' },
                  { label: 'Support', href: '#' },
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
                { icon: Github, href: '#', label: 'GitHub' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
                { icon: Mail, href: '#', label: 'Email' },
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
