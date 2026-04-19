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
  Play,
  ExternalLink,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { DEMO_ANALYSES } from './data';
import { PipelineFlowDiagram } from '@/components/marketing/how-it-works/PipelineFlowDiagram';
import { PipelineNodeDetail } from '@/components/marketing/how-it-works/PipelineNodeDetail';
import { DqiComponentBars } from '@/components/marketing/how-it-works/DqiComponentBars';
import { NoiseDistributionViz } from '@/components/marketing/how-it-works/NoiseDistributionViz';
import { DQIBadge } from '@/components/ui/DQIBadge';
import { Reveal } from '@/components/ui/Reveal';
import { PasteAuditResults } from '@/components/marketing/demo/PasteAuditResults';
import { trackEvent } from '@/lib/analytics/track';
import type { AnalysisResult } from '@/types';

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

/* Inner card recipe — used inside Section components for grouped items
 * (bias details, boardroom twins, toxic combos, pre-mortem scenarios). */
const innerCardStyle: React.CSSProperties = {
  background: C.slate50,
  border: `1px solid ${C.slate200}`,
  borderRadius: 12,
  padding: '18px 20px',
};

/* Soft-tint pill — used for vote badges, severity tags, etc. */
function tintedPill(color: string, opts: { size?: 'sm' | 'md' } = {}): React.CSSProperties {
  const sm = opts.size === 'sm';
  return {
    fontSize: sm ? 10 : 11,
    padding: sm ? '3px 8px' : '4px 10px',
    borderRadius: 999,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    background: `${color}15`,
    color,
    border: `1px solid ${color}30`,
    display: 'inline-flex',
    alignItems: 'center',
  };
}

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

const BiasNetwork3D = dynamic(() => import('@/components/visualizations/BiasNetwork3DCanvas'), {
  ssr: false,
});
const BiasProfileRadar = dynamic(
  () =>
    import('@/components/visualizations/BiasProfileRadar').then(m => ({
      default: m.BiasProfileRadar,
    })),
  { ssr: false }
);

