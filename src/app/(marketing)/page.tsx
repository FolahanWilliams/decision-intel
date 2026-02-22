'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useInView } from 'framer-motion';
import { Brain, AlertTriangle, Shield, Zap, Activity, Terminal } from 'lucide-react';

// Scroll Progress
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#ff9f0a] origin-left z-50"
      style={{ scaleX: scrollYProgress, boxShadow: '0 0 10px rgba(255, 159, 10, 0.5)' }}
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

  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const problemInView = useInView(problemRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const roiInView = useInView(roiRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-mono overflow-x-hidden selection:bg-[#ff9f0a]/30 selection:text-white">
      <ScrollProgress />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-[#333333]"
      >
        <div className="container mx-auto py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#ff9f0a]/10 border border-[#ff9f0a]/30">
              <Brain className="w-6 h-6 text-[#ff9f0a]" />
            </div>
            <span className="font-bold text-lg tracking-widest text-[#ffffff]">NEUROAUDIT_</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest text-[#a0a0a0]">
            <a href="#problem" className="hover:text-[#ff9f0a] hover:tracking-[0.2em] transition-all duration-300">SYSTEM_ERROR</a>
            <a href="#solution" className="hover:text-[#ff9f0a] hover:tracking-[0.2em] transition-all duration-300">PROTOCOL</a>
            <a href="#features" className="hover:text-[#ff9f0a] hover:tracking-[0.2em] transition-all duration-300">MODULES</a>
          </div>
          <div className="flex gap-4">
            <Link
              href="/sign-in"
              className="btn btn-secondary text-xs"
            >
              [ LOGIN ]
            </Link>
            <Link
              href="/sign-up"
              className="btn btn-primary text-xs"
            >
              [ INITIALIZE ]
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex items-center pt-24 relative overflow-hidden bg-[#000000]">
        <div className="absolute inset-0 pixel-grid opacity-20" />
        <div className="scanner-line opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-[#ff9f0a]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={heroInView ? { opacity: 1, x: 0 } : {}}
                  className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-[#ff9f0a]/30 bg-[#ff9f0a]/10 text-[#ff9f0a] text-xs font-bold tracking-widest"
                >
                  <Terminal className="w-3 h-3" />
                  <span>v2.0_ONLINE</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 border-l-0 pl-0 text-[#ffffff] tracking-tight font-sans"
                >
                  QUANTIFY
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#ff9f0a] to-[#ffd60a] py-2">
                    DECISION NOISE.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 }}
                  className="text-lg text-[#a0a0a0] mb-8 leading-relaxed max-w-xl font-sans"
                >
                  Cognitive biases and inconsistencies silently drain <span className="text-[#ff453a] font-bold">12-15%</span> of revenue. Deploy our AI audit engine to detect, measure, and eliminate human error in critical processes.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap items-center gap-4"
                >
                  <Link
                    href="/sign-up"
                    className="btn btn-primary text-sm py-3 px-8 glow"
                  >
                    DEPLOY PROTOCOL_
                  </Link>
                  <a
                    href="#problem"
                    className="btn btn-secondary text-sm py-3 px-8"
                  >
                    VIEW SECRETS
                  </a>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={heroInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex gap-4 text-xs font-bold text-[#555555]"
                >
                  <span>STATUS: <span className="text-[#30d158]">OPERATIONAL</span></span>
                  <span>LATENCY: <span className="text-[#0a84ff] animate-pulse">12ms</span></span>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 }}
                className="hidden md:block"
              >
                <div className="card card-glow border-[#333333] p-0 overflow-hidden relative group">
                  <div className="scanline-overlay" />
                  <div className="card-header border-b border-[#333333] bg-[#0a0a0a]">
                    <h3 className="text-xs text-[#a0a0a0] flex items-center gap-2 tracking-widest uppercase">
                      <Activity className="w-4 h-4 text-[#ff9f0a]" />
                      LIVE_AUDIT_STREAM
                    </h3>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#ff453a]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#ffd60a]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#30d158]"></div>
                    </div>
                  </div>
                  <div className="p-6 bg-[#050505] font-mono text-xs text-[#a0a0a0] space-y-2">
                    <p><span className="text-[#555555]">[14:02:41]</span> <span className="text-[#0a84ff]">SYS:</span> Ingesting document stream...</p>
                    <p><span className="text-[#555555]">[14:02:42]</span> <span className="text-[#0a84ff]">AI:</span> Scanning for cognitive anomalies...</p>
                    <p className="pl-4 border-l border-[#333333] my-2">
                      <span className="text-[#ff9f0a]">&gt; WARNING:</span> Confirmatory Bias detected (Confidence: 94%)<br />
                      <span className="text-[#ff9f0a]">&gt; WARNING:</span> Groupthink indicators present in Section 3
                    </p>
                    <p><span className="text-[#555555]">[14:02:43]</span> <span className="text-[#0a84ff]">SYS:</span> Calculating noise baseline...</p>
                    <p><span className="text-[#555555]">[14:02:43]</span> <span className="text-[#30d158]">RES:</span> Overall Decision Quality: <span className="text-[#ffffff] font-bold">42/100</span></p>
                    <p className="text-[#ffffff] mt-4 terminal-cursor">Awaiting next instruction...</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" ref={problemRef} className="py-32 bg-[#050505] relative border-t border-[#333333]">
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={problemInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 border-l-4 border-[#ff453a] pl-6"
          >
            <h2 className="text-3xl md:text-4xl text-[#ffffff] mb-2 tracking-tight">SYSTEM_FAILURE: DECISION NOISE</h2>
            <p className="text-[#a0a0a0] max-w-2xl text-sm font-sans">
              Different experts evaluating identical data produce wildly varying outputs. Human inconsistency is a silent tax destroying profit margins.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Without NeuroAudit */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              className={`card cursor-pointer transition-all duration-300 ${activeDemo === 'chaos'
                ? 'border-[#ff453a] shadow-[0_0_20px_rgba(255,69,58,0.1)] bg-[#0a0000]'
                : 'border-[#333333] hover:border-[#ff453a]/50'
                }`}
              onClick={() => setActiveDemo('chaos')}
            >
              <div className="card-header border-b border-[#ff453a]/20 bg-transparent flex justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#ff453a]" />
                  <h3 className="text-lg text-[#ff453a] font-mono tracking-widest">UNMANAGED_PROCESS</h3>
                </div>
                {activeDemo === 'chaos' && <span className="badge badge-critical animate-pulse">ACTIVE</span>}
              </div>

              <div className="p-8 space-y-4 font-mono text-sm">
                <div className="flex items-start gap-3 p-3 bg-[#ff453a]/5 border border-[#ff453a]/10">
                  <span className="text-[#ff453a] font-bold">ERR</span>
                  <span className="text-[#a0a0a0]">High variance across similar critical decisions</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#ff453a]/5 border border-[#ff453a]/10">
                  <span className="text-[#ff453a] font-bold">ERR</span>
                  <span className="text-[#a0a0a0]">Undetected cognitive biases steering outcomes</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#ff453a]/5 border border-[#ff453a]/10">
                  <span className="text-[#ff453a] font-bold">ERR</span>
                  <span className="text-[#a0a0a0]">No visibility or measurability of decision quality</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#ff453a]/5 border border-[#ff453a]/10">
                  <span className="text-[#ff453a] font-bold">FTL</span>
                  <span className="text-[#ffffff]">12-15% of EBITDA lost to systematic errors</span>
                </div>
              </div>
            </motion.div>

            {/* With NeuroAudit */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 }}
              className={`card cursor-pointer transition-all duration-300 ${activeDemo === 'order'
                ? 'border-[#30d158] shadow-[0_0_20px_rgba(48,209,88,0.1)] bg-[#000a00]'
                : 'border-[#333333] hover:border-[#30d158]/50'
                }`}
              onClick={() => setActiveDemo('order')}
            >
              <div className="card-header border-b border-[#30d158]/20 bg-transparent flex justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#30d158]" />
                  <h3 className="text-lg text-[#30d158] font-mono tracking-widest">NEUROAUDIT_PROTOCOL</h3>
                </div>
                {activeDemo === 'order' && <span className="badge badge-complete animate-pulse">ACTIVE</span>}
              </div>

              <div className="p-8 space-y-4 font-mono text-sm">
                <div className="flex items-start gap-3 p-3 bg-[#30d158]/5 border border-[#30d158]/10">
                  <span className="text-[#30d158] font-bold">SYS</span>
                  <span className="text-[#a0a0a0]">Consistent, objectively scored decision criteria</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#30d158]/5 border border-[#30d158]/10">
                  <span className="text-[#30d158] font-bold">SYS</span>
                  <span className="text-[#a0a0a0]">15+ bias signatures detected automatically</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#30d158]/5 border border-[#30d158]/10">
                  <span className="text-[#30d158] font-bold">SYS</span>
                  <span className="text-[#a0a0a0]">Quantifiable metrics generated for every review</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#30d158]/5 border border-[#30d158]/10">
                  <span className="text-[#30d158] font-bold">OPT</span>
                  <span className="text-[#ffffff]">Up to 60% reduction in measured variance</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section id="features" ref={featuresRef} className="py-32 bg-[#000000] border-t border-[#333333] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,159,10,0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 border-l-4 border-[#ff9f0a] pl-6"
          >
            <h2 className="text-3xl md:text-4xl text-[#ffffff] mb-2 tracking-tight">PLATFORM_MODULES</h2>
            <p className="text-[#a0a0a0] text-sm font-sans">Enterprise-grade tools for cognitive auditing.</p>
          </motion.div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">

            {/* Large Feature 1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              className="card card-glow col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-[#111111] flex flex-col justify-between overflow-hidden relative"
            >
              <div className="p-8 z-10 relative">
                <div className="p-3 bg-[#ff9f0a]/10 border border-[#ff9f0a]/30 w-12 h-12 flex items-center justify-center mb-6">
                  <Brain className="w-6 h-6 text-[#ff9f0a]" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-[#ffffff]">Cognitive Bias Engine</h3>
                <p className="text-[#a0a0a0] text-sm max-w-md font-sans leading-relaxed">
                  Advanced argumentation mining algorithms parse unstructured text to identify 15+ logical fallacies and cognitive distortions including confirmation bias, anchoring, and groupthink.
                </p>
              </div>
              <div className="mt-8 px-8 pb-0 z-10">
                <div className="border-t border-l border-r border-[#333333] bg-[#050505] p-4 font-mono text-xs rounded-t-sm relative h-32 overflow-hidden shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                  <div className="scanline-overlay"></div>
                  <div className="flex justify-between items-center mb-3 border-b border-[#333333] pb-2">
                    <span className="text-[#555555]">ANALYSIS_RESULTS.JSON</span>
                    <span className="badge badge-high tracking-widest">BIAS_DETECTED</span>
                  </div>
                  <div className="text-[#a0a0a0] leading-relaxed">
                    <span className="text-[#0a84ff]">&quot;biasType&quot;</span>: <span className="text-[#ff9f0a]">&quot;Confirmation Bias&quot;</span>,<br />
                    <span className="text-[#0a84ff]">&quot;severity&quot;</span>: <span className="text-[#ff9f0a]">&quot;HIGH&quot;</span>,<br />
                    <span className="text-[#0a84ff]">&quot;confidence&quot;</span>: <span className="text-[#30d158]">0.94</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Smaller Feature 1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1 }}
              className="card card-glow col-span-1 md:col-span-1 lg:col-span-2 bg-[#050505] p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-2 bg-[#0a84ff]/10 border border-[#0a84ff]/30">
                  <Activity className="w-5 h-5 text-[#0a84ff]" />
                </div>
                <span className="badge badge-medium tracking-widest">NOISE_AUDIT</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#ffffff]">Statistical Jury</h3>
              <p className="text-[#a0a0a0] text-sm font-sans leading-relaxed">
                Simulates multiple independent assessments (LLM instances) to measure variance and identify Decision Noise. Output precise standard deviations.
              </p>
            </motion.div>

            {/* Smaller Feature 2 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2 }}
              className="card card-glow col-span-1 md:col-span-1 lg:col-span-1 bg-[#1a1a1a] p-8 flex flex-col items-center text-center justify-center border-[#333333]"
            >
              <Zap className="w-8 h-8 text-[#ffd60a] mb-4" />
              <h3 className="text-lg font-bold mb-2 text-[#ffffff]">Sub-second<br />Analysis</h3>
              <p className="text-[#a0a0a0] text-xs font-sans">High-performance edge computing infrastructure.</p>
            </motion.div>

            {/* Smaller Feature 3 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 }}
              className="card card-glow col-span-1 md:col-span-1 lg:col-span-1 bg-[#050505] p-8 flex flex-col items-center text-center justify-center pixel-grid"
            >
              <Shield className="w-8 h-8 text-[#30d158] mb-4" />
              <h3 className="text-lg font-bold mb-2 text-[#ffffff]">FCA & GDPR<br />Ready</h3>
              <p className="text-[#a0a0a0] text-xs font-sans">Consumer Duty mapping and automated PII sanitization.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section ref={roiRef} className="py-32 bg-[#050505] border-t border-[#333333]">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={roiInView ? { opacity: 1, y: 0 } : {}}
            className="mb-16 border-l-4 border-[#0a84ff] pl-6"
          >
            <h2 className="text-3xl md:text-4xl text-[#ffffff] mb-2 tracking-tight">ROI_SCENARIO_TESTBED</h2>
            <p className="text-[#a0a0a0] text-sm font-sans">Model the financial impact of unmitigated decision variance.</p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-8">
            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={roiInView ? { opacity: 1, x: 0 } : {}}
              className="md:col-span-2 card p-8 bg-[#111111]"
            >
              <div className="space-y-8">
                <div className="pb-4 border-b border-[#333333]">
                  <h4 className="text-[#0a84ff] mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    INPUT_PARAMETERS
                  </h4>
                </div>
                <div>
                  <label className="flex justify-between text-xs text-[#a0a0a0] mb-4 font-bold tracking-widest">
                    <span>ANNUAL_DECISIONS</span>
                    <span className="text-[#ffffff] bg-[#333333] px-2 py-1">{annualDecisions.toLocaleString()}</span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="50000"
                    step="100"
                    value={annualDecisions}
                    onChange={(e) => setAnnualDecisions(Number(e.target.value))}
                    className="w-full h-1 bg-[#333333] appearance-none cursor-pointer outline-none"
                    style={{ accentColor: '#0a84ff' }}
                  />
                </div>

                <div>
                  <label className="flex justify-between text-xs text-[#a0a0a0] mb-4 font-bold tracking-widest">
                    <span>AVG_DECISION_VALUE</span>
                    <span className="text-[#ffffff] bg-[#333333] px-2 py-1">{formatCurrency(avgDecisionValue)}</span>
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={avgDecisionValue}
                    onChange={(e) => setAvgDecisionValue(Number(e.target.value))}
                    className="w-full h-1 bg-[#333333] appearance-none cursor-pointer outline-none"
                    style={{ accentColor: '#0a84ff' }}
                  />
                </div>

                <div className="p-4 bg-[#050505] border border-[#333333] text-xs text-[#555555] font-mono leading-relaxed">
                  {`// ALGORITHM: Baseline noise tax derived from Kahneman et al.`}<br />
                  const NOISE_TAX = 0.12;
                </div>
              </div>
            </motion.div>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={roiInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="md:col-span-3 card bg-[#000000] border-[#0a84ff]/30 p-8 relative overflow-hidden flex flex-col justify-center"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-9xl font-bold">
                $
              </div>
              <div className="space-y-8 relative z-10">
                <div className="flex items-center gap-4 border-b border-[#333333] pb-4">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-[#0a84ff]"></div>
                  <span className="text-[#a0a0a0] font-bold text-xs tracking-widest">PROJECTION_OUTPUT</span>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div>
                    <div className="text-xs text-[#ff453a] mb-2 tracking-widest font-bold">ESTIMATED_LOSS</div>
                    <div className="text-4xl lg:text-5xl font-bold text-[#ffffff] data-value">
                      {formatCurrency(potentialLoss)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[#30d158] mb-2 tracking-widest font-bold">RECOVERABLE_VALUE_60%</div>
                    <div className="text-4xl lg:text-5xl font-bold text-[#30d158] data-value" style={{ textShadow: '0 0 20px rgba(48,209,88,0.4)' }}>
                      {formatCurrency(potentialSavings)}
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-[#333333]">
                  <Link
                    href="/sign-up"
                    className="btn btn-primary w-full py-4 text-sm tracking-widest glow"
                    style={{ background: '#0a84ff', color: 'black', borderColor: '#0a84ff' }}
                  >
                    [ INITIALIZE_TRIAL ]
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#000000] border-t border-[#333333] relative z-10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
            <div className="flex items-center gap-2 border border-[#333333] px-3 py-1 bg-[#111111]">
              <div className="w-2 h-2 bg-[#ff9f0a]"></div>
              <span className="font-bold text-[#ffffff] text-xs tracking-widest">NEUROAUDIT</span>
              <span className="text-xs text-[#555555] ml-2">v2.0.4 - © 2025</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#555555] tracking-widest">
              <a href="#" className="hover:text-[#ff9f0a] transition-colors">PRIVACY</a>
              <a href="#" className="hover:text-[#ff9f0a] transition-colors">TERMS</a>
              <a href="#" className="hover:text-[#ff9f0a] transition-colors">API_DOCS</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
