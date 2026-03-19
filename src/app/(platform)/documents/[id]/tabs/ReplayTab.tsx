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
} from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { decomposeAnalysis } from '@/lib/replay/score-calculator';
import { CounterfactualPanel } from '@/components/replay/CounterfactualPanel';

interface ReplayTabProps {
  analysisData: AnalysisResult;
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

export function ReplayTab({ analysisData }: ReplayTabProps) {
  const steps = decomposeAnalysis(analysisData);
  const [expandedStep, setExpandedStep] = useState<string | null>(steps[0]?.id || null);
  const [counterfactualStep, setCounterfactualStep] = useState<string | null>(null);

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
                            ? 'rgba(255, 255, 255, 0.1)'
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
                          background: showCounterfactual
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
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
    </div>
  );
}
