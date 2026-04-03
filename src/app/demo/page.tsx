'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
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
  Scale,
  Gavel,
  Lightbulb,
  Skull,
  Loader2,
  Upload,
  CheckCircle2,
  ClipboardPaste,
  Play,
  ExternalLink,
} from 'lucide-react';
import { DEMO_ANALYSES, type DemoAnalysis } from './data';
import { DQIBadge } from '@/components/ui/DQIBadge';
import { trackEvent } from '@/lib/analytics/track';
import { scanForBiases, type ScanResult } from '@/lib/analysis/client-bias-scanner';

type DemoTab =
  | 'overview'
  | 'biases'
  | 'logic'
  | 'swot'
  | 'noise'
  | 'compliance'
  | 'premortem'
  | 'boardroom'
  | 'intelligence';

const TABS: { id: DemoTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
  { id: 'biases', label: 'Biases', icon: <Brain size={14} /> },
  { id: 'intelligence', label: 'Intelligence', icon: <FileText size={14} /> },
  { id: 'logic', label: 'Logic', icon: <Scale size={14} /> },
  { id: 'swot', label: 'SWOT', icon: <Lightbulb size={14} /> },
  { id: 'noise', label: 'Noise', icon: <Target size={14} /> },
  { id: 'compliance', label: 'Compliance', icon: <Gavel size={14} /> },
  { id: 'premortem', label: 'Pre-Mortem', icon: <Skull size={14} /> },
  { id: 'boardroom', label: 'Boardroom', icon: <Users size={14} /> },
];

const sevColor = (severity: string) =>
  severity === 'critical'
    ? '#ef4444'
    : severity === 'high'
      ? '#f97316'
      : severity === 'medium'
        ? '#eab308'
        : '#22c55e';

const statusColor = (status: string) =>
  status === 'compliant' ? '#22c55e' : status === 'partial' ? '#eab308' : '#ef4444';

