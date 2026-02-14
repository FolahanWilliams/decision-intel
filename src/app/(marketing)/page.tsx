'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Brain, 
  FileText,
  Shield,
  Zap,
  Target,
  CheckCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  Clock
} from 'lucide-react';

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
      {/* Navigation - Clean, no data */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-[var(--accent-primary)]" />
            <span className="font-bold text-lg tracking-wider">NEUROAUDIT</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)] uppercase tracking-wider hidden sm:block">Features</a>
            <a href="#roi" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)] uppercase tracking-wider hidden sm:block">ROI</a>
            <Link href="/sign-in" className="text-xs hover:text-[var(--accent-primary)] transition-colors uppercase tracking-wider">
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold text-xs hover:bg-[var(--text-highlight)] transition-colors uppercase tracking-wider"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Strong Value Prop */}
      <section className="pt-24 pb-12">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Value Proposition */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs mb-6 uppercase tracking-wider">
                <Zap className="w-3 h-3" />
                AI-Powered Decision Auditing
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Stop Losing Money to<br />
                <span className="text-[var(--accent-primary)]">Bad Decisions</span>
              </h1>

              <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
                Decision noise and cognitive bias cost organizations <span className="text-[var(--accent-primary)] font-bold">12-15%</span> of their annual revenue. 
                NeuroAudit detects these hidden errors before they cost you millions.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  'Identify 15+ cognitive biases in real-time',
                  'Reduce decision variance by up to 60%',
                  'Save $2-15M annually (typical ROI)',
                  'Complete audit trails for compliance'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/sign-up"
                  className="btn btn-primary text-sm"
                >
                  Start Free 14-Day Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a 
                  href="#demo"
                  className="btn btn-secondary text-sm"
                >
                  See How It Works
                </a>
              </div>

              <div className="flex items-center gap-6 mt-8 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--success)]" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[var(--success)]" />
                  <span>GDPR Ready</span>
                </div>
              </div>
            </div>

            {/* Right - Marketing Visual (NOT real data) */}
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--accent-primary)]/5 blur-3xl" />
              <div className="relative card">
                <div className="card-header flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">Sample Analysis Preview</span>
                  <span className="text-xs text-[var(--text-muted)]">DEMO_MODE</span>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[var(--bg-primary)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
                        <span className="text-sm">Strategic_Decision.pdf</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-[var(--error)]/20 text-[var(--error)] border border-[var(--error)]">HIGH RISK</span>
                        <span className="text-sm font-bold">45%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-[var(--text-muted)] uppercase">Detected Issues:</div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]">Confirmation Bias</span>
                        <span className="text-xs px-2 py-1 bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]">Anchoring</span>
                        <span className="text-xs px-2 py-1 bg-[var(--error)]/20 text-[var(--error)] border border-[var(--error)]">High Variance</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)]">
                      <div className="text-xs text-[var(--text-muted)] mb-2">Potential Annual Loss:</div>
                      <div className="text-2xl font-bold text-[var(--error)]">$4.2M</div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[var(--success)]">
                      <CheckCircle className="w-4 h-4" />
                      <span>NeuroAudit can prevent 60% of this loss</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM - Interactive Demo */}
      <section id="demo" className="py-12 border-t border-[var(--border-color)]">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">The Hidden Cost of Decision Noise</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              When different experts evaluate the same situation, their judgments vary wildly. 
              This inconsistency costs organizations millions in missed opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Without NeuroAudit */}
            <div 
              className={`card cursor-pointer transition-all ${activeDemo === 'without' ? 'border-[var(--error)]' : ''}`}
              onClick={() => setActiveDemo('without')}
            >
              <div className="card-header bg-[var(--error)]/10">
                <h3 className="text-sm font-bold text-[var(--error)] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  WITHOUT NEUROAUDIT
                </h3>
              </div>
              <div className="card-body">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--error)]">✗</span>
                    <span>12-15% revenue lost to decision errors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--error)]">✗</span>
                    <span>Undetected cognitive biases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--error)]">✗</span>
                    <span>Wide variance in similar decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--error)]">✗</span>
                    <span>No audit trail or compliance</span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Decision Distribution</div>
                  <div className="h-20 flex items-end gap-0.5">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-[var(--error)]/40"
                        style={{ height: `${Math.random() * 80 + 10}%` }}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-[var(--error)] mt-2 text-center">High Variance = High Cost</div>
                </div>
              </div>
            </div>

            {/* With NeuroAudit */}
            <div 
              className={`card cursor-pointer transition-all ${activeDemo === 'with' ? 'border-[var(--success)]' : ''}`}
              onClick={() => setActiveDemo('with')}
            >
              <div className="card-header bg-[var(--success)]/10">
                <h3 className="text-sm font-bold text-[var(--success)] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  WITH NEUROAUDIT
                </h3>
              </div>
              <div className="card-body">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--success)]">✓</span>
                    <span>Save $2-15M annually</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--success)]">✓</span>
                    <span>Detect 15+ bias types automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--success)]">✓</span>
                    <span>60% reduction in variance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--success)]">✓</span>
                    <span>Full audit trail & compliance</span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Decision Distribution</div>
                  <div className="h-20 flex items-end gap-0.5">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const isCenter = i >= 8 && i <= 11;
                      return (
                        <div
                          key={i}
                          className={`flex-1 ${isCenter ? 'bg-[var(--success)]' : 'bg-[var(--success)]/20'}`}
                          style={{ height: isCenter ? '85%' : `${Math.random() * 20 + 5}%` }}
                        />
                      );
                    })}
                  </div>
                  <div className="text-xs text-[var(--success)] mt-2 text-center">Tight Distribution = Consistency</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-12 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <p className="text-[var(--text-secondary)]">
              Three simple steps to eliminate decision noise
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'UPLOAD',
                desc: 'Upload PDFs, emails, or documents containing decision rationale',
                icon: FileText,
              },
              {
                step: '02',
                title: 'ANALYZE',
                desc: 'AI scans for biases, noise, and logical fallacies in real-time',
                icon: Brain,
              },
              {
                step: '03',
                title: 'IMPROVE',
                desc: 'Get actionable insights to reduce errors and improve quality',
                icon: Target,
              },
            ].map((item, idx) => (
              <div key={idx} className="card text-center">
                <div className="card-body">
                  <div className="text-5xl font-bold text-[var(--accent-primary)] opacity-20 mb-4">{item.step}</div>
                  <item.icon className="w-8 h-8 text-[var(--accent-primary)] mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-12 border-t border-[var(--border-color)]">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Why Choose NeuroAudit</h2>
            <p className="text-[var(--text-secondary)]">
              Enterprise-grade decision intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                icon: Brain, 
                title: '15+ Bias Types', 
                desc: 'Detect confirmation, anchoring, overconfidence, and more' 
              },
              { 
                icon: Activity, 
                title: 'Noise Analysis', 
                desc: 'Measure and reduce decision variance by 60%' 
              },
              { 
                icon: Zap, 
                title: 'Real-Time', 
                desc: 'Get results in seconds, not hours' 
              },
              { 
                icon: Shield, 
                title: 'Compliance', 
                desc: 'Full audit trails for regulatory requirements' 
              },
            ].map((feature, idx) => (
              <div key={idx} className="card card-glow">
                <div className="card-body text-center">
                  <feature.icon className="w-8 h-8 text-[var(--accent-primary)] mx-auto mb-3" />
                  <h3 className="text-sm font-bold mb-2">{feature.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI CALCULATOR */}
      <section id="roi" className="py-12 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Calculate Your Savings</h2>
            <p className="text-[var(--text-secondary)]">
              See how much decision noise is costing you
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-body space-y-6">
                  <div>
                    <label className="flex justify-between text-xs uppercase mb-3">
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
                      className="w-full h-2 bg-[var(--bg-tertiary)] appearance-none"
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-xs uppercase mb-3">
                      <span className="text-[var(--text-muted)]">Average Value</span>
                      <span className="text-[var(--accent-primary)] font-bold">{formatCurrency(avgDecisionValue)}</span>
                    </label>
                    <input 
                      type="range" 
                      min="5000" 
                      max="500000" 
                      step="5000" 
                      value={avgDecisionValue}
                      onChange={(e) => setAvgDecisionValue(Number(e.target.value))}
                      className="w-full h-2 bg-[var(--bg-tertiary)] appearance-none"
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                  </div>
                </div>
              </div>

              <div className="card border-[var(--accent-primary)]">
                <div className="card-body">
                  <div className="text-center space-y-4">
                    <div>
                      <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Current Annual Loss</div>
                      <div className="text-2xl font-bold text-[var(--error)] line-through opacity-70">
                        {formatCurrency(potentialLoss)}
                      </div>
                    </div>
                    
                    <div className="py-4 border-y border-[var(--border-color)]">
                      <div className="text-xs text-[var(--success)] uppercase mb-1">Your Potential Savings</div>
                      <div className="text-4xl font-bold text-[var(--success)]">
                        {formatCurrency(potentialSavings)}
                      </div>
                    </div>

                    <Link 
                      href="/sign-up"
                      className="btn btn-primary w-full"
                    >
                      Start Saving Today
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-12 border-t border-[var(--border-color)]">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Trusted By Industry Leaders</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'NeuroAudit identified $2.3M in preventable decision variance within 90 days.',
                author: 'Sarah Chen',
                role: 'Chief Risk Officer',
                metric: '$2.3M Saved'
              },
              {
                quote: 'Reduced our decision inconsistency by 58%. The ROI was immediate and measurable.',
                author: 'Michael Rodriguez',
                role: 'VP Strategy',
                metric: '58% Improvement'
              },
              {
                quote: 'Complete audit trails for compliance. The bias detection is incredibly accurate.',
                author: 'Emily Watson',
                role: 'General Counsel',
                metric: '100% Compliant'
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="card">
                <div className="card-body">
                  <div className="text-3xl text-[var(--accent-primary)] mb-4">"</div>
                  <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">{testimonial.quote}</p>
                  <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4">
                    <div>
                      <div className="text-sm font-bold">{testimonial.author}</div>
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
      </section>

      {/* FINAL CTA */}
      <section className="py-16 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Stop Losing Money to Bad Decisions?
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              Join 500+ companies using NeuroAudit to improve decision quality and save millions annually.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link 
                href="/sign-up"
                className="btn btn-primary text-base px-8 py-3"
              >
                <Zap className="w-5 h-5" />
                Start Free 14-Day Trial
              </Link>
              <Link 
                href="/sign-in"
                className="btn btn-secondary text-base px-8 py-3"
              >
                Sign In
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                Full feature access
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--success)]" />
                Setup in 5 minutes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border-color)]">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[var(--accent-primary)]" />
              <span className="font-bold tracking-wider">NEUROAUDIT</span>
              <span className="text-xs text-[var(--text-muted)]">© 2025</span>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]">Privacy</a>
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]">Terms</a>
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
