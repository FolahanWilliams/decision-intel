'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Shield,
  BarChart3,
  FileText,
  AlertTriangle,
  ArrowRight,
  Users,
  Brain,
  Target,
  TrendingUp,
  Skull,
  Gavel,
  Loader2,
  Upload,
  CheckCircle2,
  ClipboardPaste,
  Play,
  ExternalLink,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { DEMO_ANALYSES } from './data';
import { DQIBadge } from '@/components/ui/DQIBadge';
import { trackEvent } from '@/lib/analytics/track';
import { scanForBiases, type ScanResult } from '@/lib/analysis/client-bias-scanner';

const BiasNetwork3D = dynamic(
  () => import('@/components/visualizations/BiasNetwork3DCanvas'),
  { ssr: false },
);
const BiasProfileRadar = dynamic(
  () =>
    import('@/components/visualizations/BiasProfileRadar').then(m => ({
      default: m.BiasProfileRadar,
    })),
  { ssr: false },
);

const FLOW_SECTIONS = [
  { id: 'score', label: 'Score' },
  { id: 'biases', label: 'Biases' },
  { id: 'noise', label: 'Noise' },
  { id: 'boardroom', label: 'Boardroom' },
  { id: 'toxic', label: 'Toxic Combos' },
  { id: 'premortem', label: 'Pre-Mortem' },
];

const sevColor = (severity: string) =>
  severity === 'critical'
    ? '#ef4444'
    : severity === 'high'
      ? '#f97316'
      : severity === 'medium'
        ? '#eab308'
        : '#22c55e';

// Pipeline stages matching the real analysis flow
const PIPELINE_STAGES = [
  { id: 'anonymize', label: 'Anonymizing PII', icon: Shield, durationMs: 800 },
  { id: 'structure', label: 'Structuring Content', icon: FileText, durationMs: 600 },
  { id: 'bias', label: 'Detecting Cognitive Biases', icon: Brain, durationMs: 1200 },
  { id: 'noise', label: 'Measuring Decision Noise', icon: Target, durationMs: 900 },
  { id: 'factcheck', label: 'Verifying Claims', icon: CheckCircle2, durationMs: 1000 },
  { id: 'compliance', label: 'Checking Compliance', icon: Gavel, durationMs: 700 },
  { id: 'simulation', label: 'Running Boardroom Simulation', icon: Users, durationMs: 1100 },
  { id: 'scoring', label: 'Calculating DQI Score', icon: BarChart3, durationMs: 600 },
] as const;

