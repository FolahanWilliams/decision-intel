'use client';

import { useState } from 'react';
import {
  Play,
  ChevronDown,
  ChevronRight,
  Beaker,
  CheckCircle,
  SkipForward,
  TrendingDown,
  Eye,
  X as XIcon,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnalysisResult } from '@/types';
import { decomposeAnalysis } from '@/lib/replay/score-calculator';
import { CounterfactualPanel } from '@/components/replay/CounterfactualPanel';

interface OutcomeData {
  outcome: string;
  confirmedBiases: string[];
  falsPositiveBiases: string[];
  lessonsLearned?: string | null;
  notes?: string | null;
  impactScore?: number | null;
  mostAccurateTwin?: string | null;
}

interface ReplayTabProps {
  analysisData: AnalysisResult;
  outcome?: OutcomeData | null;
  recalibratedDqi?: { originalScore: number; recalibratedScore: number; delta: number; recalibratedGrade: string } | null;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  'document-intel': <Play size={14} />,
  'bias-detection': <TrendingDown size={14} />,
  'noise-analysis': <TrendingDown size={14} />,
  'fact-check': <CheckCircle size={14} />,
  'deep-analysis': <TrendingDown size={14} />,
  boardroom: <Play size={14} />,
  'final-score': <CheckCircle size={14} />,
};

const OUTCOME_COLORS: Record<string, string> = {
  success: '#16a34a',
  partial_success: '#84cc16',
  failure: '#ef4444',
  too_early: '#94a3b8',
};

const OUTCOME_LABELS: Record<string, string> = {
  success: 'Success',
  partial_success: 'Partial Success',
  failure: 'Failure',
  too_early: 'Too Early to Tell',
};

