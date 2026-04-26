'use client';

import { useEffect, useState } from 'react';
import { BiasInstance, RecognitionCuesResult, NarrativePreMortem } from '@/types';
import { formatDate } from '@/lib/utils/format-date';
import { formatBiasName } from '@/lib/utils/labels';
import { Brain, Lightbulb, ExternalLink, BarChart3, Eye, ChevronDown } from 'lucide-react';
import { DocumentTextHighlighter } from '@/components/visualizations/DocumentTextHighlighter';
import { BiasSparklineWithData } from '@/components/visualizations/BiasSparkline';
import dynamic from 'next/dynamic';
const BiasNetwork3D = dynamic(() => import('@/components/visualizations/BiasNetwork3DCanvas'), {
  ssr: false,
});
import { RiskHeatMap } from '@/components/visualizations/RiskHeatMap';
const BiasProfileRadar = dynamic(
  () =>
    import('@/components/visualizations/BiasProfileRadar').then(m => ({
      default: m.BiasProfileRadar,
    })),
  { ssr: false }
);
import { DecisionTimeline } from '@/components/visualizations/DecisionTimeline';
import { DQIBadge } from '@/components/visualizations/DQIBadge';
import { System1GaugeBar } from '@/components/visualizations/System1GaugeBar';
import { BiologicalRiskBadge } from '@/components/ui/BiologicalRiskBadge';
import { OutsideViewCard } from '@/components/ui/OutsideViewCard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ResearchInsight } from '@/types';
import { StructuralAssumptionsPanel } from '@/components/analysis/StructuralAssumptionsPanel';
import { BiasCollabPanel } from '@/components/analysis/BiasCollabPanel';
import { MarketContextChip } from '@/components/analysis/MarketContextChip';
import { RedactionTrailCard } from '@/components/analysis/RedactionTrailCard';
import { DprPreviewCard } from '@/components/analysis/DprPreviewCard';

interface ExtendedBiasInstance extends BiasInstance {
  researchInsight: ResearchInsight;
}

interface BiasFrequencyData {
  displayName: string;
  total: number;
  timeline: Array<{ date: string; count: number }>;
}

interface DQIData {
  score: number;
  grade: string;
  gradeLabel: string;
  system1Ratio: number | null;
  components: {
    biasLoad: { score: number; grade: string };
    noiseLevel: { score: number; grade: string };
    evidenceQuality: { score: number; grade: string };
    processMaturity: { score: number; grade: string };
    complianceRisk: { score: number; grade: string };
  };
  topImprovement: {
    component: string;
    currentScore: number;
    potentialGain: number;
    suggestion: string;
  };
}

interface OverviewTabProps {
  documentContent: string;
  biases: BiasInstance[];
  uploadedAt: string;
  analysisCreatedAt?: string;
  analysisId?: string;
  compoundAdjustments?: Array<{ source: string; delta: number; description: string }>;
  recognitionCues?: RecognitionCuesResult;
  narrativePreMortem?: NarrativePreMortem;
  dealSector?: string | null;
  dealTicketSize?: number | null;
  marketContextApplied?: {
    context: 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';
    emergingMarketCountries: string[];
    developedMarketCountries: string[];
    cagrCeiling: number;
    rationale: string;
  };
  marketContextOverride?: {
    context: 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';
    emergingMarketCountries: string[];
    developedMarketCountries: string[];
    cagrCeiling: number;
    rationale: string;
    overriddenAt?: string;
    overriddenBy?: string;
  } | null;
  /** Triggered after a successful override save so the parent can refresh. */
  onMarketContextChanged?: () => void;
  /** Document-owner flag — gates the redaction map reveal feature. */
  isOwner?: boolean;
}

const SEVERITY_BADGE_STYLES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-blue-500/20 text-blue-400',
};

const SEVERITY_BORDER_STYLES: Record<string, string> = {
  critical: 'border-red-500/20 bg-red-500/5',
  high: 'border-orange-500/20 bg-orange-500/5',
  medium: 'border-yellow-500/20 bg-yellow-500/5',
  low: 'border-border',
};

