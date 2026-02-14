'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useInView } from 'framer-motion';
import { Brain, FileText, Target, CheckCircle, AlertTriangle, Shield, Zap, Clock, Activity } from 'lucide-react';

// Scroll Progress
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-orange-500 origin-left z-50"
      style={{ scaleX: scrollYProgress }}
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
  const howItWorksRef = useRef(null);
  const featuresRef = useRef(null);
  const roiRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const problemInView = useInView(problemRef, { once: true, margin: "-100px" });
  const howItWorksInView = useInView(howItWorksRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const roiInView = useInView(roiRef, { once: true, margin: "-100px" });

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
            <Brain className="w-8 h-8 text-orange-500" />
            <span className="font-bold text-xl tracking-wider">NEUROAUDIT</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-sm text-gray-400 hover:text-orange-500 transition-colors">Problem</a>
            <a href="#solution" className="text-sm text-gray-400 hover:text-orange-500 transition-colors">Solution</a>
            <a href="#features" className="text-sm text-gray-400 hover:text-orange-500 transition-colors">Features</a>
          </div>
          <Link 
            href="/sign-up"
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg transition-all text-sm"
          >
            Start Free
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex items-center pt-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm mb-6"
            >
              <span>AI-Powered Decision Intelligence</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Eliminate Costly
              <span className="block text-orange-500">Decision Errors</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto"
            >
              Research shows decision noise and cognitive bias cost organizations 
              <span className="text-red-400 font-bold"> 12-15%</span> of their annual revenue. 
              NeuroAudit helps you identify and reduce these hidden costs.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                href="/sign-up"
                className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl transition-all text-lg"
              >
                Start Free Trial
              </Link>
              <a 
                href="#problem"
                className="px-8 py-4 border border-white/20 hover:border-orange-500/50 rounded-xl font-semibold transition-all"
              >
                Learn More
              </a>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                14-day free trial
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cancel anytime
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" ref={problemRef} className="py-24 bg-[#0d0d12]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={problemInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Hidden Cost of Decision Noise</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              When different experts evaluate the same situation, their judgments vary widely. 
              This inconsistency costs organizations millions in missed opportunities.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Without NeuroAudit */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                activeDemo === 'chaos' 
                  ? 'bg-red-500/5 border-red-500/50' 
                  : 'bg-[#111] border-white/10'
              }`}
              onClick={() => setActiveDemo('chaos')}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-red-400">Without Analysis</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-gray-300">High variance in similar decisions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-gray-300">Undetected cognitive biases</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-gray-300">No visibility into decision quality</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="text-gray-300">12-15% of revenue lost to errors</span>
                </div>
              </div>
            </motion.div>

            {/* With NeuroAudit */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={problemInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 }}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                activeDemo === 'order' 
                  ? 'bg-green-500/5 border-green-500/50' 
                  : 'bg-[#111] border-white/10'
              }`}
              onClick={() => setActiveDemo('order')}
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h3 className="text-xl font-bold text-green-400">With NeuroAudit</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-gray-300">Consistent decision criteria</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-gray-300">15+ bias types detected automatically</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-gray-300">Clear quality metrics and scores</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-gray-300">Up to 60% reduction in variance</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="solution" ref={howItWorksRef} className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400">Three simple steps to better decisions</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Upload Documents',
                desc: 'Upload PDFs, emails, or meeting notes containing decision rationale.',
                icon: FileText,
              },
              {
                step: '02',
                title: 'AI Analysis',
                desc: 'Our AI scans for cognitive biases, noise, and logical fallacies.',
                icon: Brain,
              },
              {
                step: '03',
                title: 'Get Insights',
                desc: 'Receive detailed reports with bias scores and recommendations.',
                icon: Target,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="text-5xl font-bold text-gray-800 mb-4">{item.step}</div>
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featuresRef} className="py-24 bg-[#0d0d12]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-gray-400">Everything you need to improve decision quality</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Brain, title: 'Bias Detection', desc: 'Identify 15+ cognitive bias types' },
              { icon: Activity, title: 'Noise Analysis', desc: 'Measure and reduce decision variance' },
              { icon: Zap, title: 'Real-Time Analysis', desc: 'Get results in seconds, not hours' },
              { icon: Shield, title: 'Compliance Ready', desc: 'Full audit trails for regulations' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-[#111] border border-white/10 hover:border-orange-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section ref={roiRef} className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={roiInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Calculate Potential Savings</h2>
            <p className="text-gray-400">See how decision noise might be impacting your organization</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Controls */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={roiInView ? { opacity: 1, x: 0 } : {}}
                className="p-6 rounded-2xl bg-[#111] border border-white/10"
              >
                <div className="space-y-6">
                  <div>
                    <label className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Annual Decisions</span>
                      <span className="text-orange-400 font-bold">{annualDecisions.toLocaleString()}</span>
                    </label>
                    <input 
                      type="range" 
                      min="100" 
                      max="50000" 
                      step="100" 
                      value={annualDecisions}
                      onChange={(e) => setAnnualDecisions(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: '#f97316' }}
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Average Decision Value</span>
                      <span className="text-orange-400 font-bold">{formatCurrency(avgDecisionValue)}</span>
                    </label>
                    <input 
                      type="range" 
                      min="1000" 
                      max="100000" 
                      step="1000" 
                      value={avgDecisionValue}
                      onChange={(e) => setAvgDecisionValue(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: '#f97316' }}
                    />
                  </div>

                  <div className="p-4 bg-[#0a0a0f] rounded-lg text-xs text-gray-500">
                    Based on research showing decision noise typically costs organizations 12% of decision value
                  </div>
                </div>
              </motion.div>

              {/* Results */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={roiInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-2xl bg-[#111] border border-orange-500/30"
              >
                <div className="text-center space-y-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Estimated Annual Cost of Noise</div>
                    <div className="text-3xl font-bold text-red-400">
                      {formatCurrency(potentialLoss)}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <div className="text-sm text-green-400 mb-1">Potential Annual Savings (60% reduction)</div>
                    <div className="text-4xl font-bold text-green-400">
                      {formatCurrency(potentialSavings)}
                    </div>
                  </div>

                  <Link 
                    href="/sign-up"
                    className="block w-full py-3 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg transition-all"
                  >
                    Start Your Analysis
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0d0d12]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto text-center p-8 md:p-12 rounded-2xl bg-[#111] border border-orange-500/30"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Improve Your Decisions?
            </h2>
            <p className="text-gray-400 mb-8">
              Start your free 14-day trial. No credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/sign-up"
                className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl transition-all"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/sign-in"
                className="px-8 py-4 border border-white/20 hover:border-orange-500/50 rounded-xl font-semibold transition-all"
              >
                Sign In
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                5-minute setup
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Full access
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cancel anytime
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-orange-500" />
              <span className="font-bold">NEUROAUDIT</span>
              <span className="text-xs text-gray-500">© 2025</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-orange-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