export function ReplayTab({ analysisData, outcome, recalibratedDqi }: ReplayTabProps) {
  const steps = decomposeAnalysis(analysisData);
  const [expandedStep, setExpandedStep] = useState<string | null>(steps[0]?.id || null);
  const [counterfactualStep, setCounterfactualStep] = useState<string | null>(null);
  const [outcomeRevealed, setOutcomeRevealed] = useState(false);

  // Calculate running score through steps
  let runningScore = 100;
  const scoreHistory: number[] = [];
  for (const step of steps) {
    if (step.id !== 'final-score') {
      runningScore += step.scoreDelta;
    } else {
      runningScore = analysisData.overallScore;
    }
    scoreHistory.push(Math.round(Math.max(0, Math.min(100, runningScore))));
  }

  return (
    <div>
      {/* Score Waterfall — horizontal bar visualization */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <h3 className="flex items-center gap-sm" style={{ fontSize: '13px' }}>
            <Play size={14} style={{ color: 'var(--accent-primary)' }} />
            Score Progression
          </h3>
        </div>
        <div className="card-body" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}>
            {steps.map((step, i) => {
              const width = `${100 / steps.length}%`;
              const score = scoreHistory[i];
              const color =
                step.scoreDelta < -5
                  ? 'var(--error)'
                  : step.scoreDelta < 0
                    ? 'var(--warning)'
                    : step.scoreDelta > 0
                      ? 'var(--success)'
                      : 'var(--accent-primary)';
              return (
                <div
                  key={step.id}
                  title={`${step.label}: ${step.scoreDelta !== 0 ? (step.scoreDelta > 0 ? '+' : '') + step.scoreDelta : 'no change'}`}
                  style={{
                    width,
                    height: `${Math.max(20, (score / 100) * 100)}%`,
                    background: color,
                    opacity: step.id === 'final-score' ? 1 : 0.7,
                    borderRadius: '3px',
                    transition: 'height 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onClick={() => setExpandedStep(step.id)}
                >
                  {step.id === 'final-score' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-18px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color:
                          score >= 70
                            ? 'var(--success)'
                            : score >= 40
                              ? 'var(--warning)'
                              : 'var(--error)',
                      }}
                    >
                      {score}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Start (100)</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Final ({Math.round(analysisData.overallScore)})
            </span>
          </div>
        </div>
      </div>

      {/* Step timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {steps.map((step, i) => {
          const isExpanded = expandedStep === step.id;
          const showCounterfactual = counterfactualStep === step.id;
          const score = scoreHistory[i];

          return (
            <div key={step.id}>
              <div
                className="card"
                style={{
                  border: isExpanded
                    ? '1px solid var(--accent-primary)'
                    : '1px solid var(--border-color)',
                  transition: 'border-color 0.15s',
                }}
              >
                {/* Step header */}
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    width: '100%',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                  }}
                  aria-expanded={isExpanded}
                >
                  {/* Step number circle */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background:
                        step.status === 'skipped'
                          ? 'var(--bg-tertiary)'
                          : isExpanded
                            ? 'var(--bg-card-hover)'
                            : 'rgba(48, 209, 88, 0.1)',
                      color:
                        step.status === 'skipped'
                          ? 'var(--text-muted)'
                          : isExpanded
                            ? '#FFFFFF'
                            : 'var(--success)',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {step.status === 'skipped' ? (
                      <SkipForward size={12} />
                    ) : (
                      STEP_ICONS[step.id] || i + 1
                    )}
                  </div>

                  {/* Label + description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                      {step.label}
                      {step.status === 'skipped' && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            marginLeft: '8px',
                          }}
                        >
                          SKIPPED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {step.description}
                    </div>
                  </div>

                  {/* Score delta badge */}
                  {step.scoreDelta !== 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background:
                          step.scoreDelta > 0 ? 'rgba(48, 209, 88, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: step.scoreDelta > 0 ? 'var(--success)' : 'var(--error)',
                        flexShrink: 0,
                      }}
                    >
                      {step.scoreDelta > 0 ? '+' : ''}
                      {step.scoreDelta} pts
                    </span>
                  )}

                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 var(--spacing-lg) var(--spacing-md)',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    {/* Findings */}
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '6px',
                        }}
                      >
                        Findings
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {step.findings.map((finding, fi) => (
                          <div
                            key={fi}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '4px 8px',
                              background: 'var(--bg-primary)',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            {finding}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Running score */}
                    <div
                      className="flex items-center justify-between"
                      style={{
                        marginTop: 'var(--spacing-md)',
                        padding: '8px 12px',
                        background: 'var(--bg-primary)',
                        borderRadius: '6px',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Score after this step
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color:
                            score >= 70
                              ? 'var(--success)'
                              : score >= 40
                                ? 'var(--warning)'
                                : 'var(--error)',
                        }}
                      >
                        {score}/100
                      </span>
                    </div>

                    {/* What-If button */}
                    {step.counterfactualSupported && (
                      <button
                        onClick={() => setCounterfactualStep(showCounterfactual ? null : step.id)}
                        style={{
                          marginTop: 'var(--spacing-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          background: showCounterfactual ? 'var(--bg-card)' : 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--text-highlight)',
                          cursor: 'pointer',
                        }}
                      >
                        <Beaker size={12} />
                        {showCounterfactual ? 'Close What-If' : 'What if...?'}
                      </button>
                    )}

                    {/* Counterfactual panel */}
                    {showCounterfactual && (
                      <CounterfactualPanel
                        analysis={analysisData}
                        step={step}
                        onClose={() => setCounterfactualStep(null)}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Timeline connector */}
              {i < steps.length - 1 && (
                <div
                  style={{
                    width: '2px',
                    height: '8px',
                    background: 'var(--border-color)',
                    marginLeft: '34px',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Outcome Reveal — "Tape Review" ──────────────────────────────── */}
      {outcome && (
        <div style={{ marginTop: 'var(--spacing-xl)' }}>
          {!outcomeRevealed ? (
            <button
              onClick={() => setOutcomeRevealed(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '14px 20px',
                background: 'var(--bg-card-hover)',
                border: '1px dashed var(--border-active)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Eye size={16} />
              Reveal What Actually Happened
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="card"
                style={{ overflow: 'hidden' }}
              >
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="flex items-center gap-sm" style={{ fontSize: 14 }}>
                    <Eye size={15} style={{ color: 'var(--accent-primary)' }} />
                    What Actually Happened
                  </h3>
                  <button
                    onClick={() => setOutcomeRevealed(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                  >
                    <XIcon size={14} />
                  </button>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Outcome badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 13,
                        fontWeight: 700,
                        background: `${OUTCOME_COLORS[outcome.outcome] || '#94a3b8'}18`,
                        color: OUTCOME_COLORS[outcome.outcome] || '#94a3b8',
                        border: `1px solid ${OUTCOME_COLORS[outcome.outcome] || '#94a3b8'}30`,
                      }}
                    >
                      {OUTCOME_LABELS[outcome.outcome] || outcome.outcome}
                    </span>
                    {outcome.impactScore != null && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Impact: {outcome.impactScore}/100
                      </span>
                    )}
                  </div>

                  {/* Recalibrated DQI */}
                  {recalibratedDqi && (
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 'var(--radius-md)',
                        background: recalibratedDqi.delta > 0 ? 'rgba(22,163,74,0.06)' : 'rgba(239,68,68,0.06)',
                        border: `1px solid ${recalibratedDqi.delta > 0 ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                      }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Recalibrated DQI:</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {recalibratedDqi.originalScore}
                        </span>
                        <span style={{ fontSize: 13 }}>→</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: recalibratedDqi.delta > 0 ? 'var(--success)' : 'var(--error)' }}>
                          {recalibratedDqi.recalibratedScore}/100
                        </span>
                        <span style={{ fontSize: 12, color: recalibratedDqi.delta > 0 ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                          ({recalibratedDqi.delta > 0 ? '+' : ''}{recalibratedDqi.delta})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Confirmed & False-Positive Biases */}
                  {(outcome.confirmedBiases.length > 0 || outcome.falsPositiveBiases.length > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Bias Accuracy
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {outcome.confirmedBiases.map(bias => (
                          <span
                            key={`confirmed-${bias}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 12,
                              background: 'rgba(22,163,74,0.1)',
                              color: 'var(--success)',
                              border: '1px solid rgba(22,163,74,0.2)',
                            }}
                          >
                            <ThumbsUp size={10} />
                            {bias.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {outcome.falsPositiveBiases.map(bias => (
                          <span
                            key={`false-${bias}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 12,
                              background: 'rgba(239,68,68,0.1)',
                              color: 'var(--error)',
                              border: '1px solid rgba(239,68,68,0.2)',
                            }}
                          >
                            <ThumbsDown size={10} />
                            {bias.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lessons Learned */}
                  {outcome.lessonsLearned && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                        Lessons Learned
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                        {outcome.lessonsLearned}
                      </p>
                    </div>
                  )}

                  {outcome.mostAccurateTwin && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Most accurate boardroom persona: <strong style={{ color: 'var(--text-primary)' }}>{outcome.mostAccurateTwin}</strong>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
