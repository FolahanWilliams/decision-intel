'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useInView } from 'framer-motion';
import { Brain, AlertTriangle, Shield, Zap, Activity, BarChart3 } from 'lucide-react';

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

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState<'chaos' | 'order'>('chaos');
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
  const featuresRef = useRef(null);
  const roiRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, margin: '-100px' });
  const problemInView = useInView(problemRef, { once: true, margin: '-100px' });
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });
  const roiInView = useInView(roiRef, { once: true, margin: '-100px' });

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
              Solution
            </a>
            <a href="#features" className="hover:text-amber-400 transition-colors duration-300">
              Features
            </a>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              Sign In
            </Link>
            <Link href="/login" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center pt-24 relative overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}
      >
        {/* Enhanced ambient glow for liquid glass effect */}
        <div
          className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full blur-[140px] pointer-events-none"
          style={{ background: 'rgba(245, 158, 11, 0.07)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'rgba(99, 102, 241, 0.06)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[30vw] rounded-full blur-[160px] pointer-events-none"
          style={{ background: 'rgba(168, 85, 247, 0.04)' }}
        />

        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto">
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
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>12–15%</span> of revenue.
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
                    Start Free Trial
                  </Link>
                  <a
                    href="#problem"
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
                className="hidden md:block"
              >
                <div
                  style={{
                    background: 'rgba(8, 11, 20, 0.65)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '20px',
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
                  <div
                    style={{
                      padding: '24px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <p>
                      <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>14:02:41</span>{' '}
                      <span style={{ color: '#3b82f6' }}>SYS</span> Ingesting document stream...
                    </p>
                    <p>
                      <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>14:02:42</span>{' '}
                      <span style={{ color: '#3b82f6' }}>AI</span> Scanning for cognitive
                      anomalies...
                    </p>
                    <div
                      style={{
                        padding: '10px 14px',
                        margin: '4px 0',
                        borderLeft: '2px solid rgba(245, 158, 11, 0.4)',
                        background: 'rgba(245, 158, 11, 0.05)',
                        borderRadius: '0 10px 10px 0',
                      }}
                    >
                      <span style={{ color: '#f59e0b' }}>Warning:</span> Confirmatory Bias detected
                      (94% confidence)
                      <br />
                      <span style={{ color: '#f59e0b' }}>Warning:</span> Groupthink indicators in
                      Section 3
                    </div>
                    <p>
                      <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>14:02:43</span>{' '}
                      <span style={{ color: '#3b82f6' }}>SYS</span> Calculating noise baseline...
                    </p>
                    <p>
                      <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>14:02:43</span>{' '}
                      <span style={{ color: '#22c55e' }}>RES</span> Overall Decision Quality:{' '}
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>42/100</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section
        id="problem"
        ref={problemRef}
        className="py-32 relative"
        style={{
          background: 'var(--bg-primary)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={problemInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16"
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

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Without Decision Intel */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              className="cursor-pointer transition-all duration-300"
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
                  '12–15% of EBITDA lost to systematic errors',
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
              className="cursor-pointer transition-all duration-300"
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

      {/* Features - Bento Grid */}
      <section
        id="features"
        ref={featuresRef}
        className="py-32 relative"
        style={{
          background: 'var(--bg-primary)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
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
            className="mb-16"
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

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {/* Large Feature: Cognitive Bias Engine */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2"
              style={{
                background: 'rgba(8, 11, 20, 0.58)',
                backdropFilter: 'blur(32px) saturate(170%)',
                WebkitBackdropFilter: 'blur(32px) saturate(170%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 12px 48px rgba(0,0,0,0.38), 0 1px 0 rgba(255,255,255,0.07) inset',
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
              className="col-span-1 md:col-span-1 lg:col-span-2"
              style={{
                background: 'rgba(8, 11, 20, 0.55)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.06) inset',
              }}
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
              className="col-span-1 md:col-span-1 lg:col-span-1 flex flex-col items-center text-center justify-center"
              style={{
                background: 'rgba(8, 11, 20, 0.55)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.06) inset',
              }}
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
              className="col-span-1 md:col-span-1 lg:col-span-1 flex flex-col items-center text-center justify-center"
              style={{
                background: 'rgba(8, 11, 20, 0.55)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.06) inset',
              }}
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

      {/* ROI Calculator */}
      <section
        ref={roiRef}
        className="py-32"
        style={{
          background: 'var(--bg-primary)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={roiInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16"
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
              style={{
                background: 'rgba(8, 11, 20, 0.58)',
                backdropFilter: 'blur(32px) saturate(170%)',
                WebkitBackdropFilter: 'blur(32px) saturate(170%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 12px 48px rgba(0,0,0,0.38), 0 1px 0 rgba(255,255,255,0.07) inset',
              }}
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
                background: 'rgba(8, 11, 20, 0.58)',
                backdropFilter: 'blur(32px) saturate(170%)',
                WebkitBackdropFilter: 'blur(32px) saturate(170%)',
                border: '1px solid rgba(59, 130, 246, 0.22)',
                borderRadius: '20px',
                padding: '32px',
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

      {/* Footer */}
      <footer
        className="py-8 relative z-10"
        style={{
          background: 'var(--bg-primary)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div
              className="flex items-center gap-3"
              style={{
                padding: '8px 16px',
                background: 'rgba(8, 11, 20, 0.55)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset',
              }}
            >
              <div
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}
              />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                Decision Intel
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                v2.0 · © 2025
              </span>
            </div>
            <div
              className="flex items-center gap-6"
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
              <a href="#" className="hover:text-amber-400 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-amber-400 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-amber-400 transition-colors">
                API Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