export default function DemoPage() {
  const router = useRouter();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('score');
  const [showAllBiases, setShowAllBiases] = useState(false);

  const analysis = selectedIdx !== null ? DEMO_ANALYSES[selectedIdx] : null;

  // Run the streaming simulation
  const startSimulation = useCallback((idx: number) => {
    trackEvent('demo_sample_selected', { sample: DEMO_ANALYSES[idx].shortName });
    setSelectedIdx(idx);
    setIsSimulating(true);
    trackEvent('demo_simulation_started');
    setShowResults(false);
    setCurrentStage(0);
    setShowAllBiases(false);

    let stage = 0;
    const runNextStage = () => {
      if (stage >= PIPELINE_STAGES.length) {
        trackEvent('demo_simulation_completed', { score: DEMO_ANALYSES[idx].overallScore });
        setIsSimulating(false);
        setShowResults(true);
        // Scroll to results after a brief delay
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
        return;
      }
      setCurrentStage(stage);
      stage++;
      setTimeout(runNextStage, PIPELINE_STAGES[stage - 1].durationMs);
    };
    runNextStage();
  }, []);

  // Handle paste mode submission — runs real client-side bias scanning
  const handlePasteAnalyze = useCallback(() => {
    if (!pasteText.trim() || pasteText.trim().length < 15) return;
    trackEvent('demo_paste_analyzed', { textLength: pasteText.length });
    const result = scanForBiases(pasteText);
    setScanResult(result);
    trackEvent('demo_paste_results', { biasCount: result.biasCount, riskLevel: result.riskLevel });
  }, [pasteText]);

  const scoreColor = analysis
    ? analysis.overallScore >= 70
      ? '#22c55e'
      : analysis.overallScore >= 40
        ? '#eab308'
        : '#ef4444'
    : '#666';
  const noiseColor = analysis
    ? analysis.noiseScore <= 30
      ? '#22c55e'
      : analysis.noiseScore <= 60
        ? '#eab308'
        : '#ef4444'
    : '#666';

  const handleTryNow = useCallback(async () => {
    setLoadingSample(true);
    try {
      const res = await fetch('/api/onboarding/sample', { method: 'POST' });
      const data = await res.json();
      if (data.documentId) {
        router.push(`/documents/${data.documentId}`);
        return;
      }
    } catch {
      // Fall through to login
    }
    router.push('/login');
    setLoadingSample(false);
  }, [router]);

  // IntersectionObserver for section navigation
  useEffect(() => {
    if (!showResults) return;
    const observers: IntersectionObserver[] = [];
    for (const section of FLOW_SECTIONS) {
      const el = document.getElementById(section.id);
      if (!el) continue;
      const observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) setActiveSection(section.id);
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
      observers.push(observer);
    }
    return () => observers.forEach(o => o.disconnect());
  }, [showResults]);

  return (
    <div className="dark" style={{ minHeight: '100vh', background: 'var(--bg-primary, #0A0F1A)', color: 'var(--text-primary, #E2E8F0)' }}>
      {/* Header */}
      <div style={{ background: '#0F172A', borderBottom: '1px solid #1E293B', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
            <Image
              src="/logo.png"
              alt="Decision Intel"
              width={24}
              height={24}
              style={{ borderRadius: 6, objectFit: 'cover' }}
            />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: '#E2E8F0' }}>Decision</span>
              <span style={{ color: '#64748B', marginLeft: 4 }}>Intel</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999, background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A', fontWeight: 700, letterSpacing: '0.5px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
              INTERACTIVE DEMO
            </span>
            <button
              onClick={handleTryNow}
              disabled={loadingSample}
              aria-busy={loadingSample}
              style={{ fontSize: 13, padding: '6px 16px', borderRadius: 8, background: '#16A34A', color: '#FFFFFF', fontWeight: 600, border: 'none', cursor: loadingSample ? 'wait' : 'pointer', opacity: loadingSample ? 0.7 : 1 }}
            >
              {loadingSample ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={14} className="animate-spin" /> Loading...
                </span>
              ) : (
                'Try Your Own Document'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Video Demo Section */}
        {!isSimulating && !showResults && !scanResult && (
          <>
            <DemoVideoSection />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '32px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#1E293B' }} />
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                Or try it yourself
              </span>
              <div style={{ flex: 1, height: 1, background: '#1E293B' }} />
            </div>
          </>
        )}

        {/* Interactive Demo Section */}
        {!isSimulating && !showResults && !scanResult && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#E2E8F0', marginBottom: 12, lineHeight: 1.2 }}>
                Interactive <span style={{ color: '#16A34A' }}>Demo</span>
              </h2>
              <p style={{ color: '#94A3B8', fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                Pick a real-world case study and watch the AI pipeline analyze it in real time. No login required.
              </p>
            </div>

            <div style={{ fontSize: 11, color: '#16A34A', marginBottom: 16, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={13} />
              Choose a document to analyze
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
              {DEMO_ANALYSES.map((a, idx) => {
                const sc = a.overallScore >= 70 ? '#22c55e' : a.overallScore >= 40 ? '#eab308' : '#ef4444';
                return (
                  <button
                    key={a.id}
                    onClick={() => startSimulation(idx)}
                    style={{
                      textAlign: 'left',
                      borderRadius: 16,
                      background: '#0F172A',
                      border: '1px solid #1E293B',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      padding: '24px 20px',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      color: 'inherit',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#16A34A40'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(22,163,74,0.08)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1E293B'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={20} style={{ color: '#16A34A' }} />
                      </div>
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, fontWeight: 700, background: `${sc}15`, color: sc, border: `1px solid ${sc}30` }}>
                        DQI {a.overallScore}/100
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0', marginBottom: 6, lineHeight: 1.3 }}>
                        {a.shortName}
                      </div>
                      <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {a.summary.slice(0, 140)}...
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#16A34A', fontWeight: 600, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #1E293B' }}>
                      <Upload size={13} />
                      <span>Click to analyze</span>
                      <ArrowRight size={13} style={{ marginLeft: 'auto' }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Paste Your Own Text */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setPasteMode(!pasteMode)}
                style={{ fontSize: 12, color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ClipboardPaste size={14} />
                {pasteMode ? 'Hide text input' : 'Or paste your own text for a preview'}
              </button>
            </div>
            {pasteMode && !scanResult && (
              <div style={{ marginTop: 16 }}>
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  style={{ width: '100%', height: 128, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: 16, fontSize: 14, color: '#E2E8F0', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                  placeholder="Paste a decision memo, investment thesis, or strategic rationale..."
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    Real-time bias scan — results generated from your text
                  </span>
                  <button
                    onClick={handlePasteAnalyze}
                    disabled={pasteText.trim().length < 15}
                    style={{ padding: '8px 16px', borderRadius: 8, background: '#16A34A', color: '#FFFFFF', fontSize: 12, fontWeight: 600, border: 'none', cursor: pasteText.trim().length < 15 ? 'not-allowed' : 'pointer', opacity: pasteText.trim().length < 15 ? 0.4 : 1 }}
                  >
                    Scan for Biases <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Scan Results (paste mode) */}
        {scanResult && !isSimulating && !showResults && (
          <QuickScanResults
            result={scanResult}
            onBack={() => {
              setScanResult(null);
              setPasteText('');
            }}
          />
        )}

        {/* Streaming Simulation */}
        {isSimulating && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Loader2 size={32} style={{ color: '#16A34A' }} className="animate-spin" />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', marginTop: 16, marginBottom: 8 }}>Analyzing document...</h2>
              <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>{analysis?.shortName ?? 'Document'}</p>
            </div>

            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              {PIPELINE_STAGES.map((stage, idx) => {
                const StageIcon = stage.icon;
                const isComplete = idx < currentStage;
                const isActive = idx === currentStage;
                const isPending = idx > currentStage;
                return (
                  <div
                    key={stage.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', transition: 'opacity 0.3s', opacity: isPending ? 0.3 : 1 }}
                  >
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s',
                        background: isComplete ? 'rgba(34, 197, 94, 0.15)' : isActive ? 'rgba(22, 163, 74, 0.08)' : 'rgba(255,255,255,0.03)',
                        border: isActive ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      {isComplete ? (
                        <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                      ) : isActive ? (
                        <Loader2 size={16} style={{ color: '#16A34A' }} className="animate-spin" />
                      ) : (
                        <StageIcon size={16} style={{ color: '#475569' }} />
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: isComplete ? '#22c55e' : isActive ? '#E2E8F0' : '#475569' }}>
                      {stage.label}
                      {isActive && <span style={{ color: '#64748B', marginLeft: 6 }} className="animate-pulse">...</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ maxWidth: 480, margin: '24px auto 0' }}>
              <div style={{ height: 3, borderRadius: 2, background: '#1E293B' }}>
                <div
                  style={{ height: '100%', borderRadius: 2, background: '#16A34A', transition: 'width 0.5s', width: `${((currentStage + 1) / PIPELINE_STAGES.length) * 100}%` }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 8, textAlign: 'center' }}>
                Step {currentStage + 1} of {PIPELINE_STAGES.length}
              </div>
            </div>
          </div>
        )}

        {/* Results (shown after simulation or when revisiting) */}
        {showResults && analysis && (
          <div
            ref={resultsRef}
            style={{ paddingTop: 32, paddingBottom: 32, scrollBehavior: 'smooth', color: '#E2E8F0' }}
          >
            {/* Back / Re-select */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <button
                onClick={() => {
                  setShowResults(false);
                  setSelectedIdx(null);
                }}
                style={{ fontSize: 12, color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowRight size={12} style={{ transform: 'rotate(180deg)' }} />
                Try another document
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                {DEMO_ANALYSES.map((a, idx) => (
                  <button
                    key={a.id}
                    onClick={() => startSimulation(idx)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: idx === selectedIdx ? '1px solid #334155' : '1px solid #1E293B',
                      background: idx === selectedIdx ? '#1E293B' : 'transparent',
                      color: idx === selectedIdx ? '#E2E8F0' : '#64748B',
                    }}
                  >
                    {a.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Scrollable Decision Flow ── */}
            <div className="relative">
              {/* Floating section nav (desktop) */}
              <nav className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-2">
                {FLOW_SECTIONS.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    title={s.label}
                    className="group flex items-center gap-2"
                    onClick={e => {
                      e.preventDefault();
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span
                      className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${activeSection === s.id ? '!opacity-100 text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
                    >
                      {s.label}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full transition-all ${activeSection === s.id ? 'bg-green-500 scale-125' : 'bg-[var(--bg-tertiary)] group-hover:bg-[var(--accent-primary)]'}`}
                    />
                  </a>
                ))}
              </nav>

              {/* Section 1: Score Hero */}
              <div id="score" style={{ scrollMarginTop: 80 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
                  <DQIBadge score={analysis.overallScore} size="lg" showGrade animate />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, lineHeight: 1.3, color: '#E2E8F0' }}>
                      {analysis.documentName}
                    </h1>
                    <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
                      Analyzed by Decision Intel &middot;{' '}
                      {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }} className="grid-cols-2 sm:grid-cols-4">
                  <ScoreCard
                    label="DECISION QUALITY"
                    value={`${analysis.overallScore}`}
                    sub="/100"
                    color={scoreColor}
                  />
                  <ScoreCard
                    label="NOISE SCORE"
                    value={`${analysis.noiseScore}`}
                    sub={
                      analysis.noiseScore <= 30
                        ? 'Low noise'
                        : analysis.noiseScore <= 60
                          ? 'Moderate'
                          : 'High inconsistency'
                    }
                    color={noiseColor}
                  />
                  <ScoreCard
                    label="BIASES DETECTED"
                    value={`${analysis.biases.length}`}
                    sub={`${analysis.biases.filter(b => b.severity === 'critical').length} critical`}
                    color="#ef4444"
                  />
                  <ScoreCard
                    label="BOARD VERDICT"
                    value={analysis.simulation.overallVerdict}
                    sub={`${analysis.simulation.twins.filter(t => t.vote === 'REJECT').length} of ${analysis.simulation.twins.length} reject`}
                    color={
                      analysis.simulation.overallVerdict === 'REJECT'
                        ? '#ef4444'
                        : analysis.simulation.overallVerdict === 'APPROVE'
                          ? '#22c55e'
                          : '#eab308'
                    }
                    smallValue
                  />
                </div>
                {/* Executive summary */}
                <Section icon={<BarChart3 size={16} />} title="Executive Summary">
                  <p className="text-[var(--text-secondary)] leading-relaxed m-0 text-sm">
                    {analysis.summary}
                  </p>
                </Section>
              </div>

              {/* Section 2: Biases */}
              <div id="biases" style={{ scrollMarginTop: 80 }}>
                <Section
                  icon={<Brain size={16} />}
                  title={`Cognitive Biases Detected (${analysis.biases.length})`}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(showAllBiases ? analysis.biases : analysis.biases.slice(0, 4)).map(
                      (bias, idx) => (
                        <div
                          key={idx}
                          style={{ background: '#1E293B', borderRadius: 10, padding: '16px 18px', border: '1px solid #334155' }}
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#E2E8F0', textTransform: 'capitalize' }}>
                              {bias.biasType.replace(/_/g, ' ')}
                            </span>
                            <SeverityBadge severity={bias.severity} />
                            <span style={{ fontSize: 11, color: '#64748B', marginLeft: 'auto' }}>
                              {Math.round(bias.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p
                            style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 10px', fontStyle: 'italic', lineHeight: 1.6, paddingLeft: 12, borderLeft: `2px solid ${sevColor(bias.severity)}30` }}
                          >
                            &ldquo;{bias.excerpt}&rdquo;
                          </p>
                          <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 10px', lineHeight: 1.6 }}>
                            {bias.explanation}
                          </p>
                          <p style={{ color: 'rgba(34, 197, 94, 0.8)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                            <strong>Recommendation:</strong> {bias.suggestion}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                  {analysis.biases.length > 4 && !showAllBiases && (
                    <button
                      onClick={() => setShowAllBiases(true)}
                      style={{ marginTop: 12, fontSize: 12, color: '#94A3B8', background: 'transparent', border: '1px solid #334155', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
                    >
                      Show all {analysis.biases.length} biases
                    </button>
                  )}
                </Section>
              </div>

              {/* Section 2b: 3D Bias Visualizations */}
              {analysis.biases.length >= 3 && (
                <div className="scroll-mt-20 mb-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 3D Bias Network */}
                    <div
                      style={{
                        border: '1px solid var(--border-color, #1E293B)',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--border-color, #1E293B)',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: 'var(--accent-primary, #16A34A)',
                        }}
                      >
                        3D Bias Network
                      </div>
                      <div style={{ height: 320 }}>
                        <BiasNetwork3D
                          biases={analysis.biases.map(b => ({
                            biasType: b.biasType,
                            severity: b.severity,
                            excerpt: b.excerpt,
                            explanation: b.explanation,
                          }))}
                        />
                      </div>
                    </div>

                    {/* Bias Intensity Radar */}
                    <div
                      style={{
                        border: '1px solid var(--border-color, #E2E8F0)',
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: 'var(--bg-card, #FFFFFF)',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--border-color, #E2E8F0)',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: '#7C3AED',
                        }}
                      >
                        Bias Intensity Profile
                      </div>
                      <div style={{ height: 320 }}>
                        <BiasProfileRadar
                          biases={analysis.biases.map(b => ({
                            id: b.biasType,
                            biasType: b.biasType,
                            severity: b.severity,
                            excerpt: b.excerpt,
                            explanation: b.explanation,
                            suggestion: b.suggestion,
                            confidence: b.confidence,
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Noise */}
              <div id="noise" style={{ scrollMarginTop: 80 }}>
                <Section icon={<Target size={16} />} title="Decision Noise Analysis">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: analysis.noiseScore <= 30 ? '#22c55e' : analysis.noiseScore <= 60 ? '#eab308' : '#ef4444' }}>
                        {analysis.noiseScore}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>/ 100</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        <StatPill label="Mean" value={analysis.noiseStats.mean.toString()} />
                        <StatPill label="Std Dev" value={analysis.noiseStats.stdDev.toFixed(1)} />
                        <StatPill label="Variance" value={analysis.noiseStats.variance.toFixed(0)} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {analysis.noiseBenchmarks.map((b, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: '#94A3B8', width: 120, flexShrink: 0 }}>{b.label}</span>
                            <div style={{ flex: 1, height: 5, borderRadius: 2, background: '#1E293B' }}>
                              <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(b.value, 100)}%`, transition: 'width 0.3s', background: i === 0 ? (b.value <= 30 ? '#22c55e' : b.value <= 60 ? '#eab308' : '#ef4444') : 'rgba(255,255,255,0.15)' }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', width: 30, textAlign: 'right' }}>{b.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>
              </div>

              {/* Section 4: Boardroom Simulation */}
              <div id="boardroom" style={{ scrollMarginTop: 80 }}>
                <Section icon={<Users size={16} />} title="Boardroom Simulation — Decision Twins">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    {analysis.simulation.twins.map((twin, idx) => {
                      const voteColor = twin.vote === 'REJECT' ? '#ef4444' : twin.vote === 'CONDITIONAL APPROVE' ? '#eab308' : '#22c55e';
                      return (
                        <div key={idx} style={{ background: '#1E293B', borderRadius: 10, padding: 16, border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#E2E8F0' }}>{twin.name}</div>
                              <div style={{ fontSize: 11, color: '#64748B' }}>{twin.role}</div>
                            </div>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 700, background: `${voteColor}15`, color: voteColor }}>{twin.vote}</span>
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ height: 3, borderRadius: 2, background: '#334155' }}>
                              <div style={{ height: '100%', borderRadius: 2, width: `${twin.confidence * 100}%`, background: voteColor }} />
                            </div>
                            <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{Math.round(twin.confidence * 100)}% confidence</div>
                          </div>
                          <p style={{ color: '#94A3B8', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{twin.rationale}</p>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </div>

              {/* Section 5: Toxic Combinations */}
              {analysis.toxicCombinations && analysis.toxicCombinations.length > 0 && (
                <div id="toxic" style={{ scrollMarginTop: 80 }}>
                  <Section
                    icon={<AlertTriangle size={16} style={{ color: '#ef4444' }} />}
                    title="Toxic Combinations — Compound Risk Patterns"
                  >
                    <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                      Individual biases are manageable. When they combine with contextual factors, compound risk can be 8x worse than any single factor.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {analysis.toxicCombinations.map((tc, idx) => (
                        <div key={idx} style={{ background: '#1E293B', borderRadius: 10, padding: '16px 18px', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#E2E8F0' }}>{tc.name}</span>
                            <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', background: tc.riskLevel === 'critical' ? '#ef444415' : '#f9731615', color: tc.riskLevel === 'critical' ? '#ef4444' : '#f97316' }}>{tc.riskLevel}</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                            {tc.biases.map((b, bi) => (
                              <span key={bi} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#334155', color: '#94A3B8', border: '1px solid #475569' }}>{b}</span>
                            ))}
                          </div>
                          <p style={{ color: '#94A3B8', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{tc.description}</p>
                          {tc.historicalExample && (
                            <p style={{ color: 'rgba(239, 68, 68, 0.7)', fontSize: 12, margin: '8px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>{tc.historicalExample}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
              )}

              {/* Section 6: Pre-Mortem */}
              <div id="premortem" style={{ scrollMarginTop: 80 }}>
                <Section icon={<Skull size={16} />} title="Pre-Mortem Analysis">
                  <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                    Imagine it&apos;s 2 years from now and this decision has failed spectacularly. What went wrong?
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analysis.preMortem.scenarios.map((s, idx) => {
                      const impactColor = s.impact === 'catastrophic' ? '#ef4444' : s.impact === 'severe' ? '#f97316' : '#eab308';
                      return (
                        <div key={idx} style={{ background: '#1E293B', borderRadius: 10, padding: '16px 18px', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#E2E8F0' }}>{s.title}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 700, background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>{Math.round(s.probability * 100)}% likely</span>
                              <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', background: `${impactColor}15`, color: impactColor }}>{s.impact}</span>
                            </div>
                          </div>
                          <p style={{ color: '#94A3B8', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{s.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </div>

              {/* Known Outcome Banner */}
              {analysis.outcome && (
                <div style={{ marginTop: 32, padding: '16px 20px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <TrendingUp size={16} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', letterSpacing: '0.5px' }}>KNOWN OUTCOME</span>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: 14, margin: '0 0 6px', lineHeight: 1.6 }}>{analysis.outcome.what}</p>
                  <p style={{ color: '#64748B', fontSize: 12, margin: 0 }}>{analysis.outcome.when} &middot; {analysis.outcome.impact}</p>
                </div>
              )}
            </div>

            {/* CTA */}
            <div style={{ marginTop: 48, textAlign: 'center', padding: '32px 40px', borderRadius: 16, border: '1px solid #1E293B', background: '#0F172A' }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0', marginBottom: 8 }}>
                This was a demo. Now try it on your own documents.
              </h3>
              <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Upload any strategic document &mdash; board memo, M&amp;A rationale, investment thesis, market analysis &mdash; and get a comprehensive cognitive bias audit in minutes.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleTryNow}
                  disabled={loadingSample}
                  aria-busy={loadingSample}
                  style={{ padding: '12px 28px', borderRadius: 10, background: '#16A34A', color: '#FFFFFF', fontWeight: 700, fontSize: 14, border: 'none', cursor: loadingSample ? 'wait' : 'pointer' }}
                >
                  {loadingSample ? 'Loading...' : 'Try with Sample Document'}{' '}
                  <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
                </button>
                <Link
                  href="/login"
                  style={{ padding: '12px 28px', borderRadius: 10, background: 'transparent', border: '1px solid #334155', color: '#E2E8F0', fontWeight: 600, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}
                >
                  Sign Up Free
                </Link>
                {DEMO_BOOKING_URL && (
                  <a
                    href={DEMO_BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '12px 28px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818CF8', fontWeight: 600, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}
                    onClick={() => trackEvent('demo_cta_clicked', { target: 'book_demo' })}
                  >
                    Book a Demo <ExternalLink size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
                  </a>
                )}
              </div>
              <p style={{ color: '#64748B', fontSize: 11, marginTop: 16 }}>
                No credit card required &middot; 3 free analyses &middot; 14-day trial on paid plans
              </p>
            </div>

            <p style={{ color: '#64748B', fontSize: 11, textAlign: 'center', marginTop: 32, lineHeight: 1.6 }}>
              Demo analyses are generated by Decision Intel&apos;s cognitive bias detection engine to demonstrate product capabilities. They are not financial or investment advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Video Demo Section ──────────────────────────────────────────────

const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL;
const DEMO_BOOKING_URL = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL;

function DemoVideoSection() {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#E2E8F0', marginBottom: 12, lineHeight: 1.2 }}>
        See Decision Intel in Action
      </h1>
      <p style={{ color: '#94A3B8', fontSize: 15, maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
        Watch how the 12-node pipeline audits real IC memos for cognitive bias, measures decision noise, and generates actionable intelligence.
      </p>

      {DEMO_VIDEO_URL ? (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #1E293B', background: '#0F172A', marginBottom: 32 }}>
          <iframe
            src={DEMO_VIDEO_URL}
            allowFullScreen
            style={{ width: '100%', border: 'none', aspectRatio: '16/9', display: 'block' }}
            title="Decision Intel Demo"
          />
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid #1E293B', background: '#0F172A', padding: '48px 32px', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={28} style={{ color: '#16A34A', marginLeft: 3 }} />
          </div>
          <p style={{ color: '#94A3B8', fontSize: 14, maxWidth: 400, margin: 0 }}>
            Try the interactive demo below — pick a sample document and watch the 12-node bias detection pipeline in real time.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/login"
          style={{ padding: '12px 28px', borderRadius: 10, background: '#16A34A', color: '#FFFFFF', fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}
          onClick={() => trackEvent('demo_video_cta_clicked', { target: 'start_trial' })}
        >
          Start Free Trial <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
        </Link>
        {DEMO_BOOKING_URL ? (
          <a
            href={DEMO_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '12px 28px', borderRadius: 10, background: 'transparent', border: '1px solid #334155', color: '#E2E8F0', fontWeight: 600, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}
            onClick={() => trackEvent('demo_video_cta_clicked', { target: 'book_call' })}
          >
            Book a Call <ExternalLink size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
          </a>
        ) : (
          <Link
            href="/#pricing"
            style={{ padding: '12px 28px', borderRadius: 10, background: 'transparent', border: '1px solid #334155', color: '#E2E8F0', fontWeight: 600, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}
          >
            View Pricing
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Shared UI Components ────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#0F172A',
        border: '1px solid #1E293B',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 24,
      }}
    >
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#E2E8F0',
        }}
      >
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function ScoreCard({
  label,
  value,
  sub,
  color,
  smallValue,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  smallValue?: boolean;
}) {
  return (
    <div
      style={{
        background: '#0F172A',
        border: '1px solid #1E293B',
        borderRadius: 12,
        padding: '12px 14px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 6, letterSpacing: '0.5px' }}>{label}</div>
      <div
        style={{
          fontSize: smallValue ? 20 : 32,
          fontWeight: 800,
          lineHeight: 1,
          color,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        padding: '2px 10px',
        borderRadius: 20,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: `${sevColor(severity)}15`,
        color: sevColor(severity),
      }}
    >
      {severity}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '4px 10px', borderRadius: 6, background: '#1E293B', border: '1px solid #334155' }}>
      <span style={{ fontSize: 10, color: '#64748B' }}>{label} </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{value}</span>
    </div>
  );
}

// ─── Quick Scan Results (Paste Mode) ──────────────────────────────────

const riskColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  clear: '#22c55e',
};

function QuickScanResults({ result, onBack }: { result: ScanResult; onBack: () => void }) {
  const router = useRouter();
  const [loadingSample, setLoadingSample] = useState(false);

  const handleTryNow = async () => {
    setLoadingSample(true);
    try {
      const res = await fetch('/api/onboarding/sample', { method: 'POST' });
      const data = await res.json();
      if (data.documentId) {
        router.push(`/documents/${data.documentId}`);
        return;
      }
    } catch {
      // Fall through to login
    }
    router.push('/login');
    setLoadingSample(false);
  };

  return (
    <div style={{ marginBottom: 40 }}>
      <button
        onClick={onBack}
        style={{ fontSize: 12, color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}
      >
        <ArrowRight size={12} style={{ transform: 'rotate(180deg)' }} />
        Scan different text
      </button>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 16,
            background: `${riskColors[result.riskLevel]}15`,
            color: riskColors[result.riskLevel],
          }}
        >
          <Brain size={16} />
          {result.biasCount === 0
            ? 'No Biases Detected'
            : `${result.biasCount} Bias${result.biasCount > 1 ? 'es' : ''} Detected`}
        </div>
        <p style={{ color: '#94A3B8', fontSize: 14, maxWidth: 600, margin: '0 auto' }}>{result.summary}</p>
      </div>

      {/* Score Cards */}
      {result.biasCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-7">
          <div className="bg-white border border-slate-200 rounded-xl py-3 px-3 text-center">
            <div className="text-[10px] text-slate-500 mb-1.5 tracking-wide">BIASES FOUND</div>
            <div
              className="text-2xl font-extrabold"
              style={{ color: riskColors[result.riskLevel] }}
            >
              {result.biasCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">of 14 checked</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl py-3 px-3 text-center">
            <div className="text-[10px] text-slate-500 mb-1.5 tracking-wide">RISK LEVEL</div>
            <div
              className="text-lg font-extrabold uppercase"
              style={{ color: riskColors[result.riskLevel] }}
            >
              {result.riskLevel}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {result.biases.filter(b => b.severity === 'critical' || b.severity === 'high').length}{' '}
              high/critical
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl py-3 px-3 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-500 mb-1.5 tracking-wide">SCAN TYPE</div>
            <div className="text-lg font-extrabold text-slate-300">Quick</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {result.isPreDecision ? 'Pre-decision detected' : '14-bias pattern scan'}
            </div>
          </div>
        </div>
      )}

      {/* Detected Biases */}
      {result.biases.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 mb-4">
          <h3 className="text-[15px] font-bold mb-4 flex items-center gap-2 text-slate-900">
            <Brain size={16} /> Detected Biases
          </h3>
          <div className="flex flex-col gap-3">
            {result.biases.map((bias, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-[10px] p-4 sm:p-[18px] border border-slate-200"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="font-bold text-sm text-slate-900">{bias.label}</span>
                  <SeverityBadge severity={bias.severity} />
                </div>
                <p
                  className="text-slate-400 text-[13px] m-0 mb-2.5 italic leading-relaxed pl-3"
                  style={{ borderLeft: `2px solid ${sevColor(bias.severity)}30` }}
                >
                  &ldquo;...{bias.signal}...&rdquo;
                </p>
                <p className="text-slate-300 text-[13px] m-0 mb-2.5 leading-relaxed">
                  {bias.explanation}
                </p>
                <p className="text-green-500/80 text-[13px] m-0 leading-relaxed">
                  <strong>Recommendation:</strong> {bias.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No biases state */}
      {result.biases.length === 0 && (
        <div className="bg-white border border-green-500/20 rounded-xl p-6 sm:p-8 mb-4 text-center">
          <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Looking Good</h3>
          <p className="text-slate-400 text-sm max-w-[500px] mx-auto">
            No common cognitive biases detected in this text. The full analysis also checks for
            logical fallacies, decision noise, regulatory compliance, fact verification, and runs a
            boardroom simulation with AI decision twins.
          </p>
        </div>
      )}

      {/* Upsell CTA */}
      <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 text-center">
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          This quick scan checks 14 common biases.
        </h3>
        <p className="text-slate-500 text-sm mb-2 max-w-[550px] mx-auto">
          The full Decision Intel analysis goes much deeper:
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[
            '30+ cognitive biases',
            'Decision noise scoring',
            'Logical fallacy detection',
            'Regulatory compliance',
            'Fact verification',
            'SWOT analysis',
            'Pre-mortem scenarios',
            'Boardroom simulation',
            'Institutional memory',
          ].map(feature => (
            <span
              key={feature}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 border border-slate-200"
            >
              {feature}
            </span>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleTryNow}
            disabled={loadingSample}
            className="px-7 py-3 rounded-[10px] bg-white text-black font-bold text-sm border-none cursor-pointer disabled:cursor-wait"
          >
            {loadingSample ? 'Loading...' : 'Try Full Analysis'}{' '}
            <ArrowRight size={14} className="inline align-middle ml-1" />
          </button>
          <Link
            href="/login"
            className="px-7 py-3 rounded-[10px] bg-transparent border border-slate-200 text-slate-900 font-semibold text-sm no-underline text-center"
          >
            Sign Up Free
          </Link>
        </div>
        <p className="text-slate-600 text-[11px] mt-4">
          No credit card required &middot; 3 free analyses &middot; 14-day trial on paid plans
        </p>
      </div>
    </div>
  );
}
