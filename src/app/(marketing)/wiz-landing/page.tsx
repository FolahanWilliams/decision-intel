'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import ROICalculator from '@/components/ROICalculator';
import {
  Brain,
  Shield,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Eye,
  GitBranch,
  ChevronRight,
  Bot,
  Calculator,
  Clock,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

// Animated counter for metrics
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v));
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
      {prefix}<motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

// Security KPI Card
interface KPICardProps {
  icon: React.ElementType;
  metric: string;
  value: string | React.ReactNode;
  improvement: string;
  description: string;
}

function KPICard({ icon: Icon, metric, value, improvement, description }: KPICardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-6 rounded-xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/50 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        <Badge className="bg-green-500/20 text-green-400 text-xs">
          {improvement}
        </Badge>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        <p className="text-sm font-medium text-gray-300">{metric}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </motion.div>
  );
}

// Badge component
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      className
    )}>
      {children}
    </span>
  );
}

// Bias detection visualization
function BiasVisualization() {
  const biases = [
    { name: 'Anchoring', detected: 234, severity: 'high', reduction: 65 },
    { name: 'Automation', detected: 189, severity: 'critical', reduction: 78 },
    { name: 'Groupthink', detected: 156, severity: 'medium', reduction: 52 },
    { name: 'Loss Aversion', detected: 298, severity: 'high', reduction: 71 },
    { name: 'Confirmation', detected: 112, severity: 'medium', reduction: 45 }
  ];

  return (
    <div className="grid gap-3">
      {biases.map((bias, index) => (
        <motion.div
          key={bias.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-gray-800"
        >
          <div className="flex items-center gap-4">
            <Brain className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="font-medium text-white">{bias.name} Bias</p>
              <p className="text-xs text-gray-400">{bias.detected} instances detected</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`
              ${bias.severity === 'critical' ? 'bg-red-500/20 text-red-400' : ''}
              ${bias.severity === 'high' ? 'bg-orange-500/20 text-orange-400' : ''}
              ${bias.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : ''}
            `}>
              {bias.severity}
            </Badge>
            <span className="text-sm font-medium text-green-400">
              -{bias.reduction}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function WizLandingPage() {
  const [showROI, setShowROI] = useState(false);

  // Section refs for scroll animations
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const integrationRef = useRef(null);
  const featuresRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true });
  const statsInView = useInView(statsRef, { once: true });
  const integrationInView = useInView(integrationRef, { once: true });
  const featuresInView = useInView(featuresRef, { once: true });

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-white/5 to-transparent rounded-full" />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-24">
          <div className="max-w-6xl mx-auto">
            {/* Partnership Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-8"
            >
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-semibold">Wiz Integration Partner</span>
              <Badge className="bg-green-500/20 text-green-400">LIVE</Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              The Cognitive Governance Layer
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                for Cloud Security at AI Speed
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 mb-8 max-w-3xl"
            >
              Decision Intel audits both <span className="text-white font-semibold">human and AI decisions</span> in
              real-time, reducing MTTR by 40% and eliminating 72% of false positives through
              behavioral science and causal AI.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <button
                onClick={() => setShowROI(true)}
                className="px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center gap-2"
              >
                <Calculator className="w-5 h-5" />
                Calculate Your ROI
              </button>
              <Link
                href="/login"
                className="px-8 py-4 rounded-lg bg-gray-800 border border-gray-700 font-semibold hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
              >
                Request Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-6 items-center text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>SOC 2 Type II Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>EU AI Act Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>DORA Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>WIN Certified</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-24 border-t border-gray-900">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Enterprise-Grade Impact</h2>
            <p className="text-gray-400 text-lg">Proven results with Fortune 100 security teams</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              icon={Clock}
              metric="MTTR Reduction"
              value={<AnimatedCounter target={37} suffix="%" />}
              improvement="-37%"
              description="From 72 to 45 minutes average"
            />
            <KPICard
              icon={AlertTriangle}
              metric="False Positives"
              value={<AnimatedCounter target={72} suffix="%" prefix="-" />}
              improvement="-72%"
              description="From 15% to 4.2% rate"
            />
            <KPICard
              icon={Brain}
              metric="Biases Prevented"
              value={<AnimatedCounter target={65} suffix="%" />}
              improvement="+65%"
              description="Cognitive bias reduction"
            />
            <KPICard
              icon={DollarSign}
              metric="Annual Savings"
              value="$1.4M"
              improvement="+280%"
              description="Average Fortune 100 ROI"
            />
          </div>
        </div>
      </section>

      {/* Wiz Integration Section */}
      <section ref={integrationRef} className="py-24 bg-gradient-to-b from-gray-900/50 to-black">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={integrationInView ? { opacity: 1, y: 0 } : {}}
              className="text-center mb-16"
            >
              <Badge className="bg-purple-500/20 text-purple-400 mb-4">
                Wiz Integration
              </Badge>
              <h2 className="text-4xl font-bold mb-4">
                Seamlessly Integrates with Your Wiz Deployment
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Decision Intel enhances Wiz with cognitive governance, providing real-time bias detection
                and causal analysis for every security decision.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Integration Diagram */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={integrationInView ? { opacity: 1, x: 0 } : {}}
                className="relative"
              >
                <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                  <div className="space-y-6">
                    {/* Wiz Platform */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">Wiz Platform</h4>
                        <p className="text-sm text-gray-400">Security Graph & Issues</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </div>

                    {/* GraphQL Connection */}
                    <div className="flex items-center gap-4 pl-14">
                      <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-blue-500/50" />
                      <span className="text-xs text-gray-500 px-2">GraphQL API</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-green-500/50" />
                    </div>

                    {/* Decision Intel */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">Decision Intel</h4>
                        <p className="text-sm text-gray-400">Cognitive Analysis</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </div>

                    {/* MCP Server */}
                    <div className="flex items-center gap-4 pl-14">
                      <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-green-500/50" />
                      <span className="text-xs text-gray-500 px-2">MCP Protocol</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-yellow-500/50" />
                    </div>

                    {/* AI Agents */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">AI Agents</h4>
                        <p className="text-sm text-gray-400">Real-time Queries</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Features List */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={integrationInView ? { opacity: 1, x: 0 } : {}}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold mb-6">Integration Features</h3>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Real-time Issue Analysis</h4>
                      <p className="text-sm text-gray-400">
                        Every Wiz issue enhanced with bias detection and causal reasoning
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Toxic Combination Analysis</h4>
                      <p className="text-sm text-gray-400">
                        Deep integration with Wiz Security Graph for attack path validation
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Intelligent Nudges</h4>
                      <p className="text-sm text-gray-400">
                        Context-aware interventions via Slack when bias is detected
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Compliance Automation</h4>
                      <p className="text-sm text-gray-400">
                        Automated EU AI Act and DORA compliance reporting
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Multi-Cloud Neutrality</h4>
                      <p className="text-sm text-gray-400">
                        Unbiased validation across AWS, Azure, and GCP environments
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 15-Bias Taxonomy Section */}
      <section ref={featuresRef} className="py-24 border-t border-gray-900">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <Badge className="bg-yellow-500/20 text-yellow-400 mb-4">
              Behavioral Science
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              15-Bias Security Taxonomy
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              The only platform that detects and mitigates all 15 security-specific cognitive biases
              based on Kahneman&apos;s research.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            <BiasVisualization />

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-yellow-400" />
                  How It Works
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <span>Real-time analysis of decision patterns in your SOC</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <span>Detection of cognitive biases using behavioral markers</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <span>Intelligent nudges delivered at the point of decision</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                    <span>Causal analysis to understand impact and alternatives</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                    <span>Continuous learning and calibration to your team</span>
                  </li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                  <div className="text-2xl font-bold text-green-400 mb-1">92%</div>
                  <p className="text-xs text-gray-400">Decision accuracy improvement</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                  <div className="text-2xl font-bold text-blue-400 mb-1">15 min</div>
                  <p className="text-xs text-gray-400">Avg time saved per incident</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                  <div className="text-2xl font-bold text-purple-400 mb-1">247</div>
                  <p className="text-xs text-gray-400">Biases prevented daily</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                  <div className="text-2xl font-bold text-orange-400 mb-1">3.2x</div>
                  <p className="text-xs text-gray-400">Faster root cause analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Causal AI Section */}
      <section className="py-24 bg-gradient-to-b from-black to-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-blue-500/20 text-blue-400 mb-4">
                True Causal AI
              </Badge>
              <h2 className="text-4xl font-bold mb-4">
                Beyond Correlation to Causation
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Pearl&apos;s causal hierarchy implementation for counterfactual reasoning in security operations
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Level 1: Association</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Observational analysis: P(Y|X)
                </p>
                <p className="text-xs text-gray-500">
                  &ldquo;Critical vulnerabilities are associated with breaches&rdquo;
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <GitBranch className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Level 2: Intervention</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Do-calculus: P(Y|do(X))
                </p>
                <p className="text-xs text-gray-500">
                  &ldquo;If we patch now, breach risk drops 65%&rdquo;
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-pink-500/10 to-orange-500/10 border border-pink-500/20">
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
                  <Cpu className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Level 3: Counterfactuals</h3>
                <p className="text-sm text-gray-400 mb-4">
                  What-if scenarios: P(Y_x|X&apos;,Y&apos;)
                </p>
                <p className="text-xs text-gray-500">
                  &ldquo;Had we patched yesterday, the breach wouldn&apos;t have occurred&rdquo;
                </p>
              </div>
            </div>

            <div className="mt-12 p-8 rounded-2xl bg-gray-900/50 border border-gray-800">
              <h3 className="text-2xl font-bold mb-6 text-center">
                Real-World Security Scenario Analysis
              </h3>
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-4 text-blue-400">Patch Decision Analysis</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 rounded bg-gray-800/50">
                      <span>Patch Now</span>
                      <div className="text-right">
                        <div className="text-green-400">3% breach risk</div>
                        <div className="text-orange-400 text-xs">2h downtime</div>
                      </div>
                    </div>
                    <div className="flex justify-between p-3 rounded bg-gray-800/50">
                      <span>Patch Later</span>
                      <div className="text-right">
                        <div className="text-yellow-400">12% breach risk</div>
                        <div className="text-green-400 text-xs">1h downtime</div>
                      </div>
                    </div>
                    <div className="flex justify-between p-3 rounded bg-gray-800/50">
                      <span>No Action</span>
                      <div className="text-right">
                        <div className="text-red-400">28% breach risk</div>
                        <div className="text-green-400 text-xs">0h downtime</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4 text-purple-400">Causal Factors Identified</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span>Network exposure: High (Internet-facing)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                      <span>Data sensitivity: Critical (PII/Financial)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <span>Attacker sophistication: Medium</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span>Exploit availability: Public (CVE-2024-XXX)</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30">
                    <div className="text-xs font-semibold text-green-400 mb-1">AI RECOMMENDATION</div>
                    <p className="text-xs">Patch during next maintenance window with staged rollout to minimize both breach risk and operational impact.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Modal */}
      {showROI && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="relative max-w-6xl w-full max-h-[90vh] overflow-auto">
            <button
              onClick={() => setShowROI(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 z-10"
            >
              ✕
            </button>
            <ROICalculator />
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-t border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Security Operations?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join Fortune 100 companies already using Decision Intel to achieve 40% MTTR reduction
            and 280% ROI within 6 months.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowROI(true)}
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              Calculate ROI
            </button>
            <Link
              href="/login"
              className="px-8 py-4 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-all duration-300"
            >
              Start 30-Day Pilot
            </Link>
            <Link
              href="/security-operations"
              className="px-8 py-4 rounded-lg bg-gray-800 border border-gray-700 font-semibold hover:bg-gray-700 transition-all duration-300"
            >
              View Live Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}