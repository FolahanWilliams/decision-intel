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
import { Reveal } from '@/components/ui/Reveal';
import { trackEvent } from '@/lib/analytics/track';
import { scanForBiases, type ScanResult } from '@/lib/analysis/client-bias-scanner';

/* ─── Color tokens (mirror landing page so the demo feels like the same product) ── */
const C = {
  navy: '#0F172A',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenSoft: '#F0FDF4',
  greenDark: '#15803D',
  warning: '#EAB308',
  danger: '#EF4444',
  orange: '#F97316',
} as const;

/* Shared card recipe: matches the landing page card style. */
const cardStyle: React.CSSProperties = {
  background: C.white,
  border: `1px solid ${C.slate200}`,
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
};

/* Section band: full-width strip with optional alternating bg. */
function SectionBand({
  bg = C.white,
  borderTop = false,
  children,
  paddingY = 64,
  maxWidth = 1200,
}: {
  bg?: string;
  borderTop?: boolean;
  children: React.ReactNode;
  paddingY?: number;
  maxWidth?: number;
}) {
  return (
    <section
      style={{
        background: bg,
        borderTop: borderTop ? `1px solid ${C.slate200}` : undefined,
      }}
    >
      <div
        style={{
          maxWidth,
          margin: '0 auto',
          padding: `${paddingY}px 24px`,
        }}
      >
        {children}
      </div>
    </section>
  );
}

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

  const idleState = !isSimulating && !showResults && !scanResult;

  return (
    <div style={{ minHeight: '100vh', background: C.white, color: C.slate900 }}>
      {/* ─── Header (sticky) ──────────────────────────────────────────── */}
      <header
        style={{
          background: C.white,
          borderBottom: `1px solid ${C.slate200}`,
          padding: '12px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" className="flex items-center gap-2 no-underline text-inherit">
            <Image
              src="/logo.png"
              alt="Decision Intel"
              width={24}
              height={24}
              style={{ borderRadius: 6, objectFit: 'cover' }}
            />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: C.slate900 }}>Decision</span>
              <span style={{ color: C.slate400, marginLeft: 4 }}>Intel</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 999,
                background: C.greenSoft,
                color: C.green,
                fontWeight: 600,
                letterSpacing: '0.04em',
                border: `1px solid ${C.greenLight}`,
              }}
              className="hidden sm:inline"
            >
              INTERACTIVE DEMO
            </span>
            <button
              onClick={handleTryNow}
              disabled={loadingSample}
              aria-busy={loadingSample}
              style={{
                fontSize: 13,
                padding: '7px 14px',
                borderRadius: 8,
                background: C.green,
                color: C.white,
                fontWeight: 600,
                border: 'none',
                cursor: loadingSample ? 'wait' : 'pointer',
                opacity: loadingSample ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (!loadingSample) e.currentTarget.style.background = C.greenDark;
              }}
              onMouseLeave={e => {
                if (!loadingSample) e.currentTarget.style.background = C.green;
              }}
            >
              {loadingSample ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={14} className="animate-spin" /> Loading...
                </span>
              ) : (
                'Try Your Own Document'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Idle: Video hero on white band ──────────────────────────── */}
      {idleState && (
        <SectionBand bg={C.white} paddingY={56}>
          <DemoVideoSection />
        </SectionBand>
      )}

      {/* ─── Idle: Interactive picker on slate50 band ────────────────── */}
      {idleState && (
        <SectionBand bg={C.slate50} borderTop paddingY={72}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div
                style={{
                  fontSize: 11,
                  color: C.green,
                  marginBottom: 12,
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                }}
              >
                INTERACTIVE DEMO
              </div>
              <h2
                style={{
                  fontSize: 'clamp(28px, 5vw, 38px)',
                  fontWeight: 800,
                  color: C.slate900,
                  margin: '0 0 14px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                }}
              >
                Pick a famous corporate decision.
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: C.slate500,
                  maxWidth: 600,
                  margin: '0 auto',
                  lineHeight: 1.6,
                }}
              >
                Watch Decision Intel score the cognitive biases, predict the questions a steering
                committee would raise, and map the decision into your Knowledge Graph — in 60 seconds.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
                marginBottom: 32,
              }}
            >
              {DEMO_ANALYSES.map((a, idx) => {
                const scoreColor =
                  a.overallScore >= 70 ? '#22c55e' : a.overallScore >= 40 ? '#eab308' : '#ef4444';
                return (
                  <button
                    key={a.id}
                    onClick={() => startSimulation(idx)}
                    className="text-left rounded-2xl bg-white border border-slate-200 cursor-pointer transition-all duration-200 hover:border-green-200 hover:shadow-lg group"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      padding: '28px 24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* Icon + DQI badge row */}
                    <div className="flex items-start justify-between">
                      <div
                        className="shrink-0"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: '#F0FDF4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText size={20} style={{ color: '#16A34A' }} />
                      </div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-lg font-bold"
                        style={{
                          background: `${scoreColor}12`,
                          color: scoreColor,
                          border: `1px solid ${scoreColor}30`,
                        }}
                      >
                        DQI {a.overallScore}/100
                      </span>
                    </div>

                    {/* Title + description */}
                    <div>
                      <div className="text-base font-bold text-slate-900 mb-1.5 leading-tight">
                        {a.shortName}
                      </div>
                      <div className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                        {a.summary.slice(0, 140)}...
                      </div>
                    </div>

                    {/* CTA footer */}
                    <div className="flex items-center gap-2 text-xs text-green-600 font-semibold group-hover:text-green-700 transition-colors mt-auto pt-2 border-t border-slate-100">
                      <Upload size={13} />
                      <span>Click to analyze</span>
                      <ArrowRight
                        size={13}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Paste Your Own Text */}
            <div className="text-center">
              <button
                onClick={() => setPasteMode(!pasteMode)}
                className="text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1.5 mx-auto"
              >
                <ClipboardPaste size={14} />
                {pasteMode ? 'Hide text input' : 'Or paste your own text for a preview'}
              </button>
            </div>
            {pasteMode && !scanResult && (
              <div className="mt-4">
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 resize-none focus:outline-none focus:border-green-300 placeholder:text-slate-400"
                  placeholder="Paste a strategic memo, board deck excerpt, or market-entry recommendation..."
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[11px] text-slate-500">
                    Real-time bias scan — results generated from your text
                  </span>
                  <button
                    onClick={handlePasteAnalyze}
                    disabled={pasteText.trim().length < 15}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                  >
                    Scan for Biases <ArrowRight size={12} className="inline ml-1" />
                  </button>
                </div>
              </div>
            )}
          </Reveal>
        </SectionBand>
      )}

      {/* Quick Scan Results (paste mode) */}
      {scanResult && !isSimulating && !showResults && (
        <SectionBand bg={C.slate50} borderTop paddingY={56}>
          <QuickScanResults
            result={scanResult}
            onBack={() => {
              setScanResult(null);
              setPasteText('');
            }}
          />
        </SectionBand>
      )}

      {/* Streaming Simulation */}
      {isSimulating && (
        <SectionBand bg={C.slate50} paddingY={88} maxWidth={720}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: C.white,
                border: `1px solid ${C.slate200}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
              }}
            >
              <Loader2 size={26} style={{ color: C.green }} className="animate-spin" />
            </div>
            <h2
              style={{
                fontSize: 'clamp(22px, 3.5vw, 28px)',
                fontWeight: 700,
                color: C.slate900,
                margin: '0 0 8px',
                letterSpacing: '-0.01em',
              }}
            >
              Analyzing your document
            </h2>
            <p style={{ fontSize: 14, color: C.slate500, margin: 0 }}>
              {analysis?.shortName ?? 'Document'}
            </p>
          </div>

          <div style={{ ...cardStyle, padding: '24px 28px' }}>
            {PIPELINE_STAGES.map((stage, idx) => {
              const StageIcon = stage.icon;
              const isComplete = idx < currentStage;
              const isActive = idx === currentStage;
              const isPending = idx > currentStage;

              return (
                <div
                  key={stage.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '10px 0',
                    opacity: isPending ? 0.35 : 1,
                    transition: 'opacity 0.3s',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: isComplete
                        ? C.greenSoft
                        : isActive
                          ? C.slate50
                          : C.white,
                      border: `1px solid ${isComplete ? C.greenLight : isActive ? C.slate200 : C.slate100}`,
                      transition: 'all 0.3s',
                    }}
                  >
                    {isComplete ? (
                      <CheckCircle2 size={16} style={{ color: C.green }} />
                    ) : isActive ? (
                      <Loader2 size={16} style={{ color: C.green }} className="animate-spin" />
                    ) : (
                      <StageIcon size={16} style={{ color: C.slate500 }} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      color: isComplete ? C.green : isActive ? C.slate900 : C.slate500,
                    }}
                  >
                    {stage.label}
                    {isActive && (
                      <span style={{ color: C.slate400, marginLeft: 6 }} className="animate-pulse">
                        …
                      </span>
                    )}
                  </span>
                </div>
              );
            })}

            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: C.slate100,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 2,
                    background: C.green,
                    width: `${((currentStage + 1) / PIPELINE_STAGES.length) * 100}%`,
                    transition: 'width 0.5s',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: C.slate500, marginTop: 8, textAlign: 'center' }}>
                Step {currentStage + 1} of {PIPELINE_STAGES.length}
              </div>
            </div>
          </div>
        </SectionBand>
      )}

      {/* Results (shown after simulation or when revisiting) */}
      {showResults && analysis && (
        <SectionBand bg={C.slate50} borderTop paddingY={56}>
          <div ref={resultsRef} style={{ scrollBehavior: 'smooth', color: C.slate900 }}>
            {/* Back / Re-select */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 28,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <button
                onClick={() => {
                  setShowResults(false);
                  setSelectedIdx(null);
                }}
                style={{
                  fontSize: 12,
                  color: C.slate500,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = C.slate900)}
                onMouseLeave={e => (e.currentTarget.style.color = C.slate500)}
              >
                <ArrowRight size={12} style={{ transform: 'rotate(180deg)' }} />
                Try another document
              </button>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DEMO_ANALYSES.map((a, idx) => {
                  const isActive = idx === selectedIdx;
                  return (
                    <button
                      key={a.id}
                      onClick={() => startSimulation(idx)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: `1px solid ${isActive ? C.slate400 : C.slate200}`,
                        background: isActive ? C.white : 'transparent',
                        color: isActive ? C.slate900 : C.slate500,
                        transition: 'all 0.15s',
                      }}
                    >
                      {a.shortName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Scrollable Decision Flow ── */}
            <div style={{ position: 'relative' }}>
              {/* Floating section nav (desktop) */}
              <nav
                className="hidden lg:flex"
                style={{
                  position: 'fixed',
                  right: 24,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 40,
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {FLOW_SECTIONS.map(s => {
                  const isActive = activeSection === s.id;
                  return (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      title={s.label}
                      onClick={e => {
                        e.preventDefault();
                        document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        textDecoration: 'none',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          opacity: isActive ? 1 : 0,
                          color: isActive ? C.slate900 : C.slate400,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: isActive ? C.green : C.slate200,
                          transform: isActive ? 'scale(1.25)' : 'scale(1)',
                          transition: 'all 0.2s',
                        }}
                      />
                    </a>
                  );
                })}
              </nav>

              {/* Section 1: Score Hero */}
              <div id="score" style={{ scrollMarginTop: 80 }}>
                <div
                  style={{
                    ...cardStyle,
                    padding: '32px 32px',
                    marginBottom: 24,
                    background: C.white,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 28,
                      flexWrap: 'wrap',
                      marginBottom: 28,
                    }}
                  >
                    <DQIBadge score={analysis.overallScore} size="lg" showGrade animate />
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.green,
                          letterSpacing: '0.1em',
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        DECISION INTEL AUDIT
                      </div>
                      <h1
                        style={{
                          fontSize: 'clamp(20px, 3vw, 26px)',
                          fontWeight: 700,
                          margin: '0 0 8px',
                          lineHeight: 1.25,
                          color: C.slate900,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {analysis.documentName}
                      </h1>
                      <p style={{ fontSize: 13, color: C.slate500, margin: 0 }}>
                        {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        · {analysis.biases.length} biases · {analysis.simulation.twins.length}{' '}
                        boardroom personas
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 12,
                    }}
                  >
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
                </div>
                {/* Executive summary */}
                <Section icon={<BarChart3 size={16} />} title="Executive Summary">
                  <p style={{ color: C.slate600, lineHeight: 1.65, margin: 0, fontSize: 14 }}>
                    {analysis.summary}
                  </p>
                </Section>
              </div>

              {/* Section 2: Biases */}
              <div id="biases" className="scroll-mt-20">
                <Section
                  icon={<Brain size={16} />}
                  title={`Cognitive Biases Detected (${analysis.biases.length})`}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(showAllBiases ? analysis.biases : analysis.biases.slice(0, 4)).map(
                      (bias, idx) => (
                        <div
                          key={idx}
                          style={{ background: '#F8FAFC', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0' }}
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', textTransform: 'capitalize' }}>
                              {bias.biasType.replace(/_/g, ' ')}
                            </span>
                            <SeverityBadge severity={bias.severity} />
                            <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>
                              {Math.round(bias.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p
                            style={{ color: '#475569', fontSize: 13, margin: '0 0 10px', fontStyle: 'italic', lineHeight: 1.6, paddingLeft: 12, borderLeft: `2px solid ${sevColor(bias.severity)}40` }}
                          >
                            &ldquo;{bias.excerpt}&rdquo;
                          </p>
                          <p style={{ color: '#475569', fontSize: 13, margin: '0 0 10px', lineHeight: 1.6 }}>
                            {bias.explanation}
                          </p>
                          <p style={{ color: '#15803D', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                            <strong>Recommendation:</strong> {bias.suggestion}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                  {analysis.biases.length > 4 && !showAllBiases && (
                    <button
                      onClick={() => setShowAllBiases(true)}
                      style={{ marginTop: 12, fontSize: 12, color: '#475569', background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
                    >
                      Show all {analysis.biases.length} biases
                    </button>
                  )}
                </Section>
              </div>

              {/* Section 2b: Bias Visualizations */}
              {analysis.biases.length >= 3 && (
                <div style={{ marginBottom: 24, scrollMarginTop: 80 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                    {/* 3D Bias Network */}
                    <div
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#16A34A', marginBottom: 2 }}>
                          3D Bias Network
                        </div>
                        <div style={{ fontSize: 13, color: '#64748B' }}>
                          Interactive bias relationship map
                        </div>
                      </div>
                      <div style={{ height: 300, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0 }}>
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
                      <div style={{ padding: '8px 16px', borderTop: '1px solid #E2E8F0', background: '#FFFFFF', fontSize: 11, color: '#94A3B8' }}>
                        Drag to rotate · Scroll to zoom · Click to explore
                      </div>
                    </div>

                    {/* Bias Intensity Radar */}
                    <div
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 16,
                        overflow: 'hidden',
                        background: '#FFFFFF',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #E2E8F0',
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7C3AED', marginBottom: 2 }}>
                          Bias Intensity Profile
                        </div>
                        <div style={{ fontSize: 13, color: '#64748B' }}>
                          Severity × confidence across {analysis.biases.length} biases
                        </div>
                      </div>
                      <div style={{ height: 300, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0 }}>
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
                </div>
              )}

              {/* Section 3: Noise */}
              <div id="noise" className="scroll-mt-20">
                <Section icon={<Target size={16} />} title="Decision Noise Analysis">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-6">
                    <div className="text-center">
                      <div
                        className="text-4xl sm:text-5xl font-extrabold leading-none"
                        style={{
                          color:
                            analysis.noiseScore <= 30
                              ? '#22c55e'
                              : analysis.noiseScore <= 60
                                ? '#eab308'
                                : '#ef4444',
                        }}
                      >
                        {analysis.noiseScore}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">/ 100</div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <StatPill label="Mean" value={analysis.noiseStats.mean.toString()} />
                        <StatPill label="Std Dev" value={analysis.noiseStats.stdDev.toFixed(1)} />
                        <StatPill
                          label="Variance"
                          value={analysis.noiseStats.variance.toFixed(0)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        {analysis.noiseBenchmarks.map((b, i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <span className="text-[11px] sm:text-xs text-slate-600 w-20 sm:w-[120px] shrink-0">
                              {b.label}
                            </span>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F1F5F9' }}>
                              <div
                                style={{
                                  height: '100%',
                                  borderRadius: 3,
                                  transition: 'width 0.3s',
                                  width: `${Math.min(b.value, 100)}%`,
                                  background:
                                    i === 0
                                      ? b.value <= 30
                                        ? '#22c55e'
                                        : b.value <= 60
                                          ? '#eab308'
                                          : '#ef4444'
                                      : '#CBD5E1',
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-900 w-[30px] text-right">
                              {b.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>
              </div>

              {/* Section 4: Boardroom Simulation */}
              <div id="boardroom" className="scroll-mt-20">
                <Section icon={<Users size={16} />} title="Boardroom Simulation — Decision Twins">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analysis.simulation.twins.map((twin, idx) => {
                      const voteColor =
                        twin.vote === 'REJECT'
                          ? '#ef4444'
                          : twin.vote === 'CONDITIONAL APPROVE'
                            ? '#eab308'
                            : '#22c55e';
                      return (
                        <div
                          key={idx}
                          className="bg-slate-50 rounded-[10px] p-4 border border-slate-200"
                        >
                          <div className="flex justify-between items-center mb-2.5">
                            <div>
                              <div className="font-bold text-[13px] text-slate-900">
                                {twin.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {twin.role}
                              </div>
                            </div>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-md font-bold"
                              style={{ background: `${voteColor}15`, color: voteColor }}
                            >
                              {twin.vote}
                            </span>
                          </div>
                          <div className="mb-2.5">
                            <div className="h-[3px] rounded-sm bg-slate-200">
                              <div
                                className="h-full rounded-sm"
                                style={{
                                  width: `${twin.confidence * 100}%`,
                                  background: voteColor,
                                }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {Math.round(twin.confidence * 100)}% confidence
                            </div>
                          </div>
                          <p className="text-slate-600 text-xs m-0 leading-relaxed">
                            {twin.rationale}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </div>

              {/* Section 5: Toxic Combinations */}
              {analysis.toxicCombinations && analysis.toxicCombinations.length > 0 && (
                <div id="toxic" className="scroll-mt-20">
                  <Section
                    icon={<AlertTriangle size={16} className="text-red-500" />}
                    title="Toxic Combinations — Compound Risk Patterns"
                  >
                    <p className="text-slate-600 text-[13px] mb-4 leading-relaxed">
                      Individual biases are manageable. When they combine with contextual factors,
                      compound risk can be 8x worse than any single factor.
                    </p>
                    <div className="flex flex-col gap-3">
                      {analysis.toxicCombinations.map((tc, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 rounded-[10px] p-4 sm:p-[18px] border border-slate-200"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            <span className="font-bold text-sm text-slate-900">
                              {tc.name}
                            </span>
                            <span
                              className="text-[10px] px-2.5 py-0.5 rounded-xl font-bold uppercase tracking-wide"
                              style={{
                                background: tc.riskLevel === 'critical' ? '#ef444415' : '#f9731615',
                                color: tc.riskLevel === 'critical' ? '#ef4444' : '#f97316',
                              }}
                            >
                              {tc.riskLevel}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {tc.biases.map((b, bi) => (
                              <span
                                key={bi}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                          <p className="text-slate-600 text-[13px] m-0 leading-relaxed">
                            {tc.description}
                          </p>
                          {tc.historicalExample && (
                            <p className="text-red-600 text-[12px] m-0 mt-2 leading-relaxed italic">
                              {tc.historicalExample}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
              )}

              {/* Section 6: Pre-Mortem */}
              <div id="premortem" className="scroll-mt-20">
                <Section icon={<Skull size={16} />} title="Pre-Mortem Analysis">
                  <p className="text-slate-600 text-[13px] mb-4 leading-relaxed">
                    Imagine it&apos;s 2 years from now and this decision has failed spectacularly.
                    What went wrong?
                  </p>
                  <div className="flex flex-col gap-3">
                    {analysis.preMortem.scenarios.map((s, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 rounded-[10px] p-4 sm:p-[18px] border border-slate-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
                          <span className="font-bold text-sm text-slate-900">
                            {s.title}
                          </span>
                          <div className="flex gap-2">
                            <span className="text-[10px] px-2.5 py-0.5 rounded-xl bg-yellow-500/10 text-yellow-500 font-bold">
                              {Math.round(s.probability * 100)}% likely
                            </span>
                            <span
                              className="text-[10px] px-2.5 py-0.5 rounded-xl font-bold uppercase"
                              style={{
                                background: `${s.impact === 'catastrophic' ? '#ef4444' : s.impact === 'severe' ? '#f97316' : '#eab308'}15`,
                                color:
                                  s.impact === 'catastrophic'
                                    ? '#ef4444'
                                    : s.impact === 'severe'
                                      ? '#f97316'
                                      : '#eab308',
                              }}
                            >
                              {s.impact}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-600 text-[13px] m-0 leading-relaxed">
                          {s.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              {/* Known Outcome Banner */}
              {analysis.outcome && (
                <div className="mt-8 p-4 sm:p-5 bg-red-500/[0.06] border border-red-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2.5">
                    <TrendingUp size={16} className="text-red-500" />
                    <span className="text-[13px] font-bold text-red-500 tracking-wide">
                      KNOWN OUTCOME
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm m-0 mb-1.5 leading-relaxed">
                    {analysis.outcome.what}
                  </p>
                  <p className="text-slate-400 text-xs m-0">
                    {analysis.outcome.when} &middot; {analysis.outcome.impact}
                  </p>
                </div>
              )}
            </div>

            {/* Conversion CTA with Email Capture */}
            <DemoConversionCTA
              analysisName={analysis.shortName}
              score={analysis.overallScore}
              biasCount={analysis.biases.length}
              onTryNow={handleTryNow}
              loadingSample={loadingSample}
            />

            <p style={{ color: C.slate400, fontSize: 11, textAlign: 'center', marginTop: 32, lineHeight: 1.6 }}>
              Demo analyses are generated by Decision Intel&apos;s cognitive bias detection engine
              to demonstrate product capabilities. They are not financial or investment advice.
            </p>
          </div>
        </SectionBand>
      )}
    </div>
  );
}

// ─── Video Demo Section ──────────────────────────────────────────────

const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL;
const DEMO_BOOKING_URL = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL;

function DemoVideoSection() {
  return (
    <div className="text-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-tight">
        Audit your next strategic memo in 60 seconds.
      </h1>
      <p className="text-slate-500 text-sm sm:text-base max-w-[620px] mx-auto mb-8">
        Pick a famous corporate decision below, or paste your own text. Watch Decision Intel score
        the cognitive biases, predict the questions your steering committee will raise, and map
        the decision into your Knowledge Graph.
      </p>

      {DEMO_VIDEO_URL ? (
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white mb-8">
          <iframe
            src={DEMO_VIDEO_URL}
            allowFullScreen
            className="w-full border-none"
            style={{ aspectRatio: '16/9' }}
            title="Decision Intel Demo"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 sm:p-16 mb-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Play size={28} className="text-slate-400 ml-1" />
          </div>
          <p className="text-slate-500 text-sm max-w-[440px]">
            Try the interactive demo below. Pick a real-world strategic decision and watch the
            bias audit, objection simulation, and Knowledge Graph come to life.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/login"
          className="px-7 py-3 rounded-[10px] bg-green-600 text-white font-bold text-sm no-underline text-center hover:bg-green-700 transition-colors"
          onClick={() => trackEvent('demo_video_cta_clicked', { target: 'start_trial' })}
        >
          Start Free Trial <ArrowRight size={14} className="inline align-middle ml-1" />
        </Link>
        {DEMO_BOOKING_URL ? (
          <a
            href={DEMO_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3 rounded-[10px] bg-transparent border border-slate-200 text-slate-900 font-semibold text-sm no-underline text-center"
            onClick={() => trackEvent('demo_video_cta_clicked', { target: 'book_call' })}
          >
            Book a Call <ExternalLink size={14} className="inline align-middle ml-1" />
          </a>
        ) : (
          <Link
            href="/pricing"
            className="px-7 py-3 rounded-[10px] bg-transparent border border-slate-200 text-slate-900 font-semibold text-sm no-underline text-center"
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
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div style={{ ...cardStyle, padding: '24px 28px', marginBottom: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: C.slate900,
            letterSpacing: '-0.01em',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 8,
              background: C.greenSoft,
              color: C.green,
            }}
          >
            {icon}
          </span>
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize: 13,
              color: C.slate500,
              margin: '6px 0 0 38px',
              lineHeight: 1.55,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
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
        ...cardStyle,
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: C.slate500,
          marginBottom: 8,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: smallValue ? 22 : 36,
          fontWeight: 800,
          lineHeight: 1,
          color,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.slate500, marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        padding: '3px 10px',
        borderRadius: 20,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        background: `${sevColor(severity)}15`,
        color: sevColor(severity),
        border: `1px solid ${sevColor(severity)}30`,
      }}
    >
      {severity}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '5px 12px',
        borderRadius: 8,
        background: C.slate50,
        border: `1px solid ${C.slate200}`,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 10, color: C.slate500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.slate900 }}>{value}</span>
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
    <div className="mb-10">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1.5 mb-6"
      >
        <ArrowRight size={12} className="rotate-180" />
        Scan different text
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4"
          style={{
            background: `${riskColors[result.riskLevel]}15`,
            color: riskColors[result.riskLevel],
          }}
        >
          <Brain size={16} />
          {result.biasCount === 0
            ? 'No Biases Detected'
            : `${result.biasCount} Bias${result.biasCount > 1 ? 'es' : ''} Detected`}
        </div>
        <p className="text-slate-600 text-sm max-w-[600px] mx-auto">{result.summary}</p>
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
            <div className="text-lg font-extrabold text-slate-900">Quick</div>
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
                  className="text-slate-500 text-[13px] m-0 mb-2.5 italic leading-relaxed pl-3"
                  style={{ borderLeft: `2px solid ${sevColor(bias.severity)}60` }}
                >
                  &ldquo;...{bias.signal}...&rdquo;
                </p>
                <p className="text-slate-600 text-[13px] m-0 mb-2.5 leading-relaxed">
                  {bias.explanation}
                </p>
                <p className="text-green-700 text-[13px] m-0 leading-relaxed">
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
          <p className="text-slate-600 text-sm max-w-[500px] mx-auto">
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
              className="text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100"
            >
              {feature}
            </span>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleTryNow}
            disabled={loadingSample}
            className="px-7 py-3 rounded-[10px] bg-green-600 text-white font-bold text-sm border-none cursor-pointer disabled:cursor-wait hover:bg-green-700 transition-colors"
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
        <p className="text-slate-500 text-[11px] mt-4">
          No credit card required &middot; 3 free analyses &middot; 14-day trial on paid plans
        </p>
      </div>
    </div>
  );
}

// ─── Demo Conversion CTA with Email Capture ──────────────────────────

function DemoConversionCTA({
  analysisName,
  score,
  biasCount,
  onTryNow,
  loadingSample,
}: {
  analysisName: string;
  score: number;
  biasCount: number;
  onTryNow: () => void;
  loadingSample: boolean;
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      trackEvent('demo_email_submitted', { score, biasCount, sample: analysisName });

      const res = await fetch('/api/pilot-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'demo_conversion_cta',
          company: `Demo: ${analysisName} (DQI: ${score}, ${biasCount} biases)`,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        trackEvent('demo_email_captured', { score, sample: analysisName });
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="mt-12 rounded-2xl border border-slate-200 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F0FDF4 100%)' }}
    >
      {/* Top section: Email capture */}
      {!submitted ? (
        <div className="p-6 sm:p-10 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A' }}
          >
            <Shield size={13} />
            PERSONALIZED REPORT
          </div>
          <h3 className="text-lg sm:text-[22px] font-bold text-slate-900 mb-2">
            Get a custom audit on your own strategic memo.
          </h3>
          <p className="text-slate-600 text-sm mb-6 max-w-[520px] mx-auto">
            Enter your email to receive a personalized bias audit report.
            We&apos;ll also send you best practices for improving decision quality.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-[440px] mx-auto mb-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@company.com"
              required
              className="flex-1 px-4 py-3 rounded-[10px] border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-green-300 transition-colors"
              id="demo-email-capture"
            />
            <button
              type="submit"
              disabled={submitting || !email}
              className="px-6 py-3 rounded-[10px] bg-green-600 text-white font-bold text-sm border-none cursor-pointer disabled:opacity-50 disabled:cursor-wait hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" /> Sending...
                </span>
              ) : (
                <>Get Report <ArrowRight size={14} className="inline align-middle ml-1" /></>
              )}
            </button>
          </form>
          {error && (
            <p className="text-red-500 text-xs mt-2">{error}</p>
          )}
          <p className="text-slate-400 text-[11px]">
            No spam. Just insights. Unsubscribe anytime.
          </p>
        </div>
      ) : (
        <div className="p-6 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={24} className="text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">You&apos;re in.</h3>
          <p className="text-slate-600 text-sm mb-6 max-w-[450px] mx-auto">
            We&apos;ll send your personalized bias audit guide to <strong>{email}</strong>.
            In the meantime, try a full analysis on your own document:
          </p>
        </div>
      )}

      {/* Bottom section: Action buttons */}
      <div className="px-6 sm:px-10 pb-6 sm:pb-10 text-center">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              trackEvent('demo_cta_clicked', { target: 'try_sample', submitted });
              onTryNow();
            }}
            disabled={loadingSample}
            aria-busy={loadingSample}
            className="px-7 py-3 rounded-[10px] bg-green-600 text-white font-bold text-sm border-none cursor-pointer disabled:cursor-wait hover:bg-green-500 transition-colors"
          >
            {loadingSample ? 'Loading...' : 'Try with Your Document'}{' '}
            <ArrowRight size={14} className="inline align-middle ml-1" />
          </button>
          <Link
            href="/login"
            className="px-7 py-3 rounded-[10px] bg-transparent border border-slate-200 text-slate-900 font-semibold text-sm no-underline text-center hover:border-slate-300 transition-colors"
            onClick={() => trackEvent('demo_cta_clicked', { target: 'signup', submitted })}
          >
            Sign Up Free
          </Link>
          {DEMO_BOOKING_URL && (
            <a
              href={DEMO_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3 rounded-[10px] bg-transparent border border-indigo-200 text-indigo-600 font-semibold text-sm no-underline text-center hover:border-indigo-300 transition-colors"
              onClick={() => trackEvent('demo_cta_clicked', { target: 'book_demo', submitted })}
            >
              Book a Demo <ExternalLink size={14} className="inline align-middle ml-1" />
            </a>
          )}
        </div>
        <p className="text-slate-400 text-[11px] mt-4">
          No credit card required &middot; 4 free analyses &middot; 14-day trial on paid plans
        </p>
      </div>
    </div>
  );
}