export function OverviewTab({
  documentContent,
  biases,
  uploadedAt,
  analysisCreatedAt,
  analysisId,
  compoundAdjustments,
  recognitionCues,
  narrativePreMortem,
  dealSector,
  dealTicketSize,
  marketContextApplied,
  marketContextOverride,
  onMarketContextChanged,
  isOwner,
}: OverviewTabProps) {
  const [showRpd, setShowRpd] = useState(false);
  const hasRpd = !!(recognitionCues || narrativePreMortem);
  // Fetch historical bias frequencies for sparklines
  const [biasFrequencies, setBiasFrequencies] = useState<Record<string, BiasFrequencyData> | null>(
    null
  );
  // Fetch DQI score for this analysis
  const [dqiData, setDqiData] = useState<DQIData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/bias-frequency')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled && data?.frequencies) {
          setBiasFrequencies(data.frequencies);
        }
      })
      .catch(() => {
        // Sparklines are non-critical; silently degrade
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch DQI when analysisId is available
  useEffect(() => {
    if (!analysisId) return;
    let cancelled = false;
    fetch(`/api/dqi?analysisId=${analysisId}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled && data?.dqi) {
          setDqiData(data.dqi);
        }
      })
      .catch(() => {
        // DQI is non-critical; silently degrade
      });
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  return (
    <div className="flex flex-col gap-lg">
      {/* 0. Decision Quality Index — top-level quality score */}
      {dqiData && (
        <ErrorBoundary sectionName="Decision Quality Index">
          <div className="card">
            <div className="card-body">
              <div className="flex items-start gap-6 flex-wrap">
                <DQIBadge
                  score={dqiData.score}
                  grade={dqiData.grade}
                  size="lg"
                  showLabel
                  showBreakdown
                  components={dqiData.components}
                />
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-lg font-semibold">{dqiData.gradeLabel}</h3>
                    {compoundAdjustments && compoundAdjustments.length > 0 && (
                      <BiologicalRiskBadge adjustments={compoundAdjustments} size="sm" />
                    )}
                  </div>
                  <p className="text-sm text-muted mb-3">
                    Decision Quality Index — a composite score across bias load, noise, evidence,
                    process maturity, and compliance.
                  </p>
                  {dqiData.system1Ratio !== null && dqiData.system1Ratio !== undefined && (
                    <div className="mb-3">
                      <System1GaugeBar ratio={dqiData.system1Ratio} height={16} />
                    </div>
                  )}
                  {dqiData.topImprovement && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                      <div className="text-xs font-semibold text-blue-300 mb-1">
                        Top Improvement: {dqiData.topImprovement.component} (+
                        {dqiData.topImprovement.potentialGain.toFixed(1)} pts potential)
                      </div>
                      <p className="text-xs text-muted">{dqiData.topImprovement.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* 0.5 Outside View — reference class forecasting from 135 historical cases */}
      <ErrorBoundary sectionName="Outside View">
        <OutsideViewCard sector={dealSector} ticketSize={dealTicketSize} />
      </ErrorBoundary>

      {/* 1. Document Text Highlighter — replaces old BiasHeatmap with sidebar linking */}
      <ErrorBoundary sectionName="Document Bias Highlighter">
        <DocumentTextHighlighter content={documentContent} biases={biases} />
      </ErrorBoundary>

      {/* Bias visualisations (refactored 2026-04-26 per Opus 4.6 audit):
          BiasProfileRadar leads — it's the most informative single read
          for a quick scan. BiasNetwork3D and RiskHeatMap moved behind a
          single "Show more visualisations" disclosure so they don't
          fight the radar for attention by default and don't burn GPU on
          a 1-page memo with 2 biases. The hardcoded probability=60 on
          RiskHeatMap is now derived from severity (critical=0.85,
          high=0.65, medium=0.45, low=0.25) — still a heuristic, but
          honestly two-axis instead of degenerate. */}
      <ErrorBoundary sectionName="Bias Profile Radar">
        <div className="card">
          <div className="card-header">
            <h4>Bias Intensity Profile</h4>
          </div>
          <div className="card-body">
            <BiasProfileRadar biases={biases} />
          </div>
        </div>
      </ErrorBoundary>

      <ErrorBoundary sectionName="Additional Bias Visualizations">
        <details
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              padding: '4px 0',
            }}
          >
            Show more visualisations · Network map · Risk landscape
          </summary>
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-lg"
            style={{ marginTop: 12, minHeight: 360 }}
          >
            <div className="card overflow-hidden" style={{ margin: 0 }}>
              <div className="card-header">
                <h4>Bias Network Map</h4>
              </div>
              <div className="card-body overflow-hidden" style={{ height: 360, padding: 0 }}>
                <BiasNetwork3D
                  biases={biases.map((b, i) => ({
                    ...b,
                    id: b.id || `bias-${i}`,
                    category: 'cognitive',
                  }))}
                />
              </div>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <h4>Risk Landscape</h4>
              </div>
              <div className="card-body">
                <RiskHeatMap
                  risks={biases.map(b => ({
                    category: b.biasType,
                    impact:
                      b.severity === 'critical'
                        ? 90
                        : b.severity === 'high'
                          ? 70
                          : b.severity === 'medium'
                            ? 50
                            : 30,
                    probability:
                      b.severity === 'critical'
                        ? 85
                        : b.severity === 'high'
                          ? 65
                          : b.severity === 'medium'
                            ? 45
                            : 25,
                  }))}
                />
              </div>
            </div>
          </div>
        </details>
      </ErrorBoundary>

      {/* 3. Decision Timeline */}
      <ErrorBoundary sectionName="Decision Timeline">
        <div className="card">
          <div className="card-header">
            <h4>Decision Timeline</h4>
          </div>
          <div className="card-body">
            <DecisionTimeline
              events={[
                {
                  id: '1',
                  date: formatDate(uploadedAt),
                  title: 'Document Uploaded',
                  description: 'Initial file ingestion.',
                  type: 'info',
                  status: 'completed',
                },
                {
                  id: '2',
                  date: analysisCreatedAt ? formatDate(analysisCreatedAt) : 'Pending',
                  title: 'AI Audit Completed',
                  description: 'Deep scan for biases and noise.',
                  type: 'decision',
                  status: 'completed',
                },
              ]}
            />
          </div>
        </div>
      </ErrorBoundary>

      {/* 4. Bias Details with inline sparklines */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2">
              <Brain size={16} /> Bias Details
            </h3>
            {biasFrequencies && (
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <BarChart3 size={10} />
                Sparklines show historical frequency across your documents
              </span>
            )}
          </div>
        </div>
        <div className="card-body">
          {biases.length === 0 ? (
            <div className="text-center p-8 text-muted">No cognitive biases detected.</div>
          ) : (
            <div className="space-y-4">
              {biases.map((bias, i) => {
                const severityKey = bias.severity.toLowerCase();
                const badgeStyle = SEVERITY_BADGE_STYLES[severityKey] ?? 'bg-muted/30 text-muted';
                const borderStyle = SEVERITY_BORDER_STYLES[severityKey] ?? 'border-border';

                return (
                  <div key={i} className={`liquid-glass p-4 border ${borderStyle}`}>
                    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 ${badgeStyle}`}>
                          {formatBiasName(bias.biasType)}
                        </span>
                        <span className={`text-xs capitalize ${badgeStyle} px-1.5 py-0.5`}>
                          {bias.severity}
                        </span>
                        {bias.confidence != null && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {Math.round(bias.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      {/* Sparkline: historical frequency for this bias type */}
                      <BiasSparklineWithData
                        biasType={bias.biasType}
                        severity={bias.severity}
                        frequencies={biasFrequencies}
                        width={80}
                        height={20}
                      />
                    </div>
                    <p className="text-sm italic text-foreground/70 border-l-2 border-border pl-3 my-2">
                      &quot;{bias.excerpt}&quot;
                    </p>
                    <p className="text-sm text-muted mb-3">{bias.explanation}</p>

                    {(bias as unknown as ExtendedBiasInstance).researchInsight && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-semibold text-blue-300">
                            Scientific Insight
                          </span>
                        </div>
                        <a
                          href={(bias as unknown as ExtendedBiasInstance).researchInsight.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-300 hover:text-blue-200 block mb-1"
                        >
                          {(bias as unknown as ExtendedBiasInstance).researchInsight.title}{' '}
                          <ExternalLink size={10} className="inline ml-1" />
                        </a>
                        <p className="text-xs text-muted">
                          {(bias as unknown as ExtendedBiasInstance).researchInsight.summary}
                        </p>
                      </div>
                    )}
                    {bias.id && (
                      <div style={{ marginTop: 14 }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            marginBottom: 8,
                          }}
                        >
                          Team discussion
                        </div>
                        <ErrorBoundary>
                          <BiasCollabPanel biasInstanceId={bias.id} />
                        </ErrorBoundary>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Decision Provenance Record preview (1.1 deep) — eight key
          fields rendered in-page so the analyst sees the audit-defensible
          shape without downloading the full PDF first. */}
      {analysisId && <DprPreviewCard analysisId={analysisId} />}

      {/* Redaction trail (3.2 deep) — proof that PII was scrubbed before
          submit. Owner can replay the local-only placeholder map. */}
      {analysisId && <RedactionTrailCard analysisId={analysisId} isOwner={!!isOwner} />}

      {/* Market-context priors chip — shows which growth-rate ceiling the bias
          detector applied based on detected jurisdictions (3.6). Owner can
          flip the auto-detection via the chip's override editor. */}
      {marketContextApplied && (
        <MarketContextChip
          marketContextApplied={marketContextApplied}
          marketContextOverride={marketContextOverride ?? null}
          analysisId={analysisId}
          isOwner={!!isOwner}
          onChanged={onMarketContextChanged}
        />
      )}

      {/* Structural Assumptions (Dalio 18-determinants macro lens) */}
      {analysisId && (
        <ErrorBoundary>
          <StructuralAssumptionsPanel
            analysisId={analysisId}
            autoRun={false}
            marketContext={
              marketContextOverride
                ? {
                    context: marketContextOverride.context,
                    cagrCeiling: marketContextOverride.cagrCeiling,
                    overridden: true,
                  }
                : marketContextApplied
                  ? {
                      context: marketContextApplied.context,
                      cagrCeiling: marketContextApplied.cagrCeiling,
                    }
                  : undefined
            }
          />
        </ErrorBoundary>
      )}

      {/* Pattern Recognition (RPD) — collapsible, conditional */}
      {hasRpd && (
        <div className="card mt-lg">
          <button
            onClick={() => setShowRpd(prev => !prev)}
            className="w-full card-header flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors"
            aria-expanded={showRpd}
          >
            <h3 className="flex items-center gap-2 text-base">
              <Eye size={18} style={{ color: 'var(--accent-primary)' }} />
              Pattern Recognition (RPD)
            </h3>
            <ChevronDown
              size={16}
              className={`text-muted transition-transform ${showRpd ? 'rotate-180' : ''}`}
            />
          </button>
          {showRpd && (
            <div className="card-body">
              {recognitionCues && (
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <h4 className="section-heading">Recognition Cues</h4>
                  <p className="text-xs text-muted mb-sm">
                    Pattern: {recognitionCues.patternMatch} (confidence:{' '}
                    {Math.round(recognitionCues.confidenceLevel * 100)}%)
                  </p>
                  {recognitionCues.cues && recognitionCues.cues.length > 0 ? (
                    <div className="space-y-2">
                      {recognitionCues.cues.map((cue, i) => (
                        <div
                          key={i}
                          className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg"
                        >
                          <div className="text-sm font-medium text-blue-300">{cue.title}</div>
                          <p className="text-xs text-muted mt-1">{cue.description}</p>
                          {cue.outcome && (
                            <span
                              className={`text-xs mt-1 inline-block ${cue.outcome === 'SUCCESS' ? 'text-emerald-400' : cue.outcome === 'FAILURE' ? 'text-red-400' : 'text-amber-400'}`}
                            >
                              Historical outcome: {cue.outcome}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">
                      No strong recognition cues detected in this document.
                    </p>
                  )}
                  {recognitionCues.expertHeuristic && (
                    <p className="text-xs text-muted mt-sm italic">
                      Expert heuristic: {recognitionCues.expertHeuristic}
                    </p>
                  )}
                </div>
              )}
              {narrativePreMortem && (
                <div>
                  <h4 className="section-heading">Narrative Pre-Mortem</h4>
                  {narrativePreMortem.warStories && narrativePreMortem.warStories.length > 0 ? (
                    <div className="space-y-2">
                      {narrativePreMortem.warStories.map((story, i) => (
                        <div
                          key={i}
                          className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg"
                        >
                          <div className="text-sm font-medium text-amber-300">{story.title}</div>
                          <p className="text-xs text-muted mt-1">{story.narrative}</p>
                          <div className="flex items-center gap-md mt-1">
                            <span className="text-xs text-muted">
                              Probability: {story.probability}
                            </span>
                            {story.keyTakeaway && (
                              <span className="text-xs text-emerald-400">
                                Takeaway: {story.keyTakeaway}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No pre-mortem scenarios generated.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
