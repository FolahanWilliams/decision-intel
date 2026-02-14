"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Brain, Shield, TrendingUp, FileText, AlertTriangle, CheckCircle, ArrowRight, BarChart3, Zap, Users, Lock, Clock, Award } from 'lucide-react';

export default function LandingPage() {
  const [annualDecisions, setAnnualDecisions] = useState(10000);
  const [avgDecisionValue, setAvgDecisionValue] = useState(25000);
  const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem');

  const noiseTaxRate = 0.12;
  const potentialLoss = annualDecisions * avgDecisionValue * noiseTaxRate;
  const potentialSavings = potentialLoss * 0.6;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/10">
        <div className="w-full px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-teal-400" />
              <span className="text-xl font-bold">NeuroAudit</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#problem" className="text-sm text-gray-400 hover:text-white transition-colors">The Problem</a>
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How it Works</a>
              <a href="#roi" className="text-sm text-gray-400 hover:text-white transition-colors">ROI</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
                Sign In
              </Link>
              <Link 
                href="/sign-up" 
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-lg transition-all text-sm"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Width Split */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
            {/* Left Content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm mb-6">
                <Zap className="w-4 h-4" />
                Trusted by Fortune 500 Companies
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6">
                Eliminate Costly{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                  Decision Errors
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-xl">
                AI-powered auditing detects cognitive biases and decision noise in your organization's critical choices.{' '}
                <span className="text-white font-semibold">Reduce errors by up to 60%.</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-12">
                <Link 
                  href="/sign-up"
                  className="group px-8 py-4 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl transition-all flex items-center gap-2 text-lg"
                >
                  Start Free Audit
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="#problem"
                  className="px-8 py-4 border border-white/20 hover:border-white/40 rounded-xl font-semibold transition-all text-lg"
                >
                  Learn More
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-400" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-teal-400" />
                  <span>GDPR Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-400" />
                  <span>99.9% Uptime</span>
                </div>
              </div>
            </div>

            {/* Right Content - Interactive Preview */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-[#1a1a20] rounded-2xl border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="text-sm text-gray-500">Decision Analysis Dashboard</div>
                </div>

                {/* Mock Dashboard */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#0f0f14] rounded-xl p-4 border border-white/5">
                      <div className="text-3xl font-bold text-teal-400">84%</div>
                      <div className="text-xs text-gray-500 mt-1">Decision Quality Score</div>
                    </div>
                    <div className="bg-[#0f0f14] rounded-xl p-4 border border-white/5">
                      <div className="text-3xl font-bold text-yellow-400">12</div>
                      <div className="text-xs text-gray-500 mt-1">Biases Detected</div>
                    </div>
                    <div className="bg-[#0f0f14] rounded-xl p-4 border border-white/5">
                      <div className="text-3xl font-bold text-green-400">$2.3M</div>
                      <div className="text-xs text-gray-500 mt-1">Potential Savings</div>
                    </div>
                  </div>

                  {/* Bias Bars */}
                  <div className="bg-[#0f0f14] rounded-xl p-4 border border-white/5">
                    <div className="text-sm font-medium mb-4">Top Detected Biases</div>
                    {[
                      { name: 'Confirmation Bias', value: 78 },
                      { name: 'Anchoring Bias', value: 65 },
                      { name: 'Overconfidence', value: 52 },
                    ].map((bias, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{bias.name}</span>
                          <span className="text-teal-400">{bias.value}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                            style={{ width: `${bias.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Document Preview */}
                  <div className="bg-[#0f0f14] rounded-xl p-4 border border-white/5">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">Q4_Strategy_Meeting.pdf</div>
                        <div className="text-xs text-gray-500 mb-2">Analyzed 2 minutes ago</div>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">High Risk</span>
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">3 Biases</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar - Full Width */}
      <section className="w-full bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-purple-500/10 border-y border-white/10">
        <div className="w-full px-6 lg:px-12 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-teal-400 mb-2">$3.2B</div>
              <div className="text-sm text-gray-400">Saved for clients</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-teal-400 mb-2">60%</div>
              <div className="text-sm text-gray-400">Avg. noise reduction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-teal-400 mb-2">500+</div>
              <div className="text-sm text-gray-400">Enterprise clients</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-teal-400 mb-2">15+</div>
              <div className="text-sm text-gray-400">Biases detected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - Full Width Cards */}
      <section id="problem" className="py-20 lg:py-32">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-4xl mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              The Hidden Cost of Decision Noise
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              When different experts evaluate the same situation, their judgments vary wildly. This inconsistency costs organizations millions in missed opportunities, poor outcomes, and competitive disadvantage.
            </p>
          </div>

          {/* Interactive Comparison - Full Width */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Without NeuroAudit */}
            <div 
              className={`p-8 rounded-2xl border-2 transition-all cursor-pointer ${
                activeTab === 'problem' 
                  ? 'bg-red-500/10 border-red-500/50' 
                  : 'bg-[#1a1a20] border-white/5 hover:border-red-500/30'
              }`}
              onClick={() => setActiveTab('problem')}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-red-400">Without NeuroAudit</h3>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">High Variance</h4>
                    <p className="text-gray-400 text-sm">Same case, different decisions. Judgments scattered across wide range leading to inconsistent outcomes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Undetected Biases</h4>
                    <p className="text-gray-400 text-sm">Confirmation bias, anchoring, and overconfidence go unnoticed, leading to systematic errors.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Costly Errors</h4>
                    <p className="text-gray-400 text-sm">12-15% of decision value lost to noise and bias annually. A $100M company loses $12-15M yearly.</p>
                  </div>
                </div>
              </div>

              {/* Visualization */}
              <div className="mt-8 bg-[#0a0a0f] rounded-xl p-6">
                <div className="text-xs text-gray-500 mb-4">Decision Distribution (Wide Variance)</div>
                <div className="h-32 flex items-end gap-1">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-red-500/40 rounded-t"
                      style={{ height: `${Math.random() * 80 + 10}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* With NeuroAudit */}
            <div 
              className={`p-8 rounded-2xl border-2 transition-all cursor-pointer ${
                activeTab === 'solution' 
                  ? 'bg-teal-500/10 border-teal-500/50' 
                  : 'bg-[#1a1a20] border-white/5 hover:border-teal-500/30'
              }`}
              onClick={() => setActiveTab('solution')}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-teal-400">With NeuroAudit</h3>
                <CheckCircle className="w-8 h-8 text-teal-400" />
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Consistent Standards</h4>
                    <p className="text-gray-400 text-sm">AI enforces uniform criteria across all decisions, eliminating variance and ensuring reliability.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Bias Detection</h4>
                    <p className="text-gray-400 text-sm">Identifies 15+ cognitive biases in real-time before they impact critical decisions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Measurable ROI</h4>
                    <p className="text-gray-400 text-sm">Average 60% reduction in decision variance. Track savings and improvements in real-time.</p>
                  </div>
                </div>
              </div>

              {/* Visualization */}
              <div className="mt-8 bg-[#0a0a0f] rounded-xl p-6">
                <div className="text-xs text-gray-500 mb-4">Decision Distribution (Tight Cluster)</div>
                <div className="h-32 flex items-end gap-1">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const isCenter = i >= 12 && i <= 17;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-t ${isCenter ? 'bg-teal-400' : 'bg-teal-500/20'}`}
                        style={{ height: isCenter ? '85%' : `${Math.random() * 30 + 10}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Horizontal Layout */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-[#0f0f14]">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-4xl mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">How NeuroAudit Works</h2>
            <p className="text-xl text-gray-400">
              Our AI engine analyzes your decision documents and identifies patterns that lead to costly errors.
            </p>
          </div>

          {/* Horizontal Steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: FileText,
                title: 'Upload Documents',
                description: 'Securely upload PDFs, emails, meeting notes, or CRM records containing decision rationale. Our system supports all major document formats.',
                color: 'text-blue-400',
                bgColor: 'bg-blue-500/10',
                borderColor: 'border-blue-500/20'
              },
              {
                step: '02',
                icon: Brain,
                title: 'AI Analysis',
                description: 'Our engine scans for 15+ cognitive biases, decision noise, and logical fallacies in real-time using advanced NLP and machine learning.',
                color: 'text-teal-400',
                bgColor: 'bg-teal-500/10',
                borderColor: 'border-teal-500/20'
              },
              {
                step: '03',
                icon: BarChart3,
                title: 'Get Insights',
                description: 'Receive detailed reports with bias scores, improvement recommendations, team benchmarks, and actionable next steps.',
                color: 'text-purple-400',
                bgColor: 'bg-purple-500/10',
                borderColor: 'border-purple-500/20'
              }
            ].map((item, index) => (
              <div 
                key={index}
                className={`relative p-8 rounded-2xl border ${item.borderColor} ${item.bgColor} hover:scale-[1.02] transition-all group`}
              >
                <div className={`text-6xl font-bold ${item.color} opacity-20 absolute top-4 right-4`}>
                  {item.step}
                </div>
                <item.icon className={`w-12 h-12 ${item.color} mb-6`} />
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
                
                {index < 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Wide Grid */}
      <section id="features" className="py-20 lg:py-32">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-4xl mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Powerful Features</h2>
            <p className="text-xl text-gray-400">Everything you need to improve decision quality across your organization.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Bias Detection',
                description: 'Identifies 15+ cognitive biases including confirmation, anchoring, overconfidence, and availability heuristic.',
                icon: Brain
              },
              {
                title: 'Noise Measurement',
                description: 'Quantifies decision variance across your team with statistical precision using multi-judge analysis.',
                icon: BarChart3
              },
              {
                title: 'Real-time Analysis',
                description: 'Get instant feedback as you upload documents. Results in seconds, not hours or days.',
                icon: Zap
              },
              {
                title: 'Team Benchmarks',
                description: 'Compare decision quality across departments and identify specific training needs.',
                icon: Users
              },
              {
                title: 'Compliance Ready',
                description: 'Built-in checks for regulatory compliance, audit trails, and data governance requirements.',
                icon: Shield
              },
              {
                title: 'ROI Tracking',
                description: 'Measure the financial impact of improved decision making with detailed cost-benefit analysis.',
                icon: TrendingUp
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl bg-[#1a1a20] border border-white/5 hover:border-teal-500/30 transition-all group"
              >
                <feature.icon className="w-10 h-10 text-teal-400 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator - Full Width */}
      <section id="roi" className="py-20 lg:py-32 bg-[#0f0f14]">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Controls */}
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold mb-6">Calculate Your Savings</h2>
                <p className="text-xl text-gray-400 mb-12">
                  Decision noise typically costs organizations 12-15% of their decision value annually. See how much you could save.
                </p>

                <div className="space-y-10">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-lg font-medium text-gray-300">Annual Decisions</label>
                      <span className="text-2xl font-bold text-teal-400">{annualDecisions.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1000" 
                      max="100000" 
                      step="1000" 
                      value={annualDecisions}
                      onChange={(e) => setAnnualDecisions(Number(e.target.value))}
                      className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-3">
                      <span>1,000</span>
                      <span>100,000</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-lg font-medium text-gray-300">Average Decision Value</label>
                      <span className="text-2xl font-bold text-teal-400">{formatCurrency(avgDecisionValue)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="5000" 
                      max="500000" 
                      step="5000" 
                      value={avgDecisionValue}
                      onChange={(e) => setAvgDecisionValue(Number(e.target.value))}
                      className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-3">
                      <span>$5,000</span>
                      <span>$500,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Results */}
              <div className="bg-[#1a1a20] rounded-3xl p-10 border border-white/10">
                <div className="text-center mb-10">
                  <div className="text-sm text-gray-400 mb-3 uppercase tracking-wider">Current Annual Loss to Noise</div>
                  <div className="text-5xl lg:text-6xl font-bold text-red-400 line-through opacity-60">
                    {formatCurrency(potentialLoss)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-2xl p-10 border border-teal-500/30 text-center mb-8">
                  <div className="text-sm text-teal-400 mb-3 uppercase tracking-wider font-semibold">Your Potential Savings</div>
                  <div className="text-6xl lg:text-7xl font-bold text-white mb-4">
                    {formatCurrency(potentialSavings)}
                  </div>
                  <div className="text-gray-400">Based on 60% noise reduction with NeuroAudit</div>
                </div>

                <Link 
                  href="/sign-up"
                  className="block w-full py-5 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl transition-all text-center text-lg"
                >
                  Start Saving Today →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Wide Cards */}
      <section className="py-20 lg:py-32">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-4xl mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Trusted by Industry Leaders</h2>
            <p className="text-xl text-gray-400">See what our clients say about their experience with NeuroAudit.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "NeuroAudit helped us identify $2.3M in decision variance within our underwriting team. The ROI was immediate and measurable.",
                author: "Sarah Chen",
                role: "Chief Risk Officer",
                company: "Financial Services",
                metric: "$2.3M Saved"
              },
              {
                quote: "We've reduced decision inconsistency by 58% in just three months. The bias detection is incredibly accurate and actionable.",
                author: "Michael Rodriguez",
                role: "VP of Strategy",
                company: "Healthcare",
                metric: "58% Reduction"
              },
              {
                quote: "The compliance features alone justify the cost. We now have complete audit trails for every major decision we make.",
                author: "Emily Watson",
                role: "General Counsel",
                company: "Manufacturing",
                metric: "100% Compliant"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-[#1a1a20] rounded-2xl p-8 border border-white/5 flex flex-col">
                <div className="text-teal-400 text-5xl mb-6">"</div>
                <p className="text-gray-300 mb-8 flex-grow leading-relaxed">{testimonial.quote}</p>
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg">{testimonial.author}</div>
                    <div className="px-3 py-1 bg-teal-500/20 text-teal-400 text-sm rounded-full font-semibold">
                      {testimonial.metric}
                    </div>
                  </div>
                  <div className="text-gray-500">{testimonial.role}, {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Full Width */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-teal-500/10 via-blue-500/10 to-purple-500/10">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl lg:text-6xl font-bold mb-8">
              Ready to Eliminate{' '}
              <span className="text-teal-400">Decision Noise?</span>
            </h2>
            <p className="text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
              Join 500+ companies using NeuroAudit to improve decision quality, reduce bias, and save millions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                href="/sign-up"
                className="px-10 py-5 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl transition-all text-xl"
              >
                Start Free 14-Day Trial
              </Link>
              <Link 
                href="/sign-in"
                className="px-10 py-5 border-2 border-white/20 hover:border-white/40 rounded-xl font-semibold transition-all text-xl"
              >
                Sign In to Dashboard
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400" />
                <span>Full feature access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Full Width */}
      <footer className="py-16 bg-[#0a0a0f] border-t border-white/10">
        <div className="w-full px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-8 h-8 text-teal-400" />
                <span className="text-2xl font-bold">NeuroAudit</span>
              </div>
              <p className="text-gray-500">
                AI-powered decision auditing that eliminates costly errors and improves organizational judgment.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-500">
              © 2025 NeuroAudit. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Shield className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Lock className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Award className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
