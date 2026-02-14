'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  FileText,
  Shield,
  BarChart3,
  Zap,
  Target,
  CheckCircle,
  AlertTriangle,
  Users,
  Lock
} from 'lucide-react';

// Live ticker data
const TICKER_DATA = [
  { symbol: 'NOISE_IDX', value: '-12.5%', change: 'down', label: 'AVG DECISION NOISE' },
  { symbol: 'BIAS_DET', value: '+8.3%', change: 'up', label: 'BIAS DETECTION RATE' },
  { symbol: 'QUAL_SCORE', value: '84.2', change: 'up', label: 'DECISION QUALITY' },
  { symbol: 'SAVINGS', value: '-$2.3M', change: 'down', label: 'ANNUAL LOSS PREVENTED' },
  { symbol: 'ROI_PCT', value: '+340%', change: 'up', label: 'CLIENT ROI' },
];

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState<'without' | 'with'>('without');
  const [annualDecisions, setAnnualDecisions] = useState(10000);
  const [avgDecisionValue, setAvgDecisionValue] = useState(25000);

  const noiseTaxRate = 0.12;
  const potentialLoss = annualDecisions * avgDecisionValue * noiseTaxRate;
  const potentialSavings = potentialLoss * 0.6;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono">
      {/* Terminal Header / Ticker */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        {/* Top Bar */}
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-[var(--accent-primary)]" />
            <span className="font-bold text-lg tracking-wider">NEUROAUDIT</span>
            <span className="text-xs text-[var(--text-muted)]">v2.4.1</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="text-xs hover:text-[var(--accent-primary)] transition-colors uppercase tracking-wider">
              [ Sign In ]
            </Link>
            <Link 
              href="/sign-up" 
              className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold text-xs hover:bg-[var(--text-highlight)] transition-colors uppercase tracking-wider"
            >
              Start Free Audit
            </Link>
          </div>
        </div>

        {/* Live Ticker */}
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-primary)] overflow-hidden">
          <div className="container py-2 flex items-center gap-8 text-xs overflow-x-auto">
            <span className="text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Live Metrics:</span>
            {TICKER_DATA.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[var(--text-muted)]">{item.symbol}</span>
                <span className={item.change === 'up' ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                  {item.change === 'up' ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        
        {/* HERO SECTION - Two Column */}
        <div className="grid grid-cols-12 gap-4 mb-8">
          {/* Left Column - Headline & CTA */}
          <div className="col-span-12 lg:col-span-7">
            <div className="card h-full">
              <div className="card-header">
                <h1 className="text-base font-bold tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--accent-primary)]" />
                  ELIMINATE_DECISION_NOISE
                </h1>
                <span className="text-xs text-[var(--text-muted)]">STATUS: OPERATIONAL</span>
              </div>
              <div className="card-body">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                  AI-Powered Detection of<br />
                  <span className="text-[var(--accent-primary)]">Cognitive Bias & Noise</span>
                </h2>
                
                <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed max-w-xl">
                  NeuroAudit analyzes your organization's decision documents to identify costly cognitive biases 
                  and decision noise. Reduce errors by up to 60% and save millions in preventable losses.
                </p>

                <div className="flex flex-wrap gap-3 mb-6">
                  <Link 
                    href="/sign-up"
                    className="btn btn-primary"
                  >
                    <Zap className="w-4 h-4" />
                    START_FREE_TRIAL
                  </Link>
                  <a 
                    href="#how-it-works"
                    className="btn btn-secondary"
                  >
                    VIEW_DEMO
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[var(--success)]" />
                    <span>SOC 2 Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[var(--success)]" />
                    <span>GDPR Ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                    <span>99.9% Uptime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="card">
              <div className="card-body">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Client Savings</div>
                <div className="text-4xl font-bold text-[var(--accent-primary)]">$3.2B+</div>
                <div className="text-xs text-[var(--success)] mt-1">+47% YoY</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Noise Reduction</div>
                <div className="text-4xl font-bold text-[var(--success)]">60%</div>
                <div className="text-xs text-[var(--success)] mt-1">Average improvement</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Enterprise Clients</div>
                <div className="text-4xl font-bold text-[var(--accent-secondary)]">500+</div>
                <div className="text-xs text-[var(--accent-secondary)] mt-1">Fortune 500 companies</div>
              </div>
            </div>
          </div>
        </div>

        {/* THE PROBLEM - Interactive Demo */}
        <div id="problem" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold tracking-wider uppercase">The Cost of Decision Noise</h2>
          </div>
          
          <div className="card">
            <div className="card-body">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                    When different experts evaluate identical situations, their judgments vary wildly. 
                    This inconsistency—<span className="text-[var(--accent-primary)]">decision noise</span>—costs organizations 
                    12-15% of their decision value annually. A $100M company loses $12-15M yearly to preventable errors.
                  </p>
                  
                  <div className="space-y-3">
                    {[
                      { icon: AlertTriangle, text: 'High variance in similar decisions' },
                      { icon: AlertTriangle, text: 'Undetected cognitive biases' },
                      { icon: AlertTriangle, text: 'No audit trail or consistency' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)]">
                        <item.icon className="w-4 h-4 text-[var(--error)] flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-4">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4">
                    Decision Variance Visualization
                  </div>
                  
                  {/* Toggle */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveDemo('without')}
                      className={`flex-1 py-2 text-xs uppercase tracking-wider border ${
                        activeDemo === 'without' 
                          ? 'bg-[var(--error)]/20 text-[var(--error)] border-[var(--error)]' 
                          : 'border-[var(--border-color)] text-[var(--text-muted)]'
                      }`}
                    >
                      Without NeuroAudit
                    </button>
                    <button
                      onClick={() => setActiveDemo('with')}
                      className={`flex-1 py-2 text-xs uppercase tracking-wider border ${
                        activeDemo === 'with' 
                          ? 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]' 
                          : 'border-[var(--border-color)] text-[var(--text-muted)]'
                      }`}
                    >
                      With NeuroAudit
                    </button>
                  </div>

                  {/* Visualization */}
                  <div className="h-48 flex items-end gap-1">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const isCenter = i >= 12 && i <= 17;
                      const height = activeDemo === 'without' 
                        ? Math.random() * 80 + 10 
                        : isCenter 
                          ? 80 + Math.random() * 15 
                          : Math.random() * 25 + 5;
                      
                      return (
                        <div
                          key={i}
                          className={`flex-1 transition-all duration-500 ${
                            activeDemo === 'without' 
                              ? 'bg-[var(--error)]/40' 
                              : isCenter 
                                ? 'bg-[var(--success)]' 
                                : 'bg-[var(--success)]/20'
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
                    <span>POOR</span>
                    <span className={activeDemo === 'with' ? 'text-[var(--success)]' : ''}>OPTIMAL</span>
                    <span>POOR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div id="how-it-works" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold tracking-wider uppercase">How NeuroAudit Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                title: 'UPLOAD_DOCUMENTS',
                desc: 'Securely upload PDFs, emails, meeting notes, or CRM records containing decision rationale.',
                icon: FileText,
              },
              {
                step: '02',
                title: 'AI_ANALYSIS',
                desc: 'Our engine scans for 15+ cognitive biases, decision noise, and logical fallacies in real-time.',
                icon: Brain,
              },
              {
                step: '03',
                title: 'GET_INSIGHTS',
                desc: 'Receive detailed reports with bias scores, improvement recommendations, and team benchmarks.',
                icon: Target,
              },
            ].map((item, idx) => (
              <div key={idx} className="card card-glow">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-4">
                    <item.icon className="w-8 h-8 text-[var(--accent-primary)]" />
                    <span className="text-4xl font-bold text-[var(--accent-primary)] opacity-20">{item.step}</span>
                  </div>
                  <h3 className="text-sm font-bold mb-2 uppercase tracking-wider">{item.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold tracking-wider uppercase">Core Capabilities</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'BIAS_DETECTION', desc: 'Identify 15+ cognitive biases', metric: '15+' },
              { title: 'NOISE_ANALYSIS', desc: 'Measure decision variance', metric: '±12%' },
              { title: 'REALTIME_PROCESSING', desc: 'Sub-second analysis', metric: '<1s' },
              { title: 'TEAM_BENCHMARKS', desc: 'Compare across departments', metric: '100%' },
            ].map((feature, idx) => (
              <div key={idx} className="card card-glow">
                <div className="card-body">
                  <div className="text-xs text-[var(--text-muted)] uppercase mb-2">{feature.title}</div>
                  <div className="text-2xl font-bold text-[var(--accent-primary)] mb-2">{feature.metric}</div>
                  <p className="text-xs text-[var(--text-secondary)]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROI CALCULATOR */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold tracking-wider uppercase">Calculate Your Savings</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-body space-y-6">
                <div>
                  <label className="flex justify-between text-xs uppercase tracking-wider mb-3">
                    <span className="text-[var(--text-muted)]">Annual Decisions</span>
                    <span className="text-[var(--accent-primary)] font-bold">{annualDecisions.toLocaleString()}</span>
                  </label>
                  <input 
                    type="range" 
                    min="1000" 
                    max="100000" 
                    step="1000" 
                    value={annualDecisions}
                    onChange={(e) => setAnnualDecisions(Number(e.target.value))}
                    className="w-full h-1 bg-[var(--bg-tertiary)] appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div>
                  <label className="flex justify-between text-xs uppercase tracking-wider mb-3">
                    <span className="text-[var(--text-muted)]">Average Decision Value</span>
                    <span className="text-[var(--accent-primary)] font-bold">{formatCurrency(avgDecisionValue)}</span>
                  </label>
                  <input 
                    type="range" 
                    min="5000" 
                    max="500000" 
                    step="5000" 
                    value={avgDecisionValue}
                    onChange={(e) => setAvgDecisionValue(Number(e.target.value))}
                    className="w-full h-1 bg-[var(--bg-tertiary)] appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              </div>
            </div>

            <div className="card border-[var(--accent-primary)]">
              <div className="card-body">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase mb-2">Current Loss</div>
                    <div className="text-2xl font-bold text-[var(--error)] line-through opacity-70">
                      {formatCurrency(potentialLoss)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase mb-2">Your Savings</div>
                    <div className="text-3xl font-bold text-[var(--success)]">
                      {formatCurrency(potentialSavings)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase mb-2">ROI</div>
                    <div className="text-2xl font-bold text-[var(--accent-primary)]">+340%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TESTIMONIALS */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold tracking-wider uppercase">Client Verification</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                quote: 'NeuroAudit helped us identify $2.3M in decision variance within our underwriting team.',
                author: 'Sarah Chen',
                role: 'Chief Risk Officer',
                company: 'Financial Services',
                metric: '$2.3M Saved'
              },
              {
                quote: 'Reduced decision inconsistency by 58% in just three months. Incredibly accurate.',
                author: 'Michael Rodriguez',
                role: 'VP of Strategy',
                company: 'Healthcare',
                metric: '58% Reduction'
              },
              {
                quote: 'Complete audit trails for every major decision. Compliance features justify the cost.',
                author: 'Emily Watson',
                role: 'General Counsel',
                company: 'Manufacturing',
                metric: '100% Compliant'
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="card">
                <div className="card-body">
                  <div className="text-2xl text-[var(--accent-primary)] mb-3">"</div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">{testimonial.quote}</p>
                  <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3">
                    <div>
                      <div className="text-xs font-bold">{testimonial.author}</div>
                      <div className="text-xs text-[var(--text-muted)]">{testimonial.role}, {testimonial.company}</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]">
                      {testimonial.metric}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="card border-[var(--accent-primary)]">
          <div className="card-body py-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Eliminate <span className="text-[var(--accent-primary)]">Decision Noise?</span>
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Join 500+ companies using NeuroAudit to improve decision quality and save millions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/sign-up"
                  className="btn btn-primary text-base px-8"
                >
                  <Zap className="w-5 h-5" />
                  Start Free 14-Day Trial
                </Link>
                <Link 
                  href="/sign-in"
                  className="btn btn-secondary text-base px-8"
                >
                  Sign In to Dashboard
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[var(--success)]" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[var(--success)]" />
                  Full feature access
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[var(--success)]" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] mt-8">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[var(--accent-primary)]" />
              <span className="font-bold text-sm tracking-wider">NEUROAUDIT</span>
              <span className="text-xs text-[var(--text-muted)]">© 2025</span>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] uppercase">Privacy Policy</a>
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] uppercase">Terms of Service</a>
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] uppercase">Security</a>
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] uppercase">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