const statusLabel = (status: string) =>
  status === 'compliant' ? 'Compliant' : status === 'partial' ? 'Partial' : 'Non-Compliant';

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
  const [activeTab, setActiveTab] = useState<DemoTab>('overview');
  const [loadingSample, setLoadingSample] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const analysis = selectedIdx !== null ? DEMO_ANALYSES[selectedIdx] : null;

  // Run the streaming simulation
  const startSimulation = useCallback((idx: number) => {
    trackEvent('demo_sample_selected', { sample: DEMO_ANALYSES[idx].shortName });
    setSelectedIdx(idx);
    setIsSimulating(true);
    trackEvent('demo_simulation_started');
    setShowResults(false);
    setCurrentStage(0);
    setActiveTab('overview');

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

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TABS.findIndex(t => t.id === activeTab);
      let nextIndex = currentIndex;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % TABS.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = TABS.length - 1;
      } else {
        return;
      }
      e.preventDefault();
      setActiveTab(TABS[nextIndex].id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIndex]?.focus();
    },
    [activeTab]
  );

  // Scroll active tab into view on mobile
  useEffect(() => {
    const activeButton =
      tabListRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    activeButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <div className="bg-[#0F172A] border-b border-slate-700 px-4 sm:px-6 py-3 sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline text-inherit">
            <Shield size={18} className="text-slate-50" />
            <span className="text-sm font-semibold">
              <span className="text-slate-50">Decision</span>
              <span className="text-slate-400 ml-1">Intel</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-[11px] px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 font-semibold tracking-wide">
              INTERACTIVE DEMO
            </span>
            <button
              onClick={handleTryNow}
              disabled={loadingSample}
              aria-busy={loadingSample}
              className="text-xs sm:text-[13px] px-3 sm:px-4 py-1.5 rounded-lg bg-white text-black font-semibold border-none cursor-pointer disabled:opacity-70 disabled:cursor-wait"
            >
              {loadingSample ? (
                <span className="flex items-center gap-1.5">
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
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20">
        {/* Video Demo Section — always visible when not in simulation/results/scan */}
        {!isSimulating && !showResults && !scanResult && (
          <>
            <DemoVideoSection />

            {/* Divider */}
            <div className="flex items-center gap-4 my-12">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-500 font-semibold tracking-widest uppercase">
                Or try it yourself
              </span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
          </>
        )}

        {/* Interactive Demo Section */}
        {!isSimulating && !showResults && !scanResult && (
          <div className="mb-10">
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 leading-tight">
                Interactive Demo
              </h2>
              <p className="text-slate-400 text-sm sm:text-base max-w-[600px] mx-auto">
                Pick a real-world case study and watch the AI pipeline analyze it in real time. No
                login required.
              </p>
            </div>

            {/* Sample Document Cards */}
            <div className="text-[11px] text-slate-500 mb-3 tracking-widest uppercase font-semibold">
              Choose a document to analyze
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {DEMO_ANALYSES.map((a, idx) => (
                <button
                  key={a.id}
                  onClick={() => startSimulation(idx)}
                  className="text-left p-4 sm:p-5 rounded-xl bg-white border border-slate-200 cursor-pointer transition-all duration-200 hover:border-slate-200 hover:bg-slate-50 group"
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div className="flex items-start justify-between">
                    <FileText
                      size={18}
                      className="text-slate-500 group-hover:text-slate-900 transition-colors shrink-0 mt-0.5"
                    />
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-md font-bold"
                      style={{
                        background: `${a.overallScore >= 70 ? '#22c55e' : a.overallScore >= 40 ? '#eab308' : '#ef4444'}15`,
                        color:
                          a.overallScore >= 70
                            ? '#22c55e'
                            : a.overallScore >= 40
                              ? '#eab308'
                              : '#ef4444',
                      }}
                    >
                      DQI {a.overallScore}/100
                    </span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900 mb-1">{a.shortName}</div>
                    <div className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      {a.summary.slice(0, 120)}...
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 group-hover:text-slate-600 transition-colors">
                    <Upload size={12} />
                    <span>Click to analyze</span>
                    <ArrowRight
                      size={12}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </button>
              ))}
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
                  className="w-full h-32 bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm text-slate-300 resize-none focus:outline-none focus:border-slate-300 placeholder:text-slate-600"
                  placeholder="Paste a decision memo, investment thesis, or strategic rationale..."
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[11px] text-slate-600">
                    Real-time bias scan — results generated from your text
                  </span>
                  <button
                    onClick={handlePasteAnalyze}
                    disabled={pasteText.trim().length < 15}
                    className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Scan for Biases <ArrowRight size={12} className="inline ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Scan Results (paste mode) */}
        {scanResult && !isSimulating && !showResults && (
          <QuickScanResults result={scanResult} onBack={() => { setScanResult(null); setPasteText(''); }} />
        )}

        {/* Streaming Simulation */}
        {isSimulating && (
          <div className="mb-10">
            <div className="text-center mb-8">
              <Loader2 size={32} className="text-slate-900 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Analyzing document...</h2>
              <p className="text-slate-500 text-sm">{analysis?.shortName ?? 'Document'}</p>
            </div>

            {/* Progress Pipeline */}
            <div className="max-w-[480px] mx-auto">
              {PIPELINE_STAGES.map((stage, idx) => {
                const StageIcon = stage.icon;
                const isComplete = idx < currentStage;
                const isActive = idx === currentStage;
                const isPending = idx > currentStage;

                return (
                  <div
                    key={stage.id}
                    className="flex items-center gap-3 py-2.5 transition-all duration-300"
                    style={{ opacity: isPending ? 0.3 : 1 }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{
                        background: isComplete
                          ? 'rgba(34, 197, 94, 0.15)'
                          : isActive
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(255, 255, 255, 0.03)',
                        border: isActive
                          ? '1px solid rgba(255, 255, 255, 0.2)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      {isComplete ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : isActive ? (
                        <Loader2 size={16} className="text-slate-900 animate-spin" />
                      ) : (
                        <StageIcon size={16} className="text-slate-600" />
                      )}
                    </div>
                    <span
                      className={`text-[13px] font-medium ${isComplete ? 'text-green-500' : isActive ? 'text-slate-900' : 'text-slate-600'}`}
                    >
                      {stage.label}
                      {isActive && <span className="text-slate-500 ml-1.5 animate-pulse">...</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Overall progress bar */}
            <div className="max-w-[480px] mx-auto mt-6">
              <div className="h-1 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${((currentStage + 1) / PIPELINE_STAGES.length) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-2 text-center">
                Step {currentStage + 1} of {PIPELINE_STAGES.length}
              </div>
            </div>
          </div>
        )}

        {/* Results (shown after simulation or when revisiting) */}
        {showResults && analysis && (
          <div ref={resultsRef}>
            {/* Back / Re-select */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  setShowResults(false);
                  setSelectedIdx(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1.5"
              >
                <ArrowRight size={12} className="rotate-180" />
                Try another document
              </button>
              <div className="flex gap-2">
                {DEMO_ANALYSES.map((a, idx) => (
                  <button
                    key={a.id}
                    onClick={() => startSimulation(idx)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer border transition-all ${
                      idx === selectedIdx
                        ? 'border-slate-300 bg-slate-100 text-slate-900'
                        : 'border-slate-200 bg-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {a.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* DQI Badge + Document Title */}
            <div className="flex items-start gap-5 mb-6">
              <DQIBadge score={analysis.overallScore} size="lg" showGrade animate />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold mb-1.5 leading-snug">
                  {analysis.documentName}
                </h1>
                <p className="text-slate-500 text-xs sm:text-[13px] m-0">
                  Analyzed by Decision Intel &middot;{' '}
                  {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-7">
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

            {/* Tabs */}
            <div
              ref={tabListRef}
              role="tablist"
              aria-label="Analysis sections"
              onKeyDown={handleTabKeyDown}
              className="flex gap-1 mb-6 overflow-x-auto pb-0.5 border-b border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0"
              style={{ scrollbarWidth: 'none' }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2.5 text-[11px] sm:text-[13px] whitespace-nowrap cursor-pointer transition-all duration-150 bg-transparent ${
                    activeTab === tab.id
                      ? 'font-semibold text-slate-900 border-b-2 border-b-slate-900'
                      : 'font-normal text-slate-500 border-b-2 border-b-transparent'
                  }`}
                  style={{
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
              {activeTab === 'overview' && <OverviewTab analysis={analysis} />}
              {activeTab === 'biases' && <BiasesTab analysis={analysis} />}
              {activeTab === 'intelligence' && <IntelligenceTab analysis={analysis} />}
              {activeTab === 'logic' && <LogicTab analysis={analysis} />}
              {activeTab === 'swot' && <SwotTab analysis={analysis} />}
              {activeTab === 'noise' && <NoiseTab analysis={analysis} />}
              {activeTab === 'compliance' && <ComplianceTab analysis={analysis} />}
              {activeTab === 'premortem' && <PreMortemTab analysis={analysis} />}
              {activeTab === 'boardroom' && <BoardroomTab analysis={analysis} />}
            </div>

            {/* Known Outcome Banner (when available) */}
            {analysis.outcome && (
              <div className="mt-8 p-4 sm:p-5 bg-red-500/[0.06] border border-red-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2.5">
                  <TrendingUp size={16} className="text-red-500" />
                  <span className="text-[13px] font-bold text-red-500 tracking-wide">
                    KNOWN OUTCOME
                  </span>
                </div>
                <p className="text-slate-200 text-sm m-0 mb-1.5 leading-relaxed">
                  {analysis.outcome.what}
                </p>
                <p className="text-slate-500 text-xs m-0">
                  {analysis.outcome.when} &middot; {analysis.outcome.impact}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-12 text-center p-6 sm:p-10 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-slate-200">
              <h3 className="text-lg sm:text-[22px] font-bold text-slate-900 mb-2">
                This was a demo. Now try it on your own documents.
              </h3>
              <p className="text-slate-500 text-sm mb-6 max-w-[500px] mx-auto">
                Upload any strategic document &mdash; board memo, M&amp;A rationale, investment
                thesis, market analysis &mdash; and get a comprehensive cognitive bias audit in
                minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleTryNow}
                  disabled={loadingSample}
                  aria-busy={loadingSample}
                  className="px-7 py-3 rounded-[10px] bg-white text-black font-bold text-sm border-none cursor-pointer disabled:cursor-wait"
                >
                  {loadingSample ? 'Loading...' : 'Try with Sample Document'}{' '}
                  <ArrowRight size={14} className="inline align-middle ml-1" />
                </button>
                <Link
                  href="/login"
                  className="px-7 py-3 rounded-[10px] bg-transparent border border-slate-200 text-slate-900 font-semibold text-sm no-underline text-center"
                >
                  Sign Up Free
                </Link>
                {DEMO_BOOKING_URL && (
                  <a
                    href={DEMO_BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-7 py-3 rounded-[10px] bg-transparent border border-indigo-500/30 text-indigo-400 font-semibold text-sm no-underline text-center"
                    onClick={() => trackEvent('demo_cta_clicked', { target: 'book_demo' })}
                  >
                    Book a Demo <ExternalLink size={14} className="inline align-middle ml-1" />
                  </a>
                )}
              </div>
              <p className="text-slate-600 text-[11px] mt-4">
                No credit card required &middot; 3 free analyses &middot; 14-day trial on paid plans
              </p>
            </div>

            <p className="text-slate-700 text-[11px] text-center mt-8 leading-relaxed">
              Demo analyses are generated by Decision Intel&apos;s cognitive bias detection engine
              to demonstrate product capabilities. They are not financial or investment advice.
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
    <div className="text-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-tight">
        See Decision Intel in Action
      </h1>
      <p className="text-slate-400 text-sm sm:text-base max-w-[600px] mx-auto mb-8">
        Watch how the 11-agent pipeline audits real IC memos for cognitive bias, measures decision
        noise, and generates actionable intelligence.
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
          <div className="w-16 h-16 rounded-full bg-slate-100 border border-white/[0.1] flex items-center justify-center">
            <Play size={28} className="text-slate-400 ml-1" />
          </div>
          <p className="text-slate-500 text-sm max-w-[400px]">
            Try the interactive demo below — upload a sample document and watch the 11-agent bias
            detection pipeline in real time.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/login"
          className="px-7 py-3 rounded-[10px] bg-white text-black font-bold text-sm no-underline text-center"
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
            href="/#pricing"
            className="px-7 py-3 rounded-[10px] bg-transparent border border-slate-200 text-slate-900 font-semibold text-sm no-underline text-center"
          >
            View Pricing
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Tab Components ──────────────────────────────────────────────────

function OverviewTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <>
      <Section icon={<BarChart3 size={16} />} title="Executive Summary">
        <p className="text-slate-300 leading-relaxed m-0 text-sm">{analysis.summary}</p>
      </Section>
      <Section
        icon={<AlertTriangle size={16} className="text-red-500" />}
        title="Meta Verdict"
        borderColor="border-red-500/20"
      >
        <p className="text-slate-300 leading-relaxed m-0 text-sm">{analysis.metaVerdict}</p>
      </Section>

      {/* Quick stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniCard
          label="Logical Fallacies"
          value={`${analysis.logicalFallacies.length} found`}
          color="#f97316"
        />
        <MiniCard
          label="SWOT Balance"
          value={`${analysis.swot.weaknesses.length + analysis.swot.threats.length} risks vs ${analysis.swot.strengths.length + analysis.swot.opportunities.length} positives`}
          color={
            analysis.swot.weaknesses.length + analysis.swot.threats.length >
            analysis.swot.strengths.length + analysis.swot.opportunities.length
              ? '#ef4444'
              : '#22c55e'
          }
        />
        <MiniCard
          label="Compliance"
          value={`${analysis.compliance.frameworks.filter(f => f.status === 'non_compliant').length} non-compliant`}
          color="#ef4444"
        />
        <MiniCard
          label="Pre-Mortem Risks"
          value={`${analysis.preMortem.scenarios.length} scenarios`}
          color="#eab308"
        />
      </div>
    </>
  );
}

function BiasesTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <Section
      icon={<Brain size={16} />}
      title={`Cognitive Biases Detected (${analysis.biases.length})`}
    >
      <div className="flex flex-col gap-3">
        {analysis.biases.map((bias, idx) => (
          <div
            key={idx}
            className="bg-slate-50 rounded-[10px] p-4 sm:p-[18px] border border-slate-200"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="font-bold text-sm text-slate-900">
                {bias.biasType.replace(/_/g, ' ')}
              </span>
              <SeverityBadge severity={bias.severity} />
              <span className="text-[11px] text-slate-500 sm:ml-auto">
                {Math.round(bias.confidence * 100)}% confidence
              </span>
            </div>
            <p
              className="text-slate-400 text-[13px] m-0 mb-2.5 italic leading-relaxed pl-3"
              style={{ borderLeft: `2px solid ${sevColor(bias.severity)}30` }}
            >
              &ldquo;{bias.excerpt}&rdquo;
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
    </Section>
  );
}

function IntelligenceTab({ analysis }: { analysis: DemoAnalysis }) {
  const { intelligence } = analysis;
  return (
    <>
      {/* Pattern Match */}
      <Section icon={<Brain size={16} />} title="Pattern Recognition">
        <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-lg p-4 mb-4">
          <p className="text-slate-200 text-sm m-0 leading-relaxed">
            {intelligence.patternMatch}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {intelligence.recognitionCues.map((cue, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-[10px] p-4 border border-slate-200 flex-1 min-w-[250px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[13px] text-slate-900">{cue.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 font-bold">
                  {Math.round(cue.similarity * 100)}% match
                </span>
              </div>
              <p className="text-slate-400 text-xs m-0 leading-relaxed">{cue.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Institutional Memory */}
      <Section
        icon={<FileText size={16} />}
        title={`Institutional Memory (${intelligence.similarCases.length} similar cases)`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[11px] text-slate-500">Recall Score</div>
          <div className="flex-1 h-1.5 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${intelligence.recallScore}%`,
                background:
                  intelligence.recallScore >= 70
                    ? '#22c55e'
                    : intelligence.recallScore >= 40
                      ? '#eab308'
                      : '#ef4444',
              }}
            />
          </div>
          <div className="text-sm font-bold text-slate-900">{intelligence.recallScore}/100</div>
        </div>

        <div className="flex flex-col gap-3">
          {intelligence.similarCases.map((c, idx) => {
            const outcomeColor =
              c.outcome === 'SUCCESS'
                ? '#22c55e'
                : c.outcome === 'FAILURE'
                  ? '#ef4444'
                  : '#eab308';
            return (
              <div
                key={idx}
                className="bg-slate-50 rounded-[10px] p-4 sm:p-[18px] border border-slate-200"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="font-bold text-sm text-slate-900">{c.title}</span>
                  <span
                    className="text-[10px] px-2.5 py-0.5 rounded-xl font-bold"
                    style={{ background: `${outcomeColor}15`, color: outcomeColor }}
                  >
                    {c.outcome}
                  </span>
                  <span className="text-[11px] text-slate-500 sm:ml-auto">
                    {Math.round(c.similarity * 100)}% similar
                  </span>
                </div>
                <p className="text-slate-300 text-[13px] m-0 leading-relaxed">
                  <strong className="text-slate-200">Key Lesson:</strong> {c.lesson}
                </p>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function LogicTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <Section
      icon={<Scale size={16} />}
      title={`Logical Fallacies (${analysis.logicalFallacies.length})`}
    >
      <div className="flex flex-col gap-3">
        {analysis.logicalFallacies.map((f, idx) => (
          <div
            key={idx}
            className="bg-slate-50 rounded-[10px] p-4 sm:p-[18px] border border-slate-200"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="font-bold text-sm text-slate-900">{f.name}</span>
              <SeverityBadge severity={f.severity} />
              <span className="text-[11px] text-slate-500 sm:ml-auto">
                Logic Score: {f.score}/100
              </span>
            </div>
            <p className="text-slate-400 text-[13px] m-0 mb-2.5 italic leading-relaxed pl-3 border-l-2 border-slate-200">
              &ldquo;{f.excerpt}&rdquo;
            </p>
            <p className="text-slate-300 text-[13px] m-0 leading-relaxed">{f.explanation}</p>
            {/* Score bar */}
            <div className="mt-3 h-1 rounded-sm bg-slate-100">
              <div
                className="h-full rounded-sm transition-[width] duration-300"
                style={{
                  width: `${f.score}%`,
                  background: f.score >= 60 ? '#22c55e' : f.score >= 35 ? '#eab308' : '#ef4444',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SwotTab({ analysis }: { analysis: DemoAnalysis }) {
  const { swot } = analysis;
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <SwotQuadrant title="Strengths" items={swot.strengths} color="#22c55e" />
        <SwotQuadrant title="Weaknesses" items={swot.weaknesses} color="#ef4444" />
        <SwotQuadrant title="Opportunities" items={swot.opportunities} color="#6366f1" />
        <SwotQuadrant title="Threats" items={swot.threats} color="#f97316" />
      </div>
      <Section icon={<Lightbulb size={16} />} title="Strategic Advice">
        <p className="text-slate-300 leading-relaxed m-0 text-sm">{swot.strategicAdvice}</p>
      </Section>
    </>
  );
}

function NoiseTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <>
      <Section icon={<Target size={16} />} title="Decision Noise Analysis">
        <p className="text-slate-400 text-[13px] mb-5 leading-relaxed">
          Decision noise measures inconsistency in the document&apos;s reasoning. A high noise score
          means the same facts could lead to wildly different conclusions depending on who reads it
          and when.
        </p>
        {/* Noise gauge */}
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
            <div className="text-xs text-slate-500 mt-1">/ 100</div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-wrap gap-2 mb-3">
              <StatPill label="Mean" value={analysis.noiseStats.mean.toString()} />
              <StatPill label="Std Dev" value={analysis.noiseStats.stdDev.toFixed(1)} />
              <StatPill label="Variance" value={analysis.noiseStats.variance.toFixed(0)} />
            </div>
            {/* Benchmark comparison */}
            <div className="flex flex-col gap-2">
              {analysis.noiseBenchmarks.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-[11px] sm:text-xs text-slate-400 w-20 sm:w-[120px] shrink-0">
                    {b.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-sm bg-slate-100">
                    <div
                      className="h-full rounded-sm transition-[width] duration-300"
                      style={{
                        width: `${Math.min(b.value, 100)}%`,
                        background:
                          i === 0
                            ? b.value <= 30
                              ? '#22c55e'
                              : b.value <= 60
                                ? '#eab308'
                                : '#ef4444'
                            : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 w-[30px] text-right">
                    {b.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function ComplianceTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <>
      <Section icon={<Gavel size={16} />} title="Compliance Assessment">
        <div className="flex flex-col gap-4">
          {analysis.compliance.frameworks.map((fw, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-[10px] p-4 sm:p-[18px] border border-slate-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <span className="font-bold text-sm text-slate-900">{fw.name}</span>
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-[10px] px-2.5 py-0.5 rounded-xl font-bold uppercase tracking-wide"
                    style={{
                      background: `${statusColor(fw.status)}15`,
                      color: statusColor(fw.status),
                    }}
                  >
                    {statusLabel(fw.status)}
                  </span>
                  <span className="text-[13px] font-bold" style={{ color: statusColor(fw.status) }}>
                    {fw.score}/100
                  </span>
                </div>
              </div>
              <ul className="m-0 pl-[18px] flex flex-col gap-1.5">
                {fw.findings.map((finding, fi) => (
                  <li key={fi} className="text-slate-400 text-[13px] leading-relaxed">
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-red-500/[0.06] rounded-lg border border-red-500/15">
          <p className="text-slate-200 text-[13px] m-0 leading-relaxed">
            <strong className="text-red-500">Overall Risk Assessment:</strong>{' '}
            {analysis.compliance.overallRisk}
          </p>
        </div>
      </Section>
    </>
  );
}

function PreMortemTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
    <Section icon={<Skull size={16} />} title="Pre-Mortem Analysis">
      <p className="text-slate-400 text-[13px] mb-4 leading-relaxed">
        Imagine it&apos;s 2 years from now and this decision has failed spectacularly. What went
        wrong?
      </p>
      <div className="flex flex-col gap-3">
        {analysis.preMortem.scenarios.map((s, idx) => (
          <div
            key={idx}
            className="bg-slate-50 rounded-[10px] p-4 sm:p-[18px] border border-slate-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
              <span className="font-bold text-sm text-slate-900">{s.title}</span>
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
            <p className="text-slate-300 text-[13px] m-0 leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function BoardroomTab({ analysis }: { analysis: DemoAnalysis }) {
  return (
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
            <div key={idx} className="bg-slate-50 rounded-[10px] p-4 border border-slate-200">
              <div className="flex justify-between items-center mb-2.5">
                <div>
                  <div className="font-bold text-[13px] text-slate-900">{twin.name}</div>
                  <div className="text-[11px] text-slate-500">{twin.role}</div>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-md font-bold"
                  style={{
                    background: `${voteColor}15`,
                    color: voteColor,
                  }}
                >
                  {twin.vote}
                </span>
              </div>
              {/* Confidence bar */}
              <div className="mb-2.5">
                <div className="h-[3px] rounded-sm bg-slate-100">
                  <div
                    className="h-full rounded-sm"
                    style={{ width: `${twin.confidence * 100}%`, background: voteColor }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {Math.round(twin.confidence * 100)}% confidence
                </div>
              </div>
              <p className="text-slate-400 text-xs m-0 leading-relaxed">{twin.rationale}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Shared UI Components ────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
  borderColor = 'border-slate-200',
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div className={`bg-white border ${borderColor} rounded-xl p-4 sm:p-6 mb-4`}>
      <h3 className="text-[15px] font-bold mb-4 flex items-center gap-2 text-slate-900">
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
    <div className="bg-white border border-slate-200 rounded-xl py-3 sm:py-[18px] px-3 sm:px-3.5 text-center">
      <div className="text-[10px] text-slate-500 mb-1.5 tracking-wide">{label}</div>
      <div
        className={`${smallValue ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-4xl'} font-extrabold leading-none`}
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[11px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function MiniCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[10px] p-3 sm:p-4">
      <div className="text-[11px] text-slate-500 mb-1 tracking-wide">{label}</div>
      <div className="text-[13px] font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className="text-[10px] px-2.5 py-0.5 rounded-xl font-bold uppercase tracking-wide"
      style={{
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
    <div className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200">
      <span className="text-[10px] text-slate-500">{label} </span>
      <span className="text-xs font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function SwotQuadrant({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-[18px]"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <h4 className="text-[13px] font-bold m-0 mb-3 tracking-wide" style={{ color }}>
        {title}
      </h4>
      <ul className="m-0 pl-4 flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-slate-300 text-xs leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
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
        <p className="text-slate-400 text-sm max-w-[600px] mx-auto">{result.summary}</p>
      </div>

      {/* Score Cards */}
      {result.biasCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-7">
          <div className="bg-white border border-slate-200 rounded-xl py-3 px-3 text-center">
            <div className="text-[10px] text-slate-500 mb-1.5 tracking-wide">BIASES FOUND</div>
            <div className="text-2xl font-extrabold" style={{ color: riskColors[result.riskLevel] }}>
              {result.biasCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">of 14 checked</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl py-3 px-3 text-center">
            <div className="text-[10px] text-slate-500 mb-1.5 tracking-wide">RISK LEVEL</div>
            <div className="text-lg font-extrabold uppercase" style={{ color: riskColors[result.riskLevel] }}>
              {result.riskLevel}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {result.biases.filter(b => b.severity === 'critical' || b.severity === 'high').length} high/critical
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
      <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-slate-200 text-center">
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
