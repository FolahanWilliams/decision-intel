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
} from 'lucide-react';

// Scroll Progress
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-50"
      style={{
        scaleX: scrollYProgress,
        background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
        boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
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
  { time: '14:02:41', tag: 'SYS', tagColor: '#3b82f6', text: 'Ingesting document stream...' },
  { time: '14:02:42', tag: 'AI', tagColor: '#3b82f6', text: 'Scanning for cognitive anomalies...' },
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
  { time: '14:02:43', tag: 'SYS', tagColor: '#3b82f6', text: 'Calculating noise baseline...' },
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
                borderLeft: '2px solid rgba(245, 158, 11, 0.4)',
                background: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '0 10px 10px 0',
              }}
            >
              {line.warnings?.map((w, wi) => (
                <span key={wi}>
                  <span style={{ color: '#f59e0b' }}>{w}</span>
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
          style={{ color: '#f59e0b' }}
        >
          ▊
        </motion.span>
      )}
    </div>
  );
}

// Glass card style helper
const glassCard = {
  background: 'rgba(8, 11, 20, 0.58)',
  backdropFilter: 'blur(32px) saturate(170%)',
  WebkitBackdropFilter: 'blur(32px) saturate(170%)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '20px',
  boxShadow: '0 12px 48px rgba(0,0,0,0.38), 0 1px 0 rgba(255,255,255,0.07) inset',
} as const;

const glassCardLight = {
  background: 'rgba(8, 11, 20, 0.55)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '20px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.06) inset',
} as const;