const FLOW_SECTIONS = [
  { id: 'pipeline', label: 'Pipeline' },
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
  const [signInHint, setSignInHint] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteAuditing, setPasteAuditing] = useState(false);
  const [pasteAudit, setPasteAudit] = useState<{
    documentId: string;
    analysisId: string | null;
    result: AnalysisResult;
  } | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteStageIdx, setPasteStageIdx] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('pipeline');
  const [showAllBiases, setShowAllBiases] = useState(false);
  const [activePipelineNodeId, setActivePipelineNodeId] = useState<string | null>(null);

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

  // Handle paste mode submission — runs the REAL 12-node pipeline via
  // /api/demo/run. Displays a staged progress animation while the audit
  // is running, then hands the result to <PasteAuditResults>.
  const handlePasteAnalyze = useCallback(async () => {
    const trimmed = pasteText.trim();
    if (trimmed.length < 15) return;

    trackEvent('demo_paste_analyzed', { textLength: trimmed.length });
    setPasteAuditing(true);
    setPasteError(null);
    setPasteAudit(null);
    setPasteStageIdx(0);

    try {
      const res = await fetch('/api/demo/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: { documentId: string; analysisId: string | null; result: AnalysisResult };
        error?: string;
      };

      if (!res.ok || !body.success || !body.data) {
        const msg =
          body.error ||
          'The audit ran into an error. Please try again in a moment.';
        trackEvent('demo_paste_error', { status: res.status });
        setPasteError(msg);
        setPasteAuditing(false);
        return;
      }

      trackEvent('demo_paste_results', {
        dqi: body.data.result.overallScore,
        biasCount: body.data.result.biases?.length ?? 0,
      });
      setPasteAudit(body.data);
      setPasteAuditing(false);
      // Scroll to results after a short beat so the animation feels intentional
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 220);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? 'Network error. Please check your connection and try again.'
          : 'Something went wrong. Please try again.';
      trackEvent('demo_paste_error', { network: true });
      setPasteError(msg);
      setPasteAuditing(false);
    }
  }, [pasteText]);

  // Cycle through the progress stages while the real pipeline runs
  useEffect(() => {
    if (!pasteAuditing) return;
    const t = setInterval(() => {
      setPasteStageIdx(i => Math.min(i + 1, PIPELINE_STAGES.length - 1));
    }, 5500);
    return () => clearInterval(t);
  }, [pasteAuditing]);

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
    setSignInHint(null);
    try {
      const res = await fetch('/api/onboarding/sample', { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as {
        documentId?: string;
        error?: string;
      };
      if (res.ok && data.documentId) {
        router.push(`/documents/${data.documentId}`);
        return;
      }
      if (res.status === 401) {
        // Anonymous visitor — give them context before the redirect instead
        // of silently dumping them on /login.
        setSignInHint(
          'Creating your own audit needs a free account (30 seconds, no card). Redirecting...'
        );
        setTimeout(
          () => router.push('/login?next=' + encodeURIComponent('/demo?start=sample')),
          1400
        );
        return;
      }
      if (res.status === 500) {
        setSignInHint(
          'Sample is temporarily unavailable. Try a pre-built demo below, or reach us at hello@decision-intel.com.'
        );
        setLoadingSample(false);
        return;
      }
      // Unexpected non-OK — fall through
      setSignInHint('Something went wrong. Redirecting to sign-in...');
      setTimeout(() => router.push('/login'), 1400);
    } catch {
      setSignInHint('Network error. Redirecting to sign-in...');
      setTimeout(() => router.push('/login'), 1400);
    }
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

  const idleState =
    !isSimulating && !showResults && !pasteAuditing && !pasteAudit && !pasteError;

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
                'Audit Your Own Memo'
              )}
            </button>
          </div>
        </div>
        {signInHint && (
          <div
            role="status"
            aria-live="polite"
            style={{
              maxWidth: 1200,
              margin: '8px auto 0',
              padding: '10px 16px',
              borderRadius: 8,
              background: C.greenSoft,
              border: `1px solid ${C.greenLight}`,
              color: C.slate900,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {signInHint}
          </div>
        )}
      </header>

      {/* ─── Idle: PASTE HERO — primary conversion mechanic ─────────── */}
      {idleState && (
        <SectionBand bg={C.white} paddingY={72} maxWidth={920}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  color: C.green,
                  background: C.greenSoft,
                  border: `1px solid ${C.greenLight}`,
                  padding: '4px 12px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 16,
                }}
              >
                <Play size={10} strokeWidth={2.8} />
                One free audit &middot; no signup
              </div>
              <h1
                style={{
                  fontSize: 'clamp(30px, 5vw, 44px)',
                  fontWeight: 800,
                  color: C.slate900,
                  margin: '0 0 14px',
                  lineHeight: 1.08,
                  letterSpacing: '-0.025em',
                }}
              >
                Paste your strategic memo.
                <br />
                <span style={{ color: C.green }}>Get a full audit in 60 seconds.</span>
              </h1>
              <p
                style={{
                  fontSize: 17,
                  color: C.slate500,
                  maxWidth: 640,
                  margin: '0 auto',
                  lineHeight: 1.6,
                }}
              >
                Decision Quality Index. Top cognitive biases with evidence excerpts. AI boardroom
                objections. What-if interventions. Your decision mapped into the Knowledge Graph.
                Everything on your actual text &mdash; no signup, no card.
              </p>
            </div>

            <div
              style={{
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 20,
                padding: 20,
                boxShadow: '0 14px 40px rgba(15,23,42,0.06)',
              }}
            >
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 resize-none focus:outline-none focus:border-green-300 placeholder:text-slate-400"
                style={{ minHeight: 200, fontSize: 14, lineHeight: 1.6 }}
                placeholder={
                  'Paste a strategic memo, board deck excerpt, or market-entry recommendation.\n\nExamples: "We should acquire [target] because…", a pre-mortem, a growth-plan one-pager, the recommendation section of a board deck…'
                }
                aria-label="Paste your strategic memo for auditing"
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 14,
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {[
                    '1 audit per day',
                    '4,000-word cap',
                    'Never stored',
                  ].map(chip => (
                    <span
                      key={chip}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11.5,
                        color: C.slate500,
                        fontWeight: 500,
                      }}
                    >
                      <CheckCircle2 size={12} style={{ color: C.green }} />
                      {chip}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handlePasteAnalyze}
                  disabled={pasteText.trim().length < 15}
                  style={{
                    padding: '11px 22px',
                    borderRadius: 10,
                    background: C.green,
                    color: C.white,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: pasteText.trim().length < 15 ? 'not-allowed' : 'pointer',
                    opacity: pasteText.trim().length < 15 ? 0.45 : 1,
                    border: 'none',
                    boxShadow:
                      pasteText.trim().length < 15
                        ? 'none'
                        : '0 6px 20px rgba(22,163,74,0.3)',
                    transition: 'all 0.15s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Run the audit <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </Reveal>
        </SectionBand>
      )}

      {/* ─── Idle: Secondary — Sample decisions ──────────────────────── */}
      {idleState && (
        <SectionBand bg={C.slate50} borderTop paddingY={64}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: C.slate500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  margin: '0 0 8px',
                }}
              >
                Or try a famous one
              </p>
              <h2
                style={{
                  fontSize: 'clamp(22px, 3vw, 28px)',
                  fontWeight: 800,
                  color: C.slate900,
                  margin: '0 0 10px',
                  lineHeight: 1.2,
                  letterSpacing: '-0.015em',
                }}
              >
                Three corporate decisions that should have been audited.
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: C.slate500,
                  maxWidth: 560,
                  margin: '0 auto',
                  lineHeight: 1.55,
                }}
              >
                Pre-canned samples, same full audit flow, runs instantly &mdash; no LLM calls.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
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
                      padding: '24px 22px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="shrink-0"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#F0FDF4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText size={18} style={{ color: '#16A34A' }} />
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
                    <div>
                      <div className="text-base font-bold text-slate-900 mb-1.5 leading-tight">
                        {a.shortName}
                      </div>
                      <div className="text-sm text-slate-500 leading-relaxed">{a.teaser}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-600 font-semibold group-hover:text-green-700 transition-colors mt-auto pt-2 border-t border-slate-100">
                      <Upload size={12} />
                      <span>Run this sample</span>
                      <ArrowRight
                        size={12}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </SectionBand>
      )}

      {/* ─── Idle: Video tour — tertiary ─────────────────────────────── */}
      {idleState && (
        <SectionBand bg={C.white} borderTop paddingY={56}>
          <DemoVideoSection />
        </SectionBand>
      )}

      {/* Paste audit: in-flight progress (real /api/demo/run running) */}
      {pasteAuditing && (
        <SectionBand bg={C.slate50} borderTop paddingY={56} maxWidth={720}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
                marginBottom: 14,
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
              }}
            >
              <Loader2 size={26} style={{ color: C.green }} className="animate-spin" />
            </div>
            <h2
              style={{
                fontSize: 'clamp(22px, 3.5vw, 28px)',
                fontWeight: 800,
                color: C.slate900,
                margin: '0 0 6px',
                letterSpacing: '-0.015em',
              }}
            >
              Auditing your memo
            </h2>
            <p style={{ fontSize: 13.5, color: C.slate500, margin: 0, lineHeight: 1.55 }}>
              Running the real Decision Intel pipeline. This takes 30&ndash;60&nbsp;seconds on a
              strategic memo.
            </p>
          </div>
          <div style={{ ...cardStyle, padding: '22px 26px' }}>
            {PIPELINE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const state =
                idx < pasteStageIdx
                  ? ('done' as const)
                  : idx === pasteStageIdx
                    ? ('running' as const)
                    : ('pending' as const);
              return (
                <div
                  key={stage.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom:
                      idx === PIPELINE_STAGES.length - 1 ? 'none' : `1px solid ${C.slate100}`,
                    opacity: state === 'pending' ? 0.42 : 1,
                    transition: 'opacity 0.3s',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background:
                        state === 'done'
                          ? C.greenLight
                          : state === 'running'
                            ? C.greenSoft
                            : C.slate50,
                      color: state === 'done' ? C.green : state === 'running' ? C.green : C.slate400,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {state === 'running' ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : state === 'done' ? (
                      <CheckCircle2 size={14} strokeWidth={2.4} />
                    ) : (
                      <Icon size={13} />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: state === 'pending' ? 500 : 600,
                      color: state === 'pending' ? C.slate500 : C.slate900,
                    }}
                  >
                    {stage.label}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionBand>
      )}

      {/* Paste audit: error state */}
      {pasteError && !pasteAuditing && !pasteAudit && (
        <SectionBand bg={C.slate50} borderTop paddingY={48} maxWidth={640}>
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 14,
              padding: '18px 22px',
              color: '#7F1D1D',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#B91C1C',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginBottom: 6,
              }}
            >
              Audit didn&rsquo;t run
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 10px' }}>{pasteError}</p>
            <button
              onClick={() => setPasteError(null)}
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: C.white,
                background: '#B91C1C',
                border: 'none',
                padding: '8px 14px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Edit memo and retry
            </button>
          </div>
        </SectionBand>
      )}

      {/* Paste audit: wow-sequence result */}
      {pasteAudit && !pasteAuditing && (
        <SectionBand bg={C.slate50} borderTop paddingY={64} maxWidth={920}>
          <div ref={resultsRef}>
            <PasteAuditResults
              documentId={pasteAudit.documentId}
              analysisId={pasteAudit.analysisId}
              result={pasteAudit.result}
            />
          </div>
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
                      position: 'relative',
                      background: isComplete ? C.greenSoft : isActive ? C.slate50 : C.white,
                      border: `1px solid ${isComplete ? C.greenLight : isActive ? C.slate200 : C.slate100}`,
                      transition: 'background 0.4s, border-color 0.4s',
                    }}
                  >
                    {/* Crossfaded icon stack — three layered icons at different
                       opacities prevent the jarring instant icon swap. */}
                    <span
                      style={{
                        position: 'absolute',
                        opacity: isPending ? 1 : 0,
                        transition: 'opacity 0.35s',
                      }}
                    >
                      <StageIcon size={16} style={{ color: C.slate500 }} />
                    </span>
                    <span
                      style={{
                        position: 'absolute',
                        opacity: isActive ? 1 : 0,
                        transition: 'opacity 0.35s',
                      }}
                    >
                      <Loader2 size={16} style={{ color: C.green }} className="animate-spin" />
                    </span>
                    <span
                      style={{
                        position: 'absolute',
                        opacity: isComplete ? 1 : 0,
                        transition: 'opacity 0.35s',
                      }}
                    >
                      <CheckCircle2 size={16} style={{ color: C.green }} />
                    </span>
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
                Audit a different memo
              </button>
              <select
                value={selectedIdx ?? 0}
                onChange={e => startSimulation(Number(e.target.value))}
                aria-label="Switch sample audit"
                style={{
                  padding: '7px 28px 7px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.slate900,
                  background: `${C.white} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>") no-repeat right 8px center`,
                  border: `1px solid ${C.slate200}`,
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.slate400)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.slate200)}
              >
                {DEMO_ANALYSES.map((a, idx) => (
                  <option key={a.id} value={idx}>
                    {a.shortName}
                  </option>
                ))}
              </select>
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

              {/* Section 0: Pipeline — inside the audit */}
              <div id="pipeline" style={{ scrollMarginTop: 80 }}>
                <div
                  style={{
                    ...cardStyle,
                    padding: '28px 32px',
                    marginBottom: 24,
                    background: C.white,
                  }}
                >
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.green,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 8,
                      }}
                    >
                      Inside the audit
                    </div>
                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: C.slate900,
                        letterSpacing: '-0.01em',
                        margin: '0 0 8px',
                      }}
                    >
                      The 12 agents that read your memo.
                    </h2>
                    <p
                      style={{
                        fontSize: 14,
                        color: C.slate600,
                        lineHeight: 1.6,
                        margin: 0,
                        maxWidth: 640,
                      }}
                    >
                      A sequential preprocessing chain, seven parallel analysis agents, and a
                      two-step synthesis that reconciles the signals and computes the DQI. Click any
                      node to see what it does.
                    </p>
                  </div>
                  <PipelineFlowDiagram
                    activeNodeId={activePipelineNodeId}
                    onSelectNode={setActivePipelineNodeId}
                  />
                </div>
              </div>
              <PipelineNodeDetail
                nodeId={activePipelineNodeId}
                onClose={() => setActivePipelineNodeId(null)}
              />

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
                <Section
                  icon={<BarChart3 size={16} />}
                  title="Executive Summary"
                  subtitle="What the audit caught, in two minutes — written for the strategist about to walk into the room."
                >
                  <p style={{ color: C.slate600, lineHeight: 1.65, margin: 0, fontSize: 14 }}>
                    {analysis.summary}
                  </p>
                </Section>
                {/* DQI methodology — how the single number is built */}
                <Section
                  icon={<BarChart3 size={16} />}
                  title="How the DQI is built"
                  subtitle="Six weighted components feed the composite score. A-F grade scale is fixed and published — re-runnable against the methodology, not a proprietary black box."
                >
                  <DqiComponentBars />
                </Section>
              </div>

              {/* Section 2: Biases */}
              <div id="biases" className="scroll-mt-20">
                <Section
                  icon={<Brain size={16} />}
                  title={`Cognitive Biases Detected (${analysis.biases.length})`}
                  subtitle="Each bias is grounded in a specific quote from the memo, with a recommended counter-move you can hand to your team."
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(showAllBiases ? analysis.biases : analysis.biases.slice(0, 4)).map(
                      (bias, idx) => (
                        <div key={idx} style={innerCardStyle}>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: 10,
                              marginBottom: 12,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: C.slate900,
                                textTransform: 'capitalize',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {bias.biasType.replace(/_/g, ' ')}
                            </span>
                            <SeverityBadge severity={bias.severity} />
                            <span
                              style={{
                                fontSize: 11,
                                color: C.slate500,
                                marginLeft: 'auto',
                                fontWeight: 600,
                              }}
                            >
                              {Math.round(bias.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p
                            style={{
                              color: C.slate600,
                              fontSize: 13,
                              margin: '0 0 12px',
                              fontStyle: 'italic',
                              lineHeight: 1.65,
                              paddingLeft: 14,
                              borderLeft: `3px solid ${sevColor(bias.severity)}55`,
                            }}
                          >
                            &ldquo;{bias.excerpt}&rdquo;
                          </p>
                          <p
                            style={{
                              color: C.slate600,
                              fontSize: 13,
                              margin: '0 0 12px',
                              lineHeight: 1.65,
                            }}
                          >
                            {bias.explanation}
                          </p>
                          <div
                            style={{
                              padding: '10px 14px',
                              borderRadius: 8,
                              background: C.greenSoft,
                              border: `1px solid ${C.greenLight}`,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: C.greenDark,
                                marginRight: 8,
                              }}
                            >
                              Recommend
                            </span>
                            <span style={{ color: C.greenDark, fontSize: 13, lineHeight: 1.6 }}>
                              {bias.suggestion}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  {analysis.biases.length > 4 && !showAllBiases && (
                    <button
                      onClick={() => setShowAllBiases(true)}
                      style={{
                        marginTop: 14,
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.slate600,
                        background: C.white,
                        border: `1px solid ${C.slate200}`,
                        borderRadius: 8,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = C.slate400;
                        e.currentTarget.style.color = C.slate900;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = C.slate200;
                        e.currentTarget.style.color = C.slate600;
                      }}
                    >
                      Show all {analysis.biases.length} biases
                    </button>
                  )}
                </Section>
              </div>

              {/* Section 2b: Bias Visualizations */}
              {analysis.biases.length >= 3 && (
                <div style={{ marginBottom: 24, scrollMarginTop: 80 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {/* 3D Bias Network */}
                    <div style={{ ...cardStyle, overflow: 'hidden', minWidth: 0 }}>
                      <div
                        style={{
                          padding: '14px 18px',
                          borderBottom: `1px solid ${C.slate200}`,
                          background: C.white,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: C.green,
                            marginBottom: 4,
                          }}
                        >
                          3D Bias Network
                        </div>
                        <div style={{ fontSize: 13, color: C.slate500 }}>
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
                      <div
                        style={{
                          padding: '10px 18px',
                          borderTop: `1px solid ${C.slate200}`,
                          background: C.slate50,
                          fontSize: 11,
                          color: C.slate500,
                        }}
                      >
                        Drag to rotate · Scroll to zoom · Click to explore
                      </div>
                    </div>

                    {/* Bias Intensity Radar */}
                    <div style={{ ...cardStyle, overflow: 'hidden', minWidth: 0 }}>
                      <div
                        style={{
                          padding: '14px 18px',
                          borderBottom: `1px solid ${C.slate200}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: '#7C3AED',
                            marginBottom: 4,
                          }}
                        >
                          Bias Intensity Profile
                        </div>
                        <div style={{ fontSize: 13, color: C.slate500 }}>
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
              <div id="noise" style={{ scrollMarginTop: 80 }}>
                <Section
                  icon={<Target size={16} />}
                  title="Decision Noise"
                  subtitle="How much the same memo would score differently if a fresh team read it cold. Lower noise means your reasoning travels well."
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 28,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div
                        style={{
                          fontSize: 'clamp(40px, 6vw, 56px)',
                          fontWeight: 800,
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                          color: noiseColor,
                        }}
                      >
                        {analysis.noiseScore}
                      </div>
                      <div style={{ fontSize: 11, color: C.slate500, marginTop: 6 }}>/ 100</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        <StatPill label="Mean" value={analysis.noiseStats.mean.toString()} />
                        <StatPill label="Std Dev" value={analysis.noiseStats.stdDev.toFixed(1)} />
                        <StatPill
                          label="Variance"
                          value={analysis.noiseStats.variance.toFixed(0)}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {analysis.noiseBenchmarks.map((b, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span
                              style={{
                                fontSize: 12,
                                color: C.slate600,
                                width: 130,
                                flexShrink: 0,
                                fontWeight: 500,
                              }}
                            >
                              {b.label}
                            </span>
                            <div
                              style={{
                                flex: 1,
                                height: 8,
                                borderRadius: 4,
                                background: C.slate100,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  borderRadius: 4,
                                  transition: 'width 0.3s',
                                  width: `${Math.min(b.value, 100)}%`,
                                  background:
                                    i === 0
                                      ? b.value <= 30
                                        ? C.green
                                        : b.value <= 60
                                          ? C.warning
                                          : C.danger
                                      : '#CBD5E1',
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: C.slate900,
                                width: 32,
                                textAlign: 'right',
                              }}
                            >
                              {b.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>
                {/* Noise methodology — what the distribution looks like */}
                <Section
                  icon={<Target size={16} />}
                  title="Why noise matters"
                  subtitle="Two memos with the same logic should get the same DQI. Low noise means your reasoning travels — different reviewers converge on the same verdict. High noise means half your committee was reading a different paper."
                >
                  <NoiseDistributionViz />
                </Section>
              </div>

              {/* Section 4: Boardroom Simulation */}
              <div id="boardroom" style={{ scrollMarginTop: 80 }}>
                <Section
                  icon={<Users size={16} />}
                  title="Boardroom Simulation"
                  subtitle="See which board member would push back, on what, and why — before the meeting happens."
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {analysis.simulation.twins.map((twin, idx) => {
                      const voteColor =
                        twin.vote === 'REJECT'
                          ? C.danger
                          : twin.vote === 'CONDITIONAL APPROVE'
                            ? C.warning
                            : C.green;
                      return (
                        <div key={idx} style={innerCardStyle}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 10,
                              marginBottom: 12,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: 13,
                                  color: C.slate900,
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                {twin.name}
                              </div>
                              <div style={{ fontSize: 11, color: C.slate500, marginTop: 2 }}>
                                {twin.role}
                              </div>
                            </div>
                            <span style={tintedPill(voteColor, { size: 'sm' })}>{twin.vote}</span>
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <div
                              style={{
                                height: 4,
                                borderRadius: 2,
                                background: C.slate200,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${twin.confidence * 100}%`,
                                  background: voteColor,
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: C.slate500,
                                marginTop: 4,
                                fontWeight: 600,
                              }}
                            >
                              {Math.round(twin.confidence * 100)}% confidence
                            </div>
                          </div>
                          <p
                            style={{
                              color: C.slate600,
                              fontSize: 12,
                              margin: 0,
                              lineHeight: 1.6,
                            }}
                          >
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
                <div id="toxic" style={{ scrollMarginTop: 80 }}>
                  <Section
                    icon={<AlertTriangle size={16} />}
                    title="Toxic Combinations"
                    subtitle="One bias is recoverable. Compound bias patterns are how $100M strategic decisions become $1B regrets — the audit calls them out by name."
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {analysis.toxicCombinations.map((tc, idx) => {
                        const tcColor = tc.riskLevel === 'critical' ? C.danger : C.orange;
                        return (
                          <div key={idx} style={innerCardStyle}>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: 12,
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: 14,
                                  color: C.slate900,
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                {tc.name}
                              </span>
                              <span style={tintedPill(tcColor, { size: 'sm' })}>
                                {tc.riskLevel}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 6,
                                marginBottom: 12,
                              }}
                            >
                              {tc.biases.map((b, bi) => (
                                <span
                                  key={bi}
                                  style={{
                                    fontSize: 11,
                                    padding: '3px 9px',
                                    borderRadius: 6,
                                    background: C.white,
                                    color: C.slate600,
                                    border: `1px solid ${C.slate200}`,
                                    fontWeight: 500,
                                  }}
                                >
                                  {b}
                                </span>
                              ))}
                            </div>
                            <p
                              style={{
                                color: C.slate600,
                                fontSize: 13,
                                margin: 0,
                                lineHeight: 1.65,
                              }}
                            >
                              {tc.description}
                            </p>
                            {tc.historicalExample && (
                              <p
                                style={{
                                  color: C.danger,
                                  fontSize: 12,
                                  margin: '10px 0 0',
                                  lineHeight: 1.6,
                                  fontStyle: 'italic',
                                }}
                              >
                                {tc.historicalExample}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                </div>
              )}

              {/* Section 6: Pre-Mortem */}
              <div id="premortem" style={{ scrollMarginTop: 80 }}>
                <Section
                  icon={<Skull size={16} />}
                  title="Pre-Mortem"
                  subtitle="Two years from now, this decision has failed and you're in front of the CEO. The audit names the failure modes — so you can pre-empt them."
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analysis.preMortem.scenarios.map((s, idx) => {
                      const impactColor =
                        s.impact === 'catastrophic'
                          ? C.danger
                          : s.impact === 'severe'
                            ? C.orange
                            : C.warning;
                      return (
                        <div key={idx} style={innerCardStyle}>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 10,
                              marginBottom: 12,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: C.slate900,
                                letterSpacing: '-0.01em',
                                flex: 1,
                                minWidth: 200,
                              }}
                            >
                              {s.title}
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <span style={tintedPill(C.warning, { size: 'sm' })}>
                                {Math.round(s.probability * 100)}% likely
                              </span>
                              <span style={tintedPill(impactColor, { size: 'sm' })}>
                                {s.impact}
                              </span>
                            </div>
                          </div>
                          <p
                            style={{
                              color: C.slate600,
                              fontSize: 13,
                              margin: 0,
                              lineHeight: 1.65,
                            }}
                          >
                            {s.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </div>

              {/* Known Outcome Banner */}
              {analysis.outcome && (
                <div
                  style={{
                    marginTop: 32,
                    padding: '20px 24px',
                    background: `${C.danger}0A`,
                    border: `1px solid ${C.danger}33`,
                    borderRadius: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: `${C.danger}1F`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TrendingUp size={16} style={{ color: C.danger }} />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.danger,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Known Outcome
                    </span>
                  </div>
                  <p
                    style={{
                      color: C.slate900,
                      fontSize: 14,
                      margin: '0 0 8px',
                      lineHeight: 1.6,
                      fontWeight: 500,
                    }}
                  >
                    {analysis.outcome.what}
                  </p>
                  <p style={{ color: C.slate500, fontSize: 12, margin: 0 }}>
                    {analysis.outcome.when} · {analysis.outcome.impact}
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

            <p
              style={{
                color: C.slate400,
                fontSize: 11,
                textAlign: 'center',
                marginTop: 32,
                lineHeight: 1.6,
              }}
            >
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
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 11,
          color: C.green,
          letterSpacing: '0.12em',
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        SEE IT IN 60 SECONDS
      </div>
      <h1
        style={{
          fontSize: 'clamp(34px, 6vw, 52px)',
          fontWeight: 800,
          color: C.slate900,
          margin: '0 auto 18px',
          lineHeight: 1.08,
          letterSpacing: '-0.025em',
          maxWidth: 820,
        }}
      >
        Audit your next strategic memo{' '}
        <span style={{ color: C.green }}>before the board sees it.</span>
      </h1>
      <p
        style={{
          fontSize: 17,
          color: C.slate500,
          maxWidth: 640,
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}
      >
        The audit your CSO never had time to run. 30+ cognitive biases scored, the question your CEO
        will raise predicted, and every decision dropped into a Knowledge Graph that compounds
        quarter after quarter.
      </p>

      {DEMO_VIDEO_URL ? (
        <div
          style={{
            ...cardStyle,
            overflow: 'hidden',
            marginBottom: 32,
            padding: 0,
          }}
        >
          <iframe
            src={DEMO_VIDEO_URL}
            allowFullScreen
            style={{ width: '100%', border: 'none', display: 'block', aspectRatio: '16/9' }}
            title="Decision Intel Demo"
          />
        </div>
      ) : (
        <div
          style={{
            ...cardStyle,
            padding: '56px 32px',
            marginBottom: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            background: `linear-gradient(180deg, ${C.white} 0%, ${C.slate50} 100%)`,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: C.greenSoft,
              border: `1px solid ${C.greenLight}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(22,163,74,0.15)',
            }}
          >
            <Play size={26} style={{ color: C.green, marginLeft: 3 }} />
          </div>
          <p
            style={{
              fontSize: 15,
              color: C.slate600,
              maxWidth: 460,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            Pick a famous corporate decision below to watch the bias audit, objection simulation,
            and Knowledge Graph unfold in real time.
          </p>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/login"
          onClick={() => trackEvent('demo_video_cta_clicked', { target: 'start_trial' })}
          style={{
            padding: '14px 24px',
            borderRadius: 10,
            background: C.green,
            color: C.white,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 0.15s',
            boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = C.greenDark)}
          onMouseLeave={e => (e.currentTarget.style.background = C.green)}
        >
          Start free — 4 audits on us <ArrowRight size={14} />
        </Link>
        {DEMO_BOOKING_URL && (
          <a
            href={DEMO_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('demo_video_cta_clicked', { target: 'book_call' })}
            style={{
              padding: '14px 24px',
              borderRadius: 10,
              background: C.white,
              border: `1px solid ${C.slate200}`,
              color: C.slate900,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.slate400;
              e.currentTarget.style.background = C.slate50;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.slate200;
              e.currentTarget.style.background = C.white;
            }}
          >
            Book a 15-min walkthrough <ExternalLink size={14} />
          </a>
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
      <span
        style={{
          fontSize: 10,
          color: C.slate500,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.slate900 }}>{value}</span>
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

  const ctaPrimary: React.CSSProperties = {
    padding: '14px 24px',
    borderRadius: 10,
    background: C.green,
    color: C.white,
    fontWeight: 700,
    fontSize: 14,
    border: 'none',
    cursor: loadingSample ? 'wait' : 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: 'background 0.15s',
    boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
  };
  const ctaSecondary: React.CSSProperties = {
    padding: '14px 24px',
    borderRadius: 10,
    background: C.white,
    border: `1px solid ${C.slate200}`,
    color: C.slate900,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: 'border-color 0.15s, background 0.15s',
  };

  return (
    <div
      style={{
        marginTop: 40,
        borderRadius: 20,
        overflow: 'hidden',
        border: `1px solid ${C.slate200}`,
        background: `linear-gradient(160deg, ${C.white} 0%, ${C.greenSoft} 100%)`,
        boxShadow: '0 4px 24px rgba(15,23,42,0.05)',
      }}
    >
      {!submitted ? (
        <div style={{ padding: '40px 32px 24px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: C.greenSoft,
              border: `1px solid ${C.greenLight}`,
              color: C.green,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              marginBottom: 20,
            }}
          >
            <Shield size={13} />
            FOR YOUR NEXT MEMO
          </div>
          <h3
            style={{
              fontSize: 'clamp(22px, 3vw, 28px)',
              fontWeight: 700,
              color: C.slate900,
              margin: '0 0 12px',
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
            }}
          >
            Walk into your next steering committee with the question nobody else caught.
          </h3>
          <p
            style={{
              color: C.slate600,
              fontSize: 15,
              margin: '0 auto 28px',
              maxWidth: 540,
              lineHeight: 1.55,
            }}
          >
            Drop your work email. We&apos;ll send a one-page audit primer for your next strategic
            memo, plus an invite to run a real audit on a document of your own.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              maxWidth: 460,
              margin: '0 auto 12px',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@company.com"
              required
              id="demo-email-capture"
              style={{
                flex: 1,
                minWidth: 220,
                padding: '13px 16px',
                borderRadius: 10,
                border: `1px solid ${C.slate200}`,
                fontSize: 14,
                color: C.slate900,
                background: C.white,
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = C.green)}
              onBlur={e => (e.currentTarget.style.borderColor = C.slate200)}
            />
            <button
              type="submit"
              disabled={submitting || !email}
              style={{
                ...ctaPrimary,
                padding: '13px 22px',
                opacity: submitting || !email ? 0.5 : 1,
                cursor: submitting || !email ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!submitting && email) e.currentTarget.style.background = C.greenDark;
              }}
              onMouseLeave={e => {
                if (!submitting && email) e.currentTarget.style.background = C.green;
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  Get Report <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
          {error && <p style={{ color: C.danger, fontSize: 12, margin: '8px 0 0' }}>{error}</p>}
          <p style={{ color: C.slate400, fontSize: 11, marginTop: 8 }}>
            No spam. Just insights. Unsubscribe anytime.
          </p>
        </div>
      ) : (
        <div style={{ padding: '40px 32px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: C.greenSoft,
              border: `1px solid ${C.greenLight}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={26} style={{ color: C.green }} />
          </div>
          <h3
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: C.slate900,
              margin: '0 0 10px',
              letterSpacing: '-0.015em',
            }}
          >
            You&apos;re in.
          </h3>
          <p
            style={{
              color: C.slate600,
              fontSize: 14,
              margin: '0 auto 24px',
              maxWidth: 460,
              lineHeight: 1.55,
            }}
          >
            We&apos;ll send your personalized bias audit guide to <strong>{email}</strong>. In the
            meantime, try a full analysis on your own document.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ padding: '0 32px 36px', textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => {
              trackEvent('demo_cta_clicked', { target: 'try_sample', submitted });
              onTryNow();
            }}
            disabled={loadingSample}
            aria-busy={loadingSample}
            style={ctaPrimary}
            onMouseEnter={e => {
              if (!loadingSample) e.currentTarget.style.background = C.greenDark;
            }}
            onMouseLeave={e => {
              if (!loadingSample) e.currentTarget.style.background = C.green;
            }}
          >
            {loadingSample ? 'Loading...' : 'Audit My Own Memo'}
            {!loadingSample && <ArrowRight size={14} />}
          </button>
          <Link
            href={
              submitted && email
                ? `/login?mode=signup&email=${encodeURIComponent(email)}&redirect=/dashboard`
                : '/login?mode=signup&redirect=/dashboard'
            }
            onClick={() => trackEvent('demo_cta_clicked', { target: 'signup', submitted })}
            style={ctaSecondary}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.slate400;
              e.currentTarget.style.background = C.slate50;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.slate200;
              e.currentTarget.style.background = C.white;
            }}
          >
            Sign Up Free
          </Link>
          {DEMO_BOOKING_URL && (
            <a
              href={DEMO_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('demo_cta_clicked', { target: 'book_demo', submitted })}
              style={{
                ...ctaSecondary,
                color: '#4F46E5',
                borderColor: '#C7D2FE',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#818CF8';
                e.currentTarget.style.background = '#EEF2FF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#C7D2FE';
                e.currentTarget.style.background = C.white;
              }}
            >
              Book a 15-min walkthrough <ExternalLink size={14} />
            </a>
          )}
        </div>
        <p style={{ color: C.slate400, fontSize: 11, marginTop: 18 }}>
          No credit card required · Free plan covers your first 4 audits · 30-day pilot on Strategy tier
        </p>
      </div>
    </div>
  );
}
