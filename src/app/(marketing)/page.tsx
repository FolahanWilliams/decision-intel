'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, useScroll, useInView, AnimatePresence } from 'framer-motion';
import { 
  Brain, FileText, Target, CheckCircle, AlertTriangle, Shield, Zap, ArrowRight, Clock, ChevronDown, Activity, Sparkles, XCircle
} from 'lucide-react';

// Animated Counter Component
function AnimatedCounter({ value, prefix = '', suffix = '', duration = 2 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    
    let start = 0;
    const end = value;
    const incrementTime = (duration * 1000) / end;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [isInView, value, duration]);
  
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Scroll Progress Bar
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-[var(--accent-primary)] origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState<'chaos' | 'order'>('chaos');
  const [annualDecisions, setAnnualDecisions] = useState(10000);
  const [avgDecisionValue, setAvgDecisionValue] = useState(25000);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const noiseTaxRate = 0.12;
  const potentialLoss = annualDecisions * avgDecisionValue * noiseTaxRate;
  const potentialSavings = potentialLoss * 0.6;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  // Memoize random values for visualizations to prevent unnecessary re-renders
  const chaosLines = useMemo(() => [...Array(8)].map(() => ({
    startY: 50 + Math.random() * 20,
    controlX: 100 + Math.random() * 100,
    controlY: Math.random() * 100,
    endY: 50 + Math.random() * 40
  })), []);

  const chaosPoints = useMemo(() => [...Array(20)].map(() => ({
    left: 20 + Math.random() * 60,
    top: 20 + Math.random() * 60
  })), []);

  const orderPoints = useMemo(() => [...Array(15)].map((_, i) => {
    const angle = (i / 15) * Math.PI * 2;
    const radius = 30 + Math.random() * 20;
    return {
      left: 50 + Math.cos(angle) * radius,
      top: 50 + Math.sin(angle) * radius
    };
  }), []);

  const heroRef = useRef(null);
  const problemRef = useRef(null);
  const howItWorksRef = useRef(null);
  const featuresRef = useRef(null);
  const roiRef = useRef(null);
  const testimonialsRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const problemInView = useInView(problemRef, { once: true, margin: "-100px" });
  const howItWorksInView = useInView(howItWorksRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const roiInView = useInView(roiRef, { once: true, margin: "-100px" });
  const testimonialsInView = useInView(testimonialsRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-x-hidden">
      <ScrollProgress />
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-8 h-8 text-orange-500" />
            </motion.div>
            <span className="font-bold text-xl tracking-wider">NEUROAUDIT</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Problem', 'Solution', 'Features', 'ROI'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-gray-400 hover:text-orange-500 transition-colors uppercase tracking-wider"
              >
                {item}
              </a>
            ))}
          </div>
          <Link 
            href="/sign-up"
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg transition-all text-sm"
          >
            Start Free
          </Link>
        </div>
      </motion.nav>

      {/* HERO SECTION - Animated Impact */}
      <section ref={heroRef} className="min-h-screen flex items-center pt-20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-20 left-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Decision Intelligence</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
              >
                Stop Losing{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  Millions
                </span>
                <br />to Bad Decisions
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-400 mb-8 leading-relaxed max-w-xl"
              >
                Decision noise and cognitive bias cost organizations{' '}
                <span className="text-red-400 font-bold">12-15%</span> of annual revenue. 
                NeuroAudit detects these hidden errors before they cost you millions.
              </motion.p>

              {/* Animated Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-6 mb-8"
              >
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-red-400">
                    <AnimatedCounter value={15} suffix="%" />
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Revenue Lost</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-green-400">
                    <AnimatedCounter value={60} suffix="%" />
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Noise Reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-orange-400">
                    $<AnimatedCounter value={500} suffix="+" />
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Enterprise Clients</div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <Link 
                  href="/sign-up"
                  className="group px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl transition-all flex items-center gap-2 text-lg"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="#problem"
                  className="px-8 py-4 border border-white/20 hover:border-orange-500/50 rounded-xl font-semibold transition-all text-lg"
                >
                  See The Problem
                </a>
              </motion.div>
            </motion.div>

            {/* Right - Animated Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative bg-[#111] rounded-2xl p-8 border border-white/10 overflow-hidden">
                {/* Animated Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-gray-500">COST ANALYSIS DASHBOARD</span>
                </div>

                {/* Animated Money Loss Counter */}
                <div className="mb-8">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Annual Loss to Decision Noise</div>
                  <motion.div 
                    className="text-6xl font-bold text-red-500 tabular-nums"
                    initial={{ opacity: 0 }}
                    animate={heroInView ? { opacity: 1 } : {}}
                  >
                    $<AnimatedCounter value={15} suffix="M" />
                  </motion.div>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={heroInView ? { width: "100%" } : {}}
                    transition={{ duration: 2, delay: 1 }}
                    className="h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full mt-4"
                  />
                </div>

                {/* Animated Bias Indicators */}
                <div className="space-y-3">
                  {['Confirmation Bias', 'Anchoring Effect', 'Overconfidence', 'Decision Variance'].map((bias, i) => (
                    <motion.div 
                      key={bias}
                      initial={{ opacity: 0, x: -20 }}
                      animate={heroInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 1.2 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-300">{bias}</span>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={heroInView ? { width: `${70 + i * 5}%` } : {}}
                        transition={{ duration: 1, delay: 1.5 + i * 0.1 }}
                        className="h-1.5 bg-red-500/50 rounded-full ml-auto"
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Floating Badge */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -right-4 top-8 bg-green-500 text-black px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-green-500/30"
                >
                  60% Preventable
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500"
          >
            <ChevronDown className="w-8 h-8" />
          </motion.div>
        </div>
      </section>

      {/* PROBLEM SECTION - Interactive Visualization */}
      <section id="problem" ref={problemRef} className="py-24 bg-[#0d0d12]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={problemInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">The Hidden Cost of Decision Noise</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              When experts evaluate the same situation, their judgments vary wildly. This inconsistency costs millions.
            </p>
          </motion.div>

          {/* Interactive Comparison */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Chaos Side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 }}
              className={`p-8 rounded-2xl border-2 cursor-pointer transition-all ${
                activeDemo === 'chaos' 
                  ? 'bg-red-500/10 border-red-500' 
                  : 'bg-[#111] border-white/10 hover:border-red-500/50'
              }`}
              onClick={() => setActiveDemo('chaos')}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-400">Without NeuroAudit</h3>
                  <p className="text-sm text-gray-500">High Variance • High Cost</p>
                </div>
              </div>

              {/* Animated Chaos Visualization */}
              <div className="relative h-64 bg-[#0a0a0f] rounded-xl overflow-hidden mb-6">
                <svg className="absolute inset-0 w-full h-full">
                  {/* Grid Lines */}
                  {[...Array(5)].map((_, i) => (
                    <line key={`h-${i}`} x1="0" y1={`${(i + 1) * 20}%`} x2="100%" y2={`${(i + 1) * 20}%`} stroke="#333" strokeWidth="1" />
                  ))}
                  
                  {/* Chaotic Lines */}
                  <AnimatePresence>
                    {activeDemo === 'chaos' && chaosLines.map((line, i) => (
                      <motion.path
                        key={i}
                        d={`M 0 ${line.startY} Q ${line.controlX} ${line.controlY}, 100% ${line.endY}`}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.6 }}
                        transition={{ duration: 1.5, delay: i * 0.1 }}
                      />
                    ))}
                  </AnimatePresence>
                  
                  {/* Center Target */}
                  <circle cx="50%" cy="50%" r="4" fill="#22c55e" />
                </svg>
                
                {/* Scatter Points */}
                <AnimatePresence>
                  {activeDemo === 'chaos' && chaosPoints.map((point, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3 rounded-full bg-red-500"
                      style={{
                        left: `${point.left}%`,
                        top: `${point.top}%`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.8 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                    />
                  ))}
                </AnimatePresence>
              </div>

              <ul className="space-y-3">
                {[
                  { icon: XCircle, text: '12-15% revenue lost annually' },
                  { icon: XCircle, text: 'Undetected cognitive biases' },
                  { icon: XCircle, text: 'Wide variance in decisions' },
                ].map((item, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={problemInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <item.icon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-gray-300">{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Order Side */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 }}
              className={`p-8 rounded-2xl border-2 cursor-pointer transition-all ${
                activeDemo === 'order' 
                  ? 'bg-green-500/10 border-green-500' 
                  : 'bg-[#111] border-white/10 hover:border-green-500/50'
              }`}
              onClick={() => setActiveDemo('order')}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-400">With NeuroAudit</h3>
                  <p className="text-sm text-gray-500">Low Variance • High Savings</p>
                </div>
              </div>

              {/* Animated Order Visualization */}
              <div className="relative h-64 bg-[#0a0a0f] rounded-xl overflow-hidden mb-6">
                <svg className="absolute inset-0 w-full h-full">
                  {[...Array(5)].map((_, i) => (
                    <line key={`h-${i}`} x1="0" y1={`${(i + 1) * 20}%`} x2="100%" y2={`${(i + 1) * 20}%`} stroke="#333" strokeWidth="1" />
                  ))}
                  
                  {/* Converging Lines */}
                  <AnimatePresence>
                    {activeDemo === 'order' && [...Array(5)].map((_, i) => (
                      <motion.path
                        key={i}
                        d={`M 0 ${30 + i * 10} Q 50% ${50 + (i - 2) * 5}, 100% 50`}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.8 }}
                        transition={{ duration: 1.5, delay: i * 0.1 }}
                      />
                    ))}
                  </AnimatePresence>
                  
                  <circle cx="50%" cy="50%" r="6" fill="#22c55e" />
                </svg>
                
                {/* Clustered Points */}
                <AnimatePresence>
                  {activeDemo === 'order' && orderPoints.map((point, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3 rounded-full bg-green-500"
                      style={{
                        left: `calc(50% + ${(point.left - 50) * 2}px)`,
                        top: `calc(50% + ${(point.top - 50) * 2}px)`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.9 }}
                      transition={{ delay: 0.5 + i * 0.03 }}
                    />
                  ))}
                </AnimatePresence>
              </div>

              <ul className="space-y-3">
                {[
                  { icon: CheckCircle, text: 'Save $2-15M annually' },
                  { icon: CheckCircle, text: '60% reduction in variance' },
                  { icon: CheckCircle, text: 'AI-powered bias detection' },
                ].map((item, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={problemInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <item.icon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-300">{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Animated Timeline */}
      <section id="how-it-works" ref={howItWorksRef} className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-gray-400">Three steps to eliminate decision noise</p>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting Line */}
            <motion.div 
              initial={{ height: 0 }}
              animate={howItWorksInView ? { height: "100%" } : {}}
              transition={{ duration: 1.5 }}
              className="absolute left-1/2 top-0 w-0.5 bg-gradient-to-b from-orange-500 via-blue-500 to-green-500 hidden lg:block"
            />

            <div className="space-y-12">
              {[
                {
                  step: '01',
                  title: 'Upload Your Documents',
                  desc: 'Securely upload PDFs, emails, meeting notes, or CRM records containing decision rationale.',
                  icon: FileText,
                  color: 'orange',
                },
                {
                  step: '02',
                  title: 'AI Analysis',
                  desc: 'Our engine scans for 15+ cognitive biases, decision noise, and logical fallacies in real-time.',
                  icon: Brain,
                  color: 'blue',
                },
                {
                  step: '03',
                  title: 'Get Actionable Insights',
                  desc: 'Receive detailed reports with bias scores, improvement recommendations, and team benchmarks.',
                  icon: Target,
                  color: 'green',
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + index * 0.2 }}
                  className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                >
                  <div className="flex-1 text-center lg:text-left">
                    <motion.div 
                      className="text-6xl font-bold text-gray-800 mb-2"
                      whileHover={{ scale: 1.1, color: item.color === 'orange' ? '#f97316' : item.color === 'blue' ? '#3b82f6' : '#22c55e' }}
                    >
                      {item.step}
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>

                  <motion.div 
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      item.color === 'orange' ? 'bg-orange-500/20 text-orange-500' :
                      item.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-green-500/20 text-green-500'
                    }`}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <item.icon className="w-10 h-10" />
                  </motion.div>

                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES - Interactive Grid */}
      <section id="features" ref={featuresRef} className="py-24 bg-[#0d0d12]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Powerful Capabilities</h2>
            <p className="text-xl text-gray-400">Everything you need to improve decision quality</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Brain, title: 'Bias Detection', desc: 'Identify 15+ cognitive biases', metric: '15+', color: 'orange' },
              { icon: Activity, title: 'Noise Analysis', desc: 'Measure decision variance', metric: '±12%', color: 'blue' },
              { icon: Zap, title: 'Real-Time', desc: 'Instant analysis results', metric: '<1s', color: 'yellow' },
              { icon: Shield, title: 'Compliance', desc: 'Full audit trails', metric: '100%', color: 'green' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="group relative p-8 rounded-2xl bg-[#111] border border-white/10 hover:border-orange-500/50 transition-all cursor-pointer overflow-hidden"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                {/* Animated Background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    feature.color === 'orange' ? 'from-orange-500/10' :
                    feature.color === 'blue' ? 'from-blue-500/10' :
                    feature.color === 'yellow' ? 'from-yellow-500/10' :
                    'from-green-500/10'
                  } to-transparent`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredFeature === index ? 1 : 0 }}
                />

                <div className="relative z-10">
                  <motion.div
                    animate={{ 
                      scale: hoveredFeature === index ? 1.1 : 1,
                      rotate: hoveredFeature === index ? 360 : 0
                    }}
                    transition={{ duration: 0.5 }}
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                      feature.color === 'orange' ? 'bg-orange-500/20 text-orange-500' :
                      feature.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                      feature.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-green-500/20 text-green-500'
                    }`}
                  >
                    <feature.icon className="w-7 h-7" />
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="text-3xl font-bold mb-2"
                  >
                    {feature.metric}
                  </motion.div>

                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>

                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: hoveredFeature === index ? '100%' : '0%' }}
                    className={`h-0.5 mt-4 ${
                      feature.color === 'orange' ? 'bg-orange-500' :
                      feature.color === 'blue' ? 'bg-blue-500' :
                      feature.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI CALCULATOR - Visual Interactive */}
      <section id="roi" ref={roiRef} className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={roiInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Calculate Your Savings</h2>
            <p className="text-xl text-gray-400">See how much decision noise is costing you</p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Controls */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={roiInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 }}
                className="p-8 rounded-2xl bg-[#111] border border-white/10"
              >
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm text-gray-400 uppercase tracking-wider">Annual Decisions</label>
                      <motion.span 
                        key={annualDecisions}
                        initial={{ scale: 1.2, color: '#f97316' }}
                        animate={{ scale: 1, color: '#fff' }}
                        className="text-2xl font-bold"
                      >
                        {annualDecisions.toLocaleString()}
                      </motion.span>
                    </div>
                    <input 
                      type="range" 
                      min="1000" 
                      max="100000" 
                      step="1000" 
                      value={annualDecisions}
                      onChange={(e) => setAnnualDecisions(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>1,000</span>
                      <span>100,000</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm text-gray-400 uppercase tracking-wider">Avg Decision Value</label>
                      <motion.span 
                        key={avgDecisionValue}
                        initial={{ scale: 1.2, color: '#f97316' }}
                        animate={{ scale: 1, color: '#fff' }}
                        className="text-2xl font-bold"
                      >
                        {formatCurrency(avgDecisionValue)}
                      </motion.span>
                    </div>
                    <input 
                      type="range" 
                      min="5000" 
                      max="500000" 
                      step="5000" 
                      value={avgDecisionValue}
                      onChange={(e) => setAvgDecisionValue(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>$5K</span>
                      <span>$500K</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Results Visualization */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={roiInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-orange-500/30 relative overflow-hidden"
              >
                {/* Animated Background Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Current Annual Loss</div>
                    <motion.div 
                      key={potentialLoss}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-4xl font-bold text-red-500 line-through opacity-60"
                    >
                      {formatCurrency(potentialLoss)}
                    </motion.div>
                  </div>

                  {/* Circular Progress Indicator */}
                  <div className="relative w-48 h-48 mx-auto mb-8">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        fill="none"
                        stroke="#333"
                        strokeWidth="12"
                      />
                      <motion.circle
                        cx="96"
                        cy="96"
                        r="88"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        initial={{ strokeDashoffset: `${2 * Math.PI * 88}` }}
                        animate={{ strokeDashoffset: `${2 * Math.PI * 88 * (1 - 0.6)}` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-sm text-green-400 uppercase tracking-wider">You Save</div>
                      <motion.div 
                        key={potentialSavings}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-3xl font-bold text-green-400"
                      >
                        {formatCurrency(potentialSavings)}
                      </motion.div>
                    </div>
                  </div>

                  <Link 
                    href="/sign-up"
                    className="block w-full py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl transition-all text-center text-lg"
                  >
                    Start Saving Today
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section ref={testimonialsRef} className="py-24 bg-[#0d0d12]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Trusted by Leaders</h2>
            <p className="text-xl text-gray-400">See what our clients say</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'NeuroAudit identified $2.3M in preventable decision variance within 90 days.',
                author: 'Sarah Chen',
                role: 'Chief Risk Officer',
                metric: '$2.3M',
                color: 'orange'
              },
              {
                quote: 'Reduced our decision inconsistency by 58%. The ROI was immediate.',
                author: 'Michael Rodriguez',
                role: 'VP Strategy',
                metric: '58%',
                color: 'green'
              },
              {
                quote: 'Complete audit trails for compliance. Bias detection is incredibly accurate.',
                author: 'Emily Watson',
                role: 'General Counsel',
                metric: '100%',
                color: 'blue'
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -10 }}
                className="p-8 rounded-2xl bg-[#111] border border-white/10 hover:border-orange-500/30 transition-all"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={testimonialsInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                  className={`text-6xl mb-4 ${
                    testimonial.color === 'orange' ? 'text-orange-500' :
                    testimonial.color === 'green' ? 'text-green-500' :
                    'text-blue-500'
                  }`}
                >
                  "
                </motion.div>
                <p className="text-gray-300 mb-6 leading-relaxed">{testimonial.quote}</p>
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <div className="font-bold">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    testimonial.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                    testimonial.color === 'green' ? 'bg-green-500/20 text-green-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {testimonial.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-orange-500/10 via-[#111] to-blue-500/10 border border-orange-500/30"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl lg:text-5xl font-bold mb-6"
            >
              Ready to Stop Losing Money?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400 mb-8"
            >
              Join 500+ companies using NeuroAudit to improve decisions
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                href="/sign-up"
                className="group px-10 py-5 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl transition-all text-lg flex items-center gap-2"
              >
                Start Free 14-Day Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/sign-in"
                className="px-10 py-5 border border-white/20 hover:border-orange-500/50 rounded-xl font-semibold transition-all text-lg"
              >
                Sign In
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-8 mt-8 text-sm text-gray-500"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Full feature access
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                5-minute setup
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-orange-500" />
              <span className="font-bold tracking-wider">NEUROAUDIT</span>
              <span className="text-xs text-gray-500">© 2025</span>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <a href="#" className="text-gray-500 hover:text-orange-500 transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-orange-500 transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-orange-500 transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