// Mobile nav overlay
function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const links = [
    { label: 'The Problem', href: '#problem' },
    { label: 'How It Works', href: '#solution' },
    { label: 'Features', href: '#features' },
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
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            key="mobile-nav-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-72"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            style={{
              background: 'rgba(8, 11, 20, 0.95)',
              backdropFilter: 'blur(40px)',
              borderLeft: '1px solid rgba(255,255,255,0.10)',
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
                  className="hover:text-amber-400 transition-colors"
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
              <Link
                href="/login"
                onClick={onClose}
                className="btn btn-primary glow"
                style={{ textAlign: 'center', padding: '14px', fontSize: '0.9rem' }}
              >
                Get Started
              </Link>
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
  const socialRef = useRef(null);
  const roiRef = useRef(null);
  const faqRef = useRef(null);
  const ctaRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, margin: '-100px' });
  const problemInView = useInView(problemRef, { once: true, margin: '-100px' });
  const solutionInView = useInView(solutionRef, { once: true, margin: '-100px' });
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });
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

  return (
    <div
      className="min-h-screen overflow-x-hidden selection:bg-amber-500/30 selection:text-white"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <ScrollProgress />
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(8, 11, 20, 0.65)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset',
        }}
      >
        <div className="container mx-auto py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                padding: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                borderRadius: '14px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Brain className="w-5 h-5" style={{ color: '#f59e0b' }} />
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
            <a href="#problem" className="hover:text-amber-400 transition-colors duration-300">
              The Problem
            </a>
            <a href="#solution" className="hover:text-amber-400 transition-colors duration-300">
              How It Works
            </a>
            <a href="#features" className="hover:text-amber-400 transition-colors duration-300">
              Features
            </a>
            <a href="#roi" className="hover:text-amber-400 transition-colors duration-300">
              ROI
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="btn btn-secondary hidden sm:inline-flex"
              style={{ fontSize: '0.85rem' }}
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="btn btn-primary hidden sm:inline-flex"
              style={{ fontSize: '0.85rem' }}
            >
              Get Started
            </Link>
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
          style={{ background: 'rgba(245, 158, 11, 0.07)', y: glowY1 }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'rgba(99, 102, 241, 0.06)', y: glowY2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[30vw] rounded-full blur-[160px] pointer-events-none"
          style={{ background: 'rgba(168, 85, 247, 0.04)', y: glowY3 }}
        />

        <div className="container relative z-10">
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
                    background: 'rgba(245, 158, 11, 0.10)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    backdropFilter: 'blur(12px)',
                    color: '#f59e0b',
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
                  <span>Now Available</span>
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
                  Quantify
                  <span
                    className="block"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                    }}
                  >
                    Decision Noise.
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
                  Cognitive biases and inconsistencies silently drain{' '}
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>12-15%</span> of revenue.
                  Deploy our AI audit engine to detect, measure, and eliminate human error in
                  critical decisions.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap items-center gap-4"
                >
                  <Link
                    href="/login"
                    className="btn btn-primary glow"
                    style={{ padding: '14px 32px', fontSize: '0.9rem' }}
                  >
                    Start Free Trial <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Link>
                  <a
                    href="#solution"
                    className="btn btn-secondary"
                    style={{ padding: '14px 32px', fontSize: '0.9rem' }}
                  >
                    See How It Works
                  </a>
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
                        color: '#3b82f6',
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
                      '0 12px 48px rgba(0, 0, 0, 0.4), 0 0 100px rgba(245, 158, 11, 0.05), 0 1px 0 rgba(255,255,255,0.07) inset',
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
                      <Activity className="w-4 h-4" style={{ color: '#f59e0b' }} />
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

      <SectionDivider variant="glow" color="rgba(245, 158, 11, 0.15)" />

      {/* Social Proof Stats */}
      <section
        ref={socialRef}
        className="py-16 relative"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={socialInView ? { opacity: 1, y: 0 } : {}}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              { value: 15000, suffix: '+', label: 'Decisions Audited', color: '#f59e0b' },
              { value: 47, suffix: '%', label: 'Avg Noise Reduction', color: '#22c55e' },
              { value: 15, suffix: '+', label: 'Bias Types Detected', color: '#3b82f6' },
              { value: 2.4, suffix: 's', label: 'Avg Analysis Time', color: '#a855f7' },
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
        <div className="container relative z-10">
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
              The Hidden Cost of Decision Noise
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                maxWidth: '640px',
                fontSize: '0.95rem',
                lineHeight: 1.7,
              }}
            >
              Different experts evaluating identical data produce wildly varying outputs. Human
              inconsistency is a silent tax destroying profit margins.
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
                  'High variance across similar critical decisions',
                  'Undetected cognitive biases steering outcomes',
                  'No visibility or measurability of decision quality',
                  '12-15% of EBITDA lost to systematic errors',
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
                  'Consistent, objectively scored decision criteria',
                  '15+ bias signatures detected automatically',
                  'Quantifiable metrics generated for every review',
                  'Up to 60% reduction in measured variance',
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

      <SectionDivider variant="angle" color="rgba(99, 102, 241, 0.2)" />

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
              'radial-gradient(circle at 30% 50%, rgba(99, 102, 241, 0.04) 0%, transparent 60%)',
          }}
        />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={solutionInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-5xl mx-auto"
            style={{ borderLeft: '3px solid #6366f1', paddingLeft: '24px' }}
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
              Three steps from noisy decisions to quantified intelligence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: FileSearch,
                title: 'Upload & Ingest',
                description:
                  'Submit decision documents, meeting notes, or Slack threads. Our pipeline extracts structured decision data automatically.',
                color: '#f59e0b',
                details: ['PDF, DOCX, TXT support', 'Slack & API integrations', 'Batch processing'],
              },
              {
                step: '02',
                icon: Brain,
                title: 'AI Cognitive Audit',
                description:
                  'Multi-agent AI pipeline scans for 15+ cognitive biases, runs a statistical jury for noise measurement, and scores decision quality.',
                color: '#6366f1',
                details: ['Bias detection engine', 'Noise quantification', 'Pre-mortem analysis'],
              },
              {
                step: '03',
                icon: TrendingUp,
                title: 'Actionable Insights',
                description:
                  'Receive behavioral nudges, compliance reports, and historical trend analysis. Track improvement over time.',
                color: '#22c55e',
                details: ['Real-time nudges', 'Effectiveness tracking', 'ROI dashboards'],
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

      <SectionDivider variant="glow" color="rgba(245, 158, 11, 0.15)" />

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
              'radial-gradient(circle at center, rgba(245, 158, 11, 0.03) 0%, transparent 70%)',
          }}
        />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-6xl mx-auto"
            style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '24px' }}
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
              Platform Features
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Enterprise-grade tools for cognitive auditing.
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
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Brain className="w-6 h-6" style={{ color: '#f59e0b' }} />
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
                  Advanced argumentation mining algorithms parse unstructured text to identify 15+
                  logical fallacies and cognitive distortions including confirmation bias,
                  anchoring, and groupthink.
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
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#f59e0b',
                      }}
                    >
                      Bias Detected
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    <span style={{ color: '#3b82f6' }}>&quot;biasType&quot;</span>:{' '}
                    <span style={{ color: '#f59e0b' }}>&quot;Confirmation Bias&quot;</span>,<br />
                    <span style={{ color: '#3b82f6' }}>&quot;severity&quot;</span>:{' '}
                    <span style={{ color: '#f59e0b' }}>&quot;HIGH&quot;</span>,<br />
                    <span style={{ color: '#3b82f6' }}>&quot;confidence&quot;</span>:{' '}
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
              className="col-span-1 md:col-span-2 lg:col-span-2"
              style={{ ...glassCardLight, padding: '32px' }}
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
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <Activity className="w-5 h-5" style={{ color: '#3b82f6' }} />
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
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
                Simulates multiple independent assessments to measure variance and identify Decision
                Noise. Outputs precise standard deviations.
              </p>
            </motion.div>

            {/* Sub-second Analysis */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2 }}
              className="col-span-1 flex flex-col items-center text-center justify-center"
              style={{ ...glassCardLight, padding: '32px' }}
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
              className="col-span-1 flex flex-col items-center text-center justify-center"
              style={{ ...glassCardLight, padding: '32px' }}
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

      <SectionDivider variant="wave" color="rgba(59, 130, 246, 0.15)" />

      {/* ROI Calculator */}
      <section id="roi" ref={roiRef} className="py-32" style={{ background: 'var(--bg-primary)' }}>
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={roiInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-6xl mx-auto"
            style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '24px' }}
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
              Model the financial impact of unmitigated decision variance.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-8">
            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={roiInView ? { opacity: 1, x: 0 } : {}}
              className="md:col-span-2"
              style={{ ...glassCard, padding: '32px' }}
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
                      color: '#3b82f6',
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
                      accentColor: '#3b82f6',
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
                      accentColor: '#3b82f6',
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
                border: '1px solid rgba(59, 130, 246, 0.22)',
                boxShadow:
                  '0 12px 48px rgba(0, 0, 0, 0.38), 0 0 40px rgba(59, 130, 246, 0.06), 0 1px 0 rgba(255,255,255,0.07) inset',
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
                      background: '#3b82f6',
                      boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
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
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      boxShadow:
                        '0 4px 20px rgba(59, 130, 246, 0.3), 0 1px 0 rgba(255,255,255,0.12) inset',
                      display: 'block',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider variant="angle" color="rgba(168, 85, 247, 0.15)" />

      {/* FAQ Section */}
      <section
        id="faq"
        ref={faqRef}
        className="py-32 relative"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 max-w-3xl mx-auto"
            style={{ borderLeft: '3px solid #a855f7', paddingLeft: '24px' }}
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
                q: 'How is my data protected?',
                a: 'All documents are encrypted at rest (AES-256) and in transit (TLS 1.3). We run on SOC 2 Type II audited infrastructure, and PII is automatically detected and redacted before analysis. Your data is never used to train models and is deleted upon request.',
              },
              {
                q: 'How long does integration take?',
                a: 'Most teams are up and running in under 30 minutes. Upload documents directly through the dashboard, connect Slack with a single OAuth flow, or use our REST API. No infrastructure changes or IT involvement required.',
              },
              {
                q: 'How accurate is the bias detection?',
                a: 'Our cognitive bias engine achieves 89% precision and 92% recall across 15+ bias types, benchmarked against expert-annotated decision corpora. The statistical jury system cross-validates findings to minimize false positives.',
              },
              {
                q: 'Does it work with our existing tools?',
                a: 'Decision Intel integrates with Slack, Microsoft Teams, Google Workspace, and any system with a REST API. We support PDF, DOCX, TXT, and structured JSON ingestion. Custom connectors are available on Enterprise plans.',
              },
              {
                q: 'What compliance standards do you support?',
                a: 'We provide built-in mapping for FCA Consumer Duty, GDPR data protection requirements, and SOX compliance controls. Our audit trail generates regulator-ready reports with full decision lineage.',
              },
              {
                q: 'Is there a free tier?',
                a: 'Yes. The free tier includes up to 50 decision audits per month, basic bias detection, and noise scoring. No credit card required. Upgrade to Pro for unlimited audits, advanced analytics, and team collaboration.',
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

      <SectionDivider variant="glow" color="rgba(245, 158, 11, 0.2)" />

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
              'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.06) 0%, transparent 60%)',
          }}
        />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            className="max-w-3xl mx-auto text-center"
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                marginBottom: '24px',
                borderRadius: '9999px',
                background: 'rgba(245, 158, 11, 0.10)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#f59e0b',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <Target className="w-3.5 h-3.5" />
              Ready to eliminate decision noise?
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
              Stop leaving money on the table.
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Start auditing decisions today.
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
              Join teams using Decision Intel to quantify cognitive biases, reduce noise, and make
              consistently better decisions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="btn btn-primary glow"
                style={{
                  padding: '16px 40px',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Get Started Free <ArrowRight className="w-4 h-4 ml-2 inline" />
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
              className="flex items-center justify-center gap-6 mt-8"
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                Free tier available
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
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div
                  style={{
                    padding: '6px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    borderRadius: '10px',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <Brain className="w-4 h-4" style={{ color: '#f59e0b' }} />
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
                AI-powered cognitive auditing for better organizational decisions.
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
                  { label: 'Pricing', href: '#' },
                ].map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    className="hover:text-amber-400 transition-colors"
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
                    className="hover:text-amber-400 transition-colors"
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
                    className="hover:text-amber-400 transition-colors"
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
                  className="hover:text-amber-400 transition-colors"
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
