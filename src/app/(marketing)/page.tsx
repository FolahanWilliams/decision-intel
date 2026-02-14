'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Brain, 
  FileText,
  ArrowRight,
  Shield,
  BarChart3,
  Zap,
  Target
} from 'lucide-react';

// Simulated ticker data
const TICKER_DATA = [
  { symbol: 'NOISE', value: '-12.5%', change: 'down', label: 'AVG DECISION NOISE' },
  { symbol: 'BIAS', value: '+8.3%', change: 'up', label: 'BIAS DETECTED' },
  { symbol: 'QUAL', value: '84.2', change: 'up', label: 'DECISION QUALITY' },
  { symbol: 'COST', value: '-$2.3M', change: 'down', label: 'ANNUAL LOSS' },
  { symbol: 'ROI', value: '+340%', change: 'up', label: 'AUDIT ROI' },
];

export default function LandingPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono">
      {/* Terminal Header / Ticker */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        {/* Top Bar */}
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-[var(--accent-primary)]" />
            <span className="font-bold text-lg tracking-wider">NEUROAUDIT</span>
            <span className="text-[var(--text-muted)] text-xs">v2.4.1</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="text-xs hover:text-[var(--accent-primary)] transition-colors">
              [ SIGN_IN ]
            </Link>
            <Link 
              href="/sign-up" 
              className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold text-xs hover:bg-[var(--text-highlight)] transition-colors"
            >
              START_AUDIT
            </Link>
          </div>
        </div>

        {/* Live Ticker */}
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-primary)] overflow-hidden">
          <div className="container py-2 flex items-center gap-8 text-xs">
            <span className="text-[var(--text-muted)] uppercase tracking-wider">Live Metrics:</span>
            {TICKER_DATA.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[var(--text-muted)]">{item.symbol}</span>
                <span className={item.change === 'up' ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                  {item.change === 'up' ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Dashboard Preview */}
      <main className="container py-8">
        {/* Hero Grid - Dashboard Style */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Main Headline - Takes 8 cols */}
          <div className="col-span-12 lg:col-span-8">
            <div className="card h-full">
              <div className="card-header">
                <h1 className="text-base font-bold tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--accent-primary)]" />
                  DECISION_INTELLIGENCE_PLATFORM
                </h1>
                <span className="text-xs text-[var(--text-muted)]">STATUS: OPERATIONAL</span>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-3xl font-bold mb-4 leading-tight">
                      ELIMINATE DECISION<br />
                      <span className="text-[var(--accent-primary)]">NOISE & BIAS</span>
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                      AI-powered forensic analysis detecting cognitive biases and variance in organizational decision-making. 
                      Reduce errors by 60%.
                    </p>
                    <div className="flex gap-3">
                      <Link 
                        href="/sign-up"
                        className="btn btn-primary"
                      >
                        <Zap className="w-4 h-4" />
                        INITIATE_AUDIT
                      </Link>
                      <Link 
                        href="#features"
                        className="btn btn-secondary"
                      >
                        VIEW_DOCS
                      </Link>
                    </div>
                  </div>
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-4">
                    <div className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-wider">Recent Analysis</div>
                    <div className="space-y-2">
                      {[
                        { file: 'Q4_Strategy.pdf', score: 72, bias: 'CONFIRMATION', risk: 'MEDIUM' },
                        { file: 'Budget_2025.docx', score: 45, bias: 'ANCHORING', risk: 'HIGH' },
                        { file: 'Hiring_Decision.pdf', score: 89, bias: 'NONE', risk: 'LOW' },
                      ].map((doc, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
                            <span className="text-sm">{doc.file}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-0.5 border ${
                              doc.risk === 'HIGH' ? 'text-[var(--error)] border-[var(--error)]' :
                              doc.risk === 'MEDIUM' ? 'text-[var(--warning)] border-[var(--warning)]' :
                              'text-[var(--success)] border-[var(--success)]'
                            }`}>
                              {doc.risk}
                            </span>
                            <span className="text-sm font-bold w-8 text-right">{doc.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - Takes 4 cols */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="card">
              <div className="card-body text-center py-6">
                <div className="text-4xl font-bold text-[var(--accent-primary)] mb-1">$3.2B</div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Client Savings</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center py-6">
                <div className="text-4xl font-bold text-[var(--success)] mb-1">60%</div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Noise Reduction</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center py-6">
                <div className="text-4xl font-bold text-[var(--accent-secondary)] mb-1">500+</div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Enterprise Clients</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Modules - 4 Column Grid */}
        <div id="features" className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold tracking-wider">CORE_MODULES</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'BIAS_DETECTION',
                desc: 'Identify 15+ cognitive biases',
                icon: Brain,
                metric: '15+',
                status: 'ACTIVE'
              },
              {
                title: 'NOISE_ANALYSIS',
                desc: 'Measure decision variance',
                icon: Activity,
                metric: '±12%',
                status: 'ACTIVE'
              },
              {
                title: 'COMPLIANCE_CHECK',
                desc: 'Regulatory audit trails',
                icon: Shield,
                metric: '100%',
                status: 'ACTIVE'
              },
              {
                title: 'REALTIME_PROCESSING',
                desc: 'Sub-second analysis',
                icon: Zap,
                metric: '<1s',
                status: 'ACTIVE'
              }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="card card-glow cursor-pointer transition-all"
                onMouseEnter={() => setHoveredCard(feature.title)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <feature.icon className={`w-6 h-6 transition-colors ${
                      hoveredCard === feature.title ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                    }`} />
                    <span className="text-xs px-2 py-0.5 bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]">
                      {feature.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold mb-1">{feature.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] mb-3">{feature.desc}</p>
                  <div className="text-2xl font-bold text-[var(--accent-primary)]">{feature.metric}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Calculator - Split Panel */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-12 lg:col-span-5">
            <div className="card h-full">
              <div className="card-header">
                <h3 className="text-sm font-bold tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  ROI_CALCULATOR
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase mb-2 block">
                    Annual Decisions: <span className="text-[var(--accent-primary)]">10,000</span>
                  </label>
                  <input 
                    type="range" 
                    defaultValue="10000"
                    min="1000"
                    max="100000"
                    className="w-full h-1 bg-[var(--bg-tertiary)] appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase mb-2 block">
                    Avg Value: <span className="text-[var(--accent-primary)]">$25,000</span>
                  </label>
                  <input 
                    type="range" 
                    defaultValue="25000"
                    min="5000"
                    max="500000"
                    className="w-full h-1 bg-[var(--bg-tertiary)] appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-12 lg:col-span-7">
            <div className="card h-full">
              <div className="card-body flex items-center justify-between py-8">
                <div className="text-center flex-1 border-r border-[var(--border-color)]">
                  <div className="text-xs text-[var(--text-muted)] uppercase mb-2">Current Loss</div>
                  <div className="text-3xl font-bold text-[var(--error)] line-through">$30M</div>
                </div>
                <div className="text-center flex-1 border-r border-[var(--border-color)]">
                  <div className="text-xs text-[var(--text-muted)] uppercase mb-2">Potential Savings</div>
                  <div className="text-3xl font-bold text-[var(--success)]">$18M</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase mb-2">ROI</div>
                  <div className="text-3xl font-bold text-[var(--accent-primary)]">+340%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials - Data Row Style */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold tracking-wider">CLIENT_VERIFICATION</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                quote: 'Identified $2.3M in decision variance. ROI was immediate.',
                author: 'Sarah Chen',
                role: 'CRO, Financial Services',
                metric: '$2.3M'
              },
              {
                quote: 'Reduced inconsistency by 58% in three months.',
                author: 'Michael Rodriguez',
                role: 'VP Strategy, Healthcare',
                metric: '58%'
              },
              {
                quote: 'Complete audit trails for every major decision.',
                author: 'Emily Watson',
                role: 'General Counsel',
                metric: '100%'
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="card">
                <div className="card-body">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl text-[var(--accent-primary)]">"</span>
                    <p className="text-sm text-[var(--text-secondary)]">{testimonial.quote}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3">
                    <div>
                      <div className="text-xs font-bold">{testimonial.author}</div>
                      <div className="text-xs text-[var(--text-muted)]">{testimonial.role}</div>
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

        {/* CTA - Terminal Style */}
        <div className="card border-[var(--accent-primary)]">
          <div className="card-body py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold mb-2">
                  <span className="text-[var(--accent-primary)]">&gt;</span> READY_TO_ELIMINATE_NOISE?
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Start free trial. No credit card required. Full feature access.
                </p>
              </div>
              <div className="flex gap-3">
                <Link 
                  href="/sign-up"
                  className="btn btn-primary text-sm"
                >
                  INITIALIZE_TRIAL
                  <ArrowRight className="w-4 h-4" />
                </Link>
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
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]">PRIVACY_POLICY</a>
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]">TERMS_OF_SERVICE</a>
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]">SECURITY</a>
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]">CONTACT</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
